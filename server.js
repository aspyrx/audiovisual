'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const fs = require('fs');
const path = require('path');

function listFilesRecursive(startPath, ext) {
    const allFiles = [];
    function addFiles(filePath) {
        if (fs.statSync(filePath).isDirectory()) {
            fs.readdirSync(filePath).map(name => addFiles(path.join(filePath, name)));
        } else if (path.extname(filePath) === ext) {
            console.log(filePath);
            allFiles.push(filePath);
        }
    }

    console.log(`Searching ${startPath} for ${ext} files...`);
    addFiles(startPath);
    return allFiles;
}

const audioFilePath = path.resolve('./audio.json');
const audioDir = path.resolve('./audio');
const audioExt = '.mp3';
let audio = [];
try {
    const audioFile = fs.openSync(audioFilePath, 'wx');
    audio = listFilesRecursive(audioDir, '.mp3');
    console.log('Writing ' + audioFilePath);
    fs.writeSync(audioFile, JSON.stringify(audio), 0, 'utf8');
    fs.closeSync(audioFile);
} catch (err) {
    if (err.code === 'EEXIST') {
        console.log('Using existing audio.json');
        audio = JSON.parse(fs.readFileSync('./audio.json', 'utf8'));
    } else {
        throw err;
    }
}

const express = require('express');
const app = express();

app.use(express.static('dist'));
app.use('/audio.json', express.static(audioFilePath));
app.use('/audio', express.static(audioDir));

app.listen(10102, () => console.log('audiovisual server listening on *:10102'));

