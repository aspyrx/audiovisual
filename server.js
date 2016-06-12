'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const fs = require('fs');
const process = require('process');
const path = require('path');

const flags = require('flags');
const ProgressBar = require('progress');
const jsmediatags = require('jsmediatags');

flags.defineString('f', undefined, 'Directory from which files should be served.');
flags.defineString('m', '[.](mp3|wav|ogg)$', 'Regular expression to use to match files.');
flags.defineString('mflags', 'i', 'Flags to use in regular expression matching.');
flags.defineBoolean('s', false, 'Scan the files directory for new files.');
flags.defineBoolean('r', false, 'Whether to scan recursively for files.');
flags.defineBoolean('v', false, 'Output verbose information.');
flags.defineString('p', 10102, 'Port on which to serve the site.');

flags.parse();

function getMediaTags(filePath, tagsToRead = [ 'title', 'artist', 'album' ]) {
    return new Promise((resolve, reject) => {
        new jsmediatags.Reader(filePath)
            .setTagsToRead(tagsToRead)
            .read({
                onSuccess: function(tag) {
                    resolve(tag.tags);
                },

                onError: function(error) {
                    reject(new Error(error.info));
                }
            });
    });
}

function parseFiles(startPath, prefix, match, recursive, verbose) {
    const files = [];
    let firstDir = true;

    const progress = new ProgressBar(
        '[:bar] :percent eta :etas  :done/:count  :path', {
            total: 100, complete: '=', incomplete: ' ', width: 10
        }
    );

    let prevPct = 0;
    let done = 0;
    let count = 0;

    function addFiles(filePath) {
        if (fs.statSync(filePath).isDirectory() && (firstDir || recursive)) {
            const dir = fs.readdirSync(filePath);

            dir.map(name => addFiles(path.join(filePath, name)));

            if (firstDir) {
                firstDir = false;
            }
        } else if (filePath.match(match)) {
            const url = filePath.replace(startPath, prefix).replace(/\\/g, '/');
            function tick(numDone) {
                done += numDone;
                const pct = done / count;
                progress.tick((pct - prevPct) * 100, {
                    done: done,
                    count: count,
                    path: url
                });
                prevPct = pct;
            }

            count += 1;
            tick(0);

            const file = {
                url: url
            };

            if (filePath.match(/\.mp3$/)) {
                files.push(getMediaTags(filePath).then(tags => {
                    file.title = tags.title;
                    file.album = tags.album;
                    file.artist = tags.artist;

                    if (verbose) {
                        console.log("add tags", file);
                    }

                    tick(1);
                    return file;
                }, err => {
                    if (verbose) {
                        console.error(err);
                    }

                    tick(1);
                    return file;
                }));
            } else {
                if (verbose) {
                    console.log("add", file);
                }

                tick(1);
                files.push(file);
            }
        }
    }

    addFiles(startPath);
    return Promise.all(files);
}

const verbose = flags.get('v');

const filesDirUrl = '/files';

const filesDirFlag = flags.get('f');
if (!filesDirFlag) {
    startServer([], '[]');
    return;
}

const filesDir = path.resolve(filesDirFlag);
const filesMatch = new RegExp(flags.get('m'), flags.get('mflags'));
const fileListPath = path.join(filesDir, '.files.json');

if (flags.get('s')) {
    console.log(`Scanning ${filesDir} for files matching ${filesMatch}`);
    parseFiles(filesDir, filesDirUrl, filesMatch, flags.get('r'), verbose)
        .then(fileList => {
            const fileListString = JSON.stringify(fileList);

            console.log('Writing ' + fileListPath);
            fs.writeFileSync(fileListPath, fileListString);

            startServer(fileList, fileListString);
        }, err => { console.error(err) })
} else {
    try {
        const fileListString = fs.readFileSync(fileListPath, 'utf8');
        const fileList = JSON.parse(fileListString);
        console.log(`Using file list from ${fileListPath}`);

        startServer(fileList, fileListString);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`${fileListPath} not found!`);
            console.error('Try scanning for files using --s. See --help for more info.');
            process.exit(1);
        } else {
            throw err;
        }
    }
}

function startServer(fileList, fileListString) {
    const fileUrlMap = {};
    fileList.map(file => fileUrlMap[file.url] = true);

    const express = require('express');
    const app = express();

    app.use(express.static('dist'));
    app.get('/files.json', (req, res) => res.type('json').send(fileListString));
    app.get(filesDirUrl + '/*', (req, res) => {
        const reqpath = decodeURIComponent(req.url);
        if (fileUrlMap[reqpath]) {
            const filePath = path.join(filesDir, reqpath.replace(filesDirUrl, '').replace(/\//g, path.sep));
                res.sendFile(filePath);
        } else {
            res.status(404).end();
        }
    });

    const port = flags.get('p');
    app.listen(port, () => console.log(`audiovisual server listening on *:${port}`));
}

