const fs = require('fs');
const readline = require('readline');
const {getFilepath} = require('./getFilepath');
const {decodeFile,getReadableData} = require('./decodeFile');
const {connectTracker} = require('./connectTracker');
const filePath = getFilepath();
let loading;

const fileCon = fs.readFile(filePath,(err,data)=>{
    if(err)
        console.log('Invalid file path !');
    else{
        let decodedData = decodeFile(data);
        let readableData = getReadableData(decodedData);
        if(!decodedData)
            console.log("Invalid File !");
        else{
            console.log(`\n       ---Torrent Information---\n
    Name          : ${readableData.name}
    Length        : ${readableData.length}
    Creation Date : ${readableData['creation date']}
        `)

            const rl = readline.createInterface({
                input:process.stdin,
                output:process.stdout,
                terminal:true,
                prompt:"node_bit",
            });

            rl.question('Do you want to download the above torrent (y/n)',answer=>{
                if(answer.match(/y(es)?$/i)){
                    console.log('Connecting to tracker');
                    loading = setInterval(()=>process.stdout.write('.'),500);

                    connectTracker(readableData).then(()=>{
                        clearInterval(loading);
                        console.log('Connected To Tracker Successully!');
                    })
                    .catch((e)=>{
                        clearInterval(loading);
                        console.log('Unable to connect to tracker !',e);
                        rl.close();
                    })

                }else{
                    rl.close();
                }
            })

            rl.on('SIGINT',()=>{
                clearInterval(loading);
                rl.question('Are you sure you want to exit ?',(answer)=>{
                    if(answer.match(/y(es)?$/i)){
                        rl.close();
                    }else rl.resume();
                })
            })
        } 
    }
})
