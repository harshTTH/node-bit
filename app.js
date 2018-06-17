const fs = require('fs');
const {getFilepath} = require('./getFilepath');
const {decodeFile,getReadableData} = require('./decodeFile');
const {udpTracker,initResendEventTimer}  = require('./udpTracker');
const {httpTracker}  = require("./httpTracker");
const {responseListener} = require('./responseListener');
const {rl,startLoading,stopLoading,isLoading,socket} = require('./utils');
const filePath = getFilepath();

const handleReqFailure = (error)=>{
    rl.write('\nUnable to connect to tracker ! ');
    if(isLoading())stopLoading();
    rl.close();
    process.exit(1);
};

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
}


fs.readFile(filePath,(err,data)=>{
    if(err)
        rl.write('\nInvalid file path !\n');
    else{
        let decodedData = decodeFile(data);
        let readableData = getReadableData(decodedData);

        if(!decodedData)
            rl.write("\nInvalid File !\n");
        else{
            rl.write(`\n       ---Torrent Information---\n
    Name          : ${readableData.name}
    Length        : ${readableData.length}
    Creation Date : ${readableData['creation date']}
        \n`)

            rl.question('Do you want to download the above torrent (y/n): ',answer=>{
                if(answer.match(/y(es)?$/i)){
                    let url = readableData.announce;
                    
                    if(url.match(/^http(s)?/)){
                        /**HTTP tracker */

                        httpTracker(url,decodedData)
                        .then(response=>{
                            if(isLoading())stopLoading();
                            rl.write('\n')
                            parseHTTPResponse(response);
                            console.log(response);
                        })
                        .catch(handleReqFailure)

                    }else if(url.match(/^udp/)){
                        /**UDP tracker */
                        
                        udpTracker(url)
                        .then((message)=>{
                            initResendEventTimer(message);
                            responseListener(message,decodedData).then((response)=>{
                                rl.write('\nTracker Responded:\n\nTorrent Status: \n')
                                console.log(`Seeders : ${response.seeders}`);
                                console.log(`Leechers: ${response.leechers}`);
                                console.log(`Peers   : ${response.peers && response.peers.length}`);
                                rl.close();
                            }).catch((err)=>{
                                rl.write(err);
                            })
                        })
                        .catch(handleReqFailure)    
                    }
                    

                    //Synchronous work
                    rl.write('\nConnecting to tracker');
                    //initailize connect request to tracker
                    startLoading(); //Start Loading Animation

                }else{
                    rl.close();
                }
            })

            rl.on('SIGINT',()=>{
                let resume = false;
                if(isLoading()){
                    stopLoading();
                    resume = true;
                }

                rl.write('\n');
                rl.question('Are you sure you want to exit ? : ',(answer)=>{
                    if(answer.match(/y(es)?$/i)){
                        rl.close();
                        socket.close();
                        //console.log(process._getActiveHandles());
                        //process.exit(1);
                    }else if(answer){
                        rl.resume();
                        rl.write('\nResuming ');
                        if(resume)startLoading();
                    }
                })
            })
        } 
    }
})

