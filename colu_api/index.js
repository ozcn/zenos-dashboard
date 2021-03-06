var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var util = require('util');
var path = require('path');
var _ = require('lodash');
var router = express.Router();
var subdomain = require('express-subdomain');
var Colu = require('colu');

require('dotenv').config();

var communityId = "";
var coluSettings = {
  network: process.env.COLU_SDK_NETWORK,
  apiKey: process.env.COLU_SDK_API_KEY,
  privateSeed: process.env.COLU_SDK_PRIVATE_SEED,
  redisUrl: process.env.COLU_SDK_REDIS_URL || process.env.REDIS_URL || '',
  // coloredCoinsHost: "https://zenos-311468746.ap-northeast-1.elb.amazonaws.com",
};

app.use(function(req, res, next) {
  var domain = req.headers.host,
    subDomain = domain.split('.');

  if (subDomain[0]) {
    communityId = subDomain[0].toUpperCase();

    coluSettings = _.merge(coluSettings, {
      network: process.env[communityId + "_COLU_SDK_NETWORK"],
      apiKey: process.env[communityId + "_COLU_SDK_API_KEY"],
      privateSeed: process.env[communityId + "_COLU_SDK_PRIVATE_SEED"]
    });
  }

  if (coluSettings['network'] == "mainnet") {
    coluSettings = _.merge(coluSettings, {
      coluHost: 'https://engine.colu.co',
      coloredCoinsHost: 'https://api.coloredcoins.org/v3',
      // coloredCoinsHost: "https://zenos-311468746.ap-northeast-1.elb.amazonaws.com",
      blockExplorerHost: 'https://explorer.coloredcoins.org'
    });
  }

  next();
});

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// CORS を許可する
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//the api middleware flow
app.use(subdomain('*', router));

router.get('/', function(req, res) {
  res.send('hello Colu API');
});

// wallet address を取得する（新規払い出し）
// http://documentation.colu.co/#GetAddress
router.post('/get_address', function(req, res) {
  var colu = new Colu(coluSettings);

  colu.on('connect', function () {
    var address = colu.hdwallet.getAddress();
    console.log("address: ", address);

    var jsonResult = {
      status: 'ok',
      address: address
    };

    res.json(jsonResult);
  });

  colu.init();
});

// 特定の wallet address の情報を取得する
// (例) 自分が今いくら assets を持っているか？
// http://documentation.colu.co/#GetAddressInfo
router.post('/get_address_info', function(req, res) {
  if (!req.body.address) {
    return res.json({
      status: 'ng'
    });
  }

  var colu = new Colu(coluSettings);
  colu.on('connect', function () {
    colu.coloredCoins.getAddressInfo(req.body.address, function (err, body) {
      if (err) {
        console.error(err);
        return res.json({
          status: 'ng'
        });
      }

      console.log("getAddressInfo: ", body);

      var jsonResult = {
        status: 'ok',
        address: null,
        totalAmount: 0
      };

      if (body.address) {
        jsonResult.address = body.address;
      }

      // wallet の総額を算出する
      var utxos = body.utxos;
      utxos.forEach(function(utxo){
        if (!utxo || !utxo.assets) {
          return;
        }

        utxo.assets.forEach(function(asset){
          if (!asset) {
            return;
          }

          if (req.body.assetId === asset.assetId) {
            jsonResult.totalAmount += asset.amount;
          }
        });
      });

      res.json(jsonResult);
    });
  });

  colu.init();
});

