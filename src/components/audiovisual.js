/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import classNames from 'classnames';
import Dancer from 'dancer/dancer';

import styles from './audiovisual.less';

const FREQ_INITIAL = 1;
const FREQ_EXP = 1.4;
const SKIP_UPDATES = 2;

/* eslint no-console: "off" */

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
            bgColor: PropTypes.string,
            textColor: PropTypes.string
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
            kickDecay: 0.1,
            kickColor: 'rgba(100%, 100%, 100%, 0.03)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.5)'
        }
    }

    constructor(props) {
        super();

        let { numFreq, numWave } = props;
        const freq = new Array(numFreq);
        for (let i = 0; i < numFreq; i++) {
            freq[i] = 0;
        }

        const wave = new Array(numWave);
        for (let i = 0; i < numWave; i++) {
            wave[i] = 0;
        }

        this.state = { kicking: false, freq, wave };
    }

    createDancer(audio, props) {
        if (this.dancer) {
            return;
        }

        let { kickOn, kickFreq, kickThreshold, kickDecay } = props;
        const dancer = new Dancer();
        const kick = dancer.createKick({
            frequency: kickFreq,
            threshold: kickThreshold,
            decay: kickDecay,
            onKick: () => {
                if (this.state.kick) {
                    window.clearTimeout(this.kickTimer);
                } else {
                    this.setState({ kicking: true });
                }

                this.kickTimer = window.setTimeout(() => this.setState({ kicking: false }), 50);
            }
        });

        let updatesSkipped = SKIP_UPDATES;
        dancer.bind('update', () => {
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

            const spectrum = dancer.getSpectrum();
            const numSpectrum = spectrum.length;
            let lo = 0, hi = FREQ_INITIAL, step = FREQ_INITIAL;
            for (let i = 0; i < numFreq && hi <= numSpectrum; i++) {
                freq[i] = Math.min(max(spectrum, lo, hi), 1.0);
                step = Math.floor(step * FREQ_EXP);
                lo = hi;
                hi += step;
            }

            const waveform = dancer.getWaveform();
            const waveStep = waveform.length / numWave;
            for (let i = 0; i < numWave; i++) {
                wave[i] = average(waveform, i * waveStep, (i + 1) * waveStep);
            }

            this.setState({ freq, wave });
        }).bind('loaded', () => {
            if (this.props.playing) {
                dancer.play();
            } else {
                dancer.pause();
            }
        });

        if (kickOn) {
            kick.on();
        }

        dancer.load(audio);

        this.dancer = dancer;
        this.kick = kick;
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

        const { kick, dancer } = this;
        if (kick && (kickFreq !== this.props.kickFreq
                     || kickThreshold !== this.props.kickThreshold
                     || kickDecay !== this.props.kickDecay
                     || kickOn !== this.props.kickOn)) {
            kick.set({
                frequency: kickFreq,
                threshold: kickThreshold,
                decay: kickDecay
            });

            kickOn ? kick.on() : kick.off();
        }

        if (dancer && dancer.isLoaded()) {
            if (playing) {
                dancer.play();
            } else {
                dancer.pause();
            }
        }
    }

    componentWillUnmount() {
        window.clearTimeout(this.kickTimer);
    }

    render() {
        const { className, src, playing, numFreq, numWave,
            freqColor, waveColor, kickColor, bgColor, textColor } = this.props;
        if (!src) {
            return (<div className={classes}></div>);
        }

        const filename = src.match(/[^/]*$/)[0];
        const {kicking, freq, wave} = this.state;
        const classes = classNames(styles.audiovisual, className, { kicking });
        const style = { backgroundColor: kicking ? kickColor : bgColor };
        const audioRef = audio => {
            if (audio) {
                this.createDancer(audio, this.props);
            }
        };

        const playIndicator = playing
            ? (<div className="play fadeOutScale"
                style={{ borderLeftColor: textColor }}></div>)
            : null;
        const pauseIndicator = playing
            ? null
            : (<div className="pause fadeOutScale"
                style={{
                    borderLeftColor: textColor,
                    borderRightColor: textColor
                }}></div>);

        return (
            <div className={classes} style={style}>
                <audio src={src} ref={audioRef} />
                <div className="waves">
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
                </div>
                <div className="freqs">
                    {freq.map((mag, i) => {
                        const width = 100 / numFreq;
                        const style = {
                            bottom: 0,
                            width: `${width}%`,
                            left: `${i * width}%`,
                            height: `${mag * 80}%`,
                            backgroundColor: freqColor
                        };
                        return (<div className="freq" key={i} style={style}></div>);
                    })}
                </div>
                <div className="info" style={{ color: textColor }}>
                    <span className="filename">{filename}</span>
                </div>
                <ReactCSSTransitionGroup transitionName="fadeOutScale"
                    transitionAppear={true}
                    transitionAppearTimeout={500}
                    transitionEnter={true}
                    transitionEnterTimeout={500}
                    transitionLeave={false}>
                    {playIndicator}
                    {pauseIndicator}
                </ReactCSSTransitionGroup>
            </div>
        );
    }
}
