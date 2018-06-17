const {announceTracker} = require('./announceTracker');
const {stopLoading,isLoading,startLoading,rl,stopTimer,startTimer,socket}  = require('./utils');
const {removeRequests} = require('./requests');

const responseListener = (message,decodedData) => {
    
    return new Promise((resolve)=>{
        socket.on('message',(response)=>{
            let parsedResponse;
            if(response.length === 16){
                parsedResponse = parseConnectResp(response);
    
                //check for transaction_id
                if(validateConnection(parsedResponse,message)){
                    rl.write('\nConnection Established with tracker\n');
                    rl.write('Sending Announce request');
                    startLoading();
                    //announce request
                    
                    const handleAnnounce = (response)=>{
                        startTimer(response.readUInt32BE(12),()=>{
                            rl.write('\nResponse Timeout Retrying');
                            announceTracker(parsedResponse.connection_id,decodedData,response)
                            .then(handleAnnounce)
                            .catch(handleFailure)
                        })
                        message = response;
                    };
                    
                    const handleFailure = (e)=>{
                        if(isLoading())stopLoading();
                        console.error('\nAnnounce request failed');
                    };

                    announceTracker(parsedResponse.connection_id,decodedData)
                    .then(handleAnnounce)
                    .catch(handleFailure)
    
                }else{
                    return rl.write('Invalid Connection, Exiting');
                }
            }else if(response.length >= 20){
                if(isLoading())stopLoading();
                parsedResponse = parseAnnounceResp(response);
                
                if(validateConnection(parsedResponse,message)){
                    resolve(parsedResponse);
                }else{
                    reject("Invalid Connection, Exiting");
                }
            }
            stopTimer(parsedResponse.transaction_id);
            removeRequests(parsedResponse.transaction_id);
        });
    })
};

const parseConnectResp = (response) => {
    return{
        action:response.readUInt32BE(0),
        transaction_id:response.readUInt32BE(4),
        connection_id:response.slice(8)
    }
}

const parseAnnounceResp = (response) => {
    const divideIP = (buff,grpSize) => {
        let ipList = [];
        for(let i = 0; i < buff.length; i+= grpSize){
            ipList.push(buff.slice(i,i+grpSize))
        }
        return ipList;
    }

    return{
        action:response.readUInt32BE(0),
        transaction_id:response.readUInt32BE(4),
        interval:response.readUInt32BE(8),
        leechers:response.readUInt32BE(12),
        seeders:response.readUInt32BE(16),
        peers:divideIP(response.slice(20),6).map(add=>{
            return({
                ip:add.slice(0,4).join('.'),
                port:add.readUInt16BE(4)
            })
        })
    }
}

const validateConnection = (response,message) => {
    if(isLoading())stopLoading();
        if(response.transaction_id === message.readUInt32BE(12)){
            return 1;
        }
    return 0;
}


module.exports = {
    responseListener
}