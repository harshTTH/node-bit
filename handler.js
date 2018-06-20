const builder = require('./msgBuilder');

module.exports.choke = (socket) => {
    socket.destroy();
};

module.exports.unChoke = (socket) => {
    console.log(`Unchoked Peer: ${socket.remoteAddress}`);
    socket.write(builder.keepAlive());
}

module.exports.have = (socket,msg) => {

}
 
module.exports.bitfield = (socket,msg) => {
    console.log(`Peer ${socket.remoteAddress} sended bitfield ${msg.payload.readUInt8(0)}`)
}

module.exports.piece = (socket,msg) => {

}