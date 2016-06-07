/*
 * audiovisual.js - React component that visualises audio.
 */

import React, {Component, PropTypes} from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import classNames from 'classnames';

import Spectral from './spectral.js';
import styles from './audiovisual.less';

const Float32Array = window.Float32Array;

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: PropTypes.string,
            src: PropTypes.string,
            playing: PropTypes.bool,
            updating: PropTypes.bool,
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
            updating: true,
            numFreq: 32,
            numWave: 64,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            kickOn: true,
            kickFreq: [3, 9],
            kickThreshold: -38,
            kickDecay: -0.05,
            kickColor: 'rgba(100%, 100%, 100%, 0.03)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.8)'
        }
    }

    constructor(props) {
        super();

        let { numFreq, numWave, kickThreshold } = props;
        const freq = new Float32Array(numFreq);
        const wave = new Float32Array(numWave);
        this.state = {
            updating: false,
            kicking: false,
            progress: 0,
            currentKickThreshold: kickThreshold,
            unmountHandlers: [],
            freq, wave
        };
    }

    initSpectral(audio) {
        if (this.spectral) {
            return;
        }

        const spectral = Spectral(audio, 1024);
        this.spectral = spectral;
        const { unmountHandlers } = this.state;

        const average = (arr, lo, hi) => {
            if (hi - lo <= 1) {
                return arr[lo];
            }

            let sum = 0;
            for (let i = lo; i < hi; i++) {
                sum += arr[i];
            }
            return sum / (hi - lo);
        }

        let kickTimer;
        const testKick = (spectrum) => {
            const { kickOn, kickFreq, kickDecay } = this.props;
            if (!kickOn) {
                return;
            }

            const { kickCurrentThreshold } = this.state;
            const mag = average(spectrum, kickFreq[0], kickFreq[1]);
            if (mag < kickCurrentThreshold) {
                this.setState({ kickCurrentThreshold: kickCurrentThreshold + kickDecay });
                return;
            }

            this.setState({ kickCurrentThreshold: mag });
            if (this.state.kick) {
                window.clearTimeout(kickTimer);
            } else {
                this.setState({ kicking: true });
            }

            kickTimer = window.setTimeout(() => this.setState({ kicking: false }), 50);
        }

        unmountHandlers.push(() => {
            if (this.state.kicking) {
                window.clearTimeout(kickTimer);
            }
        });

        const { waveformSize, spectrumSize } = spectral;
        const waveform = new Float32Array(waveformSize);
        const spectrum = new Float32Array(spectrumSize);
        const onUpdate = () => {
            if (spectral.paused || !this.state.updating) {
                return;
            }

            spectral.getWaveform(waveform);
            spectral.getSpectrum(spectrum);
            const { freq, wave } = this.state;
            const { numFreq, numWave } = this.props;

            const freqStep = (i, m = numFreq, n = spectrumSize) =>
                Math.min(Math.floor(n * Math.pow(n / Math.sqrt(m), (i / m) - 1)), n);

            for (let i = 0; i < numFreq; i++) {
                const [lo, hi] = [freqStep(i), freqStep(i + 1)];
                freq[i] = 1 - ((average(spectrum, lo, hi) + 30) / -70);
            }

            const waveStep = waveformSize / numWave;
            for (let i = 0; i < numWave; i++) {
                const [lo, hi] = [i * waveStep, (i + 1) * waveStep];
                wave[i] = average(waveform, lo, hi);
            }

            testKick(spectrum);
            this.setState({ freq, wave });
        }

        const updateRate = 60;
        let updateTimer;
        this.cancelUpdates = () => {
            if (this.state.updating) {
                window.clearInterval(updateTimer);
                this.setState({ updating: false });
            }
        };
        this.startUpdates = () => {
            if (!this.state.updating) {
                updateTimer = window.setInterval(onUpdate, updateRate);
                this.setState({ updating: true });
            }
        };

        unmountHandlers.push(this.cancelUpdates);
        if (this.props.updating) {
            this.startUpdates();
        }

        spectral.addEventListener('canplay', () => {
            if (this.props.playing) {
                spectral.play();
            }
        });
        spectral.addEventListener('timeupdate', () => {
            this.setState({ progress: spectral.currentTime / spectral.duration });
        });

        this.setState({ unmountHandlers });
    }

    componentWillReceiveProps(props) {
        const {
            src, playing, updating,
            numFreq, numWave, kickThreshold
        } = props;

        if (playing !== this.props.playing || src !== this.props.src) {
            playing ? this.spectral.play() : this.spectral.pause();
        }

        if (updating !== this.props.updating && this.spectral) {
            updating ? this.startUpdates() : this.cancelUpdates();
        }

        if (numFreq !== this.props.numFreq) {
            const freq = new Float32Array(numFreq);
            this.setState({ freq });
        }

        if (numWave !== this.props.numWave) {
            const wave = new Float32Array(numWave);
            this.setState({ wave });
        }

        if (kickThreshold !== this.props.kickThreshold) {
            this.setState({ kickCurrentThreshold: kickThreshold });
        }
    }

    componentWillUnmount() {
        for (let callback of this.state.unmountHandlers) {
            callback();
        }
    }

    render() {
        const { src } = this.props;
        if (!src) {
            return (<div className={classes}></div>);
        }

        const {
            className, playing, numFreq, numWave,
            freqColor, waveColor, kickColor, bgColor, textColor, ...props
        } = this.props;
        const {kicking, progress, freq, wave} = this.state;

        const classes = classNames(styles.audiovisual, className, { kicking });
        const style = { backgroundColor: kicking ? kickColor : bgColor };
        const progressStyle = {
            backgroundColor: textColor,
            width: `${progress * 100}%`
        };

        const audioRef = audio => {
            if (audio) {
                this.initSpectral(audio);
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
                <audio src={src} ref={audioRef} {...props} />
                <div className="progress" style={progressStyle}></div>
                <div className="waves">
                    {Array.prototype.map.call(wave, (mag, i) => {
                        const width = 100 / numWave;
                        const top = 49.75 - mag * 30;
                        const style = {
                            height: '0.5%',
                            width: `${width}%`,
                            left: `${i * width}%`,
                            top: `${top}%`,
                            backgroundColor: waveColor
                        };
                        return (<div className="wave" key={i} style={style}></div>);
                    })}
                </div>
                <div className="freqs">
                    {Array.prototype.map.call(freq, (mag, i) => {
                        const width = 100 / numFreq;
                        const height = mag * 30;
                        const style = {
                            bottom: 0,
                            width: `${width}%`,
                            left: `${i * width}%`,
                            height: `${height}%`,
                            backgroundColor: freqColor
                        };
                        return (<div className="freq" key={i} style={style}></div>);
                    })}
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
