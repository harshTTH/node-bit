const dgram = require('dgram');
const url = require('url');
const bencode = require('bencode');
const socket = dgram.createSocket('udp4');
const readline = require('readline');
const crypto = require('crypto');
const {addRequests,requests,getRequest} = require('./requests');

let loading,timeOutId = [];
const LOADING_CHANGE_TIME = 500;
const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    terminal:true
});

const udpSend = (message,trackUrl)=> {
    let transaction_id = message.readUInt32BE(12);
    addRequests(transaction_id);
    let reqIndex = getRequest(transaction_id);
    if(reqIndex !== -1 && requests[reqIndex].n < 8){
        return new Promise((resolve,reject)=>{
            let URL = url.parse(trackUrl);
            socket.send(message,0,message.length,URL.port,URL.hostname,(err)=>{
                if(err)reject(err);
                else resolve(message);
            });
        })
    }else{
        return new Promise((resolve,reject)=>reject('Something went wrong'))
    }
}

const startLoading = () => {
    loading = setInterval(()=>rl.write('.'),LOADING_CHANGE_TIME)
}

const stopLoading = () => {
    if(loading){
        clearInterval(loading);
        loading=undefined;
    }
    else return false;
}

const isLoading = () => !!loading;

const startTimer = (transaction_id,callback,TIMEOUT=15000) => {
    timeOutId[transaction_id] = setTimeout(()=>{
        return callback();
    },TIMEOUT)
}

const stopTimer = (transaction_id) => {
    if(timeOutId[transaction_id]){
        clearTimeout(timeOutId[transaction_id]);
        timeOutId.splice(transaction_id,1)
    }
}

const createInfoHash = (decodedData) => {
    let encodedInfo = bencode.encode(decodedData.info);
    let hash = crypto.createHash('SHA1');
    hash.update(encodedInfo);
    return hash.digest();
}

const getPeerId = (bytes) => {
    if(bytes){
        let id = crypto.randomBytes(20);
        Buffer.from('-BC0001-').copy(id,0);
        return id;
    }
    return(`BC0001${process.pid}${new Date().getTime()}`.substr(0,20));
}

module.exports = {
    udpSend,
    rl,
    startLoading,
    stopLoading,
    startTimer,
    stopTimer,
    isLoading,
    socket,
    createInfoHash,
    getPeerId
}