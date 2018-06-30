let requested = [], recieved = [],rarePieces = [],  {pieceHashes} = require('./decodeFile');
const {findIndices} = require('./utils');
const builder = require('./msgBuilder');

const download = (peersPieces,socket,rarePieces) => {
    if(!isFinished(recieved,pieceHashes.length)){
        let requestedIndex = selectPiece(peersPieces,socket,rarePieces);
        requested.push(requestedIndex);
        console.log(requested);
    }
}

const isFinished = (recieved,pieces) => {
    return recieved.length === pieces
}

const selectPiece = (peersPieces,socket,rarePieces) => {
    if(rarePieces && !socket.poor){
        for(let i = 0;i < rarePieces.length; i++){
            if(requested.indexOf(rarePieces[i].index) === -1 && rarePieces[i].peer.indexOf(socket) === -1){
                return rarePieces[i].index;
            }
        }
        socket.poor = true;
    }
    let totalPieces = pieceHashes.length,index;
    do{
        index = Math.floor(Math.random()*totalPieces);
    }while(!isAvailabel(peersPieces[socket.peerIndex].payload,index))
    return index;
}

const isAvailabel = (bitField,index) => {
    let byteIndex = Math.floor(index/8);
    let bitIndex = index%8;
    if(findIndices(requested.indexOf(index) === -1 && 255-bitField[byteIndex],0).indexOf(bitIndex) === -1)return true;
    return false;
}
module.exports = {
    download
}