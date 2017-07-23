import React, { Component } from 'react';
import {
    bool, number, string, func, instanceOf, element
} from 'prop-types';
import TransitionGroup from 'react-transition-group/TransitionGroup';
import CSSTransition from 'react-transition-group/CSSTransition';
import classNames from 'classnames';

import Spectral from './spectral.js';
import styles from './audiovisual.less';

function average(arr, lo, hi) {
    if (hi - lo <= 1) {
        return arr[lo];
    }

    let sum = 0;
    for (let i = lo; i < hi; i++) {
        sum += arr[i];
    }
    return sum / (hi - lo);
}

function normalizeFreq(f) {
    return 1 - ((f + 30) / -70);
}

function calcFreq(f, b) {
    return (Math.pow(b, f) - 1) / (b - 1);
}

function freqStep(i, m, n) {
    return Math.min(
        Math.floor(n / 2 * Math.pow(n / Math.sqrt(m), (i / m) - 1)),
        n
    );
}

function FadeTransition(props) {
    const { children, ...rest } = props;
    const className = classNames(children.props.className, styles.fadeOutScale);
    const childWithClass = React.cloneElement(children, { className });
    return  <CSSTransition
        {...rest}
        classNames={{
            appear: styles.fadeOutScaleTransition,
            appearActive: styles.fadeOutScaleTransitionActive,
            enter: styles.fadeOutScaleTransition,
            enterActive: styles.fadeOutScaleTransitionActive
        }}
        timeout={500}
    >
        {childWithClass}
    </CSSTransition>;
}

FadeTransition.propTypes = {
    children: element
};

function PauseIcon(props) {
    const { textColor, className } = props;
    return <div
        className={classNames(styles.pause, className)}
        style={{
            borderLeftColor: textColor,
            borderRightColor: textColor
        }}
    />;
}

PauseIcon.propTypes = {
    textColor: string.isRequired,
    className: string
};

function PlayIcon(props) {
    const { textColor, className } = props;
    return <div
        className={classNames(styles.play, className)}
        style={{ borderLeftColor: textColor }}
    />;
}

