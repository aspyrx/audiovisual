/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';
import KeyHandler, {KEYDOWN} from 'react-key-handler';

import Audiovisual from '../components/audiovisual.js';
import styles from './index.less';

class FileInfo extends Component {
    static get propTypes() {
        return {
            file: React.PropTypes.object.isRequired
        };
    }

    render() {
        const { file, ...props } = this.props;
        const { url, title, artist, album } = file;
        const filename = url.match(/[^/]*$/)[0];

        return title
            ? (<p {...props}>
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
            histIndex: 0
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

    setSong(songIndex) {
        const { hist, audio } = this.state;
        if (audio instanceof Array) {
            hist.unshift(songIndex);
            this.setState({ hist, histIndex: 0 });
        }
    }

    nextSong() {
        const { hist, histIndex, repeat, shuffle, audio } = this.state;
        if (audio instanceof Array) {
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
    }

    prevSong() {
        const { hist, histIndex, audio } = this.state;
        if (audio instanceof Array) {
            this.setState({ histIndex: (histIndex + 1) % hist.length });
        }
    }

    render() {
        const {
            showingHelp, showingFiles, shuffle, repeat, audio,
            hist, histIndex, filter, ...avProps
        } = this.state;
        const { playing, updating } = this.state;
        if (!(audio instanceof Array)) {
            return (<div className={styles.container}></div>);
        }

        const file = audio[hist[histIndex]];

        avProps.src = file.url;
        avProps.onEnded = () => {
            this.nextSong();
        }

        const {
            togglePlayback, toggleShuffle, toggleHelp, toggleFiles,
            toggleRepeat, toggleUpdating, setSong, nextSong, prevSong
        } = this;

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
                    <FileInfo className="file" onClick={toggleFiles} file={file} />
                    { showingFiles
                        ? (<div className="files">
                            <input type="text"
                                placeholder="search"
                                onChange={event => {
                                    this.setState({
                                        filter: event.target.value
                                    });
                                }} />
                            <div className="files-container">
                                {audio.map((file, i) => {
                                    const { url, artist, album, title } = file;
                                    const search = artist || album || title
                                        ? [artist, album, title].join(' ')
                                        : url;
                                    return !filter || search.toLowerCase().includes(filter)
                                        ? <FileInfo className="file"
                                            file={file}
                                            onClick={() => setSong(i)} />
                                        : null;
                                })}
                            </div>
                        </div>)
                        : null
                    }
                </div>
                <div className="controls" onClick={stopEventPropagation}>
                    <div className="playback">
                        <span onClick={toggleUpdating} title="visualisation on/off">
                            { updating ? 'V' : 'v' }
                        </span>
                        <span onClick={toggleShuffle} title="shuffle on/off">
                            { shuffle ? 'S' : 's' }
                        </span>
                        <span onClick={toggleRepeat} title="repeat on/off">
                            { repeat ? 'R' : 'r' }
                        </span>
                        <span onClick={prevSong} title="previous song">≪</span>
                        <span onClick={togglePlayback} title="play/pause">
                            { playing ? '►' : ' ‖ ' }
                        </span>
                        <span onClick={nextSong} title="next song">≫</span>
                        <span onMouseOver={toggleHelp}
                            onMouseOut={toggleHelp}
                            onClick={toggleHelp}>?</span>
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
                                        <td colSpan="2">Click the filename to select a song.</td>
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

