import React, { Component } from 'react';
import {
    bool, string, func, object, shape, arrayOf
} from 'prop-types';
import classNames from 'classnames';

import styles from './files.less';

const fileShape = shape({
    fileObj: shape({
        name: string
    }),
    url: string,
    stream: object,
    title: string,
    artist: string,
    album: string
});

function basename(str, sep = '/') {
    return str.match(new RegExp(`[^${sep}]*$`))[0];
}

function testFilter(filter, file) {
    if (!filter) {
        return true;
    }

    const title = getTitleForFile(file).toLowerCase();
    const {
        artist = 'no artist',
        album = 'no album'
    } = file;

    return filter.test(`${artist} ${album} ${title}`);
}

function getTitleForFile(file) {
    if (file.title) {
        return file.title;
    }

    if (file.stream) {
        return 'Streaming...';
    }


    const { fileObj } = file;
    if (fileObj && fileObj.name) {
        return basename(fileObj.name, ':');
    }

    return basename(file.url);
}

function getTextForFile(file) {
    const {
        artist = 'no artist',
        album = 'no album'
    } = file;

    return `${artist} · ${album} · ${getTitleForFile(file)}`;
}

function FileInfo(props) {
    const { text, selected, onClick, onRemove } = props;
    const className = classNames(styles.file, {
        [styles.selected]: selected
    });

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
    text: string.isRequired,
    selected: bool,
    className: string,
    onClick: func,
    onRemove: func,
    title: string
};

function Actions(props) {
    const { addMicrophone, addSongs, toggle } = props;

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
                onChange={addSongs}
            />
        </label>
        <span onClick={toggle} title="close">
            ×
        </span>
    </span>;
}

Actions.propTypes = {
    addMicrophone: func.isRequired,
    addSongs: func.isRequired,
    toggle: func.isRequired
};

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

    const { artist, album, pictureURL } = file;
    const title = getTitleForFile(file);

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
    file: fileShape,
    toggle: func.isRequired
};

export default class Files extends Component {
    static get propTypes() {
        return {
            file: fileShape,
            audio: arrayOf(fileShape).isRequired,
            streams: arrayOf(fileShape).isRequired,
            setFile: func.isRequired,
            removeFile: func.isRequired,
            addSongs: func.isRequired,
            addMicrophone: func.isRequired
        };
    }

    constructor() {
        super();
        this.state = {
            filter: null,
            showing: false
        };

        this.toggle = this.toggle.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
    }

    toggle() {
        this.setState({ showing: !this.state.showing });
    }

    onSearchChange(event) {
        const { value } = event.target;
        const filter = new RegExp(value.replace(/\s/g, '\\s*'), 'i');
        this.setState({ filter });
    }

    render() {
        const { file } = this.props;
        const { showing } = this.state;
        const { toggle } = this;

        if (!showing) {
            return <Compact file={file} toggle={toggle} />;
        }

        const {
            audio, streams, setFile, removeFile, addSongs, addMicrophone
        } = this.props;
        const { filter } = this.state;

        const streamsInfo = streams.map((f, i) => {
            function onClick() {
                toggle();
                setFile(f);
            }

            function onRemove() {
                removeFile(f);
            }

            return <FileInfo
                key={i}
                text={getTextForFile(f)}
                selected={f === file}
                onClick={onClick}
                onRemove={onRemove}
            />;
        });

        const audioInfo = audio.filter(f =>
            testFilter(filter, f)
        ).map(f => {
            const text = getTextForFile(f);

            function onClick() {
                toggle();
                setFile(f);
            }

            function onRemove() {
                removeFile(f);
            }

            return <FileInfo
                key={f.url}
                text={text}
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
                    addSongs={addSongs}
                    addMicrophone={addMicrophone}
                    toggle={toggle}
                />
            </div>
            <div className={styles.filesContainer}>
                {streamsInfo}
                {audioInfo}
            </div>
        </div>;
    }
}