PlayIcon.propTypes = {
    textColor: string.isRequired,
    className: string
};

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: string,
            src: string,
            stream: instanceOf(MediaStream),
            playing: bool,
            updating: bool,
            numFreq: number,
            numWave: number,
            freqColor: string,
            waveColor: string,
            bgColor: string,
            textColor: string,
            altColor: string,
            onEnded: func
        };
    }

    static get defaultProps() {
        return {
            numFreq: 64,
            numWave: 64,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.8)',
            altColor: 'rgba(100%, 100%, 100%, 0.1)'
        };
    }

    constructor(props) {
        super();

        const {
            numFreq, numWave
        } = props;

        this.audio = null;
        this.spectral = null;
        this.waveform = null;
        this.spectrum = null;
        this.animFrame = null;

        this.state = {
            progress: 0,
            freq: new Float32Array(numFreq),
            wave: new Float32Array(numWave)
        };

        [
            'audioRef', 'onAnimFrame', 'onTimeUpdate'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });
    }

    onTimeUpdate(evt) {
        const progress = evt.target.currentTime / evt.target.duration;
        this.setState({ progress });
    }

    initSpectral(audio) {
        this.audio = audio;
        audio.addEventListener('timeupdate', this.onTimeUpdate);

        const spectral = this.spectral = new Spectral(audio);
        this.waveform = new Float32Array(spectral.waveformSize);
        this.spectrum = new Float32Array(spectral.spectrumSize);

        const { playing, updating, stream } = this.props;
        if (playing) {
            this.spectral.play(stream);
        }

        if (playing && updating) {
            this.startAnimating();
        }
    }

    destroySpectral() {
        this.stopAnimating();
        this.waveform = null;
        this.spectrum = null;
        this.spectral.close();
        this.spectral = null;
        this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
        this.audio = null;
    }

    audioRef(audio) {
        this[audio === null
            ? 'destroySpectral'
            : 'initSpectral'
        ](audio);
    }

    onAnimFrame() {
        const { spectral, waveform, spectrum } = this;
        const { numFreq, numWave } = this.props;
        const { freq, wave } = this.state;
        const { waveformSize, spectrumSize } = spectral;

        spectral.fillWaveform(waveform);
        spectral.fillSpectrum(spectrum);

        Array.prototype.forEach.call(
            spectrum, (f, i) => (spectrum[i] = normalizeFreq(f))
        );

        for (let i = 0; i < numFreq; i++) {
            freq[i] = calcFreq(average(
                spectrum,
                freqStep(i, numFreq, spectrumSize),
                freqStep(i + 1, numFreq, spectrumSize)
            ), (1 - (i / numFreq)) * 100);
        }

        const waveStep = waveformSize / numWave;
        for (let i = 0; i < numWave; i++) {
            wave[i] = average(waveform, i * waveStep, (i + 1) * waveStep);
        }

        this.setState({ freq, wave }, () => {
            this.animFrame = requestAnimationFrame(this.onAnimFrame);
        });
    }

    startAnimating() {
        if (this.animFrame === null) {
            this.animFrame = requestAnimationFrame(this.onAnimFrame);
        }
    }

    stopAnimating() {
        if (this.animFrame !== null) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    }

    componentWillReceiveProps(props) {
        const old = this.props;

        const {
            playing, numFreq, numWave, updating, stream
        } = props;

        if (numFreq !== old.numFreq) {
            this.freq = new Float32Array(numFreq);
        }

        if (numWave !== old.numWave) {
            this.wave = new Float32Array(numWave);
        }

        if (this.spectral) {
            if (playing) {
                this.spectral.play(stream);
            } else {
                this.spectral.pause();
            }

            if (playing) {
                this[updating ? 'startAnimating' : 'stopAnimating']();
            }
        }
    }

    render() {
        const {
            className, numFreq, numWave,
            bgColor, altColor, textColor, freqColor, waveColor,
            src, stream, playing, onEnded
        } = this.props;

        const classes = classNames(styles.audiovisual, className);
        const style = { backgroundColor: bgColor };

        if (!src && !stream) {
            return <div className={classes} style={style} />;
        }

        const {
            progress, freq, wave
        } = this.state;

        const progressStyle = {
            backgroundColor: textColor,
            width: `${progress * 100}%`
        };

        const altStyle = {
            backgroundColor: altColor
        };

        const wavePath = 'M0,0 ' + catmullRom2Bezier(
            Array.prototype.map.call(wave, (mag, i) =>
                `${i / numWave},${mag}`
            ).join(' ') + ' 1,0'
        );

        const playbackIndicator = playing
            ? <PlayIcon textColor={textColor} />
            : <PauseIcon textColor={textColor} />;

        return <div className={classes} style={style}>
            <audio
                src={stream ? void 0 : src}
                ref={this.audioRef}
                onEnded={onEnded}
            />
            <div className={styles.progressContainer} style={altStyle}>
                <div className={styles.progress} style={progressStyle}></div>
            </div>
            <div className={styles.waveZero} style={altStyle}></div>
            <svg
                className={styles.wave}
                viewBox='0 -1.5 1 3'
                preserveAspectRatio='none'
            >
                <path
                    fill='none' stroke={waveColor} strokeWidth={0.0025}
                    d={wavePath}
                />
            </svg>
            <div className={styles.freqs}>
                {Array.prototype.map.call(freq, (mag, i) => {
                    const width = 100 / numFreq;
                    const freqStyle = {
                        width: `calc(${width}% - 1px)`,
                        left: `${i * width}%`,
                        transform: `scaleY(${mag})`,
                        backgroundColor: freqColor
                    };
                    return <div
                        key={i}
                        className={styles.freq}
                        style={freqStyle}
                    />;
                })}
            </div>
            <TransitionGroup>
                <FadeTransition key={playing ? 'play' : 'pause'}>
                    {playbackIndicator}
                </FadeTransition>
            </TransitionGroup>
        </div>;
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
                { x: parseFloat(crp[i]), y: parseFloat(crp[i + 1]) },
                { x: parseFloat(crp[i]), y: parseFloat(crp[i + 1]) },
                { x: parseFloat(crp[i + 2]), y: parseFloat(crp[i + 3]) },
                { x: parseFloat(crp[i + 4]), y: parseFloat(crp[i + 5]) }
            ];
        } else if (i === crp.length - 4) {
            p = [
                { x: parseFloat(crp[i - 2]), y: parseFloat(crp[i - 1]) },
                { x: parseFloat(crp[i]), y: parseFloat(crp[i + 1]) },
                { x: parseFloat(crp[i + 2]), y: parseFloat(crp[i + 3]) },
                { x: parseFloat(crp[i + 2]), y: parseFloat(crp[i + 3]) }
            ];
        } else {
            p = [
                { x: parseFloat(crp[i - 2]), y: parseFloat(crp[i - 1]) },
                { x: parseFloat(crp[i]), y: parseFloat(crp[i + 1]) },
                { x: parseFloat(crp[i + 2]), y: parseFloat(crp[i + 3]) },
                { x: parseFloat(crp[i + 4]), y: parseFloat(crp[i + 5]) }
            ];
        }

        // Catmull-Rom to Cubic Bezier conversion matrix
        //    0       1       0       0
        //  -1/6      1      1/6      0
        //    0      1/6      1     -1/6
        //    0       0       1       0

        const bp = [{
            x: p[1].x,
            y: p[1].y
        }, {
            x: ((-p[0].x + 6 * p[1].x + p[2].x) / 6),
            y: ((-p[0].y + 6 * p[1].y + p[2].y) / 6)
        }, {
            x: ((p[1].x + 6 * p[2].x - p[3].x) / 6),
            y: ((p[1].y + 6 * p[2].y - p[3].y) / 6)
        }, {
            x: p[2].x,
            y: p[2].y
        }];

        d.push(
            `C${bp[1].x},${bp[1].y} `
            + `${bp[2].x},${bp[2].y} `
            + `${bp[3].x},${bp[3].y}`
        );
    }

    return d.join(' ');
}

