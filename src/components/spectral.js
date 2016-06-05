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
    const script = context.createScriptProcessor(bufsize, 1, 1);
    const gain = context.createGain();
    const source = context.createMediaElementSource(audio);

    analyser.fftSize = bufsize;
    analyser.smoothingTimeConstant = 0.7;

    const scriptListeners = [];
    script.onaudioprocess = (event) => {
        for (let callback of scriptListeners) {
            callback(event);
        }
    }

    source.connect(analyser);
    source.connect(gain);
    analyser.connect(script);
    script.connect(context.destination);
    gain.connect(context.destination);

    Object.defineProperties(audio, {
        addScriptListener: {
            value: (callback) => scriptListeners.push(callback)
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

