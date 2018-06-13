const fs = require('fs');
const {getFilepath} = require('./getFilepath');
const filePath = getFilepath();

const fileCon = fs.readFile(filePath,(err,data)=>{
    if(err)
        console.log('Invalid file path !');
    else{
        console.log(data);
    }
})
