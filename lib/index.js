'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const ProgressBar = require('progress');
const jsmediatags = require('jsmediatags');

const filesDirURL = '/audio';
const fileListName = '.audiovisual.json';

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

function parseFiles(opts) {
    const { filesDir, filesMatch, recursive, quiet } = opts;
    !quiet && console.log(
        `Scanning '${filesDir}' for files matching ${filesMatch}`
    );

    const files = [];
    let firstDir = true;
    let tick = null;

    if (!quiet) {
        const progress = new ProgressBar(
            '[:bar] :percent eta :etas  :done/:count  :path', {
                total: 100, complete: '=', incomplete: ' ', width: 10
            }
        );

        let done = 0;
        let count = 0;
        tick = function(isDone, url) {
            if (isDone) {
                done++;
            } else {
                count++;
            }

            const pct = done / count;
            progress.update(pct, {
                done: done,
                count: count,
                path: url
            });
        };
    }

    function addDir(dirPath) {
        const dir = fs.readdirSync(dirPath);

        dir.map(name => addFiles(path.join(dirPath, name)));

        if (firstDir) {
            firstDir = false;
        }
    }

    function addFile(filePath) {
        const url = filePath
            .replace(filesDir, filesDirURL)
            .replace(/\\/g, '/');
        tick && tick(false, url);

        const file = {
            url: url
        };

        if (!filePath.match(/\.(mp3|mp4|m4a)$/)) {
            tick && tick(true, url);
            files.push(file);
            return;
        }

        const tagsPromise = getMediaTags(
            filePath
        ).then(tags => {
            file.title = tags.title;
            file.album = tags.album;
            file.artist = tags.artist;

            tick && tick(true, url);
            return file;
        }, err => {
            console.error(err);
            tick && tick(true, url);
            return file;
        });

        files.push(tagsPromise);
    }

    function addFiles(filePath) {
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory() && (firstDir || recursive)) {
            addDir(filePath);
        } else if (fileStats.isFile() && filePath.match(filesMatch)) {
            addFile(filePath);
        }
    }

    addFiles(filesDir);
    return Promise.all(files);
}

function getFileList(opts) {
    const { filesDir, scan, quiet } = opts;
    const fileListPath = path.join(filesDir, fileListName);

    if (scan) {
        return parseFiles(opts).then(fileList => {
            const fileListString = JSON.stringify(fileList);

            !quiet && console.log('Writing ' + fileListPath);
            fs.writeFileSync(fileListPath, fileListString);
            return { fileList, fileListString };
        });
    }

    return new Promise((resolve, reject) => {
        fs.readFile(fileListPath, 'utf8', (err, contents) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(contents);
        });
    }).then(fileListString => {
        !quiet && console.log(`Using file list from '${fileListPath}'`);
        const fileList = JSON.parse(fileListString);
        return { fileList, fileListString };
    }, err => {
        console.error(
            `File list '${fileListPath}' could not be read!\n`
            + 'Try scanning for files using -s.'
        );
        throw err;
    });
}

module.exports = function server(opts) {
    const app = express();
    app.use(express.static(path.resolve(__dirname, '../dist')));

    const { filesDir } = opts;
    if (!filesDir) {
        return Promise.resolve(app);
    }

    return getFileList(opts).then(result => {
        const { fileList, fileListString } = result;
        const fileUrlMap = {};
        fileList.forEach(file => (fileUrlMap[file.url] = true));

        app.get(`${filesDirURL}/${fileListName}`, function(req, res) {
            res.type('json').send(fileListString);
        });
        app.get(`${filesDirURL}/*`, function(req, res) {
            const reqpath = decodeURIComponent(req.url);
            if (fileUrlMap[reqpath]) {
                const filePath = path.join(
                    filesDir,
                    reqpath.replace(filesDirURL, '').replace(/\//g, path.sep)
                );
                res.sendFile(path.resolve(filePath));
            } else {
                res.status(404).end();
            }
        });

        return app;
    });
};

