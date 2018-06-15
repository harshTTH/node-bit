const url = require('url');
const readline = require('readline');
let loading;
const LOADING_CHANGE_TIME = 500;

const udpSend = (message,socket,trackUrl)=> {
    let URL = url.parse(trackUrl);
    return new Promise((resolve,reject)=>{
        socket.send(message,0,message.length,URL.port,URL.hostname,(err)=>{
            if(err)reject(err);
            else resolve(message);
        });
    });
}

const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout,
    terminal:true
});

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

module.exports = {
    udpSend,
    rl,
    startLoading,
    stopLoading,
    isLoading
}