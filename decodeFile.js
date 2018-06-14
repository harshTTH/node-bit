const bencode = require('bencode');

const decodeFile = (data) => {
    try{
        return bencode.decode(data);
    }catch(error){
        console.log(error);
        return null;
    }
}

const getReadableData = (decodedData)=> {
    return {
        name:decodedData.info.name && decodedData.info.name.toString(),
        announce:decodedData.announce.toString(),

        'announce-list':decodedData['announce-list'] && decodedData['announce-list'].map(announce=>announce[0].toString()),

        'creation date':decodedData['creation date'] && new Date(decodedData['creation date']).toLocaleDateString(),

        length:(decodedData.info.length)
        ? fixMagnitude(decodedData.info.length)
        : fixMagnitude(decodedData.info.files.reduce(
            (prvs,next)=>prvs.length   +next.length))
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
    getReadableData
}