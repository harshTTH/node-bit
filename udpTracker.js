const crypto = require('crypto');
const {rl,startTimer,udpSend} = require('./utils');
const {responseListener} = require('./responseListener');

const udpTracker = (url,message) => {
    //udp connection initiated
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

const initResendEventTimer = (url,message,decodedData) => {
    startTimer(message.readUInt32BE(12),()=>{
        rl.write('\nResponse timeout Retrying');
        udpTracker(url,message)
        .then((message)=>{
            initResendEventTimer(url,message);//with every request one resend timer
            responseListener(message,decodedData,url).then((response)=>{
                rl.write('\nTracker Responded:\n\nTorrent Status: \n')
                console.log(`Seeders : ${response.seeders}`);
                console.log(`Leechers: ${response.leechers}`);
                console.log(`Peers   : ${response.peers && response.peers.length}`);
                rl.close();
            }).catch((err)=>{
                rl.write(err);
            })
        })
    })
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
    udpTracker,
    initResendEventTimer,
    createConnectStruct
}