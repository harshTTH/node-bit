const fs = require('fs');
const {getFilepath} = require('./getFilepath');
const {decodeFile,getReadableData} = require('./decodeFile');
const {udpTracker,initResendEventTimer}  = require('./udpTracker');
const {httpTracker}  = require("./httpTracker");
const {responseListener} = require('./responseListener');
const {rl,startLoading,stopLoading,isLoading,socket,getWorkingTracker} = require('./utils');
const {setupConnect} = require('./tcpPeers');
const filePath = getFilepath();

const handleReqFailure = (error)=>{
    console.log(error)
    rl.write('\nUnable to connect to tracker ! ');
    if(isLoading())stopLoading();
    rl.close();
    process.exit(1);

};

fs.readFile(filePath,(err,data)=>{
    if(err)
        rl.write('\nInvalid file path !\n');
    else{
        let decodedData = decodeFile(data);
        let readableData = getReadableData(decodedData);
    
        //console.log(decodedData);

        if(!decodedData)
            rl.write("\nInvalid File !\n");
        else{
            rl.write('\n       ---Torrent Information---\n');
            rl.write(`Name          : ${readableData.name}\n`);
            rl.write(`Length        : ${readableData.length}\n`);
            rl.write(`Creation Date : ${readableData['creation date']}\n\n`)

            rl.question('Do you want to download the above torrent (y/n): ',answer=>{
                if(answer.match(/y(es)?$/i)){

                    getWorkingTracker(readableData)
                    .then(url=>{
                        if(url.match(/^http(s)?/)){
                            /**HTTP tracker */
    
                            httpTracker(url,decodedData)
                            .then(response=>{
                                if(isLoading())stopLoading();
                                rl.write('\n')
                                rl.write('\nTracker Responded:\n\nTorrent Status: \n')
                                console.log(`Seeders : ${response.complete}`);
                                console.log(`Leechers: ${response.incomplete}`);
                                console.log(`Peers   : ${response.peers && response.peers.length}`);

                                //connecting peers
                                setupConnect(response.peers,readableData.pieceHash);
                                
                            })
                            .catch(handleReqFailure)
    
                        }else if(url.match(/^udp/)){
                            /**UDP tracker */
                            
                            udpTracker(url)
                            .then((message)=>{
                                initResendEventTimer(url,message,decodedData);
                                responseListener(message,decodedData,url).then((response)=>{
                                    rl.write('\nTracker Responded:\n\nTorrent Status: \n')
                                    console.log(`Seeders : ${response.seeders}`);
                                    console.log(`Leechers: ${response.leechers}`);
                                    console.log(`Peers   : ${response.peers && response.peers.length}`);

                                    //connect peers
                                    
                                    setupConnect(response.peers,readableData.pieceHash);

                                }).catch((err)=>{
                                    console.log(err);
                                })
                            })
                            .catch(handleReqFailure)    
                        }
                    })

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

