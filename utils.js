const url = require('url');
const readline = require('readline');
const {addRequests,requests,getRequest} = require('./requests');

let loading,timeOutId = [];
const LOADING_CHANGE_TIME = 500;
const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    terminal:true
});

const udpSend = (message,socket,trackUrl)=> {
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
        return new Promise((resolve,reject)=>reject('Timeout'))
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

module.exports = {
    udpSend,
    rl,
    startLoading,
    stopLoading,
    startTimer,
    stopTimer,
    isLoading
}