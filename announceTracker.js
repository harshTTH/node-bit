const crypto = require('crypto');
const bencode = require('bencode');
const {udpSend} = require('./utils');
const {socket} = require('./connectTracker');
const bignum = require('bignum')

const announceTracker = (connection_id,decodedData,annReq) => {
    let url = decodedData.announce.toString();
    console.log(`\nAnnounce request sent to: ${url}`);
    if(!annReq)annReq = createAnnounceReq(connection_id,decodedData);
    return new Promise((resolve,reject)=>{
        udpSend(annReq,socket,url).then((response)=>{
            resolve(response);
        })
        .catch((error)=>{
            reject(error)
        })  
    })
}

const createAnnounceReq = (connection_id,decodedData,port=6884) => {
    let buff = Buffer.allocUnsafe(98);
    let infoHash = createInfoHash(decodedData);
    //console.log(`\nInfo Hash :  ${infoHash}\n`);
    let peer_id = getPeerId();

    //connection_id
    connection_id.copy(buff,0);

    //action
    buff.writeUInt32BE(1,8);

    //transaction_id
    crypto.randomBytes(4).copy(buff,12);

    //info_hash
    infoHash.copy(buff,16);
     
    //peer_id
    peer_id.copy(buff,36);

    //downloaded
    Buffer.alloc(8).copy(buff,56);

    //left
    bignum.toBuffer(decodedData.length,{size:8}).copy(buff,64);

    //uploaded
    Buffer.alloc(8).copy(buff,72);
    
    //event
    buff.writeUInt32BE(0,80);

    //ipaddress
    buff.writeUInt32BE(0,84);

    //key
    crypto.randomBytes(4).copy(buff,88);

    //num_want
    buff.writeInt32BE(-1,92);

    //port
    buff.writeUInt16BE(port,96);

    return buff;
}

const createInfoHash = (decodedData) => {
    let encodedInfo = bencode.encode(decodedData.info);
    let hash = crypto.createHash('SHA1');
    hash.update(encodedInfo);
    return hash.digest();
}

const getPeerId = () => {
    let id = crypto.randomBytes(20);
    Buffer.from('-BC0001-').copy(id,0);
    return id;
}

module.exports = {
    announceTracker
}