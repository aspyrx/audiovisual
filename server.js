'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const fs = require('fs');
const process = require('process');
const path = require('path');
const flags = require('flags');

flags.defineString('f').setDescription('Directory from which files should be served. (required)');
flags.defineString('m', '[.](mp3|wav|ogg)$', 'Regular expression to use to match files.');
flags.defineString('mflags', 'i', 'Flags to use in regular expression matching.');
flags.defineBoolean('s', false, 'Scan the files directory for new files.');
flags.defineBoolean('r', false, 'Whether to scan recursively for files.');
flags.defineBoolean('v', false, 'Output verbose information.');
flags.defineString('p', 10102, 'Port on which to serve the site.');

flags.parse();

function listFiles(startPath, prefix, match, recursive, verbose) {
    const allFiles = [];
    let firstDir = true;
    function addFiles(filePath) {
        if (fs.statSync(filePath).isDirectory() && (firstDir || recursive)) {
            fs.readdirSync(filePath).map(name => addFiles(path.join(filePath, name)));
            firstDir = false;
        } else if (filePath.match(match)) {
            filePath = filePath.replace(startPath, prefix).replace(/\\/g, '/');
            if (verbose) {
                console.log(filePath);
            }
            allFiles.push(filePath);
        }
    }

    addFiles(startPath);
    return allFiles;
}

const verbose = flags.get('v');

const filesDirFlag = flags.get('f');
if (!filesDirFlag) {
    console.error('No files directory specified. See --help for more info.');
    process.exit(1);
}

const filesDir = path.resolve(filesDirFlag);
const filesDirUrl = '/files';
const filesMatch = new RegExp(flags.get('m'), flags.get('mflags'));
const fileListPath = path.join(filesDir, '.files.json');
let fileList = [];
let fileListString = '[]';

if (flags.get('s')) {
    console.log(`Scanning ${filesDir} for files matching ${filesMatch}`);
    fileList = listFiles(filesDir, filesDirUrl, filesMatch, flags.get('r'), verbose);
    fileListString = JSON.stringify(fileList);

    console.log('Writing ' + fileListPath);
    fs.writeFileSync(fileListPath, fileListString);
} else {
    try {
        fileListString = fs.readFileSync(fileListPath, 'utf8');
        fileList = JSON.parse(fileListString);
        console.log(`Using file list from ${fileListPath}`);
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

const files = {};
fileList.map((filePath) => files[filePath] = true);

const express = require('express');
const app = express();

app.use(express.static('dist'));
app.get('/files.json', (req, res) => res.type('json').send(fileListString));
app.get(filesDirUrl + '/*', (req, res) => {
    const reqpath = decodeURIComponent(req.url);
    if (files[reqpath]) {
        const filePath = path.join(filesDir, reqpath.replace(filesDirUrl, '').replace(/\//g, path.sep));
        res.sendFile(filePath);
    } else {
        res.status(404).end();
    }
});

const port = flags.get('p');
app.listen(port, () => console.log(`audiovisual server listening on *:${port}`));