// fromAddress から toAddress に asset を送る
// http://documentation.colu.co/#SendAsset
router.post('/send_asset', function(req, res) {
  if (!req.body.fromAddress || !req.body.toAddress ||
    !req.body.amount || !req.body.assetId) {

    return res.json({
      status: 'ng'
    });
  }

  var location = null;

  if (req.body.fromAddress.location !== void 0) {
    location = req.body.fromAddress.location;
  }

  var colu = new Colu(coluSettings);
  colu.on('connect', function () {
    var args = {
      "from": [req.body.fromAddress],
      "to": [{
        "address": req.body.toAddress,
        "amount": req.body.amount,
        "assetId": req.body.assetId
      }]
    };

    colu.sendAsset(args, function (err, body) {
      if (err) {
        console.error(err);
        app.on_send_asset(err, null);
        return res.json({
          status: 'ng'
        });
      }

      console.log("sendAsset: ", body);

      // GEO 情報を付与
      var emitData = util.inspect(body, false, null);
      emitData.timestamp = new Date().getTime();
      if (location) {
        emitData.location = location;
      } else {
        emitData.location = {
          longitude: 136.363662 + (0.1 * Math.random() - 0.05),
          latitude: 36.291488 + (0.1 * Math.random() - 0.05)
        };
      }
      app.on_send_asset(null, emitData);

      var jsonResult = {
        status: 'ok'
      };

      res.json(jsonResult);
    });
  });

  colu.init();
});

router.get('/test/send_asset', function(req, res) {
  var example_response = {
    jsonrpc:'2.0',
    id: '1',
    result: {
      txHex:'01000000028eb8630c3b717aca732d1756847b2fa09a61bf411e71cbf44d56978bbe4a92da010000001976a9140163a335af7b06bf036af48072ad0c7ed4e659c988acffffffffc76706af9c70ace15b65b1175ca2fa7dcea72a20c56083a5f823e2f2a8d4b720000000001976a9140163a335af7b06bf036af48072ad0c7ed4e659c988acffffffff04ac0200000000000047512103ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff2103ff7e5db2203b4cf330203b4255269b8c88d89802757fdccf2dd4b57a91aebdd652ae58020000000000001976a9141548a1ebcc09d386e6bdd1ccf39e4e17dd60ed6588ac00000000000000001c6a1a434301113b2f0f74c075e385811e0b64e81a6f175f116706010a24050000000000001976a9140163a335af7b06bf036af48072ad0c7ed4e659c988ac00000000',
      metadataSha1: '3b2f0f74c075e385811e0b64e81a6f175f116706',
      multisigOutputs: [],
      coloredOutputIndexes: [1],
      financeTxid: '20b7d4a8f2e223f8a58360c5202aa7ce7dfaa25c17b1655be1ac709caf0667c7',
      txid: 'b905a0d835393245cef9901f891fa1058e33c2ac44fb01b437055aeeab401c55'
    }
  };
  example_response.timestamp = new Date().getTime();
  example_response.location = {
    longitude: 136.363662 + (0.1 * Math.random() - 0.05),
    latitude: 36.291488 + (0.1 * Math.random() - 0.05)
  };
  app.on_send_asset(null, example_response);
  var jsonResult = {
    status: 'ok'
  };

  res.json(jsonResult);
});

router.post('/issueAsset', function(req, res) {
  console.log(req.body);

  if (!req.body.divisibility || !req.body.reissueable || !req.body.amount || !req.body.assetName || !req.body.issuer || !req.body.description) {
    return res.json({
      status: 'ng'
    });
  }

  var colu = new Colu(coluSettings);
  // console.log(coluSettings);
  colu.on('connect', function () {
    var args = {
        amount: req.body.amount,
        divisibility: req.body.divisibility,
        reissueable: req.body.reissueable,
        transfer: [{
            amount: 1
        }],
        metadata: {
            'assetName': req.body.assetName,
            'issuer': req.body.issuer,
            'description': req.body.description,
            'urls': [{name:'icon', url: req.body.icon_url || 'https://pbs.twimg.com/profile_images/572390580823412736/uzfQSciL_bigger.png', mimeType: 'image/png', dataHash: ''}],
        }
    };

    colu.issueAsset(args, function (err, body) {
      if (err) return console.error(err);
      console.log(body);

      res.json(body);
    })
  });

  colu.init();
});

router.get('/privateSeed', function(req, res) {
  var colu = new Colu(coluSettings);
  console.log(coluSettings);

  colu.on('connect', function () {
    var privateSeed = colu.hdwallet.getPrivateSeed()

    console.log("privateSeed: ", privateSeed)

    res.json(privateSeed);
  });

  colu.init();
})

module.exports = app;
