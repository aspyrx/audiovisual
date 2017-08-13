/**
 * Audio stream data structure module.
 *
 * @module src/Player/AudioStream
 */

/**
 * Represents an audio stream.
 */
export default class AudioStream {
    /**
     * Initializes a new audio stream.
     *
     * @param {Object} data - File data.
     * @param {MediaStream} data.stream - `MediaStream` instance.
     * @param {string} [data.title] - Title.
     */
    constructor(data) {
        if (!data) {
            throw new Error('Cannot construct AudioStream without data');
        }

        if (!(data.stream instanceof MediaStream)) {
            throw new Error(
                `data.stream must be a MediaStream, got: ${data.stream}`
            );
        }

        /**
         * The stream's `MediaStream` instance.
         *
         * @private
         * @type {MediaStream}
         */
        this._stream = data.stream;

        /**
         * The stream's title.
         *
         * @private
         * @type {String}
         */
        this._title = data.title;
    }

    /**
     * Cleans up resources associated with the stream.
     */
    cleanup() {
        const { stream } = this;
        stream.getTracks().forEach(track => {
            track.stop();
            stream.removeTrack(track);
        });
    }

    /**
     * Gets the stream's `MediaStream` instance.
     *
     * @returns {MediaStream} The `MediaStream` instance.
     */
    get stream() {
        return this._stream;
    }

    /**
     * Gets the stream's title.
     *
     * @returns {string} Title.
     */
    get title() {
        const { _title } = this;
        if (_title) {
            return _title;
        }

        const { stream } = this;
        const tracks = stream.getAudioTracks();
        if (tracks.length) {
            const { label } = tracks[0];
            if (label) {
                return label;
            }
        }

        return `Audio stream ${stream.id}`;
    }
}

