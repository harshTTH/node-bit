const {pieceHashes,pieceSize,fileSize,fileName} = require('./decodeFile');
const {download} = require('./download.js');
const {findIndices,requested,received,rl} = require('./utils');
const {writePiece} = require('./downContent');
const BIT8MAX = 255;
const BLOCK_LENGTH = Math.pow(2,14);
let peersPieces = [],rarePieces,unchokedCount = 0;

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
        download(peersPieces,socket,rarePieces,BLOCK_LENGTH,0);
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
    const block = msg.payload.block;
    socket.pieceData = Buffer.concat([socket.pieceData,block]);
    let receivedPieceIndex = msg.payload.index;
    let receivedBlockIndex = msg.payload.begin; 
    let BLOCK_LENGTH = block.length;
    
    //console.log(`Block of length ${BLOCK_LENGTH} of offset ${receivedBlockIndex} of Piece ${receivedPieceIndex}`)

    if(receivedBlockIndex+BLOCK_LENGTH < pieceSize[0]){

        download(peersPieces,socket,rarePieces,BLOCK_LENGTH,receivedBlockIndex+BLOCK_LENGTH);

    }else if(receivedBlockIndex+BLOCK_LENGTH === pieceSize[0]){

        let pieceData = socket.pieceData;
        if(writePiece(fileName[0],pieceData,receivedPieceIndex,pieceSize[0]) === false){
            console.log('Failed to write');
        }else{
            received.push(receivedPieceIndex);
            let percentage = ((received.length/pieceHashes.length)*100).toPrecision(2);
            
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(percentage+' %');    
        }
        socket.pieceData = Buffer.alloc(0);
        if(received.length !== pieceHashes.length && requested.length !== received.length)
            download(peersPieces,socket,rarePieces,BLOCK_LENGTH,0);
        else{
            peersPieces.forEach(peer=>{
                peer.socket.destroy();
            })
            rl.write('\nFile Downloaded Successfully \n')
            rl.close();
        }

    }else{
        
        let dPieceSize;
        if(receivedPieceIndex === pieceHashes.length-1)
            dPieceSize = fileSize[0] - (pieceSize[0]*(pieceHashes.length-1));
        else dPieceSize = pieceSize[0]; 

        BLOCK_LENGTH = dPieceSize % BLOCK_LENGTH;
        download(peersPieces,socket,rarePieces,BLOCK_LENGTH,receivedBlockIndex+BLOCK_LENGTH);
    }

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

