const crypto = require('crypto');
const {udpSend} = require('./utils');

const connectTracker = (url,message) => {
    return new Promise((resolve,reject)=>{
        if(!message){
            message = createConnectStruct();
            console.log(`\nTracker url: ${url}`);
        }
        udpSend(message,url)
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
    connectTracker
}