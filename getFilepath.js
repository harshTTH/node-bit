const yargs = require('yargs');

const getFilepath = () => {
    const argv = yargs.option('file',{
        alias:'f',
        demand:true,
        describe:'Absolute file path of .torrent file',
        string:true,
        nargs:1
    })
    .help()
    .alias('help','h')
    .argv;

    return argv.file;
}

module.exports = {
    getFilepath
}

