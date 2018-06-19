const net = require('net');
const {rl} = require('./utils');
let connectedCount = 0;

const setupConnect = (peers,trackerRequestParams) => {
    if(peers.length > 0){
        peers.forEach((peer)=>connectPeer(perr,decodedData))
    }
    rl.write('Connected Peers: \033[s'+`${connectedCount}`);
    //console.log('\nhello');
}

const connectPeer = (peer) => {
    const socket = net.Socket();
    
    socket.connect(peer.port,peer.ip,()=>{
        connectedCount++;
        updateDisplay(connectedCount);
    });
    
    socket.on('error',()=>{})
    
    socket.on('end',()=>{
        connectedCount--;
        updateDisplay(connectedCount);
    })
    
    socket.on('data',data=>{
        console.log(`Data: ${data}`)
    })
}

const updateDisplay = (connectedCount) => {
    rl.write('\033[u'+`${connectedCount}`);

}

const sendHandshake = (socket) => {
    socket.write()
}

const generateHandshakeMsg = () => {
    let pstr = 'BitTorrent protocol';
    let buff = Buffer.allocUnsafe(49+pstr.length);

    buff.writeUInt8(pstr.length,0);
    buff.write(pstr,1,pstr.length);
    buff.writeUInt32BE(0,pstr.length);
    buff.writeUInt32BE(0,pstr.length+4);
}

module.exports = {
    setupConnect
}