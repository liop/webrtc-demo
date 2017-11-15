/*
* @Author: lizhengfeng
* @Date:   2017-11-14 14:37:45
* @Last Modified by:   lizhengfeng
* @Last Modified time: 2017-11-14 19:04:26
*/
import http from 'http';
import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import realtime from './realtime.js';
import api from './api.js';
//http
const app = express();
app.use(function(req, res, next) {
  // console.log(req.url);
  next();
})
app.use(express.static( path.resolve(__dirname, '../web')));
app.use('/api', api);

var server = http.createServer(app).listen(3000, function(e) {
  if(e) console.error(e);
  console.log('server listen at port: ', 3000);
});

//socket
const io = socketIO.listen(server);
io.on('connection',realtime);





