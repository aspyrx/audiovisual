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
        return this._title || `Audio stream ${this.stream.id}`;
    }
}

