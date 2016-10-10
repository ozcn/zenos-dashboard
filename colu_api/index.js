var express = require('express');
var app = express();
var request = require('request');

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
    }

    console.log(body);

    res.json(body);
  });
});

app.listen(3000);

/**
 * node $(which colu) で起動中の Colu API へリクエストを送る
 * via: http://documentation.colu.co/
 **/
function postToApi(apiEndpoint, jsonData, callback) {
  console.log(apiEndpoint + ': ', JSON.stringify(jsonData));
  request.post({
      url: 'http://localhost:8081/' + apiEndpoint,
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
