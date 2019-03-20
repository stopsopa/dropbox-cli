/**
 * Implement pagination, default limit is 1000
 *      https://www.dropbox.com/developers/documentation/http/documentation#file_requests-list
 */
const path      = require('path');

const fs        = require('fs');

const https     = require('https');

const fetch     = require('isomorphic-fetch');

const Dropbox   = require('dropbox').Dropbox;

const mkdirp    = require('mkdirp');

const file      = path.basename(__filename);

const log       = console.log;

const trim      = require('nlab/trim');
/**
 * export DROPBOX_NODE_SECRET="access ... token" && node test.js list
 */

if (process.argv.length < 3) {

    log(`
        
It's necessary to provide dropbox accessToken, there are two ways of providing it:

- through enviroment variable DROPBOX_NODE_SECRET
- or by creating tiny js module next THIS js script 'dropbox_node_secret.js' with content:

----------------------
            
module.exports = "arURX_accessToken_85b5n_accessToken_XBAxaE_accessToken_o5QQaXWYf";

----------------------
    
Api:        
####
        
node ${file} list "/path" 
    path - default "" - if not specified
    
    examples:
        node ${file} list
        node ${file} list "/folder"
        node ${file} list "/folder/another/folder"
        node ${file} list "/another folder"
        node ${file} list "/another folder/" - with slash at the end - doesn't matter as long as it's path to folder not file

node ${file} download \${path_to_file_to_download} [\${where_to_save}]
    
    examples:   
        node ${file} download "/test.txt"
        node ${file} download "/test.txt" "target/location.txt"
 
`);

    process.exit(0);
}


let accessToken = process.env.DROPBOX_NODE_SECRET;

if ( typeof accessToken !== 'string' ) {

    try {

        accessToken = eval('require')('./dropbox_node_secret');
    }
    catch (e) {

        log(`Can't extract accessToken from ./dropbox_node_secret.js, see \n\n    node ${file}\n\nfor help\n\noriginal exception: ` + (e + ''))

        process.exit(1);
    }
}

if ( typeof accessToken !== 'string' ) {

    log(`Can't extract accessToken, see \n\n    node ${file}\n\nfor help`)

    process.exit(1);
}

let dropbox;

const init = () => {
    dropbox = new Dropbox({
        fetch,
        accessToken,
    })
};
    // .filesListFolder({path: ''})
    // .then(data => console.log(JSON.stringify(data, null, 4)), console.error);


/**
 * Logic based on https://www.npmjs.com/package/escape-string-regexp
 */
var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

function pregQuote(str) {

    if (typeof str !== 'string') {

        return false;
    }

    return str.replace(matchOperatorsRe, '\\$&');
};

// from: https://github.com/dropbox/dropbox-sdk-js/issues/139#issuecomment-308444157
// Where: `path` is the path of your file in your Dropbox
const downloadLargeFile = (source, target) => {
    return new Promise((resolve, reject) => {
        dropbox.filesGetTemporaryLink({
            path: source
        }).then(result => {

            const dir = path.dirname(target);

            try {

                mkdirp.sync(dir);
            }
            catch (e) {

                process.stdout.write(`\n    ERROR prepareDir: ${dir}, error: ${e}\n`);

                process.exit(1);
            }

            const writePath = path.resolve(__dirname, target);
            const req = https.get(result.link, res => {
                res.pipe(fs.createWriteStream(writePath));
            });

            req.on('close', resolve);
            req.on('error', reject);

        }).catch(reject);
    });
}


switch(process.argv[2]) {
    case 'list':
        init();
        dropbox
            .filesListFolder({path: process.argv[3] || ''})
            .then(data => console.log(JSON.stringify(data, null, 4)), error => {
                console.error(error);
                process.exit(1);
            })
        ;
        break;
    case 'download':
    case 'down':

        if ( typeof process.argv[3] !== 'string' ) {

            log(`\nspecify file path to download, see more in \n\n    node ${file}\n`);

            process.exit(0);
        }

        init();

        const target = process.argv[4] || trim(process.argv[3], './' , 'l');
// Usage
        downloadLargeFile(process.argv[3], target).then(() => {
            // file was saved as 'large-file.zip'
            log(`file '${process.argv[3]}' successfully downloaded to '${target}'`)
        }).catch(err => {
            // handle err
            log('error', err);
        });

        break;

}