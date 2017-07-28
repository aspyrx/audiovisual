/*
 * index.js - Index page for the app.
 */

import React, { Component } from 'react';
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import { func } from 'prop-types';
import jsmediatags from 'jsmediatags';

import Spinner from 'components/spinner';
import Audiovisual from 'components/audiovisual';
import Files from 'components/files';
import styles from './player.less';

function shuffleIndex(old, n) {
    return (old + 1 + Math.floor(Math.random() * (n - 1))) % n;
}

const formatToMediaType = {
    jpg: 'image/jpeg',
    png: 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/png': 'image/png'
};

function addTags(file) {
    if (!file || file.hasTags) {
        return;
    }

    const { fileObj } = file;

    if (!(fileObj && /\.(mp3|mp4|m4a)$/.test(fileObj.name))) {
        return Promise.resolve(file);
    }

    return new Promise((resolve, reject) => {
        jsmediatags.read(fileObj, {
            onSuccess: result => resolve(result.tags),
            onError: reject
        });
    }).then(tags => {
        ['artist', 'album', 'title'].forEach(key => {
            if (key in tags) {
                file[key] = tags[key];
            }
        });

        file.hasTags = true;

        if (tags.picture) {
            const { data, format } = tags.picture;
            const bytes = Uint8Array.from(data);
            const type = formatToMediaType[format.toLowerCase()];

            const pictureObj = new Blob([bytes], { type });
            file.pictureObj = pictureObj;
            file.pictureURL = URL.createObjectURL(pictureObj);
        }

        return file;
    }, err => {
        console.error('failed to parse tags', err);
        return err;
    });
}

function Help(props) {
    return <div className={styles.help} onClick={props.onClick}>
        <table>
            <tbody>
                <tr>
                    <td>V</td>
                    <td>visualisation on/off</td>
                </tr>
                <tr>
                    <td>S</td>
                    <td>shuffle on/off</td>
                </tr>
                <tr>
                    <td>R</td>
                    <td>repeat on/off</td>
                </tr>
                <tr>
                    <td>J, ←</td>
                    <td>previous song</td>
                </tr>
                <tr>
                    <td>K, space, click</td>
                    <td>play/pause</td>
                </tr>
                <tr>
                    <td>L, →</td>
                    <td>next song</td>
                </tr>
                <tr>
                    <td colSpan="2">
                        Click the song info to select a song.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>;
}

Help.propTypes = {
    onClick: func
};

