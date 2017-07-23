#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

'use strict';

const fs = require('fs');
const process = require('process');
const path = require('path');

const express = require('express');
const minimist = require('minimist');
const ProgressBar = require('progress');
const jsmediatags = require('jsmediatags');

const argvConfig =  {
    string: ['m', 'mflags', 'p'],
    boolean: ['s', 'r', 'v'],
    default: {
        m: '[.](mp3|wav|ogg)$',
        mflags: 'i',
        s: false,
        r: false,
        v: false,
        p: 10102
    },
    unknown(flag) {
        if (!flag.startsWith('-')) {
            return true;
        }

        console.log(`Unknown flag: '${flag}'`);
        usage();
        process.exit(1);
    }
};

function usage() {
    const desc = {
        m: 'Regular expression to use to match files.',
        mflags: 'Flags to use in regular expression matching.',
        s: 'Scan the files directory for new files.',
        r: 'Whether to scan recursively for files.',
        v: 'Output verbose information.',
        p: 'Port on which to serve the site.'
    };

    const script = path.relative('', require.main.filename);
    console.log(`Usage: node ${script} [directory]\n`);
    Object.keys(desc).forEach(key => {
        const flag = key.length === 1
            ? `-${key}`
            : `--${key}`;
        const value = key in argvConfig.default
            ? `=${argvConfig.default[key]}`
            : '';

        console.log(`\t${flag}${value}\t${desc[key]}\n`);
    });
}

const argv = minimist(process.argv.slice(2), argvConfig);

function getMediaTags(filePath, tagsToRead) {
    tagsToRead = tagsToRead || ['title', 'artist', 'album'];
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

// eslint-disable-next-line max-params
function parseFiles(startPath, prefix, match, recursive, verbose) {
    const files = [];
    let firstDir = true;

    const progress = new ProgressBar(
        '[:bar] :percent eta :etas  :done/:count  :path', {
            total: 100, complete: '=', incomplete: ' ', width: 10
        }
    );

    let done = 0;
    let count = 0;

    function tick(numDone, url) {
        done += numDone;
        const pct = done / count;
        progress.update(pct, {
            done: done,
            count: count,
            path: url
        });
    }

    function addDir(dirPath) {
        const dir = fs.readdirSync(dirPath);

        dir.map(name => addFiles(path.join(dirPath, name)));

        if (firstDir) {
            firstDir = false;
        }
    }

    function addFile(filePath) {
        const url = filePath.replace(startPath, prefix).replace(/\\/g, '/');
        count++;
        tick(0, url);

        const file = {
            url: url
        };

        if (filePath.match(/\.(mp3|mp4|m4a)$/)) {
            files.push(getMediaTags(filePath).then(tags => {
                file.title = tags.title;
                file.album = tags.album;
                file.artist = tags.artist;

                if (verbose) {
                    console.log('add tags', file);
                }

                tick(1, url);
                return file;
            }, err => {
                if (verbose) {
                    console.error(err);
                }

                tick(1, url);
                return file;
            }));
        } else {
            if (verbose) {
                console.log('add', file);
            }

            tick(1, url);
            files.push(file);
        }
    }

    function addFiles(filePath) {
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory() && (firstDir || recursive)) {
            addDir(filePath);
        } else if (fileStats.isFile() && filePath.match(match)) {
            addFile(filePath);
        }
    }

    addFiles(startPath);
    return Promise.all(files);
}

const verbose = argv.v;

const filesDirUrl = '/files';

const filesDirFlag = argv._[0];
if (!filesDirFlag) {
    startServer([], '[]');
    return;
}

const filesDir = path.resolve(filesDirFlag);
const filesMatch = new RegExp(argv.m, argv.mflags);
const fileListPath = path.join(filesDir, '.files.json');

if (argv.s) {
    console.log(`Scanning ${filesDir} for files matching ${filesMatch}`);
    parseFiles(filesDir, filesDirUrl, filesMatch, argv.r, verbose)
        .then(fileList => {
            const fileListString = JSON.stringify(fileList);

            console.log('Writing ' + fileListPath);
            fs.writeFileSync(fileListPath, fileListString);

            startServer(fileList, fileListString);
        }, console.error);
} else {
    try {
        const fileListString = fs.readFileSync(fileListPath, 'utf8');
        const fileList = JSON.parse(fileListString);
        console.log(`Using file list from ${fileListPath}`);

        startServer(fileList, fileListString);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`${fileListPath} not found!`);
            console.error(
                'Try scanning for files using --s. See --help for more info.'
            );
            process.exit(1);
        } else {
            throw err;
        }
    }
}

function startServer(fileList, fileListString) {
    const fileUrlMap = {};
    fileList.forEach(file => (fileUrlMap[file.url] = true));

    const app = express();

    app.use(express.static(path.resolve(__dirname, '../dist')));
    app.get('/files.json', (req, res) => res.type('json').send(fileListString));
    app.get(filesDirUrl + '/*', (req, res) => {
        const reqpath = decodeURIComponent(req.url);
        if (fileUrlMap[reqpath]) {
            const filePath = path.join(
                filesDir,
                reqpath.replace(filesDirUrl, '').replace(/\//g, path.sep)
            );
            res.sendFile(filePath);
        } else {
            res.status(404).end();
        }
    });

    const port = argv.p;
    app.listen(port, () => {
        console.log(`audiovisual server listening on *:${port}`);
    });
}

