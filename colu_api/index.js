var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var util = require('util');
var path = require('path');

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
// http://documentation.colu.co/#GetAddress34
app.post('/get_address', function(req, res) {
  var jsonData = {
    jsonrpc: "2.0", // mandatory
    method: "hdwallet.getAddress", // mandatory
    id: "1" // mandatory if response is needed
  };

  postToApi('', jsonData, function(err, body) {
    if (err) {
      console.error(err);
      return res.json({
        status: 'ng'
      });
    }

    console.log(body);

    var jsonResult = {
      status: 'ok',
      address: body.result || null,
    };

    res.json(jsonResult);
  });
});

// 特定の wallet address の情報を取得する
// (例) 自分が今いくら assets を持っているか？
// http://documentation.colu.co/#GetAddressInfo38
app.post('/get_address_info', function(req, res) {
  if (!req.body.address) {
    return res.json({
      status: 'ng'
    });
  }

  var params = {
    address: req.body.address
  };

  var jsonData = {
    jsonrpc: "2.0", // mandatory
    method: "coloredCoins.getAddressInfo", // mandatory
    id: "1", // mandatory if response is needed
    params: params // quary parameters
  };

  postToApi('', jsonData, function(err, body) {
    if (err) {
      console.error(err);
      return res.json({
        status: 'ng'
      });
    }

    console.log(util.inspect(body, false, null));

    var jsonResult = {
      status: 'ok',
      address: null,
      assets: []
    };

    if (body.result) {
      if (body.result.address) {
        jsonResult.address = body.result.address;
      }
      if (body.result.utxos && body.result.utxos[0]) {
        jsonResult.assets = body.result.utxos[0].assets;
      }
    }

    res.json(jsonResult);
  });
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
    longitude: 139.739143 + (0.01 * Math.random() - 0.005),
    latitude: 35.678707 + (0.01 * Math.random() - 0.005)
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
