/*
* @Author: lizhengfeng
* @Date:   2017-11-14 14:37:45
* @Last Modified by:   liop
* @Last Modified time: 2017-11-16 14:03:45
*/
import http from 'http';
import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import realtime from './realtime.js';
import api from './api.js';

var port = process.env.PORT || 3000;

//http
const app = express();
app.use(function(req, res, next) {
  // console.log(req.url);
  next();
})
app.use(express.static( path.resolve(__dirname, '../web')));
app.use('/api', api);

var server = http.createServer(app).listen(port, function(e) {
  if(e) console.error(e);
  console.log('server listen at port: ', port);
});

//socket
const io = socketIO.listen(server);
io.on('connection',realtime);





