import React, { Component } from 'react';
import {
    bool, number, string, func, object, shape, arrayOf
} from 'prop-types';
import classnames from 'classnames';

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
    const { url, stream, title, artist, album } = file;
    const filename = stream ? 'Streaming...' : url.match(/[^/]*$/)[0];

    const className = classnames(styles.file, {
        [styles.selected]: selected
    });

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
    file: fileShape.isRequired,
    selected: bool,
    className: string,
    onClick: func,
    title: string
};

export default class Files extends Component {
    static get propTypes() {
        return {
            audio: arrayOf(fileShape).isRequired,
            audioIndex: number.isRequired,
            setSong: func.isRequired,
            addSongs: func.isRequired
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
            audio, audioIndex, setSong, addSongs
        } = this.props;
        const { filter, showing } = this.state;
        const { toggle } = this;

        if (!showing) {
            return <FileInfo
                onClick={toggle}
                title="select a song"
                file={audio[audioIndex]}
            />;
        }

        const files = audio.map((f, i) => {
            const { url, artist, album, title } = f;
            const search = (artist || album || title
                ? [artist, album, title].join(' ')
                : url
            ).toLowerCase();
            return !filter || search.includes(filter)
                ? <FileInfo
                    key={i}
                    file={f}
                    selected={i === audioIndex}
                    onClick={() => setSong(i)}
                />
                : null;
        });

        const actions = <span className={styles.actions}>
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

        return <div className={styles.files}>
            <div className={styles.search}>
                <input
                    type="search"
                    placeholder="search"
                    onChange={this.onSearchChange}
                />
                {actions}
            </div>
            <div className={styles.filesContainer}>
                {files}
            </div>
        </div>;
    }
}

