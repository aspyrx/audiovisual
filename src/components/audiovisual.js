/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import classNames from 'classnames';
import Dancer from 'dancer/dancer';

import styles from './audiovisual.less';

const FREQ_INITIAL = 1;
const FREQ_EXP = 1.4;
const SKIP_UPDATES = 2;

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: PropTypes.string,
            src: PropTypes.string,
            playing: PropTypes.bool,
            numFreq: PropTypes.number,
            numWave: PropTypes.number,
            freqColor: PropTypes.string,
            waveColor: PropTypes.string,
            kickOn: PropTypes.bool,
            kickFreq: PropTypes.arrayOf(PropTypes.number),
            kickThreshold: PropTypes.number,
            kickDecay: PropTypes.number,
            kickColor: PropTypes.string,
            bgColor: PropTypes.string
        };
    }

    static get defaultProps() {
        return {
            playing: false,
            numFreq: 64,
            numWave: 64,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            kickOn: true,
            kickFreq: [0, 15],
            kickThreshold: 0.4,
            kickDecay: 0.02,
            kickColor: 'rgba(100%, 100%, 100%, 0.03)',
            bgColor: 'transparent'
        }
    }

    constructor(props) {
        super();

        let { numFreq, numWave, kickOn, kickFreq, kickThreshold, kickDecay } = props;
        const freq = new Array(numFreq);
        for (let i = 0; i < numFreq; i++) {
            freq[i] = 0;
        }

        const wave = new Array(numWave);
        for (let i = 0; i < numWave; i++) {
            wave[i] = 0;
        }

        this.state = { kick: false, freq, wave };

        let updatesSkipped = SKIP_UPDATES;

        this.dancer = new Dancer();
        this.kick = this.dancer.createKick({
            frequency: kickFreq,
            threshold: kickThreshold,
            decay: kickDecay,
            onKick: () => {
                if (this.state.kick) {
                    window.clearTimeout(this.kickTimer);
                } else {
                    this.setState({ kick: true });
                }

                this.kickTimer = window.setTimeout(() => this.setState({ kick: false }), 50);
            }
        });

        if (kickOn) {
            this.kick.on();
        }

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
            const { numFreq, numWave } = this.props;

            const spectrum = this.dancer.getSpectrum();
            const numSpectrum = spectrum.length;
            let lo = 0, hi = FREQ_INITIAL, step = FREQ_INITIAL;
            for (let i = 0; i < numFreq && hi <= numSpectrum; i++) {
                freq[i] = max(spectrum, lo, hi);
                step = Math.floor(step * FREQ_EXP);
                lo = hi;
                hi += step;
            }

            const waveform = this.dancer.getWaveform();
            const waveStep = waveform.length / numWave;
            for (let i = 0; i < numWave; i++) {
                wave[i] = average(waveform, i * waveStep, (i + 1) * waveStep);
            }

            this.setState({ freq, wave });
        }).bind('loaded', () => {
            if (this.props.playing) {
                this.dancer.play();
            }
        });
    }

    componentWillReceiveProps(props) {
        const { numFreq, numWave, kickOn, kickFreq, kickThreshold, kickDecay, playing } = props;
        if (numFreq !== this.props.numFreq) {
            const freq = new Array(numFreq);
            for (let i = 0; i < numFreq; i++) {
                freq[i] = 0;
            }

            this.setState({ freq });
        }

        if (numWave !== this.props.numWave) {
            const wave = new Array(numWave);
            for (let i = 0; i < numWave; i++) {
                wave[i] = 0;
            }

           this.setState({ wave });
        }

        if (kickFreq !== this.props.kickFreq
            || kickThreshold !== this.props.kickThreshold
            || kickDecay !== this.props.kickDecay
            || kickOn !== this.props.kickOn) {
            this.kick.set({
                frequency: kickFreq,
                threshold: kickThreshold,
                decay: kickDecay
            });

            if (kickOn) {
                this.kick.on();
            } else {
                this.kick.off();
            }
        }

        if (this.dancer.isLoaded()) {
            if (playing) {
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
        const {className, src, numFreq, numWave, freqColor, waveColor, kickColor, bgColor } = this.props;
        if (!src) {
            return (<div className={classes}></div>);
        }

        const {kick, freq, wave} = this.state;
        const classes = classNames(styles.audiovisual, className, { kick });
        const style = { backgroundColor: kick ? kickColor : bgColor };
        const audioRef = audio => {
            if (audio
                && (!this.dancer.isLoaded() || this.dancer.source !== audio)) {
                this.dancer.load(audio);
            }
        }

        return (
            <div className={classes} style={style}>
                <audio src={src} ref={audioRef} />
                {wave.map((mag, i) => {
                    const width = 100 / numWave;
                    const style = {
                        height: '0.5%',
                        width: `${width}%`,
                        left: `${i * width}%`,
                        top: `${49.75 - mag * 30}%`,
                        backgroundColor: waveColor
                    };
                    return (<div className="wave" key={i} style={style}></div>);
                })}
                {freq.map((mag, i) => {
                    const width = 100 / numFreq;
                    const style = {
                        bottom: 0,
                        width: `${width}%`,
                        left: `${i * width}%`,
                        height: `${mag * 90}%`,
                        backgroundColor: freqColor
                    };
                    return (<div className="freq" key={i} style={style}></div>);
                })}
            </div>
        );
    }
}
