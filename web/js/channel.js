/*
* @Author: lizhengfeng
* @Date:   2017-11-15 14:51:15
* @Last Modified by:   lizhengfeng
* @Last Modified time: 2017-11-15 17:56:03
*/

var dataChannelSend = document.getElementById('dataChannelSend');
var dataChannelReceive = document.getElementById('dataChannelReceive');

var startBtn = document.getElementById('startBtn');
var sendButton = document.getElementById('sendButton');
var closeButton = document.getElementById('closeButton');

var dataChannel = null;
if (window.pc === undefined) {
  pc = null;
}

startBtn.onclick = function () {
  if (!pc) {
    start();
  }
  dataChannelSend.disabled = false;
  createDataChannel();

}
sendButton.onclick = function () {
  dataChannel.disabled = true;
  dataChannel.send(dataChannelSend.textContent);
}



function createDataChannel() {
  dataChannel = pc1.createDataChannel('text');
  dataChannel.onopen = function () {
    track('dataChannel Opened!!');
  }
  dataChannel.onmessage = function(event) {
    if (event && event.data) {
      dataChannelReceive.textContent = event.data + dataChannelReceive.textContent;
    }
    dataChannel.disabled = false;
    track(event);
  }
}