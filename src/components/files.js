import React, { Component } from 'react';
import {
    bool, string, func, object, shape, arrayOf
} from 'prop-types';
import classNames from 'classnames';

import styles from './files.less';

const fileShape = shape({
    url: string,
    stream: object,
    title: string,
    artist: string,
    album: string
});

function FileInfo(props) {
    const { file, selected, onClick } = props;
    const className = classNames(styles.file, {
        [styles.selected]: selected
    });

    if (!file) {
        return <p className={className} onClick={onClick} title={props.title}>
            <span>No song selected.</span>
        </p>;
    }

    const { url, stream, title, artist, album } = file;
    const filename = stream ? 'Streaming...' : url.match(/[^/]*$/)[0];

    if (!title) {
        return <p className={className} onClick={onClick} title={props.title}>
            <span>{filename}</span>
        </p>;
    }

    return <p className={className} onClick={onClick} title={props.title}>
        <span>{artist || 'no artist'}</span>
        <span>&nbsp;&middot;&nbsp;</span>
        <span>{album || 'no album'}</span>
        <span>&nbsp;&middot;&nbsp;</span>
        <span>{title}</span>
    </p>;
}

FileInfo.propTypes = {
    file: fileShape,
    selected: bool,
    className: string,
    onClick: func,
    title: string
};

function Actions(props) {
    const { addMicrophone, addSongs, toggle } = props;

    return <span className={styles.actions}>
        <span onClick={addMicrophone} title="add microphone">
            ⏺
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
            file, audio, streams, setFile, addSongs, addMicrophone
        } = this.props;
        const { filter, showing } = this.state;
        const { toggle } = this;

        if (!showing) {
            return <FileInfo
                onClick={toggle}
                title="select a song"
                file={file}
            />;
        }

        const streamsInfo = streams.map((f, i) => {
            function onClick() {
                toggle();
                setFile(f);
            }

            return <FileInfo
                key={i}
                file={f}
                selected={f === file}
                onClick={onClick}
            />;
        });

        const audioInfo = audio.map((f, i) => {
            const { url, artist, album, title } = f;
            const search = (artist || album || title
                ? [artist, album, title].join(' ')
                : url
            ).toLowerCase();

            function onClick() {
                toggle();
                setFile(f);
            }

            return !filter || search.includes(filter)
                ? <FileInfo
                    key={i}
                    file={f}
                    selected={f === file}
                    onClick={onClick}
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

