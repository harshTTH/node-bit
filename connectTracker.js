const crypto = require('crypto');
const dgram = require('dgram');
const {udpSend} = require('./utils');
const socket = dgram.createSocket('udp4');

const connectTracker = (decodedData,message) => {
    return new Promise((resolve,reject)=>{
        if(!message)message = createConnectStruct();
        udpSend(message,socket,decodedData.announce)
        .then((message)=>{
            resolve(message);
        },(err)=>reject(err));
    });
}

const createConnectStruct = () => {
    let buf = Buffer.allocUnsafe(16);
    buf.writeInt32BE(0x417,0);
    buf.writeInt32BE(0x27101980,4);
    buf.writeInt32BE(0,8);
    crypto.randomFillSync(buf,12,4);
    return buf;
}


module.exports = {
    connectTracker,socket
}