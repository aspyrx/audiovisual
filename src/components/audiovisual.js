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
            stream: PropTypes.object,
            playing: PropTypes.bool,
            updating: PropTypes.bool,
            bufSize: PropTypes.number,
            smoothing: PropTypes.number,
            maxDelay: PropTypes.number,
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
            textColor: PropTypes.string,
            altColor: PropTypes.string
        };
    }

    static get defaultProps() {
        return {
            playing: false,
            updating: true,
            bufSize: 2048,
            smoothing: 0.3,
            maxDelay: 0,
            numFreq: 64,
            numWave: 128,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            kickOn: true,
            kickFreq: [0, 1],
            kickThreshold: -60,
            kickDecay: -0.1,
            kickColor: 'rgba(100%, 100%, 100%, 0.03)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.8)',
            altColor: 'rgba(100%, 100%, 100%, 0.1)'
        }
    }

    constructor(props) {
        super();

        let { playing, numFreq, numWave, kickThreshold } = props;
        const freq = new Float32Array(numFreq);
        const wave = new Float32Array(numWave);
        this.state = {
            playing: playing,
            updating: false,
            kicking: false,
            progress: 0,
            kickCurrentThreshold: kickThreshold,
            unmountHandlers: [],
            freq, wave
        };
    }

    initSpectral(audio) {
        if (this.spectral) {
            return;
        }

        const { bufSize, smoothing } = this.props;
        const spectral = Spectral(audio, bufSize, smoothing);
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

        const max = (arr, lo, hi) => {
            if (hi - lo <= 1) {
                return arr[lo];
            }

            let max = -Infinity;
            for (let i = lo; i < hi; i++) {
                if (arr[i] > max) {
                    max = arr[i];
                }
            }
            return max;
        }

        let kickTimer;
        const testKick = (spectrum) => {
            const { kickOn, kickFreq, kickDecay } = this.props;
            if (!kickOn) {
                return;
            }

            let { kickCurrentThreshold } = this.state;
            const { kickThreshold } = this.props;
            const mag = max(spectrum, ...kickFreq);
            if (mag < kickCurrentThreshold) {
                kickCurrentThreshold = Math.max(
                    kickCurrentThreshold + kickDecay, kickThreshold
                );
                this.setState({ kickCurrentThreshold });
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
            if (!this.state.updating || (!spectral.streaming && spectral.paused)) {
                return;
            }

            spectral.getWaveform(waveform);
            spectral.getSpectrum(spectrum);
            const { freq, wave } = this.state;
            const { numFreq, numWave } = this.props;

            const freqExp = (f, b = 100) => (Math.pow(b, f) - 1) / (b - 1);
            const freqStep = (i, m = numFreq, n = spectrumSize) =>
                Math.min(Math.floor(n * Math.pow(n / Math.sqrt(m), (i / m) - 1)), n);

            for (let i = 0; i < numFreq; i++) {
                const [lo, hi] = [freqStep(i), freqStep(i + 1)];
                freq[i] = freqExp(1 - ((average(spectrum, lo, hi) + 30) / -70));
            }

            const waveStep = waveformSize / numWave;
            for (let i = 0; i < numWave; i++) {
                const [lo, hi] = [i * waveStep, (i + 1) * waveStep];
                wave[i] = average(waveform, lo, hi);
            }

            testKick(spectrum);
            this.setState({ freq, wave });
        }

        const updateRate = 80;
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

        if (this.props.stream) {
            spectral.startStreaming(this.props.stream);
        }

        spectral.addEventListener('canplay', () => {
            if (this.props.playing) {
                spectral.play();
            }
        });
        spectral.addEventListener('timeupdate', () => {
            this.setState({ progress: spectral.currentTime / spectral.duration });
        });
        spectral.addEventListener('play', () => {
            this.setState({ playing: true });
        });
        spectral.addEventListener('pause', () => {
            this.setState({ playing: false });
        });

        this.setState({ unmountHandlers });
    }

    componentWillReceiveProps(props) {
        const {
            src, stream, playing, updating,
            numFreq, numWave, kickThreshold
        } = props;

        if (src) {
            this.spectral.stopStreaming();

            if (playing !== this.state.playing) {
                playing ? this.spectral.play() : this.spectral.pause();
            }
        } else if (stream) {
            this.spectral.startStreaming(stream);
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
        const { src, stream } = this.props;
        if (!src && !stream) {
            return (<div className={classes}></div>);
        }

        const {
            className, numFreq, numWave, freqColor, waveColor,
            kickColor, bgColor, textColor, altColor, ...props
        } = this.props;
        const {playing, kicking, progress, freq, wave} = this.state;

        const classes = classNames(styles.audiovisual, className, { kicking });
        const style = { backgroundColor: kicking ? kickColor : bgColor };
        const progressStyle = {
            backgroundColor: textColor,
            width: `${progress * 100}%`
        };

        const altStyle = {
            backgroundColor: altColor
        }

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
                <audio src={stream ? undefined : src} ref={audioRef} {...props} />
                <div className="progressContainer" style={altStyle}>
                    <div className="progress" style={progressStyle}></div>
                </div>
                <div className="waveZero" style={altStyle}></div>
                <div className="waves">
                    {Array.prototype.map.call(wave, (mag, i) => {
                        if (i + 1 >= numWave) {
                            return null;
                        }

                        const dx = 100 / (numWave - 1);
                        const dy = (wave[i + 1] - mag) * 15;
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                        const style = {
                            width: `calc(${dx}% - 1px)`,
                            left: `${i * dx}%`,
                            transform: `translateY(${mag * 15}vh) rotate(${angle}deg)`,
                            backgroundColor: waveColor
                        };
                        return (<div className="wave" key={i} style={style}></div>);
                    })}
                </div>
                <div className="freqs">
                    {Array.prototype.map.call(freq, (mag, i) => {
                        const width = 100 / numFreq;
                        const style = {
                            width: `calc(${width}% - 1px)`,
                            left: `${i * width}%`,
                            transform: `scaleY(${mag})`,
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
