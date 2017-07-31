import React, { Component } from 'react';
import { bool, func } from 'prop-types';

import styles from './index.less';

function stopEventPropagation(evt) {
    evt.stopPropagation();
}

function Help(props) {
    return <div className={styles.help} onClick={props.onClick}>
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
                    <td colSpan="2">
                        Click the song info to select a song.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>;
}

Help.propTypes = {
    onClick: func
};

export default class Controls extends Component {
    static get propTypes() {
        return {
            updating: bool,
            shuffle: bool,
            repeat: bool,
            playing: bool,
            toggleUpdating: func.isRequired,
            toggleShuffle: func.isRequired,
            toggleRepeat: func.isRequired,
            togglePlaying: func.isRequired,
            prevFile: func.isRequired,
            nextFile: func.isRequired
        };
    }

    constructor() {
        super();

        this.state = { showingHelp: false };
        this.toggleHelp = this.toggleHelp.bind(this);
    }

    toggleHelp() {
        this.setState({ showingHelp: !this.state.showingHelp });
    }

    render() {
        const {
            updating, shuffle, repeat, playing,
            toggleUpdating, toggleShuffle, toggleRepeat, togglePlaying,
            nextFile, prevFile
        } = this.props;
        const { showingHelp } = this.state;
        const { toggleHelp } = this;

        const help = showingHelp
            ? <Help onClick={toggleHelp} />
            : null;

        return <div className={styles.controls} onClick={stopEventPropagation}>
            <div className={styles.playback}>
                <div>
                    <span
                        onClick={toggleUpdating}
                        title="visualisation on/off"
                    >
                        { updating ? 'V' : 'v' }
                    </span>
                    <span
                        onClick={toggleShuffle}
                        title="shuffle on/off"
                    >
                        { shuffle ? 'S' : 's' }
                    </span>
                    <span
                        onClick={toggleRepeat}
                        title="repeat on/off"
                    >
                        { repeat ? 'R' : 'r' }
                    </span>
                </div>
                <div>
                    <span onClick={prevFile} title="previous song">
                        ⏮
                    </span>
                    <span onClick={togglePlaying} title="play/pause">
                        { playing ? '॥' : '►' }
                    </span>
                    <span onClick={nextFile} title="next song">
                        ⏭
                    </span>
                    <span onClick={toggleHelp} title="help">?</span>
                </div>
            </div>
            {help}
        </div>;
    }
}

