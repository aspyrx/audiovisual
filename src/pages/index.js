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
            shuffle: true,
            hist: [0],
            histIndex: 0
        };

        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                const audio = JSON.parse(req.responseText);
                if (audio instanceof Array && audio.length > 0) {
                    this.setState({ audio });
                    if (this.state.shuffle) {
                        this.nextSong();
                    }
                }
            }
        }
        req.open('GET', '/audio.json');
        req.send();

        this.onClick = this.onClick.bind(this);
        document.addEventListener('keydown', (event) => {
            if (event.key.match(/^( |k)$/)) {
                this.togglePlayback();
            } else if (event.key.match(/^(ArrowLeft|j)$/)) {
                this.prevSong();
            } else if (event.key.match(/^(ArrowRight|l)$/)) {
                this.nextSong();
            }
        });
    }

    togglePlayback() {
        this.setState({ playing: !this.state.playing });
    }

    toggleShuffle() {
        this.setState({ shuffle: !this.state.shuffle });
    }

    nextSong() {
        const { hist, histIndex, shuffle, audio } = this.state;
        if (audio instanceof Array) {
            if (histIndex > 0) {
                this.setState({ histIndex: histIndex - 1 });
            } else {
                hist.unshift(shuffle
                    ? Math.round(Math.random() * audio.length)
                    : ((hist[histIndex] + 1) % audio.length));
                this.setState({ hist });
            }
        }
    }

    prevSong() {
        const { hist, histIndex, audio } = this.state;
        if (audio instanceof Array) {
            this.setState({ histIndex: (histIndex + 1) % hist.length });
        }
    }

    onClick() {
        this.togglePlayback();
    }

    render() {
        const { audio, hist, histIndex, ...props } = this.state;
        if (!(audio instanceof Array)) {
            return (<div className={styles.container}></div>);
        }

        props.src = audio[hist[histIndex]];
        return (
            <div className={styles.container} onClick={this.onClick}>
                <Audiovisual className="audiovisual" {...props} />
            </div>
        );
    }
}

