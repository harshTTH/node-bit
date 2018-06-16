const dgram = require('dgram');
const {socket} = require('./connectTracker');
const {announceTracker} = require('./announceTracker');
const {stopLoading,isLoading,startLoading,rl,stopTimer,startTimer}  = require('./utils');
const {removeRequests} = require('./requests');

const tracker = (message,decodedData) => {
    socket.on('message',(response)=>{
        let parsedResponse;
        if(response.length === 16){
            if(isLoading())stopLoading();

            parsedResponse = parseConnectResp(response);

            if(parsedResponse.transaction_id === message.readUInt32BE(12)){

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
                    rl.write('\nAnnounce Request sent to tracker\n');
                };

                const handleFailure = (e)=>{
                    if(isLoading())stopLoading();
                    console.error('\nAnnounce request failed',e);
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
            if(parsedResponse.transaction_id === message.readUInt32BE(12)){
                console.log(parsedResponse);
                rl.close();
            }else{
                return rl.write('Invalid Connection, Exiting');
            }
        }
        stopTimer(parsedResponse.transaction_id);
        removeRequests(parsedResponse.transaction_id);
    });
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
        leechers:response.readUInt32BE(8),
        seeders:response.readUInt32BE(12),
        peers:divideIP(response.slice(20),6).map(add=>{
            return({
                ip:add.slice(0,4).join('.'),
                port:add.readUInt16BE(4)
            })
        })
    }
}
module.exports = {
    tracker
}