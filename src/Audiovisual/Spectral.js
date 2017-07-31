/**
 * Uses the Web Audio API to provide frequency and waveform data from the
 * specified HTML5 `<audio>` element.
 *
 * @module src/Audiovisual/Spectral
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;

export default class Spectral {
    constructor(audio, options = {}) {
        if (!(audio instanceof HTMLMediaElement)) {
            throw new Error('Spectral audio must be an HTMLMediaElement');
        }

        audio.pause();

        const {
            bufsize = 2048,
            smoothing = 0.8,
            delay = 0.25
        } = options;

        const context = new AudioContext();
        Object.defineProperties(this, {
            _audio: {
                value: audio
            },
            context: {
                value: context
            },
            analyser: {
                value: context.createAnalyser()
            },
            gain: {
                value: context.createGain()
            },
            source: {
                value: context.createMediaElementSource(audio)
            },
            delay: {
                value: context.createDelay(1.0)
            },
            _onCanPlay: {
                value: this._onCanPlay.bind(this)
            },
            _audioPlaying: {
                value: false,
                writable: true
            },
            _streamId: {
                value: null,
                writable: true
            },
            _streamSources: {
                value: Object.create(null)
            }
        });

        this.setupDelay(delay);
        this.setupAnalyser(bufsize, smoothing);
        this.setupConnections();

        audio.addEventListener('canplay', this._onCanPlay);
    }

    close() {
        const { _audio, context, _onCanPlay } = this;
        _audio.removeEventListener('canplay', _onCanPlay);
        if (context.close) {
            context.close();
        }
    }

    setupDelay(delay) {
        this.delay.delayTime.value = delay;
    }

    setupAnalyser(bufsize, smoothing) {
        const { analyser } = this;
        analyser.fftSize = bufsize;
        analyser.smoothingTimeConstant = smoothing;

        if (!analyser.getFloatTimeDomainData) {
            analyser.getFloatTimeDomainData = function(arr) {
                const data = new window.Uint8Array(this.fftSize);
                this.getByteTimeDomainData(data);

                for (let i = 0; i < data.length; i++) {
                    arr[i] = (data[i] - 128) / 128.0;
                }

                return arr;
            };
        }
    }

    setupConnections() {
        const {
            context, analyser, gain, delay, source
        } = this;
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(delay);
        delay.connect(context.destination);
    }

    _onCanPlay() {
        if (this._audioPlaying && this._audio.paused) {
            this._audio.play();
        }
    }

    get streaming() {
        return this._streamId !== null;
    }

    get paused() {
        return !this.streaming && !this._audioPlaying;
    }

    addStream(stream) {
        const { id } = stream;
        const { context, _streamSources } = this;

        if (id in _streamSources) {
            return;
        }

        _streamSources[id] = context.createMediaStreamSource(stream);
    }

    removeStream(stream) {
        delete this._streamSources[stream.id];
    }

    _startStream(stream) {
        const { source, analyser, _streamSources } = this;
        source.disconnect();
        analyser.disconnect();

        this.addStream(stream);
        _streamSources[stream.id].connect(analyser);
        this._streamId = stream.id;
    }

    _stopStream() {
        const { source, analyser, gain, _streamSources } = this;

        if (!this._streamId) {
            return;
        }

        _streamSources[this._streamId].disconnect();
        this._streamId = null;
        source.connect(analyser);
        analyser.connect(gain);
    }

    play(stream) {
        const { _audio } = this;

        if (stream && !this.streaming) {
            _audio.pause();
            this._startStream(stream);
        } else if (!stream && _audio.paused) {
            this._stopStream();
            _audio.play();
            this._audioPlaying = true;
        }
    }

    pause() {
        if (this.paused) {
            return;
        }

        this._stopStream();
        this._audio.pause();
        this._audioPlaying = false;
    }

    get gain() {
        return this.gain.gain.value;
    }

    set gain(val) {
        this.gain.gain.value = val;
    }

    get waveformSize() {
        return this.analyser.fftSize;
    }

    get spectrumSize() {
        return this.analyser.frequencyBinCount;
    }

    fillWaveform(out) {
        return this.analyser.getFloatTimeDomainData(out);
    }

    fillSpectrum(out) {
        return this.analyser.getFloatFrequencyData(out);
    }
}

