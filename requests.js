let requests = [];
const Request = function(transaction_id){
    this.transaction_id = transaction_id;
    this.n = 1;
}

const getRequest = (transaction_id) => {
    return requests.findIndex(request=>(
        request.transaction_id === transaction_id
    ));
}

module.exports.requests = requests;
module.exports.getRequest = getRequest;
module.exports.Request = Request;

module.exports.addRequests = (transaction_id) => {
    let reqIndex = getRequest(transaction_id);
    if(reqIndex !== -1){
        requests[reqIndex].n++;
    }else{
        requests.push(new Request(transaction_id));
    }
}

module.exports.removeRequests = (transaction_id) => {
    let reqIndex = getRequest(transaction_id);
    if(reqIndex !== -1){
        requests[reqIndex].n--;
        if(requests[reqIndex].n === 0){
            requests.splice(reqIndex,1);
        }
    }
}
