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
            waveWidth: number,
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
            numWave: 1024,
            waveWidth: 3,
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
            numFreq,
            numWave
        } = props;

        this.audio = null;
        this.spectral = null;
        this.waveform = null;
        this.spectrum = null;

        this.animFrame = null;

        this.node = null;

        this.wave = null;
        this.wavePoints = new Float32Array(numWave);

        this.freq = null;
        this.freqPoints = new Float32Array(numFreq);

        this.state = {
            progress: 0,
            offsetWidth: 1,
            offsetHeight: 1
        };

        [
            'nodeRef', 'audioRef', 'waveRef',
            'onAnimFrame', 'onTimeUpdate', 'onResize'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });
    }

    onTimeUpdate(evt) {
        const progress = evt.target.currentTime / evt.target.duration;
        this.setState({ progress });
    }

    onResize() {
        const { offsetWidth, offsetHeight } = this.node;
        this.setState({ offsetWidth, offsetHeight });
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

    nodeRef(node) {
        this.node = node;

        if (node) {
            window.addEventListener('resize', this.onResize);
            this.onResize();
        } else {
            window.removeEventListener('resize', this.onResize);
        }
    }

    waveRef(wave) {
        this.wave = wave;
    }

    onAnimFrame() {
        const { spectral, waveform, spectrum } = this;
        const { numFreq, numWave } = this.props;
        const { waveformSize, spectrumSize } = spectral;

        spectral.fillWaveform(waveform);
        spectral.fillSpectrum(spectrum);

        Array.prototype.forEach.call(
            spectrum, (f, i) => (spectrum[i] = normalizeFreq(f))
        );

        const { offsetWidth, offsetHeight } = this.state;
        const { wavePoints, freqPoints } = this;

        for (let i = 0; i < numFreq; i++) {
            freqPoints[i] = calcFreq(average(
                spectrum,
                freqStep(i, numFreq, spectrumSize),
                freqStep(i + 1, numFreq, spectrumSize)
            ), (1 - (i / numFreq)) * 100);
        }

        const waveStep = waveformSize / numWave;
        for (let i = 0; i < numWave; i++) {
            wavePoints[i] = (
                average(waveform, i * waveStep, (i + 1) * waveStep) / 3 + 0.5
            ) * offsetHeight;
        }

        this.updateWave(offsetWidth, offsetHeight, numWave, wavePoints);
        this.animFrame = requestAnimationFrame(this.onAnimFrame);
    }

    updateWave(w, h, n, ys) {
        const { wave } = this;
        if (wave) {
            const bezier = ysToBezier(w, n, ys);
            wave.setAttribute('d', `M0,${h / 2} ${bezier} ${w},${h / 2}`);
        }
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
            this.freqPoints = new Float32Array(numFreq);
        }

        if (numWave !== old.numWave) {
            this.wavePoints = new Float32Array(numWave);
        }

        if (this.spectral) {
            if (playing) {
                this.spectral.play(stream);
            } else {
                this.spectral.pause();
            }

            if (playing && updating) {
                this.startAnimating();
            } else {
                this.stopAnimating();
            }
        }
    }

    render() {
        const {
            className, waveWidth,
            bgColor, altColor, textColor, waveColor,
            src, stream, playing, onEnded
        } = this.props;

        const classes = classNames(styles.audiovisual, className);
        const style = { backgroundColor: bgColor };

        if (!src && !stream) {
            return <div className={classes} style={style} />;
        }

        const { progress } = this.state;

        const { nodeRef, audioRef, waveRef } = this;

        const progressStyle = {
            backgroundColor: textColor,
            width: `${progress * 100}%`
        };

        const altStyle = {
            backgroundColor: altColor
        };

        const playbackIndicator = playing
            ? <PlayIcon textColor={textColor} />
            : <PauseIcon textColor={textColor} />;

        return <div
            className={classes}
            style={style}
            ref={nodeRef}
        >
            <audio
                src={stream ? void 0 : src}
                ref={audioRef}
                onEnded={onEnded}
            />
            <div className={styles.progressContainer} style={altStyle}>
                <div className={styles.progress} style={progressStyle}></div>
            </div>
            <div className={styles.waveZero} style={altStyle}></div>
            <svg className={styles.wave}>
                <path
                    fill='none' ref={waveRef}
                    stroke={waveColor} strokeWidth={waveWidth}
                />
            </svg>
            <TransitionGroup>
                <FadeTransition key={playing ? 'play' : 'pause'}>
                    {playbackIndicator}
                </FadeTransition>
            </TransitionGroup>
        </div>;
    }
}

// Adapted from http://schepers.cc/svg/path/catmullrom2bezier.js
// eslint-disable-next-line max-params
function catmullRom2Bezier(ax, ay, bx, by, cx, cy, dx, dy) {
    // Catmull-Rom to Cubic Bezier conversion matrix
    //    0       1       0       0
    //  -1/6      1      1/6      0
    //    0      1/6      1     -1/6
    //    0       0       1       0

    const px = (-ax + 6 * bx + cx) / 6;
    const py = (-ay + 6 * by + cy) / 6;
    const qx = (bx + 6 * cx - dx) / 6;
    const qy = (by + 6 * cy - dy) / 6;

    return `C${px},${py} ${qx},${qy} ${cx},${cy}`;
}

function ysToBezier(w, n, ys) {
    if (n < 3) {
        return '';
    }

    const dx = w / n;
    const d = new Array(n - 1);

    d[0] = catmullRom2Bezier(
        0, ys[0],
        0, ys[0],
        dx, ys[1],
        dx + dx, ys[2]
    );

    d[n - 2] = catmullRom2Bezier(
        (n - 3) * dx, ys[n - 3],
        (n - 2) * dx, ys[n - 2],
        (n - 1) * dx, ys[n - 1],
        (n - 1) * dx, ys[n - 1]
    );

    for (let i = 1, x = 0; i < n - 2; i++, x += dx) {
        d[i] = catmullRom2Bezier(
            x - dx, ys[i - 1],
            x, ys[i],
            x + dx, ys[i + 1],
            x + dx + dx, ys[i + 2]
        );
    }

    return d.join(' ');
}

