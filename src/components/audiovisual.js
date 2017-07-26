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
    const x = (Math.pow(b, f) - 1) / (b - 1);
    if (x < 0) {
        return 0;
    } else if (x > 1) {
        return 1;
    }

    return x;
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
            numFreq: 128,
            numWave: 1024,
            waveWidth: 3,
            freqColor: 'white',
            waveColor: 'rgb(0%, 50%, 100%)',
            bgColor: 'transparent',
            textColor: 'rgba(100%, 100%, 100%, 0.8)',
            altColor: 'rgba(100%, 100%, 100%, 0.1)'
        };
    }

    // eslint-disable-next-line max-statements
    constructor(props) {
        super();

        const {
            numFreq,
            numWave
        } = props;

        // refs
        this.audio = null;
        this.spectral = null;
        this.node = null;
        this.canvas = null;
        this.progress = null;

        // timers
        this.animFrame = null;

        // data arrays
        this.waveform = null;
        this.spectrum = null;

        this.waveXs = new Float32Array(numWave);
        this.waveYs = new Float32Array(numWave);

        this.freqXs = new Float32Array(numFreq);
        this.freqYs = new Float32Array(numFreq);

        this.state = {
            offsetWidth: 1,
            offsetHeight: 1
        };

        [
            'audioRef', 'nodeRef', 'canvasRef', 'progressRef',
            'onAnimFrame', 'onTimeUpdate', 'onResize'
        ].forEach(key => {
            this[key] = this[key].bind(this);
        });
    }

    onTimeUpdate(evt) {
        const progress = evt.target.currentTime / evt.target.duration;
        if (this.progress) {
            this.progress.style.width = `${progress * 100}%`;
        }
    }

    onResize() {
        const { offsetWidth, offsetHeight } = this.node;
        if (offsetWidth !== this.state.offsetWidth) {
            const { numFreq, numWave } = this.props;
            const { freqXs, waveXs } = this;

            const dfX = offsetWidth / numFreq;
            for (let i = 0, x = dfX; i < numFreq; i++, x += dfX) {
                freqXs[i] = x;
            }

            const dwX = offsetWidth / numWave;
            for (let i = 0, x = 0; i < numWave; i++, x += dwX) {
                waveXs[i] = x;
            }

            this.setState({ offsetWidth });
        }

        if (offsetHeight !== this.state.offsetHeight) {
            this.setState({ offsetHeight });
        }
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

    canvasRef(canvas) {
        if (canvas) {
            this.canvas = canvas.getContext('2d');
        } else {
            this.canvas = null;
        }
    }

    progressRef(progress) {
        this.progress = progress;
    }

    onAnimFrame() {
        const { canvas } = this;
        if (!canvas) {
            return;
        }

        const { offsetWidth: w, offsetHeight: h } = this.state;
        canvas.clearRect(0, 0, w, h);
        this.updateWave(canvas);
        this.updateFreq(canvas);
        this.animFrame = requestAnimationFrame(this.onAnimFrame);
    }

    updateWave(canvas) {
        const { spectral, waveform, waveXs, waveYs } = this;
        spectral.fillWaveform(waveform);

        const { waveformSize } = spectral;
        const { numWave, waveColor, waveWidth } = this.props;
        const { offsetHeight: h } = this.state;

        const waveStep = waveformSize / numWave;
        for (let i = 0; i < numWave; i++) {
            waveYs[i] = (
                average(waveform, i * waveStep, (i + 1) * waveStep) / 3 + 0.5
            ) * h;
        }

        canvas.beginPath();
        canvas.strokeStyle = waveColor;
        canvas.lineWidth = waveWidth;
        canvas.moveTo(0, h / 2);
        drawBezier(canvas, numWave, waveXs, waveYs);
        canvas.stroke();
    }

    // eslint-disable-next-line max-statements
    updateFreq(canvas) {
        const { spectral, spectrum, freqXs, freqYs } = this;

        spectral.fillSpectrum(spectrum);
        Array.prototype.forEach.call(
            spectrum, (f, i) => (spectrum[i] = normalizeFreq(f))
        );

        const { spectrumSize } = spectral;
        const { numFreq, freqColor } = this.props;
        const { offsetWidth: w, offsetHeight: h } = this.state;

        const db = -100 / numFreq;
        const barHeight = h / 3;
        for (let i = 0, b = 100; i < numFreq; i++, b += db) {
            freqYs[i] = h - calcFreq(average(
                spectrum,
                freqStep(i, numFreq, spectrumSize),
                freqStep(i + 1, numFreq, spectrumSize)
            ), b) * barHeight;
        }

        canvas.beginPath();
        canvas.fillStyle = freqColor;
        canvas.moveTo(0, h);
        drawBars(canvas, numFreq, 0, freqXs, freqYs);
        canvas.lineTo(w, h);
        canvas.closePath();
        canvas.fill();
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
            bgColor, altColor, textColor,
            src, stream, playing, onEnded
        } = this.props;

        const classes = classNames(styles.audiovisual, className);
        const style = { backgroundColor: bgColor };

        if (!src && !stream) {
            return <div className={classes} style={style} />;
        }

        const { offsetWidth, offsetHeight } = this.state;

        const { nodeRef, audioRef, progressRef, canvasRef } = this;

        const waveZeroStyle = {
            backgroundColor: altColor,
            height: waveWidth,
            bottom: (offsetHeight - waveWidth) / 2
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
            <div className={styles.waveZero} style={waveZeroStyle}></div>
            <div
                className={styles.progressContainer}
                style={{ backgroundColor: altColor }}
            >
                <div
                    ref={progressRef}
                    className={styles.progress}
                    style={{ backgroundColor: textColor }}
                />
            </div>
            <canvas
                ref={canvasRef}
                className={styles.visualiser}
                width={offsetWidth}
                height={offsetHeight}
            />
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
function drawBezierFromCatmullRom(canvas, ax, ay, bx, by, cx, cy, dx, dy) {
    // Catmull-Rom to Cubic Bezier conversion matrix
    //    0       1       0       0
    //  -1/6      1      1/6      0
    //    0      1/6      1     -1/6
    //    0       0       1       0

    const px = (-ax + 6 * bx + cx) / 6;
    const py = (-ay + 6 * by + cy) / 6;
    const qx = (bx + 6 * cx - dx) / 6;
    const qy = (by + 6 * cy - dy) / 6;

    canvas.bezierCurveTo(px, py, qx, qy, cx, cy);
}

// eslint-disable-next-line max-statements
function drawBezier(canvas, n, xs, ys) {
    if (n < 3) {
        return;
    }

    let xp = xs[0];
    let yp = ys[0];
    let x = xs[0];
    let y = ys[0];
    let xn = xs[1];
    let yn = ys[1];
    let xnn = xs[2];
    let ynn = ys[2];
    drawBezierFromCatmullRom(
        canvas,
        xp, yp,
        xp, yp,
        xn, yn,
        xnn, ynn
    );

    for (let i = 1; i < n - 2; i++) {
        drawBezierFromCatmullRom(
            canvas,
            xp, yp,
            x, y,
            xn, yn,
            xnn, ynn
        );

        xp = x;
        yp = y;
        x = xn;
        y = yn;
        xn = xnn;
        yn = ynn;
        xnn = xs[i + 2];
        ynn = ys[i + 2];
    }

    drawBezierFromCatmullRom(
        canvas,
        xs[n - 3], ys[n - 3],
        xs[n - 2], ys[n - 2],
        xs[n - 1], ys[n - 1],
        xs[n - 1], ys[n - 1]
    );
}

// eslint-disable-next-line max-params
function drawBars(canvas, n, startX, xs, ys) {
    for (let i = 0, x = startX; i < n; i++) {
        const xn = xs[i];
        const y = ys[i];
        canvas.lineTo(x, y);
        canvas.lineTo(xn, y);
        x = xn;
    }
}

