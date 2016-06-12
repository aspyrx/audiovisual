/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';
import KeyHandler, {KEYDOWN} from 'react-key-handler';
import jsmediatags from 'jsmediatags';
import classnames from 'classnames';

import Audiovisual from '../components/audiovisual.js';
import styles from './index.less';

class FileInfo extends Component {
    static get propTypes() {
        return {
            file: React.PropTypes.object.isRequired,
            selected: React.PropTypes.bool,
            className: React.PropTypes.any
        };
    }

    render() {
        const { file, selected, className, ...props } = this.props;
        const { url, title, artist, album } = file;
        const filename = url.match(/[^/]*$/)[0];

        const name = classnames(className, { selected });

        return title
            ? (<p className={name} {...props}>
                <span>{artist || 'no artist'}</span>
                <span>&nbsp;&middot;&nbsp;</span>
                <span>{album || 'no album'}</span>
                <span>&nbsp;&middot;&nbsp;</span>
                <span>{title}</span>
            </p>)
            : (<p {...props}>
                <span>{filename}</span>
            </p>);
    }
}

export default class Index extends Component {
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
        }
        req.open('GET', '/files.json');
        req.send();

        this.togglePlayback = this.togglePlayback.bind(this);
        this.toggleRepeat = this.toggleRepeat.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        this.toggleHelp = this.toggleHelp.bind(this);
        this.toggleFiles = this.toggleFiles.bind(this);
        this.toggleUpdating = this.toggleUpdating.bind(this);
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

    addSongs(evt) {
        const { audio } = this.state;
        const { files } = evt.target;
        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            const file = {
                title: fileObj.name,
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
            togglePlayback, toggleShuffle, toggleHelp, toggleFiles,
            toggleRepeat, toggleUpdating, addSongs, setSong, nextSong, prevSong
        } = this;

        if (audio.length < 1) {
            return (<div className={styles.container}>
                <label className="fileInput">
                    <h1>Click to select some songs to play!</h1>
                    <h3>(Hint: you can select multiple files)</h3>
                    <h4>(Loading mp3 files can take a while, please be patient!)</h4>
                    <input type="file" accept="audio/*" multiple onChange={addSongs} />
                </label>
            </div>);
        }

        const audioIndex = hist[histIndex];
        const file = audio[audioIndex];

        avProps.src = file.url;
        avProps.onEnded = () => {
            this.nextSong();
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
        ].map(([key, handler], i) => (
            <KeyHandler key={i} keyEventName={KEYDOWN} keyValue={key} onKeyHandle={handler} />
        ));

        const stopEventPropagation = event => event.stopPropagation();
        return (
            <div className={styles.container} onClick={togglePlayback}>
                {keyHandlers}
                <Audiovisual className="audiovisual" {...avProps} />
                <div className="info" onClick={stopEventPropagation}>
                    { showingFiles
                        ? (<div className="files">
                            <div className="search">
                                <input type="search"
                                    placeholder="search"
                                    onChange={event => {
                                        this.setState({
                                            filter: event.target.value.toLowerCase()
                                        });
                                    }} />
                                <span className="actions">
                                    <label title="add songs">
                                        +
                                        <input type="file"
                                            accept="audio/*"
                                            multiple
                                            onChange={addSongs} />
                                    </label>
                                    <span onClick={toggleFiles} title="close">×</span>
                                </span>
                            </div>
                            <div className="files-container">
                                {audio.map((file, i) => {
                                    const { url, artist, album, title } = file;
                                    const search = artist || album || title
                                        ? [artist, album, title].join(' ')
                                        : url;
                                    return !filter || search.toLowerCase().includes(filter)
                                        ? <FileInfo className="file"
                                            key={i}
                                            file={file}
                                            selected={i === audioIndex}
                                            onClick={() => setSong(i)} />
                                        : null;
                                })}
                            </div>
                        </div>)
                        : <FileInfo className="file"
                            onClick={toggleFiles}
                            title="select a song"
                            file={file} />
                    }
                </div>
                <div className="controls" onClick={stopEventPropagation}>
                    <div className="playback">
                        <div>
                            <span onClick={toggleUpdating} title="visualisation on/off">
                                { updating ? 'V' : 'v' }
                            </span>
                            <span onClick={toggleShuffle} title="shuffle on/off">
                                { shuffle ? 'S' : 's' }
                            </span>
                            <span onClick={toggleRepeat} title="repeat on/off">
                                { repeat ? 'R' : 'r' }
                            </span>
                        </div>
                        <div>
                            <span onClick={prevSong} title="previous song">≪</span>
                            <span onClick={togglePlayback} title="play/pause">
                                { playing ? '►' : ' ‖ ' }
                            </span>
                            <span onClick={nextSong} title="next song">≫</span>
                            <span onClick={toggleHelp} title="help">?</span>
                        </div>
                    </div>
                    { showingHelp
                        ? (<div className="help" onClick={toggleHelp}>
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
                                        <td colSpan="2">Click the song info to select a song.</td>
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

