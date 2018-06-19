const net = require('net');
const {rl,createInfoHash,getPeerId} = require('./utils');
let connectedCount = 0;
let message;

const setupConnect = (peers) => {
    if(peers.length > 0){
        peers.forEach(connectPeer)
    }
}

const connectPeer = (peer) => {
    const socket = new net.Socket();
    
    socket.connect(peer.port,peer.ip,()=>{
        sendHandshake(socket);
    });
    
    socket.on('error',(err)=>{})
    
    socket.on('end',()=>{
        if(connectedCount !== 0){
            connectedCount--;
            rl.write(`Connected Peers: ${connectedCount}\n`);
        }
    })

    socket.on('data',(data)=>{
       //if(data.length === data.readUInt8(0) + 49){
           //if(data.slice(1,20).toString() === 'BitTorrent protocol'){
                connectedCount++;
                rl.write(`Connected Peers: ${connectedCount}\n`);
                console.log(data.length);
           //}
       //}else {
           //console.log(data.toString());
       //}
    })
}


const sendHandshake = (socket) => {
    let message = generateHandshakeMsg();
    socket.write(message);
}

const generateHandshakeMsg = () => {
    if(!message){
        let pstr = 'BitTorrent protocol';
        let buff = Buffer.allocUnsafe(49+pstr.length);
        let infoHash = createInfoHash();
        let peerId = getPeerId();
    
        buff.writeUInt8(pstr.length,0);
        buff.write(pstr,1,pstr.length);
        buff.writeUInt32BE(0,pstr.length+1);
        buff.writeUInt32BE(0,pstr.length+5);
        infoHash.copy(buff,pstr.length+9);
        peerId.copy(buff,pstr.length+9+infoHash.length);
        
        message = buff;
        return message;        
    }return message;
}

module.exports = {
    setupConnect
}