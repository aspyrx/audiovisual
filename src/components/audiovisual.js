/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import classNames from 'classnames';
import Dancer from 'dancer';

import styles from './audiovisual.less';

const NUM_SPECTRUM = 512;
const NUM_WAVEFORM = 1024;
const NUM_FREQ = 32;
const NUM_WAVE = 32;
const FREQ_STEP = NUM_SPECTRUM / NUM_FREQ;
const WAVE_STEP = NUM_WAVEFORM / NUM_WAVE;
const SKIP_UPDATES = 2;

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: PropTypes.string,
            src: PropTypes.string.isRequired,
            playing: PropTypes.bool
        };
    }

    constructor(props) {
        super();

        const freq = new Array(NUM_FREQ);
        for (let i = 0; i < NUM_FREQ; i++) {
            freq[i] = 0;
        }

        const wave = new Array(NUM_WAVE);
        for (let i = 0; i < NUM_WAVE; i++) {
            wave[i] = 0;
        }

        this.state = { kick: false, freq, wave };

        let updatesSkipped = SKIP_UPDATES;

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

            const { freq, wave } = this.state;
            const spectrum = this.dancer.getSpectrum();
            for (let i in freq) {
                let max = 0;
                for (let j = i; j <= i * FREQ_STEP; j++) {
                    if (spectrum[i] > max) {
                        max = spectrum[j];
                    }
                }
                max -= 1;
                freq[i] = -(max) * (max) + 1;
            }

            const waveform = this.dancer.getWaveform();
            for (let i in wave) {
                let sum = 0;
                for (let j = i; j <= i * WAVE_STEP; j++) {
                    sum += waveform[j];
                }
                wave[i] = sum / WAVE_STEP;
            }
            this.setState({ freq, wave });
        }).load({ src: props.src });

        if (props.playing) {
            this.dancer.play();
        }
    }

    componentWillReceiveProps(props) {
        if (props.music) {
            this.dancer.pause().load(props.src);
        }

        if (this.dancer.isLoaded()) {
            if (props.playing) {
                this.dancer.play();
            } else {
                this.dancer.pause();
            }
        }
    }

    componentWillUnmount() {
        window.clearTimeout(this.kickTimer);
    }

    render() {
        const {className} = this.props;
        const {kick, freq, wave} = this.state;
        const classes = classNames(styles.audiovisual, className, { kick });
        return (
            <svg className={classes} viewBox="0 0 100 100" preserveAspectRatio="none">
                {wave.map((mag, i) => {
                    const width = 100 / NUM_WAVE;
                    const props = {
                        key: i,
                        width: width,
                        x: i * width,
                        style: { transform: `translate(0, ${mag * 25}px)` }
                    };
                    return (
                        <rect className="wave" y="50" height="0.5" {...props} />
                    );
                })}
                {freq.map((mag, i) => {
                    const width = 100 / NUM_FREQ;
                    const props = {
                        key: i,
                        width: width,
                        x: i * width,
                        style: { transform: `scale(1, ${mag})` }
                    };
                    return (
                        <rect className="freq" y="0" height="100" {...props} />
                    );
                })}
            </svg>
        );
    }
}
