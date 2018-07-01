const net = require('net');
const {rl} = require('./utils');
const builder = require('./msgBuilder');
const checkType = require('./msgType');
const handler = require('./handler');

const setupConnect = (peers) => {
    rl.write('\nDownloading :- \n');
    if(peers.length > 0){
        peers.forEach(connectPeer);
    }
}

const connectPeer = (peer) => {
    const socket = new net.Socket();

    socket.connect(peer.port,peer.ip,()=>{
        socket.pieceData = Buffer.alloc(0);
        socket.write(builder.handshake());
    });
    
    socket.on('error',(err)=>{})
    
    socket.on('end',()=>{

    })

    getWholeMessage(socket,data=>{
        if(checkType.isHandshake(builder.handshake(),data)){
            socket.write(builder.intrested());
        }else{
            let msg = checkType.parseMsg(data);
            switch(msg.id){
                case 0 : handler.choke(socket); break;
                case 1 : handler.unChoke(socket);break;
                case 4 : handler.have(socket,msg); break;
                case 5 : handler.bitfield(socket,msg);break;
                case 7: handler.piece(socket,msg);break;
            } 
        }
    });
}

const getWholeMessage = (socket,callback) => {
    let prvsBuff = Buffer.alloc(0);
    let handshake = true;
    let msgLen;

    socket.on('data',data=>{
        if(!(data.length > 4))return;
        if(prvsBuff.length === 0){

            msgLen = handshake?68:data.readUInt32BE(0)+4;
            
            if(data.length > msgLen){
                prvsBuff = data.slice(msgLen);
                if(handshake){
                    handshake = false;
                }
                callback(data.slice(0,msgLen));
                return;
            }else if(data.length < msgLen){
                prvsBuff = Buffer.concat([data,prvsBuff]);
            }else{
                if(handshake){
                    handshake = false;
                }
                callback(data);
            }

        }else{
            msgLen = prvsBuff.readUInt32BE(0)+4;
            
            if(prvsBuff.length+data.length > msgLen){
                if(handshake){
                    handshake = false;
                }
                let temp = data.slice(0,msgLen-prvsBuff.length);
                callback(Buffer.concat([prvsBuff,temp],msgLen));
                prvsBuff = data.slice(msgLen-prvsBuff.length);
                return;
            }else if(prvsBuff.length + data.length < msgLen){
                prvsBuff = Buffer.concat([prvsBuff,data]);
            }else{
                if(handshake){
                    handshake = false;
                }
                callback(Buffer.concat([prvsBuff,data]));
                prvsBuff = Buffer.alloc(0);
            }
        }
        
    })
}


module.exports = {
    setupConnect,
}