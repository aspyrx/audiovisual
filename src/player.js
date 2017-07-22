/*
 * index.js - Index page for the app.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import jsmediatags from 'jsmediatags';
import classnames from 'classnames';

import Audiovisual from 'components/audiovisual';
import styles from './player.less';

class FileInfo extends Component {
    static get propTypes() {
        return {
            file: PropTypes.object.isRequired,
            selected: PropTypes.bool,
            className: PropTypes.any
        };
    }

    render() {
        const { file, selected, className, ...props } = this.props;
        const { url, stream, title, artist, album } = file;
        const filename = stream ? 'Streaming...' : url.match(/[^/]*$/)[0];

        const name = classnames(className, { selected });

        return title
            ? (<p className={name} {...props}>
                <span>{artist || 'no artist'}</span>
                <span>&nbsp;&middot;&nbsp;</span>
                <span>{album || 'no album'}</span>
                <span>&nbsp;&middot;&nbsp;</span>
                <span>{title}</span>
            </p>)
            : (<p className={name} {...props}>
                <span>{filename}</span>
            </p>);
    }
}

export default class Player extends Component {
    constructor() {
        super();

        this.state = {
            playing: false,
            repeat: false,
            shuffle: true,
            showingHelp: false,
            showingFiles: false,
            updating: true,
            filter: '',
            hist: [0],
            histIndex: 0,
            audio: []
        };

        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                const audio = JSON.parse(req.responseText);
                if (audio instanceof Array && audio.length > 0) {
                    this.setState({ audio });
                    if (this.state.shuffle) {
                        this.nextSong();
                    }
                }
            }
        };
        req.open('GET', '/files.json');
        req.send();

        this.togglePlayback = this.togglePlayback.bind(this);
        this.toggleRepeat = this.toggleRepeat.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        this.toggleHelp = this.toggleHelp.bind(this);
        this.toggleFiles = this.toggleFiles.bind(this);
        this.toggleUpdating = this.toggleUpdating.bind(this);
        this.addMicrophone = this.addMicrophone.bind(this);
        this.addSongs = this.addSongs.bind(this);
        this.setSong = this.setSong.bind(this);
        this.nextSong = this.nextSong.bind(this);
        this.prevSong = this.prevSong.bind(this);
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

    toggleFiles() {
        this.setState({ showingFiles: !this.state.showingFiles });
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

        if (window.navigator.mediaDevices.getUserMedia) {
            window.navigator.mediaDevices.getUserMedia({ audio: true }).then(
                onSuccess, onError
            );
        } else {
            const getUserMedia = window.navigator.getUserMedia
                || window.navigator.webkitGetUserMedia
                || window.navigator.mozGetUserMedia;
            if (getUserMedia) {
                getUserMedia.call(window.navigator,
                    { audio: true }, onSuccess, onError);
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
            showingHelp, showingFiles, shuffle, repeat, audio,
            hist, histIndex, filter, ...avProps
        } = this.state;
        const { playing, updating } = this.state;

        const {
            addMicrophone,
            togglePlayback, toggleShuffle,
            toggleHelp, toggleFiles,
            toggleRepeat, toggleUpdating,
            addSongs, setSong, nextSong, prevSong
        } = this;

        function stopEventPropagation(evt) {
            evt.stopPropagation();
        }

        if (audio.length < 1) {
            return (<div className={styles.container}>
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
            </div>);
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

        return (
            <div className={styles.container} onClick={togglePlayback}>
                {keyHandlers}
                <Audiovisual className={styles.audiovisual} {...avProps} />
                <div className={styles.info} onClick={stopEventPropagation}>
                    { showingFiles
                        ? (<div className={styles.files}>
                            <div className={styles.search}>
                                <input type="search"
                                    placeholder="search"
                                    onChange={event => {
                                        const { value } = event.target;
                                        this.setState({
                                            filter: value.toLowerCase()
                                        });
                                    }} />
                                <span className={styles.actions}>
                                    <label title="add songs">
                                        +
                                        <input type="file"
                                            accept="audio/*"
                                            multiple
                                            onChange={addSongs} />
                                    </label>
                                    <span onClick={toggleFiles} title="close">
                                        ×
                                    </span>
                                </span>
                            </div>
                            <div className={styles.filesContainer}>
                                {audio.map((f, i) => {
                                    const { url, artist, album, title } = f;
                                    const search = (artist || album || title
                                        ? [artist, album, title].join(' ')
                                        : url
                                    ).toLowerCase();
                                    return !filter || search.includes(filter)
                                        ? <FileInfo className={styles.file}
                                            key={i}
                                            file={file}
                                            selected={i === audioIndex}
                                            onClick={() => setSong(i)} />
                                        : null;
                                })}
                            </div>
                        </div>)
                        : <FileInfo className={styles.file}
                            onClick={toggleFiles}
                            title="select a song"
                            file={file} />
                    }
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
                                { playing ? '►' : ' ‖ ' }
                            </span>
                            <span onClick={nextSong} title="next song">
                                ≫
                            </span>
                            <span onClick={toggleHelp} title="help">?</span>
                        </div>
                    </div>
                    { showingHelp
                        ? (<div className={styles.help} onClick={toggleHelp}>
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
                                            Click the song info to select a
                                            song.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>)
                        : null
                    }
                </div>
            </div>
        );
    }
}

