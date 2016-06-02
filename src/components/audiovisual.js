/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import classNames from 'classnames';
import Dancer from 'dancer';

import music from '../music/[Electro] - Astronaut - Rain [Monstercat EP Release].mp3';
import styles from './audiovisual.less';

/* eslint no-console: "off" */

const NUM_FREQS = 512;
const NUM_AMPS = 64;
const AMP_STEP = NUM_FREQS / NUM_AMPS;
const SKIP_UPDATES = 2;

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: PropTypes.string
        };
    }

    constructor() {
        super();
        const amp = new Array(NUM_AMPS);
        for (let i = 0; i < NUM_AMPS; i++) {
            amp[i] = 0;
        }

        this.state = { kick: false, amp };

        this.onClick = this.onClick.bind(this);
        let updatesSkipped = 0;

        this.dancer = new Dancer();
        this.dancer.createKick({
            frequency: [0, 4],
            threshold: 0.4,
            onKick: () => {
                if (this.state.kick) {
                    window.clearTimeout(this.kickTimer);
                } else {
                    this.setState({ kick: true });
                }

                this.kickTimer = window.setTimeout(() => this.setState({ kick: false }), 50);
            }
        }).on();
        this.dancer.bind('update', () => {
            if (updatesSkipped !== SKIP_UPDATES) {
                updatesSkipped++;
                return;
            }
            updatesSkipped = 0;
            const freq = this.dancer.getSpectrum();
            const amp = this.state.amp.map((curr, i) => {
                let max = 0;
                for (let j = i; j <= i * AMP_STEP; j++) {
                    if (freq[i] > max) {
                        max = freq[j];
                    }
                }
                return max;
            });
            this.setState({ amp });
        }).load({ src: music });
    }

    componentWillUnmount() {
        window.clearTimeout(this.kickTimer);
    }

    onClick() {
        if (this.dancer.isLoaded()) {
            if (this.dancer.isPlaying()) {
                this.dancer.pause();
            } else {
                this.dancer.play();
            }
        }
    }

    render() {
        const {className} = this.props;
        const {kick, amp} = this.state;
        const classes = classNames(styles.audiovisual, className, { kick });
        return (
            <svg className={classes} onClick={this.onClick} viewBox="0 0 100 100" preserveAspectRatio="none">
                {amp.map((mag, i) => {
                    const props = {
                        key: i,
                        width: 100 / NUM_AMPS,
                        x: i * 100 / NUM_AMPS,
                        style: { transform: `scale(1, ${mag})` }
                    };
                    return (
                        <rect className="bar" y="0" height="100" {...props} />
                    );
                })}
            </svg>
        );
    }
}
