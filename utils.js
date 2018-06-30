const dgram = require('dgram');
const url = require('url');
const bencode = require('bencode');
const socket = dgram.createSocket('udp4');
const readline = require('readline');
const crypto = require('crypto');
const net = require('net');
const {addRequests,requests,getRequest} = require('./requests');
let infoHash,peerId;
let requested = [], received = [];

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
    if(!infoHash){
        let encodedInfo = bencode.encode(decodedData.info);
        let hash = crypto.createHash('SHA1');
        hash.update(encodedInfo);
        infoHash = hash.digest();
        return infoHash;
    }return infoHash;
}

const getPeerId = () => {
    if(!peerId){
        let id = '-BC0001-',
        pid = process.pid.toString(),
        time = new Date().getTime().toString();
        
        let buff = Buffer.alloc(20);
        buff.write(id,0,id.length);
        buff.write(pid,id.length,pid.length);
        buff.write(time,pid.length);

        peerId = buff;
        return peerId;
    }return peerId;
}

async function getWorkingTracker(torrent){
    let trackers = torrent['announce-list'];
    let checkedTracker = [];
    
    if(trackers){
        while(true){
            let index;
            do{
                index = Math.floor(Math.random()*trackers.length);
            }while(checkedTracker.indexOf(index) !== -1 || checkedTracker.length === trackers.length);
    
            if(checkedTracker.length === trackers.length){
                return torrent.announce;
            }
    
            checkedTracker.push(index);
            let tracker = trackers[index];
            let trackerObj = url.parse(tracker);
    
            if(trackerObj.protocol === 'http:'){
                const socket = new net.Socket();
                let status = await new Promise((resolve)=>{
                    socket.connect(trackerObj.port||80,trackerObj.hostname,()=>{
                        resolve(true);
                    })
                    socket.on('error',()=>{
                        resolve(false);
                    })
                    socket.setTimeout(3000,()=>{
                        socket.end();
                        resolve(false);
                    })
                })
                if(status && tracker !== 'http://tracker.opentrackr.org/announce')return tracker;
    
            }
            else if(trackerObj.protocol === 'udp:'){    
                let message = Buffer.allocUnsafe(16);
                message.writeInt32BE(0x417,0);
                message.writeInt32BE(0x27101980,4);
                message.writeInt32BE(0,8);
                crypto.randomFillSync(message,12,4);
            
                let res = await new Promise((resolve)=>{
                    socket.send(message,0,message.length,trackerObj.port,trackerObj.hostname,(err)=>{
                        if(err)resolve(false);
                    });
                    socket.on('message',(response)=>{
                        resolve(true)
                    })
                    setTimeout(()=>resolve(false),5000);
                });
    
                if(res){
                    return tracker;
                }
            }

        }
    }else return torrent.announce;
}

const findIndices = (difference,i) => {
    let indices = [];
    while(difference){
        let index = Math.floor(Math.log2(difference));
        indices.push(8*i + (7-index));
        difference-=Math.pow(2,index);
    }
    return indices;
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
    getPeerId,
    getWorkingTracker,
    findIndices,
    requested,
    received
}