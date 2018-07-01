let {pieceHashes} = require('./decodeFile');
let {requested,received} = require('./utils');
const {findIndices} = require('./utils');
const builder = require('./msgBuilder');

const download = (peersPieces,socket,rarePieces,BLOCK_LENGTH,blockOffset) => {
    if(!isFinished(received,pieceHashes.length)){
        let requestedIndex;
        if(blockOffset === 0){
            requestedIndex = selectPiece(peersPieces,socket,rarePieces);
            socket.lastRequestedIndex = requestedIndex;
        }else requestedIndex = socket.lastRequestedIndex;

        socket.write(builder.request(requestedIndex,blockOffset,BLOCK_LENGTH),()=>{
            requested.push(requestedIndex);
        })
    }
}

const isFinished = (received,pieces) => {
    return received.length === pieces
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