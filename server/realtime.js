/*
* @Author: lizhengfeng
* @Date:   2017-11-14 15:19:45
* @Last Modified by:   liop
* @Last Modified time: 2017-11-15 22:17:18
*/

import socketIO from 'socket.io';

const rooms = {};
function realtime(socket) {
  const io = socket.server;
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    const sockets = io.sockets.sockets;
    Object.keys(sockets).forEach(key => {
      if (key != socket.id) {
        sockets[key].emit('message', message);
      }
    });
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var numClients = io.to(room).clients()
    log('Room ' + room + ' now has ' + numClients + ' client(s)');
    console.log(numClients, io.to(room).clients);
    if (numClients === 1) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 2) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
          console.log(details.address);
        }
      });
    }
  });
}

module.exports = realtime;