export default class Player extends Component {
    constructor() {
        super();

        this.state = {
            loading: false,
            playing: true,
            repeat: false,
            shuffle: true,
            showingHelp: false,
            updating: true,
            hist: [],
            histIndex: null,
            audio: [],
            streams: []
        };

        [
            'addFile', 'removeFile',
            'addMicrophone', 'addSongs',
            'setFile', 'nextSong', 'prevSong',
            'togglePlayback', 'toggleShuffle', 'toggleRepeat', 'toggleUpdating',
            'toggleHelp'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });
    }

    togglePlayback() {
        this.setState({ playing: !this.state.playing });
    }

    toggleRepeat() {
        this.setState({ repeat: !this.state.repeat });
    }

    toggleShuffle() {
        this.setState({ shuffle: !this.state.shuffle });
    }

    toggleHelp() {
        this.setState({ showingHelp: !this.state.showingHelp });
    }

    toggleUpdating() {
        this.setState({ updating: !this.state.updating });
    }

    request(method, url, opts) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            Object.assign(req, opts);
            req.onreadystatechange = () => {
                if (req.readyState === req.OPENED) {
                    this.setState({ loading: true });
                    return;
                } else if (req.readyState !== XMLHttpRequest.DONE) {
                    return;
                }

                this.setState({ loading: false }, () => resolve(req));
            };
            req.onerror = () => {
                this.setState({ loading: false });
                reject(req);
            };
            req.open(method, url);
            req.send();
        });
    }

    addFileObj(file) {
        if (!file.url || file.fileObj) {
            return Promise.resolve(file);
        }

        return this.request(
            'GET', file.url, { responseType: 'blob' }
        ).then(req => {
            if (req.status !== 200) {
                return;
            }

            if (!(req.response instanceof Blob)) {
                return;
            }

            const blob = req.response;
            const fileObj = new File([blob], file.url, { type: blob.type });
            file.fileObj = fileObj;
            file.url = URL.createObjectURL(fileObj);
            file.hasObjectURL = true;
            return file;
        }, () => file);
    }

    addFile(file) {
        if (!file || file.length < 1) {
            return;
        }

        this.setState(({ audio, streams }) => {
            const state = {};

            if (file.stream) {
                state.streams = streams.concat(file);
            } else {
                state.audio = audio.concat(file);
            }

            return state;
        }, () => {
            if (this.state.histIndex === null) {
                this.nextSong();
            }
        });
    }

    removeFile(file) {
        if (!file) {
            return;
        }

        const notFile = f => f !== file;

        this.setState(({ audio, streams, hist, histIndex }) => {
            const state = {};
            if (file.stream) {
                state.streams = streams.filter(notFile);
            } else {
                state.audio = audio.filter(notFile);
            }

            state.hist = hist.filter(notFile);
            if (state.hist.length < histIndex + 1) {
                state.histIndex = state.hist.length > 0 ? 0 : null;
            }

            return state;
        }, () => {
            if (file.hasObjectURL) {
                URL.revokeObjectURL(file.url);
            }

            if (file.pictureURL) {
                URL.revokeObjectURL(file.pictureURL);
            }


            if (file.stream) {
                file.stream.getTracks().forEach(track => {
                    track.stop();
                    file.stream.removeTrack(track);
                });
            }
        });
    }

    addMicrophone() {
        const onSuccess = stream => {
            const tracks = stream.getAudioTracks();
            if (!tracks.length) {
                return;
            }

            const file = {
                artist: 'Microphone',
                album: 'Ready',
                title: 'Listening for input...',
                stream: stream
            };

            tracks[0].addEventListener('ended', () => {
                this.removeFile(file);
            });

            this.addFile(file);
        };

        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(
                onSuccess, console.log
            );
        } catch (err) {
            const getUserMedia = navigator.getUserMedia
                || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia;
            getUserMedia.call(
                navigator, { audio: true }, onSuccess, console.log
            );
        }
    }

    addSongs(evt) {
        Promise.all(Array.prototype.map.call(evt.target.files, fileObj => {
            const file = {
                fileObj: fileObj,
                url: URL.createObjectURL(fileObj),
                hasObjectURL: true
            };

            return addTags(file);
        })).then(this.addFile);
    }

    setFile(file) {
        this.addFileObj(file).then(addTags).then(() => {
            const { hist } = this.state;
            this.setState({
                hist: [file].concat(hist),
                histIndex: 0
            });
        });
    }

    nextSong() {
        const {
            hist, histIndex, repeat, shuffle, audio, streams
        } = this.state;

        if (repeat) {
            this.setState({ playing: true });
            return;
        }

        if (histIndex > 0) {
            this.setState({ histIndex: histIndex - 1 });
            return;
        }

        let file;
        if (histIndex === null) {
            const arr = audio.length ? audio : streams;
            if (!arr.length) {
                return;
            }

            file = arr[shuffle ? shuffleIndex(0, arr.length) : 0];
        } else {
            const oldFile = hist[histIndex];
            const arr = oldFile.stream ? streams : audio;
            const oldIndex = arr.indexOf(oldFile);
            const index = shuffle
                ? shuffleIndex(oldIndex, arr.length)
                : (oldIndex + 1) % arr.length;
            file = arr[index];
        }

        this.setFile(file);
    }

    prevSong() {
        const { hist, histIndex } = this.state;
        if (histIndex === null) {
            this.nextSong();
            return;
        }

        this.setState({ histIndex: (histIndex + 1) % hist.length });
    }

    componentDidMount() {
        this.request('GET', '/files.json').then(req => {
            if (req.status !== 200) {
                return;
            }

            const audio = JSON.parse(req.responseText);

            if (!(audio instanceof Array)) {
                return;
            }

            if(!audio.length) {
                return;
            }

            this.addFile(audio);
        });
    }

    render() {
        const {
            showingHelp, shuffle, repeat, audio, streams,
            hist, histIndex, updating, playing, loading
        } = this.state;

        const {
            addMicrophone, addSongs, setFile, removeFile, nextSong, prevSong,
            togglePlayback, toggleShuffle, toggleRepeat, toggleUpdating,
            toggleHelp
        } = this;

        function stopEventPropagation(evt) {
            evt.stopPropagation();
        }

        if (!audio.length && !streams.length) {
            return <div className={styles.container}>
                <div className={styles.fileInput}>
                    <h1 onClick={addMicrophone}>
                        Click here to use your microphone!
                    </h1>
                    <label>
                        <h1>Click here to select some songs to play!</h1>
                        <input type='file'
                            accept='audio/*'
                            multiple
                            onChange={addSongs} />
                    </label>
                    <h3>(Hint: you can select multiple files)</h3>
                    <h4>
                        (Loading mp3 files can take a while, please be patient!)
                    </h4>
                    <h5>
                        <a href='https://github.com/aspyrx/audiovisual'>
                            Source code on GitHub
                        </a> made by <a href='https://szz.io/'>
                            Stan Zhang
                        </a>
                    </h5>
                </div>
            </div>;
        }

        const avProps = {
            updating,
            playing: playing && !loading,
            onEnded: this.nextSong
        };

        const file = histIndex === null ? null : hist[histIndex];
        let containerStyle;
        if (file) {
            avProps.src = file.url;
            avProps.stream = file.stream;
        }

        const keyHandlers = [
            [' ', togglePlayback],
            ['ArrowLeft', prevSong],
            ['ArrowRight', nextSong],
            ['k', togglePlayback],
            ['j', prevSong],
            ['l', nextSong],
            ['r', toggleRepeat],
            ['s', toggleShuffle],
            ['v', toggleUpdating]
        ].map(([key, handler], i) => <KeyHandler
            key={i}
            keyEventName={KEYDOWN}
            keyValue={key}
            onKeyHandle={handler}
        />);

        const help = showingHelp
            ? <Help onClick={toggleHelp} />
            : null;

        const spinner = loading
            ? <Spinner />
            : null;

        return <div
            className={styles.container}
            onClick={togglePlayback}
            style={containerStyle}
        >
            {keyHandlers}
            {spinner}
            <Audiovisual className={styles.audiovisual} {...avProps} />
            <div className={styles.info} onClick={stopEventPropagation}>
                <Files
                    file={file}
                    audio={audio}
                    streams={streams}
                    setFile={setFile}
                    removeFile={removeFile}
                    addSongs={addSongs}
                    addMicrophone={addMicrophone}
                />
            </div>
            <div className={styles.controls} onClick={stopEventPropagation}>
                <div className={styles.playback}>
                    <div>
                        <span
                            onClick={toggleUpdating}
                            title="visualisation on/off"
                        >
                            { updating ? 'V' : 'v' }
                        </span>
                        <span
                            onClick={toggleShuffle}
                            title="shuffle on/off"
                        >
                            { shuffle ? 'S' : 's' }
                        </span>
                        <span
                            onClick={toggleRepeat}
                            title="repeat on/off"
                        >
                            { repeat ? 'R' : 'r' }
                        </span>
                    </div>
                    <div>
                        <span onClick={prevSong} title="previous song">
                            ⏮
                        </span>
                        <span onClick={togglePlayback} title="play/pause">
                            { playing ? '॥' : '►' }
                        </span>
                        <span onClick={nextSong} title="next song">
                            ⏭
                        </span>
                        <span onClick={toggleHelp} title="help">?</span>
                    </div>
                </div>
                {help}
            </div>
        </div>;
    }
}

