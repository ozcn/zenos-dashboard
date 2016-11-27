var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var util = require('util');
var path = require('path');
var Colu = require('colu');

var coluSettings = {
  network: 'testnet',
  privateSeed: ''
};

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

app.get('/', function(req, res) {
  res.send('hello Colu API');
});

// wallet address を取得する（新規払い出し）
// http://documentation.colu.co/#GetAddress
app.post('/get_address', function(req, res) {
  var colu = new Colu({
    network: coluSettings.network
  });

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
app.post('/get_address_info', function(req, res) {
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
// http://documentation.colu.co/#SendAsset36
app.post('/send_asset', function(req, res) {
  if (!req.body.fromAddress || !req.body.toAddress ||
    !req.body.amount || !req.body.assetId) {

    return res.json({
      status: 'ng'
    });
  }

  var sendAsset = {
    "from": [req.body.fromAddress],
    "to": [{
      "address": req.body.toAddress,
      "amount": req.body.amount,
      "assetId": req.body.assetId
    }],
  };

  var location = null;

  if (req.body.fromAddress.location !== void 0) {
    location = req.body.fromAddress.location;
  }

  var jsonData = {
    jsonrpc: "2.0", // mandatory
    method: "sendAsset", // mandatory
    id: "1", // mandatory if response is needed
    params: sendAsset // asset json object
  };

  postToApi('', jsonData, function(err, body) {
    if (err) {
      console.error(err);
      app.on_send_asset(err, null);
      return res.json({
        status: 'ng'
      });
    }

    console.log(util.inspect(body, false, null));
    var emitData = util.inspect(body, false, null);
    emitData.timestamp = new Date().getTime();
    if (location != null) {
      emitData.location = location;
    } else {
      emitData.location = {
        longitude: 139.739143 + (0.1 * Math.random() - 0.05),
        latitude: 35.678707 + (0.1 * Math.random() - 0.05)
      };
    }
    app.on_send_asset(null, emitData);
    var jsonResult = {
      status: 'ok'
    };

    res.json(jsonResult);
  });
});

app.get('/test/send_asset', function(req, res) {
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
    longitude: 139.739143 + (0.1 * Math.random() - 0.05),
    latitude: 35.678707 + (0.1 * Math.random() - 0.05)
  };
  app.on_send_asset(null, example_response);
  var jsonResult = {
    status: 'ok'
  };

  res.json(jsonResult);
});

/**
 * node $(which colu) で起動中の Colu API へリクエストを送る
 * via: http://documentation.colu.co/
 **/
function postToApi(apiEndpoint, jsonData, callback) {
  console.log(apiEndpoint + ': ', JSON.stringify(jsonData));
  request.post({
      url: 'https://zenos-colu.herokuapp.com/' + apiEndpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(jsonData), 'utf8')
      },
      body: JSON.stringify(jsonData)
    },
    function(error, response, body) {
      if (error) {
        return callback(error);
      }
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      return callback(null, body);
    });
}

module.exports = app;
