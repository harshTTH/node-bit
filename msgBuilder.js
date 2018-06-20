const {createInfoHash,getPeerId} = require('./utils');
let message;

module.exports.handshake = () => {
    if(!message){
        let pstr = 'BitTorrent protocol';
        let buff = Buffer.allocUnsafe(49+pstr.length);
        let infoHash = createInfoHash();
        let peerId = getPeerId();
    
        buff.writeUInt8(pstr.length,0);
        buff.write(pstr,1,pstr.length);
        buff.writeUInt32BE(0,pstr.length+1);
        buff.writeUInt32BE(0,pstr.length+5);
        infoHash.copy(buff,pstr.length+9);
        peerId.copy(buff,pstr.length+9+infoHash.length);
        
        message = buff;
        return message;        
    }return message;
}

module.exports.keepAlive = () => {
    return Buffer.alloc(4);
}

module.exports.choke = () => {
    let buff = Buffer.alloc(5);
    buff.writeUInt32BE(1,0);
    buff.writeUInt8(0,4);

    return buff;   
}

module.exports.unchoke = () => {
    let buff = Buffer.alloc(5);
    buff.writeUInt32BE(1,0);
    buff.writeUInt8(1,4);

    return buff;
}

module.exports.intrested = () => {
    let buff = Buffer.alloc(5);
    buff.writeUInt32BE(1,0);
    buff.writeUInt8(2,4);

    return buff;    
}

module.exports.notIntrested = () => {
    let buff = Buffer.alloc(5);
    buff.writeUInt32BE(1,0);
    buff.writeUInt8(3,4);

    return buff;
}

module.exports.have = (pieceIndex) => {
    let buff = Buffer.alloc(9);
    buff.writeUInt32BE(5,0);
    buff.writeUInt8(4,4);
    buff.writeUInt32BE(pieceIndex,5);
    return buff;
}

module.exports.bitField = (bitfield) => {
    let buff = Buffer.alloc(5+bitfield.length);
    buff.writeUInt32BE(1+bitfield.length,0);
    buff.writeUInt8(5,4);
    bitField.copy(buff,5);
    
    return buff;
}

module.exports.request = (index,begin,length) => {
    let buff = Buffer.alloc(17);
    buff.writeUInt32BE(13,0);
    buff.writeUInt8(6,4);
    buff.writeUInt32BE(index,5);
    buff.writeUInt32BE(begin,9);
    buff.writeUInt32BE(length,13);

    return buff;
}

module.exports.piece = (index,begin,block) => {
    let buff = Buffer.alloc(13+block.length);
    buff.writeUInt32BE(9+block.length,0);
    buff.writeUInt8(7,4);
    buff.writeUInt32BE(index,5);
    buff.writeUInt32BE(begin,9);
    block.copy(buff,13);

    return buff;
}

module.exports.cancel = (index,begin,length) => {
    let buff = Buffer.from(17);
    buff.writeUInt32BE(13,0);
    buff.writeUInt8(9,4);
    buff.writeUInt32BE(index,5);
    buff.writeUInt32BE(begin,9);
    buff.writeUInt32BE(length,13);

    return buff;
}

module.exports.port = (listenPort) => {
    let buff = Buffer.alloc(7);
    buff.writeUInt32BE(3,0);
    buff.writeUInt8(9,4);
    buff.writeUInt16BE(listenPort,5);

    return buff;
}