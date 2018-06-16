const fs = require('fs');
const readline = require('readline');
const {getFilepath} = require('./getFilepath');
const {decodeFile,getReadableData} = require('./decodeFile');
const {connectTracker} = require('./connectTracker');
const {tracker} = require('./tracker');
const {rl,startLoading,stopLoading,isLoading,startTimer} = require('./utils');
const filePath = getFilepath();

const fileCon = fs.readFile(filePath,(err,data)=>{
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
                    rl.write('Connecting to tracker');
                    //initailize connect request to tracker
                    startLoading(); //Start Loading Animation
                    
                    const initSocketEvents = (message)=>{
                        startTimer(message.readUInt32BE(12),()=>{
                            rl.write('\nResponse timeout');
                            connectTracker(readableData,message)
                            .then(initSocketEvents,handleError)
                        })
                        //initialize socket's event handlers 
                        tracker(message,decodedData);
                    }

                    const handleError = (e)=>{
                        rl.write('\nUnable to connect to tracker ! ');
                        console.log(e);
                        if(isLoading())stopLoading();
                        rl.close();
                        process.exit(1);
                    }

                    connectTracker(readableData)
                    .then(initSocketEvents,handleError)
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
                        process.exit(1);
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
