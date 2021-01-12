/**
 * Uses the Web Audio API to provide frequency and waveform data from the
 * specified `HTMLMediaElement`.
 *
 * @module src/Audiovisual/Spectral
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * Wraps an `HTMLMediaElement` to provide frequency and waveform data.
 */
export default class Spectral {
    /**
     * Initializes the instance with the given `HTMLMediaElement`.
     *
     * @param {HTMLMediaElement} audio - The element to wrap.
     * @param {Object} options - Options for the analyser.
     * @param {number} options.bufsize - Analyser buffer size.
     * @param {number} options.smoothing - Analysier smoothing constant.
     * @param {number} options.delay - Delay (seconds) before output.
     */
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

    /**
     * Closes the audio context.
     */
    close() {
        const { _audio, context, _onCanPlay } = this;
        _audio.removeEventListener('canplay', _onCanPlay);
        if (context.close) {
            context.close();
        }
    }

    /**
     * Sets up the delay node.
     *
     * @param {number} delay - The delay (seconds).
     */
    setupDelay(delay) {
        this.delay.delayTime.value = delay;
    }

    /**
     * Sets up the analyser node.
     *
     * @param {number} bufsize - The buffer size.
     * @param {number} smoothing - The smoothing constant.
     */
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

    /**
     * Sets up the connections between the various audio nodes.
     */
    setupConnections() {
        const {
            context, analyser, gain, delay, source
        } = this;
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(delay);
        delay.connect(context.destination);
    }

    /**
     * `canplay` event handler.
     *
     * @private
     */
    _onCanPlay() {
        if (this._audioPlaying && this._audio.paused) {
            this._audio.play();
        }
    }

    /**
     * Whether or not the audio is streaming.
     *
     * @returns {boolean} `true` if the audio is streaming; `false` otherwise.
     */
    get streaming() {
        return this._streamId !== null;
    }

    /**
     * Whether or not the audio is paused.
     *
     * @returns {boolean} `true` if the audio is paused; `false` otherwise.
     */
    get paused() {
        return !this.streaming && !this._audioPlaying;
    }

    /**
     * Adds the given stream.
     *
     * @param {MediaStream} stream - The stream to add.
     */
    addStream(stream) {
        const { id } = stream;
        const { context, _streamSources } = this;

        if (id in _streamSources) {
            return;
        }

        _streamSources[id] = context.createMediaStreamSource(stream);
    }

    /**
     * Removes the given stream.
     *
     * @param {MediaStream} stream - The stream to remove.
     */
    removeStream(stream) {
        delete this._streamSources[stream.id];
    }

    /**
     * Starts analysing the given stream.
     *
     * @private
     * @param {MediaStream} stream - The stream to analyse.
     */
    _startStream(stream) {
        const { source, analyser, _streamSources } = this;
        source.disconnect();
        analyser.disconnect();

        this.addStream(stream);
        _streamSources[stream.id].connect(analyser);
        this._streamId = stream.id;
    }

    /**
     * Stops analysing the current stream, if any.
     *
     * @param {MediaStream} stream - The stream to analyse.
     */
    _stopStream() {
        const { _streamId } = this;
        if (!_streamId) {
            return;
        }

        const { source, analyser, gain, _streamSources } = this;
        _streamSources[_streamId].disconnect();
        delete _streamSources[_streamId];
        this._streamId = null;
        source.connect(analyser);
        analyser.connect(gain);
    }

    /**
     * Starts playing, using the given stream if provided.
     *
     * @param {MediaStream} [stream] - The stream to use, if any. Otherwise, the
     * wrapped `HTMLMediaElement` content is used instead.
     */
    async play(stream) {
        const { _audio } = this;

        await this.context.resume();

        if (stream && !this.streaming) {
            _audio.pause();
            this._startStream(stream);
        } else if (!stream && _audio.paused) {
            this._stopStream();
            _audio.play();
            this._audioPlaying = true;
        }
    }

    /**
     * Pauses playback.
     */
    async pause() {
        if (this.paused) {
            return;
        }

        this._stopStream();
        this._audio.pause();
        this._audioPlaying = false;

        await this.context.suspend();
    }

    /**
     * The current gain.
     *
     * @returns {number} The current gain value.
     */
    get gain() {
        return this.gain.gain.value;
    }

    /**
     * Sets the gain.
     *
     * @param {number} val - The new gain value.
     */
    set gain(val) {
        this.gain.gain.value = val;
    }

    /**
     * The size of the waveform result.
     *
     * @returns {number} The number of elements in the waveform.
     */
    get waveformSize() {
        return this.analyser.fftSize;
    }

    /**
     * The size of the spectrum result.
     *
     * @returns {number} The number of elements in the spectrum.
     */
    get spectrumSize() {
        return this.analyser.frequencyBinCount;
    }

    /**
     * Fills the given array with waveform (time-domain) data.
     *
     * @param {Array} out - The array to fill.
     * @returns {Array} The input array.
     */
    fillWaveform(out) {
        return this.analyser.getFloatTimeDomainData(out);
    }

    /**
     * Fills the given array with spectrum (frequency-domain) data.
     *
     * @param {Array} out - The array to fill.
     * @returns {Array} The input array.
     */
    fillSpectrum(out) {
        return this.analyser.getFloatFrequencyData(out);
    }
}

