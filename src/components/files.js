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

function basename(str) {
    return str.match(/[^/]*$/)[0];
}

function getTextForFile(file) {
    if (!file) {
        return 'No song selected.';
    }

    const {
        artist = 'no artist',
        album = 'no album',
        title
    } = file;

    if (title) {
        return `${artist} - ${album} - ${title}`;
    }

    const { stream, fileObj, url } = file;
    if (stream) {
        return 'Streaming...';
    } else if (fileObj && fileObj.name) {
        return basename(fileObj.name);
    }

    return basename(url);
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
            filter: '',
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
        this.setState({
            filter: value.toLowerCase()
        });
    }

    render() {
        const {
            file, audio, streams, setFile, removeFile, addSongs, addMicrophone
        } = this.props;
        const { filter, showing } = this.state;
        const { toggle } = this;

        if (!showing) {
            return <FileInfo
                onClick={toggle}
                title="select a song"
                text={getTextForFile(file)}
            />;
        }

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

        const audioInfo = audio.map((f, i) => {
            const text = getTextForFile(f);
            const search = text.toLowerCase();

            function onClick() {
                toggle();
                setFile(f);
            }

            function onRemove() {
                removeFile(f);
            }

            return !filter || search.includes(filter)
                ? <FileInfo
                    key={i}
                    text={text}
                    selected={f === file}
                    onClick={onClick}
                    onRemove={onRemove}
                />
                : null;
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

