const fs = require('fs');
const crypto = require('crypto');
const {pieceHashes} = require('./decodeFile');
//const {rl} = require('./utils');

const writePiece = (fileName,pieceData,pieceIndex,pieceSize) => {
    if(verifyPiece(pieceData,pieceIndex)){
        let filePath = `${process.env.HOME}/Downloads/${fileName}`;
        fs.open(filePath,'w',(err,fd)=>{
            if(!err){
                fs.write(fd,pieceData,0,pieceSize,pieceIndex*pieceSize,()=>{});
            }    
        })
    }else return false;
}

const verifyPiece = (pieceData,pieceIndex) => {
    const hash = crypto.createHash('sha1');
    hash.update(pieceData);
    return (Buffer.compare(pieceHashes[pieceIndex],hash.digest()));
}

module.exports = {
    writePiece
}
