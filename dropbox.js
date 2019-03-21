/**
 * Implement pagination, default limit is 1000
 *      https://www.dropbox.com/developers/documentation/http/documentation#file_requests-list
 */
const path      = require('path');

const fs        = require('fs');

const https     = require('https');

const log       = require('inspc');

const debounce  = require('lodash/debounce');

const fetch     = require('isomorphic-fetch');

const Dropbox   = require('dropbox').Dropbox;

const mkdirp    = require('mkdirp');

const progress  = require('progress-stream');

const pb        = require('pretty-bytes');

const pt        = require('pretty-time');

const file      = path.basename(__filename);

const trim      = require('nlab/trim');

function now () {
    return (new Date()).toISOString().substring(0, 19).replace('T', ' ');
}
/**
 * export DROPBOX_NODE_SECRET="access ... token" && node test.js list
 */

if (process.argv.length < 3) {

    console.log(`
        
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
        node dropbox.js list "/apps/phaseii-api" "#cart.*mM_#i" -- filter parameter as a regex

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

        console.log(`Can't extract accessToken from ./dropbox_node_secret.js, see \n\n    node ${file}\n\nfor help\n\noriginal exception: ` + (e + ''))

        process.exit(1);
    }
}

if ( typeof accessToken !== 'string' ) {

    console.log(`Can't extract accessToken, see \n\n    node ${file}\n\nfor help`)

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
const downloadLargeFile = (source, target, size) => {
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

            var str = progress({
                length: size,
                time: 100 /* ms */
            });

            const debounceResolve = debounce(resolve, 150);

            str.on('progress', function(p) {

                process.stdout.write((`\rsize: ${pb(p.length)}, percent: ${(p.percentage).toFixed(1).padStart(5, ' ')}%, ETA: ${p.eta} sec, progress: ${pb(p.transferred)}, left: ${pb(p.remaining)}`).padEnd(process.stdout.columns, ' '));

                /*
                {
                    percentage: 9.05,
                    transferred: 949624,
                    length: 10485760,
                    remaining: 9536136,
                    eta: 42,
                    runtime: 3,
                    delta: 295396,
                    speed: 949624
                }
                */
                debounceResolve()
            });

            const req = https.get(result.link, res => {
                res
                    .pipe(str)
                    .pipe(fs.createWriteStream(writePath))
                ;
            });

            req.on('close', debounceResolve);
            req.on('error', reject);

        }).catch(reject);
    });
}

switch(process.argv[2]) {
    case 'meta':
        init();
        dropbox.filesGetMetadata({path: process.argv[3] || ''})
            .then(data => console.log(JSON.stringify(data, null, 4)))
        ;
        break;
    case 'list':
        init();
        dropbox
            .filesListFolder({path: process.argv[3] || ''})
            .then(data => {

                if ( typeof process.argv[4] === 'string' ) {

                    try {

                        var reg = ((function (k) {

                            if (k.length === 0) {

                                throw new Error(`strng is empty`);
                            }

                            var i = k.lastIndexOf(k[0]);

                            var t = k.indexOf(k[0]);

                            if (i === t) {

                                throw new Error(`Invalid regex syntax`);
                            }

                            return new RegExp(k.substring(1, i), k.substring(i + 1));

                        })(process.argv[4]));

                        data.entries = data.entries.filter(a => {

                            return reg.test(a.path_lower);
                        });
                    }
                    catch (e) {

                        throw new Error(`reg error: ${e}`);
                    }
                }

                console.log(JSON.stringify(data, null, 4))
            }, error => {
                console.error(error);
                process.exit(1);
            })
        ;
        break;
    case 'download':
    case 'down':

        const start = now();

        if ( typeof process.argv[3] !== 'string' ) {

            console.log(`\nspecify file path to download, see more in \n\n    node ${file}\n`);

            process.exit(0);
        }

        init();

        const target = process.argv[4] || trim(process.argv[3], './' , 'l');

        dropbox.filesGetMetadata({path: process.argv[3]})
            .then(data => {
                downloadLargeFile(process.argv[3], target, data.size).then(() => {
                    // file was saved as 'large-file.zip'
                    console.log(`\nfile '${process.argv[3]}' successfully downloaded to '${target}'`);

                    console.log(`start : ${start}`);

                    console.log(`end   : ${now()}`);

                }, p => {
                    console.log(p);
                }).catch(err => {
                    // handle err
                    log.dump('downloadLargeFile_error', err);
                });
            })
            .catch(e => log.dump({
                'dropbox.filesGetMetadata_error': e
            }))
        ;
// Usage

        break;

}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0,targetLength);
        }
    };
}

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}