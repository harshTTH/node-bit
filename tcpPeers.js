const net = require('net');
const {rl} = require('./utils');
const builder = require('./msgBuilder');
const checkType = require('./msgType');
const handler = require('./handler');
let connectedCount = 0;

const setupConnect = (peers) => {
    if(peers.length > 0){
        peers.forEach(connectPeer);
    }
}

const connectPeer = (peer) => {
    const socket = new net.Socket();
    
    socket.connect(peer.port,peer.ip,()=>{
        socket.write(builder.handshake());
        //console.log(`Connected to ${peer.ip}:${peer.port}`);
    });
    
    socket.on('error',(err)=>{})
    
    socket.on('end',()=>{
        if(connectedCount !== 0){
            connectedCount--;
            rl.write(`Connected Peers: ${connectedCount}\n`);
        }
    })

    getWholeMessage(socket,data=>{
        if(checkType.isHandshake(builder.handshake(),data)){
            socket.write(builder.intrested());
        }else{
            let msg = checkType.parseMsg(data);

            switch(msg.id){
                case 0 : handler.choke(socket); break;
                case 1 : handler.unChoke(socket); break;
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
        if(prvsBuff.length === 0){
            msgLen = handshake?68:data.readUInt32BE(0)+4;
            if(data.length > msgLen){
                prvsBuff = data.slice(msgLen);
                if(handshake){
                    handshake = false;
                    connectedCount++;
                }
                callback(data.slice(0,msgLen));
            }else if(data.length < msgLen){
                prvsBuff.copy(data);
            }else{
                if(handshake){
                    handshake = false;
                    connectedCount++;
                }
                callback(data);
            }

        }else{
            if(prvsBuff.length+data.length > msgLen){
                if(handshake){
                    handshake = false;
                    connectedCount++;
                }
                callback(Buffer.concat([prvsBuff,data],msgLen));
                prvsBuff = data.slice(msgLen-prvsBuff.length);
            }else if(prvsBuff.length + data.length < msgLen){
                prvsBuff = Buffer.concat([prvsBuff,data]);
            }else{
                if(handshake){
                    handshake = false;
                    connectedCount++;
                }
                callback(Buffer.concat([prvsBuff,data]));
                prvsBuff = Buffer.alloc(0);
            }
        }
    })
}


module.exports = {
    setupConnect
}