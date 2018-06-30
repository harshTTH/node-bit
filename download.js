let {pieceHashes,pieceSize} = require('./decodeFile');
let {requested,received} = require('./utils');
const {findIndices} = require('./utils');
const builder = require('./msgBuilder');
const BLOCK_LENGTH = Math.pow(2,14);

const download = (peersPieces,socket,rarePieces,i = 30) => {
    if(!isFinished(received,pieceHashes.length)){
        //const NO_OF_BLOCKS = Math.ceil(pieceSize[0]/BLOCK_LENGTH);
        let requestedIndex = selectPiece(peersPieces,socket,rarePieces);
        let blockIndex = i*BLOCK_LENGTH;

        socket.write(builder.request(requestedIndex,blockIndex,BLOCK_LENGTH),()=>{
            requested.push(requestedIndex);
            console.log(`Requested Block Index ${blockIndex} of piece ${requestedIndex} to ${socket.remoteAddress}`);
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