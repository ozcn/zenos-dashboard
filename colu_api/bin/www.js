#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../index');
var http = require('http').Server(app);
var socketio = require('socket.io')(http);


var port = process.env.PORT || 3000
app.set('port', port);

http.listen(port);
http.on('error', onError);
http.on('listening', onListening);

socketio.on('connection', function(socket) {
  console.log('a user connected');
});

app.on_send_asset = function(err, data) {
  if (err != null) {
    return;
  }
  socketio.emit('send_asset', data);
}


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = http.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
