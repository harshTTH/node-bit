module.exports.isHandshake = (request,response) => {
    let pstr = 'BitTorrent protocol';
    let pstrReq = request.slice(1,pstr.length+1).toString();
    let pstrRes = response.slice(1,pstr.length+1).toString();

    return (
        (response.length === (pstrReq.length + 49)) && 
        (pstrRes === pstr)
    );
}

module.exports.parseMsg  = (response) => {
    let length = response.readUInt32BE(0)+4;
    let payload = null;
    let id = (response.length > 4)?response.readUInt8(4):null;
    if(id === 4 || id === 5 || id === 9){
        payload = (id === 5) ? response.slice(5):response.readUInt32BE(5);
    }else if(id === 6 || id === 7 || id === 8){
        payload = {
            index:response.readUInt32BE(5),
            begin:response.readUInt32BE(9)
        }
        payload[id !== 7?'length':'block'] = response.slice(13);
    }
    return {
        length,
        id,
        payload
    }
}
