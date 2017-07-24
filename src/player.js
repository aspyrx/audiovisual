/*
 * index.js - Index page for the app.
 */

import React, { Component } from 'react';
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import { func } from 'prop-types';
import jsmediatags from 'jsmediatags';

import Audiovisual from 'components/audiovisual';
import Files from 'components/files';
import styles from './player.less';

function readTags(fileObj) {
    return new Promise((onSuccess, onError) => {
        jsmediatags.read(fileObj, { onSuccess, onError });
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

    addFile(file) {
        if (!file || file.length < 1) {
            return;
        }

        this.setState(({ audio, streams, hist }) => {
            const state = {};

            if (file.stream) {
                state.streams = streams.concat(file);
            } else {
                state.audio = audio.concat(file);
            }

            if (!hist.length) {
                state.hist = hist.concat(file.length ? file[0] : file);
                state.histIndex = 0;
            }

            return state;
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
                url: window.URL.createObjectURL(fileObj)
            };

            if (!fileObj.name.match(/\.(mp3|mp4|m4a)$/)) {
                return file;
            }

            return readTags(fileObj).then(tag => {
                file.title = tag.tags.title;
                file.album = tag.tags.album;
                file.artist = tag.tags.artist;
                return file;
            }, () => file);
        })).then(this.addFile);
    }

    setFile(file) {
        this.setState(({ hist }) => ({
            hist: [file].concat(hist),
            histIndex: 0
        }));
    }

    nextSong() {
        this.setState(({
            hist, histIndex, repeat, shuffle, audio, streams
        }) => {
            if (histIndex === null) {
                return;
            }

            if (repeat) {
                return { playing: true };
            }

            if (histIndex > 0) {
                return { histIndex: histIndex - 1 };
            }

            const file = hist[histIndex];
            const arr = file.stream ? streams : audio;
            const nextIndex = shuffle
                ? Math.floor(Math.random() * arr.length)
                : (arr.indexOf(file) + 1) % arr.length;
            return {
                hist: [arr[nextIndex]].concat(hist)
            };
        });
    }

    prevSong() {
        const { hist, histIndex } = this.state;
        this.setState({ histIndex: (histIndex + 1) % hist.length });
    }

    componentDidMount() {
        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState !== XMLHttpRequest.DONE) {
                return;
            }
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
        };
        req.open('GET', '/files.json');
        req.send();
    }

    render() {
        const {
            showingHelp, shuffle, repeat, audio, streams,
            hist, histIndex, updating, playing
        } = this.state;

        const {
            addMicrophone, addSongs, setFile, nextSong, prevSong,
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
            playing,
            onEnded: this.nextSong
        };

        const file = histIndex === null ? null : hist[histIndex];
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

        return <div className={styles.container} onClick={togglePlayback}>
            {keyHandlers}
            <Audiovisual className={styles.audiovisual} {...avProps} />
            <div className={styles.info} onClick={stopEventPropagation}>
                <Files
                    file={file}
                    audio={audio}
                    streams={streams}
                    setFile={setFile}
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
                            ⏪
                        </span>
                        <span onClick={togglePlayback} title="play/pause">
                            { playing ? '॥' : '►' }
                        </span>
                        <span onClick={nextSong} title="next song">
                            ⏩
                        </span>
                        <span onClick={toggleHelp} title="help">?</span>
                    </div>
                </div>
                {help}
            </div>
        </div>;
    }
}

