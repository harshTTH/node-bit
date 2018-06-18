const http = require('http');
const bencode = require('bencode');
const url = require('url');
const {createInfoHash,getPeerId,rl} = require('./utils');

const httpTracker = (trackUrl,decodedData,port=6881) => {
    let request = createGetReq(trackUrl,decodedData,port);
    rl.write(`\nTracker url : ${trackUrl}\n`);
    
    return new Promise((resolve,reject)=>{
        httpRequest(resolve,reject,request,1);
    })

}

const httpRequest = (resolve,reject,request,count) => {
    if(count < 6){
        http.get(request,res => {
            if(res.statusCode >300 && res.statusCode <400){
                let redirectUrl = url.parse(res.headers.location);
                if(!redirectUrl.hostname){
                    res.headers.location = url.parse(request).hostname + res.headers.location;
                }
                httpRequest(resolve,reject,res.headers.location,count++);
            }else{
                res.on('data',data=>{
                    resolve(
                        parseHTTPResponse(bencode.decode(data))
                    );
                })
                
                res.on('error',err=>{
                    reject(err);
                })
            }
        }).on("error",()=>{
            reject();
        })
    }else reject();
}

const parseHTTPResponse = (response) => {
    let peers = response.peers;
    let peersIp = [];
    for(let i = 0; i < peers.length; i+=6){
        peersIp.push({
            ip:peers.slice(i,i+4).join('.'),
            port:peers.readUInt16BE(i+4)
        })    
    }
    response.peers = peersIp;
    return response;
}

const createGetReq = (url,decodedData,port) => {
    let infoHash = escape(createInfoHash(decodedData).toString('binary'));
    let peerId = escape(getPeerId(0));

    return(`${url}?info_hash=${infoHash}&peer_id=${peerId}&port=${port}&uploaded=0&downloaded=0&left=${decodedData.length}&compact=1&numwant=200&event=started&key=${peerId.slice(14)}`);
}

module.exports = {
    httpTracker
}