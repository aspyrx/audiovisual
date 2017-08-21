/**
 * Playback UI module.
 *
 * TODO: This file abuses `setState` because `PlayHistory` and `AudioFile` are
 * treated as mutable. A refactor to rely solely on immutable data structures
 * would be ideal.
 *
 * @module src/Player
 */

import React, { Component } from 'react';
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import { func } from 'prop-types';

import Spinner from 'src/Spinner';
import Audiovisual from 'src/Audiovisual';

import AudioFile from './AudioFile';
import AudioStream from './AudioStream';
import PlayHistory from './PlayHistory';
import Items from './Items';
import Controls from './Controls';
import styles from './index.less';

/**
 * React component to render when there are no songs or streams to play.
 *
 * @param {Object} props - Props for the component.
 * @param {Function} onInputFiles - Event handler called when songs are added.
 * @param {Function} addMicrophone - Function to call to add a microphone.
 * @returns {ReactElement} The component's elements.
 */
function NoItems(props) {
    const { onInputFiles, addMicrophone } = props;

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
                    onChange={onInputFiles} />
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
    onInputFiles: func.isRequired
};

/**
 * Player UI React component.
 */
export default class Player extends Component {
    /**
     * Initializes the Player UI component.
     */
    constructor() {
        super();

        this.state = {
            loading: false,
            playing: true,
            repeat: false,
            shuffle: true,
            updating: true,
            history: new PlayHistory()
        };

        // Set up toggle instance functions
        // 'playing' -> this.togglePlaying(), etc.
        [
            'playing', 'repeat', 'shuffle', 'updating'
        ].forEach(key => {
            const upper = key[0].toUpperCase() + key.slice(1);
            this[`toggle${upper}`] = () => {
                this.setState({ [key]: !this.state[key] });
            };
        });

        // Bind handlers to this instance
        [
            'onInputFiles', 'addMicrophone',
            'removeItem', 'setItem', 'nextItem', 'prevItem'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });
    }

    /**
     * Performs an XHR request and sets the `loading` state appropriately.
     *
     * @param {string} method - The method to use.
     * @param {string} url - The URL to request.
     * @param {Object} opts - Options to assign to the XHR request instance.
     * @returns {Promise} Resolves with the XHR request instance if it completed
     * with status code 200; rejects with the instance if any errors occur.
     */
    request(method, url, opts) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            const onError = () => {
                this.setState({ loading: false }, () => reject(req));
            };

            Object.assign(req, opts);
            req.onreadystatechange = () => {
                if (req.readyState !== XMLHttpRequest.DONE) {
                    return;
                }

                if (req.status !== 200) {
                    onError();
                    return;
                }

                this.setState({ loading: false }, () => resolve(req));
            };
            req.onerror = onError;
            req.open(method, url);
            req.send();
            this.setState({ loading: true });
        });
    }

    /**
     * Requests the URL for the given `AudioFile`, initializes a `File`
     * instance for the file contents, and associates the `File` instance with
     * the `AudioFile`.
     *
     * @param {module:src/Player/AudioFile} file - The file to request.
     * @returns {Promise} Resolves with the `AudioFile` when the `File` instance
     * has been added, or rejects with an `Error`, if any.
     */
    async requestAudioFile(file) {
        if (file.file) {
            return file;
        }

        if (!file.url) {
            throw new Error(
                'Cannot request URL for AudioFile without URL'
            );
        }

        let req;
        try {
            req = await this.request(
                'GET', file.url, { responseType: 'blob' }
            );
        } catch (err) {
            throw new Error(
                `Failed to request audio file from '${file.url}'`
            );
        }

        const blob = req.response;
        if (!(blob instanceof Blob)) {
            throw new Error(
                `Malformed response to AudioRequest: '${blob}'`
            );
        }

        file.file = new File([blob], file.url, { type: blob.type });
        return file;
    }

    /**
     * Adds the given items to the end of the item list.
     *
     * @param {module:src/Player/PlayHistory~Item[]} items - The new items.
     */
    addItems(items) {
        if (items.length < 1) {
            return;
        }

        this.setState(({ history }) => {
            history.addItems(items);
            return { history };
        }, () => {
            if (!this.state.history.item) {
                this.nextItem();
            }
        });
    }

    /**
     * Event handler for adding files selected on an `<input>` element.
     *
     * @param {Event} evt - The event.
     * @param {HTMLInputElement} evt.target - The target element of the event.
     * @param {FileList} evt.target.files - The selected files.
     */
    async onInputFiles(evt) {
        const files = await Promise.all(Array.prototype.map.call(
            evt.target.files,
            file => {
                const f = new AudioFile({ file });
                return f.addTags();
            }
        ));
        this.addItems(files);
    }

    /**
     * Removes the given item from the item list.
     *
     * @param {module:src/Player/PlayHistory~Item} item - The item to remove.
     */
    removeItem(item) {
        this.setState(({ history }) => {
            history.removeItem(item);
            return { history };
        }, () => {
            item.cleanup();
        });
    }

    /**
     * Sets the currently-playing item.
     *
     * @param {module:src/Player/PlayHistory~Item} item - The item to use.
     */
    async setItem(item) {
        if (item instanceof AudioFile) {
            try {
                await this.requestAudioFile(item);
                await item.addTags();
            } catch (err) {
                return;
            }
        }
        this.setState(({ history }) => {
            history.item = item;
            return { history };
        });
    }

    /**
     * Attempts to move to the next item.
     */
    async nextItem() {
        const { history, shuffle } = this.state;
        const file = history.nextItem(shuffle);
        if (file instanceof AudioFile) {
            await this.requestAudioFile(file);
            await file.addTags();
        }
        this.setState({ history });
    }

    /**
     * Attempts to move to the previous item.
     */
    prevItem() {
        this.setState(({ history }) => {
            history.prevItem();
            return { history };
        });
    }

    /**
     * Attempts to add a microphone stream.
     */
    addMicrophone() {
        const onSuccess = stream => {
            const audioStream = new AudioStream({
                stream
            });

            const tracks = stream.getAudioTracks();
            if (!tracks.length) {
                return;
            }
            tracks[0].addEventListener('ended', () => {
                this.removeItem(audioStream);
            });

            this.addItems([audioStream]);
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

    /**
     * React lifecycle handler called when component is about to mount.
     */
    async componentWillMount() {
        let req;
        try {
            req = await this.request('GET', '/audio/.audiovisual.json');
        } catch (err) {
            return;
        }

        const configs = JSON.parse(req.responseText);

        if (!(configs instanceof Array)) {
            return;
        }

        const newFiles = configs.map(config => new AudioFile(config));
        this.addItems(newFiles);
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement} The component's elements.
     */
    render() {
        const {
            shuffle, repeat, updating, playing, loading, history
        } = this.state;

        const {
            togglePlaying, toggleShuffle, toggleRepeat, toggleUpdating,
            onInputFiles, addMicrophone,
            removeItem, setItem, nextItem, prevItem
        } = this;

        if (!history.itemsLength) {
            return <NoItems
                addMicrophone={addMicrophone}
                onInputFiles={onInputFiles}
            />;
        }

        const avProps = {
            updating,
            playing: playing && !loading,
            onEnded: nextItem
        };

        const { item } = history;
        if (item instanceof AudioFile) {
            avProps.src = item.fileURL;
            avProps.bgURL = item.pictureURL;
        } else if (item instanceof AudioStream) {
            avProps.stream = item.stream;
        }

        const keyHandlers = [
            [' ', togglePlaying],
            ['ArrowLeft', prevItem],
            ['ArrowRight', nextItem],
            ['j', prevItem],
            ['k', togglePlaying],
            ['l', nextItem],
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

        const itemsProps = {
            history, onInputFiles, addMicrophone,
            removeItem, setItem
        };

        const controlsProps = {
            repeat, shuffle, updating, playing,
            toggleRepeat, toggleShuffle, toggleUpdating, togglePlaying,
            prevItem, nextItem
        };

        return <div
            className={styles.container}
            onClick={togglePlaying}
        >
            {keyHandlers}
            {spinner}
            <Audiovisual className={styles.audiovisual} {...avProps} />
            <div className={styles.itemsContainer}>
                <Items {...itemsProps} />
            </div>
            <Controls {...controlsProps} />
        </div>;
    }
}

