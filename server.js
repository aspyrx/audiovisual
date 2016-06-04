'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const fs = require('fs');
const path = require('path');

function listFilesRecursive(startPath, prefix, match) {
    const allFiles = [];
    function addFiles(filePath) {
        if (fs.statSync(filePath).isDirectory()) {
            fs.readdirSync(filePath).map(name => addFiles(path.join(filePath, name)));
        } else if (filePath.match(match)) {
            filePath = filePath.replace(startPath, prefix).replace(/\\/g, '/');
            console.log(filePath);
            allFiles.push(filePath);
        }
    }

    console.log(`Searching ${startPath} files matching ${match}`);
    addFiles(startPath);
    return allFiles;
}

const audioFilePath = path.resolve('./audio.json');
const audioFileUrl = '/audio.json';
const audioDir = path.resolve('./audio');
const audioDirUrl = '/audio';
const audioMatch = /.mp3$/;
let audioString = '[]';
try {
    const audioFile = fs.openSync(audioFilePath, 'wx');
    audioString = JSON.stringify(listFilesRecursive(audioDir, audioDirUrl, audioMatch));
    console.log('Writing ' + audioFilePath);
    fs.writeSync(audioFile, audioString, 0, 'utf8');
    fs.closeSync(audioFile);
} catch (err) {
    if (err.code === 'EEXIST') {
        console.log('Using existing audio.json');
        audioString = fs.readFileSync('./audio.json', 'utf8');
    } else {
        throw err;
    }
}

const express = require('express');
const app = express();

app.get(audioFileUrl, (req, res) => res.type('json').send(audioString));
app.use(express.static('dist'));
app.use(audioDirUrl, express.static(audioDir));

app.listen(10102, () => console.log('audiovisual server listening on *:10102'));

