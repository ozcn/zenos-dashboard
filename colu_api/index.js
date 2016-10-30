var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var util = require('util');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

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

    res.json(body);
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

  var jsonData = {
    jsonrpc: "2.0", // mandatory
    method: "sendAsset", // mandatory
    id: "1", // mandatory if response is needed
    params: sendAsset // asset json object
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
      status: 'ok'
    };

    res.json(jsonResult);
  });
});

app.listen(process.env.PORT || 3000);

/**
 * node $(which colu) で起動中の Colu API へリクエストを送る
 * via: http://documentation.colu.co/
 **/
function postToApi(apiEndpoint, jsonData, callback) {
  console.log(apiEndpoint + ': ', JSON.stringify(jsonData));
  request.post({
      url: 'http://0.0.0.0:8081/' + apiEndpoint,
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
