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
import Controls from 'components/controls';
import styles from './player.less';

function stopEventPropagation(evt) {
    evt.stopPropagation();
}

function NoItems(props) {
    const { addMicrophone, addSongs } = props;

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
                </a>
                <span> made by </span>
                <a href='https://szz.io/'>
                    Stan Zhang
                </a>
            </h5>
        </div>
    </div>;
}

NoItems.propTypes = {
    addMicrophone: func.isRequired,
    addSongs: func.isRequired
};

function nextFile(streams, audio, shuffle, oldFile) {
    let arr, oldIndex;
    if (!oldFile) {
        arr = audio.length ? audio : streams;
        if (!arr.length) {
            return null;
        }
        oldIndex = 0;
    } else {
        arr = oldFile.stream ? streams : audio;
        oldIndex = arr.indexOf(oldFile);
    }

    const { length } = arr;
    const incr = shuffle
        ? Math.floor(Math.random() * (length - 1)) + 1
        : 1;
    return arr[(oldIndex + incr) % length];
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
            'togglePlayback', 'toggleShuffle', 'toggleRepeat', 'toggleUpdating'
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
        if (this.state.repeat) {
            this.setState({ playing: true });
            return;
        }

        const { histIndex } = this.state;
        if (histIndex > 0) {
            this.setState({ histIndex: histIndex - 1 });
            return;
        }

        const { hist, streams, audio, shuffle } = this.state;

        const file = histIndex === null
            ? nextFile(streams, audio, shuffle)
            : nextFile(streams, audio, shuffle, hist[histIndex]);

        if (file === null) {
            return;
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
        this.request('GET', '/audio/.audiovisual.json').then(req => {
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
            shuffle, repeat, audio, streams,
            hist, histIndex, updating, playing, loading
        } = this.state;

        const {
            addMicrophone, addSongs, setFile, removeFile, nextSong, prevSong,
            togglePlayback, toggleShuffle, toggleRepeat, toggleUpdating
        } = this;

        if (!audio.length && !streams.length) {
            return <NoItems
                addMicrophone={addMicrophone}
                addSongs={addSongs}
            />;
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
            avProps.bgURL = file.pictureURL;
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
            <Controls
                repeat={repeat}
                shuffle={shuffle}
                updating={updating}
                playing={playing}
                toggleRepeat={toggleRepeat}
                toggleShuffle={toggleShuffle}
                toggleUpdating={toggleUpdating}
                prevSong={prevSong}
                togglePlayback={togglePlayback}
                nextSong={nextSong}
            />
        </div>;
    }
}

