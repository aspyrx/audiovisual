/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';

import Audiovisual from '../components/audiovisual.js';
import styles from './index.less';

export default class Index extends Component {
    constructor() {
        super();

        this.state = {};

        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                const audio = JSON.parse(req.responseText);
                if (audio instanceof Array) {
                    this.setState({ audio, src: audio[339] });
                }
            }
        }
        req.open('GET', '/audio.json');
        req.send();

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
        const { audio, ...props } = this.state;
        /* eslint no-console: "off" */
        if (!(audio instanceof Array)) {
            return (<div className={styles.container}></div>);
        }

        return (
            <div className={styles.container} onClick={this.onClick}>
                <Audiovisual className="audiovisual" {...props} />
            </div>
        );
    }
}

