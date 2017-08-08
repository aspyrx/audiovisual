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
import PlayHistory from './PlayHistory';
import Items from './Items';
import Controls from './Controls';
import styles from './index.less';

/**
 * Event handler for stopping event propagation.
 *
 * @param {Event} evt - The event to stop propagating.
 */
function stopEventPropagation(evt) {
    evt.stopPropagation();
}

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
            fileHistory: new PlayHistory(),
            streamHistory: new PlayHistory()
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
            'onInputFiles', 'removeFile', 'setFile', 'nextFile', 'prevFile',
            'addMicrophone'
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
     * Adds the given files to the end of the file list.
     *
     * @param {module:src/Player/AudioFile[]} files - The new files.
     */
    addFiles(files) {
        if (files.length < 1) {
            return;
        }

        this.setState(({ fileHistory }) => {
            fileHistory.addItems(files);
            return { fileHistory };
        }, () => {
            if (!this.state.fileHistory.item) {
                this.nextFile();
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
                const f = new File({ file });
                return f.addTags();
            }
        ));
        this.addFiles(files);
    }

    /**
     * Removes the given file from the file list.
     *
     * @param {module:src/Player/AudioFile} file - The file to remove.
     */
    removeFile(file) {
        this.setState(({ fileHistory }) => {
            fileHistory.removeItem(file);
            return { fileHistory };
        }, () => {
            file.cleanup();
        });
    }

    /**
     * Sets the currently-playing file.
     *
     * @param {module:src/Player/AudioFile} file - The file to use.
     */
    async setFile(file) {
        try {
            await this.requestAudioFile(file);
            await file.addTags();
        } catch (err) {
            return;
        }
        this.setState(({ fileHistory }) => {
            fileHistory.item = file;
            return { fileHistory };
        });
    }

    /**
     * Attempts to move to the next file.
     */
    async nextFile() {
        const { fileHistory, shuffle } = this.state;
        const file = fileHistory.nextItem(shuffle);
        await this.requestAudioFile(file);
        await file.addTags();
        this.setState({ fileHistory });
    }

    /**
     * Attempts to move to the previous file.
     */
    prevFile() {
        this.setState(({ fileHistory }) => {
            fileHistory.prevItem();
            return { fileHistory };
        });
    }

    /**
     * Attempts to add a microphone stream.
     */
    addMicrophone() {

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
        this.addFiles(newFiles);
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement} The component's elements.
     */
    render() {
        const {
            shuffle, repeat, updating, playing, loading,
            fileHistory
        } = this.state;

        const {
            togglePlaying, toggleShuffle, toggleRepeat, toggleUpdating,
            onInputFiles, removeFile, setFile, nextFile, prevFile,
            addMicrophone
        } = this;

        if (!fileHistory.itemsLength) {
            return <NoItems
                addMicrophone={addMicrophone}
                onInputFiles={onInputFiles}
            />;
        }

        const avProps = {
            updating,
            playing: playing && !loading,
            onEnded: nextFile
        };

        const file = fileHistory.item;
        if (file) {
            avProps.src = file.src;
            avProps.bgURL = file.pictureURL;
        }

        const keyHandlers = [
            [' ', togglePlaying],
            ['ArrowLeft', prevFile],
            ['ArrowRight', nextFile],
            ['j', prevFile],
            ['k', togglePlaying],
            ['l', nextFile],
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
            fileHistory, onInputFiles, removeFile, setFile,
            addMicrophone
        };

        const controlsProps = {
            repeat, shuffle, updating, playing,
            toggleRepeat, toggleShuffle, toggleUpdating, togglePlaying,
            prevFile, nextFile
        };

        return <div
            className={styles.container}
            onClick={togglePlaying}
        >
            {keyHandlers}
            {spinner}
            <Audiovisual className={styles.audiovisual} {...avProps} />
            <div className={styles.info} onClick={stopEventPropagation}>
                <Items {...itemsProps} />
            </div>
            <Controls {...controlsProps} />
        </div>;
    }
}
