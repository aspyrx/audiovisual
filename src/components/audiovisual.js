/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import classNames from 'classnames';
import Dancer from 'dancer/dancer';

import styles from './audiovisual.less';

const NUM_SPECTRUM = 512;
const NUM_WAVEFORM = 1024;
const NUM_FREQ = 32;
const NUM_WAVE = 32;
const FREQ_INITIAL = 1;
const FREQ_EXP = 1.4;
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

    constructor() {
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

            const average = (arr, lo, hi) => {
                let sum = 0;
                for (let i = lo; i < hi; i++) {
                    sum += arr[i];
                }
                return sum / (hi - lo);
            }

            const max = (arr, lo, hi) => {
                let max = -Infinity;
                for (let i = lo; i < hi; i++) {
                    if (arr[i] > max) {
                        max = arr[i];
                    }
                }
                return max;
            }

            const { freq, wave } = this.state;

            const spectrum = this.dancer.getSpectrum();
            let lo = 0, hi = FREQ_INITIAL, step = FREQ_INITIAL;
            for (let i = 0; i < NUM_FREQ && hi <= NUM_SPECTRUM; i++) {
                freq[i] = max(spectrum, lo, hi);
                step = Math.floor(step * FREQ_EXP);
                lo = hi;
                hi += step;
            }

            const waveform = this.dancer.getWaveform();
            for (let i = 0; i < NUM_WAVE; i++) {
                wave[i] = average(waveform, i * WAVE_STEP, (i + 1) * WAVE_STEP);
            }
            this.setState({ freq, wave });
        }).bind('loaded', () => {
            if (this.props.playing) {
                this.dancer.play();
            }
        });
    }

    componentWillReceiveProps(props) {
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
        const {className, src} = this.props;
        const {kick, freq, wave} = this.state;
        const classes = classNames(styles.audiovisual, className, { kick });
        const audioRef = audio => {
            if (audio
                && (!this.dancer.isLoaded() || this.dancer.source !== audio)) {
                this.dancer.load(audio);
            }
        }

        return (
            <div className={classes}>
                <audio src={src} ref={audioRef} />
                {wave.map((mag, i) => {
                    const width = 100 / NUM_WAVE;
                    const style = {
                        height: '0.5%',
                        width: `${width}%`,
                        left: `${i * width}%`,
                        top: `${49.75 - mag * 30}%`
                    };
                    return (
                        <div className="wave" key={i} style={style} />
                    );
                })}
                {freq.map((mag, i) => {
                    const width = 100 / NUM_FREQ;
                    const style = {
                        bottom: 0,
                        width: `${width}%`,
                        left: `${i * width}%`,
                        height: `${mag * 100}%`
                    };
                    return (
                        <div className="freq" key={i} style={style} />
                    );
                })}
            </div>
        );
    }
}
