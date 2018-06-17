const {connectTracker} = require('./connectTracker');
const {rl,startTimer} = require('./utils');

const udpTracker = (url,message) => {
    //udp connection initiated
    return new Promise((resolve,reject)=>{
        connectTracker(url,message)
        .then(resolve,reject)
    })
} 

const initResendEventTimer = (message) => {
    startTimer(message.readUInt32BE(12),()=>{
        rl.write('\nResponse timeout Retrying');
        udpTracker(readableData,message)
        .then(()=>{
            initResendEventTimer(message);//with every request one resend timer
            tracker(message,decodedData);
        })
    })
}
module.exports = {
    udpTracker,
    initResendEventTimer
}