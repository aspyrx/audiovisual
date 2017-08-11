/**
 * Items UI module.
 *
 * @module src/Player/Items
 */

import React, { Component } from 'react';
import {
    bool, string, func, instanceOf
} from 'prop-types';
import classNames from 'classnames';

import PlayHistory from '../PlayHistory';
import AudioFile from '../AudioFile';
import styles from './index.less';

/**
 * Tests if the filter matches the given file.
 *
 * @param {RegExp} filter - The filter to use.
 * @param {AudioFile} file - The file to test.
 * @returns {boolean} `true` if the filter matches; `false` if not.
 */
function testFilter(filter, file) {
    const { album, artist, title } = file;
    return filter.test(`${artist} ${album} ${title}`);
}

/**
 * Formats text to describe the file.
 *
 * @param {AudioFile} file - The file to use.
 * @returns {string} Text for describing the file.
 */
function getTextForFile(file) {
    const { artist, album, title } = file;
    return `${artist} · ${album} · ${title}`;
}

/**
 * React component that represents information about a file.
 *
 * @param {Object} props - The component's props.
 * @param {string} props.file - The file.
 * @param {boolean} props.selected - Whether or not the file is selected.
 * @param {Function} props.onClick - Click event handler.
 * @param {Function} props.onRemove - Remove click event handler.
 * @returns {ReactElement} The component's elements.
 */
function FileInfo(props) {
    const { file, selected, onClick, onRemove } = props;
    const className = classNames(styles.file, {
        [styles.selected]: selected
    });

    const text = getTextForFile(file);
    const contents = onRemove
        ? [
            <span key='contents' onClick={onClick}>{text}</span>,
            <span key='remove' className={styles.remove} onClick={onRemove}>
                ×
            </span>
        ]
        : <span onClick={onClick}>{text}</span>;

    return <p className={className} title={props.title}>
        {contents}
    </p>;
}

FileInfo.propTypes = {
    file: instanceOf(AudioFile).isRequired,
    selected: bool,
    onClick: func,
    onRemove: func,
    title: string
};

/**
 * Actions UI React component.
 *
 * @param {Object} props - The component's props.
 * @param {Function} props.addMicrophone - Function to call to add microphone.
 * @param {Function} props.onInputFiles - Event handler called when songs are
 * added.
 * @param {Function} props.toggle - Function to call to toggle the UI.
 * @returns {ReactElement} The component's elements.
 */
function Actions(props) {
    const { addMicrophone, onInputFiles, toggle } = props;

    return <span className={styles.actions}>
        <span onClick={addMicrophone} title="add microphone">
            ●
        </span>
        <label title="add songs">
            +
            <input
                type="file"
                accept="audio/*"
                multiple
                onChange={onInputFiles}
            />
        </label>
        <span onClick={toggle} title="close">
            ×
        </span>
    </span>;
}

Actions.propTypes = {
    onInputFiles: func.isRequired,
    addMicrophone: func.isRequired,
    toggle: func.isRequired
};

/**
 * Compact item information UI React element.
 *
 * @param {Object} props - The component's props.
 * @param {Function} props.toggle - Function to call to toggle the UI.
 * @param {AudioFile} props.file - The current file.
 * @returns {ReactElement} The component's elements.
 */
function Compact(props) {
    const { toggle, file } = props;

    if (!file) {
        return <div
            className={styles.compact}
            onClick={toggle}
            title="select a song"
        >
            <span className={styles.title}>No song selected.</span>
        </div>;
    }

    const { artist, album, title, pictureURL } = file;

    const pictureElem = pictureURL
        ? <img className={styles.picture} src={pictureURL} alt="album art" />
        : <div className={styles.picture}>no album art</div>;

    const artistElem = artist
        ? <span className={styles.artist}>{artist}</span>
        : null;

    const albumElem = album
        ? <span className={styles.album}>{album}</span>
        : null;

    const titleElem = <span className={styles.title}>{title}</span>;

    return <div
        className={styles.compact}
        onClick={toggle}
        title="select a song"
    >
        {pictureElem}
        <div className={styles.details}>
            {titleElem}
            {albumElem}
            {artistElem}
        </div>
    </div>;
}

Compact.propTypes = {
    file: instanceOf(AudioFile),
    toggle: func.isRequired
};

/**
 * Items UI React component.
 */
export default class Items extends Component {
    /**
     * The propTypes for the component.
     */
    static get propTypes() {
        return {
            fileHistory: instanceOf(PlayHistory).isRequired,
            onInputFiles: func.isRequired,
            removeFile: func.isRequired,
            setFile: func.isRequired,
            addMicrophone: func.isRequired
        };
    }

    /**
     * Initializes the component.
     */
    constructor() {
        super();
        this.state = {
            filter: null,
            showing: false
        };

        this.toggle = this.toggle.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
    }

    /**
     * Toggles the item list.
     */
    toggle() {
        this.setState({ showing: !this.state.showing });
    }

    /**
     * Event handler called when the search input changes.
     *
     * @param {Event} event - The event to handle.
     */
    onSearchChange(event) {
        const { value } = event.target;
        const filter = new RegExp(value.replace(/\s/g, '\\s*'), 'i');
        this.setState({ filter });
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement} The component's elements.
     */
    render() {
        const { fileHistory } = this.props;
        const { showing } = this.state;
        const { toggle } = this;

        const file = fileHistory.item;
        if (!showing) {
            return <Compact file={file} toggle={toggle} />;
        }

        const {
            onInputFiles, removeFile, setFile,
            addMicrophone
        } = this.props;
        const { filter } = this.state;
        const files = fileHistory.items;

        const fileInfos = (filter
            ? files.filter(f => testFilter(filter, f))
            : files
        ).map(f => {
            /**
             * Click handler for the file.
             */
            function onClick() {
                toggle();
                setFile(f);
            }

            /**
             * Remove handler for the file.
             */
            function onRemove() {
                removeFile(f);
            }

            return <FileInfo
                key={f.url}
                file={f}
                selected={f === file}
                onClick={onClick}
                onRemove={onRemove}
            />;
        });

        return <div className={styles.files}>
            <div className={styles.search}>
                <input
                    type="search"
                    placeholder="search"
                    onChange={this.onSearchChange}
                />
                <Actions
                    onInputFiles={onInputFiles}
                    addMicrophone={addMicrophone}
                    toggle={toggle}
                />
            </div>
            <div className={styles.filesContainer}>
                {fileInfos}
            </div>
        </div>;
    }
}

