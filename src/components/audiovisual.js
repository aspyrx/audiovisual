/*
 * audiovisual.js - React component that visualises audio.
 */

import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import classNames from 'classnames';
import Raphael from 'raphael';

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
            delay: PropTypes.number,
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
            altColor: PropTypes.string,
            onEnded: PropTypes.func
        };
    }

    static get defaultProps() {
        return {
            playing: false,
            updating: true,
            bufSize: 2048,
            smoothing: 0.2,
            delay: 0.25,
            numFreq: 64,
            numWave: 64,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            kickOn: true,
            kickFreq: [5, 15],
            kickThreshold: 0.7,
            kickDecay: -0.01,
            kickColor: 'rgba(100%, 100%, 100%, 0.02)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.8)',
            altColor: 'rgba(100%, 100%, 100%, 0.1)'
        }
    }

    constructor(props) {
        super();

        this.onResize = this.onResize.bind(this);

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

    onResize() {
        const node = ReactDOM.findDOMNode(this);
        this.paper = Raphael(node, node.offsetWidth, node.offsetHeight);
        this.paper.setViewBox(0, -1.5, 1, 3);
        this.paper.canvas.setAttribute('preserveAspectRatio', 'none');
        this.path = this.paper.path('M0,0 1,0');
        this.path.attr({ 'stroke': this.props.waveColor, 'stroke-width': 0.0025 });
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize);
        this.onResize();
    }

    initSpectral(audio) {
        if (this.spectral) {
            return;
        }

        const { bufSize, smoothing, delay } = this.props;
        const spectral = Spectral(audio, bufSize, smoothing, delay);
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

            let { kickCurrentThreshold } = this.state;
            const { kickThreshold } = this.props;
            const mag = average(spectrum, ...kickFreq);
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

            const normalizeFreq = f => 1 - ((f + 30) / -70);
            Array.prototype.forEach.call(spectrum, (f, i) => (spectrum[i] = normalizeFreq(f)));

            const calcFreq = (f, b) => (Math.pow(b, f) - 1) / (b - 1);
            const freqStep = (i, m = numFreq, n = spectrumSize) =>
                Math.min(Math.floor(n / 2 * Math.pow(n / Math.sqrt(m), (i / m) - 1)), n);

            for (let i = 0; i < numFreq; i++) {
                freq[i] = calcFreq(average(spectrum, freqStep(i), freqStep(i + 1)), (1 - (i / numFreq)) * 100);
            }

            const waveStep = waveformSize / numWave;
            for (let i = 0; i < numWave; i++) {
                wave[i] = average(waveform, i * waveStep, (i + 1) * waveStep);
            }

            testKick(spectrum);
            this.setState({ freq, wave });
        }

        const updateRate = 90;
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
                this.setState({ playing });
            }
        } else if (stream) {
            this.spectral.startStreaming(stream);
        }

        if (updating !== this.props.updating && this.spectral) {
            updating ? this.startUpdates() : this.cancelUpdates();
            this.setState({ updating });
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
        window.removeEventListener('resize', this.onResize);

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
            className, numFreq, freqColor, numWave,
            kickColor, bgColor, textColor, altColor, onEnded
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

        if (this.path) {
            const wavePath = 'M0,0 ' + catmullRom2Bezier(Array.prototype.map.call(wave, (mag, i) => `${i / numWave},${mag}`).join(' ') + ' 1,0');
            this.path.animate({ path: wavePath }, 85, 'linear');
        }

        return (
            <div className={classes} style={style}>
                <audio src={stream ? undefined : src} ref={audioRef} onEnded={onEnded} />
                <div className="progressContainer" style={altStyle}>
                    <div className="progress" style={progressStyle}></div>
                </div>
                <div className="waveZero" style={altStyle}></div>
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


// Adapted from http://schepers.cc/svg/path/catmullrom2bezier.js
function catmullRom2Bezier(points) {
    const crp = points.split(/[,\s]/);
    const d = [];

    for (let i = 0; i < crp.length - 2; i += 2) {
        let p;
        if (i === 0) {
            p = [
                {x: parseFloat(crp[ i ]), y: parseFloat(crp[ i + 1 ])},
                {x: parseFloat(crp[ i ]), y: parseFloat(crp[ i + 1 ])},
                {x: parseFloat(crp[ i + 2 ]), y: parseFloat(crp[ i + 3 ])},
                {x: parseFloat(crp[ i + 4 ]), y: parseFloat(crp[ i + 5 ])}
            ];
        } else if (i === crp.length - 4) {
            p = [
                {x: parseFloat(crp[ i - 2 ]), y: parseFloat(crp[ i - 1 ])},
                {x: parseFloat(crp[ i ]), y: parseFloat(crp[ i + 1 ])},
                {x: parseFloat(crp[ i + 2 ]), y: parseFloat(crp[ i + 3 ])},
                {x: parseFloat(crp[ i + 2 ]), y: parseFloat(crp[ i + 3 ])}
            ];
        } else {
            p = [
                {x: parseFloat(crp[ i - 2 ]), y: parseFloat(crp[ i - 1 ])},
                {x: parseFloat(crp[ i ]), y: parseFloat(crp[ i + 1 ])},
                {x: parseFloat(crp[ i + 2 ]), y: parseFloat(crp[ i + 3 ])},
                {x: parseFloat(crp[ i + 4 ]), y: parseFloat(crp[ i + 5 ])}
            ];
        }

        // Catmull-Rom to Cubic Bezier conversion matrix
        //    0       1       0       0
        //  -1/6      1      1/6      0
        //    0      1/6      1     -1/6
        //    0       0       1       0

        const bp = [
            { x: p[1].x,  y: p[1].y },
            { x: ((-p[0].x + 6*p[1].x + p[2].x) / 6), y: ((-p[0].y + 6*p[1].y + p[2].y) / 6)},
            { x: ((p[1].x + 6*p[2].x - p[3].x) / 6),  y: ((p[1].y + 6*p[2].y - p[3].y) / 6) },
            { x: p[2].x,  y: p[2].y }
        ];

        d.push(`C${bp[1].x},${bp[1].y} ${bp[2].x},${bp[2].y} ${bp[3].x},${bp[3].y}`);
    }

    return d.join(' ');
}

