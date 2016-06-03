/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';

import Audiovisual from '../components/audiovisual.js';
import styles from './index.less';

export default class Index extends Component {
    constructor() {
        super();

        this.state = {
            src: 'audio/Monstercat 016 - Expedition/18. Astronaut - Rain.mp3',
            playing: false
        };

        this.onClick = this.onClick.bind(this);
        document.addEventListener('keydown', (event) => {
            if (event.key.match(/^( |k)$/)) {
                this.togglePlayback();
            }
        });
    }

    togglePlayback() {
        this.setState({ playing: !this.state.playing });
    }

    onClick() {
        this.togglePlayback();
    }

    render() {
        const {src, playing} = this.state;
        return (
            <div className={styles.container} onClick={this.onClick}>
                <Audiovisual className="audiovisual" src={src} playing={playing} />
            </div>
        );
    }
}

