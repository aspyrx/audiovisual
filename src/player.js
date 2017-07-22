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
            playing: false,
            repeat: false,
            shuffle: true,
            showingHelp: false,
            updating: true,
            hist: [0],
            histIndex: 0,
            audio: []
        };

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

            this.setState({ audio });
            if (this.state.shuffle) {
                this.nextSong();
            }
        };
        req.open('GET', '/files.json');
        req.send();

        [
            'addMicrophone', 'addSongs', 'setSong', 'nextSong', 'prevSong',
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

    addMicrophone() {
        const { audio } = this.state;
        const onSuccess = stream => {
            audio.unshift({
                artist: 'Microphone',
                album: 'Ready',
                title: 'Listening for input...',
                stream: stream
            });
            this.setState({ audio });
        };
        const onError = err => {
            let message = 'An unknown error occurred while'
                + ' accessing the microphone.';
            if (err) {
                if (err.name === 'NotAllowedError'
                   || err.name === 'PermissionDeniedError') {
                    message = 'Microphone access not allowed.';
                } else if (err.name === 'NotFoundError') {
                    message = 'No microphone found.';
                }
            }

            audio.unshift({
                artist: 'Microphone',
                album: 'Error',
                title: message,
                url: ''
            });
            this.setState({ audio });
        };

        if (!navigator) {
            onError();
        }

        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(
                onSuccess, onError
            );
        } catch (err) {
            const getUserMedia = navigator.getUserMedia
                || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia;
            if (getUserMedia) {
                getUserMedia.call(
                    window.navigator,
                    { audio: true }, onSuccess, onError
                );
            } else {
                onError();
            }
        }
    }

    addSongs(evt) {
        const { audio } = this.state;
        const { files } = evt.target;
        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            const file = {
                url: window.URL.createObjectURL(fileObj)
            };

            if (fileObj.name.match(/\.(mp3|mp4|m4a)$/)) {
                jsmediatags.read(fileObj, {
                    onSuccess: tag => {
                        file.title = tag.tags.title;
                        file.album = tag.tags.album;
                        file.artist = tag.tags.artist;
                        audio.push(file);
                        this.setState({ audio });
                    },
                    onError: () => {
                        audio.push(file);
                        this.setState({ audio });
                    }
                });
            } else {
                audio.push(file);
            }
        }

        this.setState({ audio });
    }

    setSong(songIndex) {
        const { hist } = this.state;
        hist.unshift(songIndex);
        this.setState({ hist, histIndex: 0 });
    }

    nextSong() {
        const { hist, histIndex, repeat, shuffle, audio } = this.state;
        if (repeat) {
            this.setState({ playing: true });
        } else if (histIndex > 0) {
            this.setState({ histIndex: histIndex - 1 });
        } else {
            hist.unshift(shuffle
                ? Math.floor(Math.random() * audio.length)
                : ((hist[histIndex] + 1) % audio.length));
            this.setState({ hist });
        }
    }

    prevSong() {
        const { hist, histIndex } = this.state;
        this.setState({ histIndex: (histIndex + 1) % hist.length });
    }

    render() {
        const {
            showingHelp, shuffle, repeat, audio,
            hist, histIndex, ...avProps
        } = this.state;
        const { playing, updating } = this.state;

        const {
            addMicrophone, addSongs, setSong, nextSong, prevSong,
            togglePlayback, toggleShuffle, toggleRepeat, toggleUpdating,
            toggleHelp
        } = this;

        function stopEventPropagation(evt) {
            evt.stopPropagation();
        }

        if (audio.length < 1) {
            return <div className={styles.container}>
                <div className={styles.fileInput}>
                    <h1 onClick={addMicrophone}>
                        Click here to use your microphone!
                    </h1>
                    <label>
                        <h1>Click here to select some songs to play!</h1>
                        <input type="file"
                            accept="audio/*"
                            multiple
                            onChange={addSongs} />
                    </label>
                    <h3>(Hint: you can select multiple files)</h3>
                    <h4>
                        (Loading mp3 files can take a while, please be patient!)
                    </h4>
                </div>
            </div>;
        }

        const audioIndex = hist[histIndex];
        const file = audio[audioIndex];

        avProps.src = file.url;
        avProps.stream = file.stream;
        avProps.onEnded = () => {
            this.nextSong();
        };

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
                    audio={audio}
                    audioIndex={audioIndex}
                    setSong={setSong}
                    addSongs={addSongs}
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
                            ≪
                        </span>
                        <span onClick={togglePlayback} title="play/pause">
                            { playing ? ' ‖ ' : '►' }
                        </span>
                        <span onClick={nextSong} title="next song">
                            ≫
                        </span>
                        <span onClick={toggleHelp} title="help">?</span>
                    </div>
                </div>
                {help}
            </div>
        </div>;
    }
}

