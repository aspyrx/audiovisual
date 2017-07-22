/*
 * spectral.js - Uses the Web Audio API to provide frequency and waveform data
 * from the specified HTML5 <audio> element.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;

export default function Spectral(audio, bufsize, smoothing, delayVal) {
    if (!(audio instanceof HTMLMediaElement)) {
        throw new Error('audio element not an instance of HTMLMediaElement');
    }

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const delay = context.createDelay(1.0);
    const source = context.createMediaElementSource(audio);
    let streamSource = null;
    const streamSources = {};

    analyser.fftSize = bufsize;
    analyser.smoothingTimeConstant = smoothing;

    if (!analyser.getFloatTimeDomainData) {
        analyser.getFloatTimeDomainData = function getFloatTimeDomainData(arr) {
            const data = new window.Uint8Array(this.fftSize);
            this.getByteTimeDomainData(data);

            for (let i = 0; i < data.length; i++) {
                arr[i] = (data[i] - 128) / 128.0;
            }

            return arr;
        };
    }

    delay.delayTime.value = delayVal;

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(delay);
    delay.connect(context.destination);

    Object.defineProperties(audio, {
        streaming: {
            get: () => streamSource !== null
        },
        startStreaming: {
            value: stream => {
                if (audio.streaming) {
                    audio.stopStreaming();
                }

                if (!audio.isPaused) {
                    audio.pause();
                }

                source.disconnect();
                analyser.disconnect();
                streamSource = streamSources[stream.id];
                if (!streamSource) {
                    streamSource = context.createMediaStreamSource(stream);
                    streamSources[stream.id] = streamSource;
                }
                streamSource.connect(analyser);
            }
        },
        stopStreaming: {
            value: () => {
                if (!audio.streaming) {
                    return;
                }

                streamSource.disconnect();
                streamSource = null;
                source.connect(analyser);
                analyser.connect(gain);
            }
        },
        gain: {
            set: val => gain.gain.value = val,
            get: () => gain.gain.value
        },
        waveformSize: {
            get: () => analyser.frequencyBinCount
        },
        spectrumSize: {
            get: () => analyser.frequencyBinCount
        },
        getWaveform: {
            value: out => analyser.getFloatTimeDomainData(out)
        },
        getSpectrum: {
            value: out => analyser.getFloatFrequencyData(out)
        }
    });

    return audio;
}

