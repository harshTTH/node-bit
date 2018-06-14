const crypto = require('crypto');
const dgram = require('dgram');
const url = require('url');
const socket = dgram.createSocket('udp4');

const connectTracker = (decodedData) => {
    return new Promise((resolve,reject)=>{
        let message = createConnectStruct();
        udpSend(message,socket,decodedData.announce)
        .then(()=>resolve(),(err)=>reject(err));
    });
}

const udpSend = (message,socket,trackUrl)=> {
    let URL = url.parse(trackUrl);
    return new Promise((resolve,reject)=>{
        socket.send(message,0,message.length,URL.port,URL.hostname,(err)=>{
            if(err)reject(err);
            else resolve();
        });
    });
}

const createConnectStruct = () => {
    let buf = Buffer.alloc(16);
    buf.writeInt32BE(0x417271,0);
    buf.writeInt32BE(0x01980,4);
    buf.writeInt32BE(0,8);
    crypto.randomFillSync(buf,12,4);
    return buf;
}

module.exports = {
    connectTracker
}