const crypto = require('crypto');
const bencode = require('bencode');
const {udpSend} = require('./utils');
const {socket} = require('./connectTracker');
const bignum = require('bignum')

const announceTracker = (connection_id,decodedData,annReq) => {
    if(!annReq)annReq = createAnnounceReq(connection_id,decodedData);

    return new Promise((resolve,reject)=>{
        udpSend(annReq,socket,decodedData.announce.toString()).then((response)=>{
            resolve(response);
        })
        .catch((error)=>{
            reject(error)
        })  
    })
}

const createAnnounceReq = (connection_id,decodedData,port=6881) => {
    let buff = Buffer.allocUnsafe(98);
    let infoHash = createInfoHash(decodedData).toString();
    let peer_id = getPeerId(01,00);

    connection_id.copy(buff);
    buff.writeUInt32BE(1,8);
    crypto.randomFillSync(buff,12,4);
    buff.write(infoHash,16,20);
    buff.write(peer_id,36,20);
    Buffer.alloc(8).copy(buff,56);
    bignum.toBuffer(decodedData.info.length,{size:8}).copy(buff,64);
    Buffer.alloc(8).copy(buff,72);
    buff.writeUInt32BE(0,80);
    buff.writeUInt32BE(0,84);
    crypto.randomFillSync(buff,88,4);
    buff.writeInt32BE(-1,92);
    buff.writeUInt16BE(port,96);

    return buff;
}

const createInfoHash = (decodedData) => {
    let encodedInfo = bencode.encode(decodedData.info);
    let hash = crypto.createHash('SHA1');
    hash.update(encodedInfo);
    return hash.digest();
}

const getPeerId = (version,build) => {
    return(`BC${version}${build}-${process.pid}${new Date().getTime()}`.substr(0,20));
}

module.exports = {
    announceTracker
}