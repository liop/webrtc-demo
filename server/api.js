/*
* @Author: lizhengfeng
* @Date:   2017-11-14 14:47:34
* @Last Modified by:   lizhengfeng
* @Last Modified time: 2017-11-14 15:51:35
*/
import express from 'express';
import N from 'nuve';

const router = express.Router();

N.API.init("531b26113e74ee30500001", "myKey", "http://localhost:3000/");

router.post('/createRoom/', function(req, res){
    N.API.createRoom('myRoom', function(roomID) {
        res.send(roomID);
    }, function (e) {
        console.log('Error: ', e);
    });
});

router.get('/getRooms/', function(req, res){
    N.API.getRooms(function(rooms) {
        res.send(rooms);
    }, function (e) {
        console.log('Error: ', e);
    });
});

router.get('/getUsers/:room', function(req, res){
    var room = req.params.room;
    N.API.getUsers(room, function(users) {
        res.send(users);
    }, function (e) {
        console.log('Error: ', e);
    });
});

module.exports = router;
