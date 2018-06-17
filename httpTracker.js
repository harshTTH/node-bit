const http = require('http');
const bencode = require('bencode');
const {createInfoHash,getPeerId,rl} = require('./utils');

const httpTracker = (url,decodedData,port=6881) => {
    let request = createGetReq(url,decodedData,port);
    rl.write(`\nTracker url : ${url}\n`);
    
    return new Promise((resolve,reject)=>{
        http.get(request,(res)=>{
            res.on('data',data=>{
                resolve(bencode.decode(data));
            })

            res.on('error',err=>{
                reject(err);
            })
        })
    })

}

const createGetReq = (url,decodedData,port) => {
    let infoHash = escape(createInfoHash(decodedData).toString('binary'));
    let peerId = escape(getPeerId(0));

    return(`${url}?info_hash=${infoHash}&peer_id=${peerId}&port=${port}&uploaded=0&downloaded=0&left=${decodedData.length}&compact=1&numwant=200`);
}

module.exports = {
    httpTracker
}