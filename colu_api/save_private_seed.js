// private seed を取得する script
// CLI から node save_private_seed.js で利用できる
// ref: http://documentation.colu.co/#SavePrivateSeed45
var request = require('request');

function postToApi(api_endpoint, json_data, callback) {
  console.log(api_endpoint + ': ', JSON.stringify(json_data));
  request.post({
      url: 'http://localhost:8081/' + api_endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(json_data), 'utf8')
      },
      body: JSON.stringify(json_data)
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
};

var json_data = {
  jsonrpc: "2.0", // mandatory
  method: "hdwallet.getPrivateSeed", // mandatory
  id: "1" // mandatory if response is needed
}

postToApi('', json_data, function(err, body) {

  if (err) console.log('error: ', err);

  console.log(body);

});