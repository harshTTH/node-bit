const bencode = require('bencode');
let pieceHashes = [];
let pieceSize = [],fileSize = [], fileName = [];

const decodeFile = (data) => {
    try{
        let decodedData = bencode.decode(data);

        if(!decodedData.info.length){
            decodedData.length = decodedData.info.files.map(f=>f.length).reduce((prvs,next)=>{
                return prvs + next;
            })
        }else decodedData.length = decodedData.info.length;
        fileSize.push(decodedData.length);
        return decodedData;
    }catch(error){
        console.error(error);
        return null;
    }
}

const getReadableData = (decodedData)=> {
    const name = decodedData.info.name && decodedData.info.name.toString();

    for(let i = 0;i< decodedData.info.pieces.length; i+=20){
        pieceHashes.push(decodedData.info.pieces.slice(i));
    }
    pieceSize.push(decodedData.info['piece length']);
    fileName.push(name)

    return {
        name,
        announce:decodedData.announce.toString(),

        'announce-list':decodedData['announce-list'] && decodedData['announce-list'].map(announce=>announce[0].toString()),

        'creation date':decodedData['creation date'] && new Date(decodedData['creation date']).toLocaleDateString(),

        length: fixMagnitude(decodedData.length)
    };
}


const fixMagnitude = (length) => {
    let exp = Number.parseFloat(length).toExponential(2).split('e');
    let mag = ['KB','MB','GB','TB','PB','EB','ZB','YB'];
    if(exp[1] > 2){
        let places = Number.parseInt(exp[1]/3);
        return`${Number.parseFloat(length/(Math.pow(1024,places))).toPrecision(4)} ${mag[places-1]}`
    }else{
        return length+" B"; 
    }
}

module.exports = {
    decodeFile,
    getReadableData,
    pieceHashes,
    pieceSize,
    fileSize,
    fileName
}