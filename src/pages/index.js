/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';
import KeyHandler, {KEYDOWN} from 'react-key-handler';

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
        this.togglePlayback = this.togglePlayback.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        this.nextSong = this.nextSong.bind(this);
        this.prevSong = this.prevSong.bind(this);
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
        const { togglePlayback, toggleShuffle, nextSong, prevSong } = this;
        const keyHandlers = [
            [' ', togglePlayback],
            ['ArrowLeft', prevSong],
            ['ArrowRight', nextSong],
            ['k', togglePlayback],
            ['j', prevSong],
            ['l', nextSong],
            ['s', toggleShuffle]
        ].map(([key, handler], i) => (
            <KeyHandler key={i} keyEventName={KEYDOWN} keyValue={key} onKeyHandle={handler} />
        ));

        return (
            <div className={styles.container} onClick={this.onClick}>
                {keyHandlers}
                <Audiovisual className="audiovisual" {...props} />
            </div>
        );
    }
}

