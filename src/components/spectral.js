/*
 * spectral.js - Uses the Web Audio API to provide frequency and waveform data
 * from the specified HTML5 <audio> element.
 */

const AudioContext = window.AudioContext;

export default function Spectral(audio, bufsize) {
    if (!(audio instanceof HTMLMediaElement)) {
        throw new Error("audio element not an instance of HTMLMediaElement");
    }

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const source = context.createMediaElementSource(audio);

    analyser.fftSize = bufsize;
    analyser.smoothingTimeConstant = 0.7;

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);

    Object.defineProperties(audio, {
        gain: {
            set: val => this.gain.gain.value = val,
            get: () => this.gain.gain.value
        },
        waveformSize: {
            get: () => analyser.frequencyBinCount
        },
        spectrumSize: {
            get: () => analyser.frequencyBinCount
        },
        getWaveform: {
            value: (out) => analyser.getFloatTimeDomainData(out)
        },
        getSpectrum: {
            value: (out) => analyser.getFloatFrequencyData(out)
        }
    });

    return audio;
}

