const {pieceHashes} = require('./decodeFile');
const {download} = require('./download.js');
const {findIndices,requested,received} = require('./utils');
let peersPieces = [],rarePieces,unchokedCount = 0;
let BIT8MAX = 255;

module.exports.choke = (socket) => {
    socket.destroy();
};

module.exports.unChoke = (socket) => {
    //console.log(`Peers : ${connectedCount}`);
    let peer;
    for(let i = 0; i< peersPieces.length;i++){
        if(peersPieces[i].socket === socket){
            peer = peersPieces[i];
            socket.peerIndex = i;
            break;
        }
    }
    if(peer && peer.choke === undefined){
        peer.choke = false;
        unchokedCount++;
        if(unchokedCount%3 === 0){
            rarePieces = findRareIndexSet();
        }
        download(peersPieces,socket,rarePieces);
    }
}

module.exports.have = (socket,msg) => {
    //console.log(msg.payload);
}
 
module.exports.bitfield = (socket,msg) => {
    if(!peersPieces.find(peer=>(peer.socket === socket && msg.payload.length*8 >= pieceHashes.length))){
        peersPieces.push({
            socket,
            payload:msg.payload
        });
    }
}

module.exports.piece = (socket,msg) => {
    let recievedPieceIndex = msg.payload.index; 
    console.log(`Recieved Block : ${recievedPieceIndex} from ${socket.remoteAddress} of length ${msg.payload.block.length}`);
}

const findRareIndexSet = () => {
    let bitFieldLength = peersPieces[0].payload.length;
    let zeroIndices = [];
    for(let i = 0; i < bitFieldLength; i++){
        for(j = 0 ; j < peersPieces.length; j++){
            let peerPiece = peersPieces[j];
            if(!peerPiece.choke){
                findIndices(BIT8MAX-peerPiece.payload.readUInt8(i),i).forEach(index=>{
                    let exist = zeroIndices.findIndex(obj=>obj.index === index);
                    if(exist !== -1){
                        zeroIndices[exist].count++;
                        zeroIndices[exist].peer.push(peerPiece.socket);
                    }else{
                        zeroIndices.push({
                            index,
                            count:1,
                            peer:[peerPiece.socket]
                        })
                    }
                });
            }
        }
    }
    return zeroIndices.filter(obj=>{
        if(obj.count === 1)return false;
        if(obj.count === peersPieces.length)return false;
        return true;
    }).sort((prvsObj,nextObj)=>{
        if(prvsObj.count < nextObj.count)return 1;
        if(prvsObj.count > nextObj.count)return -1;
        if(prvsObj.count === nextObj.count)return 0;
    })
}

