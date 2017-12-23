/**
 * Audio file data structure module.
 *
 * @module src/Player/AudioFile
 */

import jsmediatags from 'jsmediatags';

const formatToMediaType = {
    jpg: 'image/jpeg',
    png: 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/png': 'image/png'
};

/**
 * Gets the last path component for the given string.
 *
 * @param {string} str - The string.
 * @param {string} [sep='/'] - Separator character(s).
 * @returns {string} The last path component.
 */
function basename(str, sep = '/') {
    return str.match(new RegExp(`[^${sep}]*$`))[0];
}

/**
 * Represents an audio file.
 */
export default class AudioFile {
    /**
     * Initializes a new audio file.
     *
     * @param {Object} [data={}] - File data.
     * @param {File} [data.file] - `File` instance.
     * @param {string} [data.url] - URL.
     * @param {string} [data.artist] - Artist.
     * @param {string} [data.album] - Album.
     * @param {string} [data.title] - Title
     */
    constructor(data = {}) {
        /**
         * The file's URL.
         *
         * @private
         * @type {string?}
         */
        this._url = data.url || null;

        /**
         * The file's `File` instance, or `null` if there is none.
         *
         * @private
         * @type {File?}
         * @default null
         */
        this._file = null;

        /**
         * The URL for the `File` instance, or `null` if there is none.
         *
         * @private
         * @type {string?}
         * @default null
         */
        this._fileURL = null;

        /**
         * The file's media tag state.
         *
         * @private
         * @type {boolean}
         * @default false
         */
        this._parsedTags = false;

        /**
         * The file's artist.
         *
         * @private
         * @type {string}
         */
        this._artist = data.artist;

        /**
         * The file's album.
         *
         * @private
         * @type {string}
         */
        this._album = data.album;

        /**
         * The file's title.
         *
         * @private
         * @type {string}
         */
        this._title = data.title;

        this.file = data.file || null;
    }

    /**
     * Cleans up resources associated with the file.
     */
    cleanup() {
        if (this._fileURL) {
            URL.revokeObjectURL(this._fileURL);
        }

        if (this._pictureURL) {
            URL.revokeObjectURL(this._pictureURL);
        }
    }

    /**
     * Gets the file's URL.
     *
     * @returns {string?} The file's URL, or `null` if there is none.
     */
    get url() {
        return this._url || this._fileURL;
    }

    /**
     * Gets the file URL for playback. Will be `null` until a `File` instance is
     * added.
     *
     * @returns {string?} The file URL for playback.
     */
    get fileURL() {
        return this._fileURL;
    }

    /**
     * Sets the file's `File` instance.
     *
     * @param {File?} file - The new instance, or `null` to remove the instance.
     */
    set file(file) {
        if (file === this._file) {
            return;
        }

        if (this._fileURL) {
            URL.revokeObjectURL(this._fileURL);
            this._url = null;
        }

        if (file === null) {
            this._file = null;
            return;
        }

        if (!(file instanceof File)) {
            throw new Error(
                `AudioFile#file must be a File or null, got: ${file}`
            );
        }

        this._file = file;
        this._fileURL = URL.createObjectURL(file);
    }

    /**
     * Gets the file's `File` instance.
     *
     * @returns {File?} The instance, or `null` if there is none.
     */
    get file() {
        return this._file;
    }

    /**
     * Gets the file's media tag state.
     *
     * @returns {boolean} `true` if the file has parsed tags; `false` otherwise.
     */
    get parsedTags() {
        return this._parsedTags;
    }

    /**
     * Gets the file's artist.
     *
     * @returns {string} Artist.
     */
    get artist() {
        return this._artist || 'no artist';
    }

    /**
     * Gets the file's album.
     *
     * @returns {string} Album.
     */
    get album() {
        return this._album || 'no album';
    }

    /**
     * Gets the file's title.
     *
     * @returns {string} Title.
     */
    get title() {
        if (this._title) {
            return this._title;
        }

        const { file } = this;
        if (file && file.name) {
            return basename(file.name, ':');
        }

        return basename(this.url);
    }

    /**
     * Gets the file's picture URL.
     *
     * @returns {string} Picture URL.
     */
    get pictureURL() {
        return this._pictureURL;
    }

    /**
     * Attempts to add a picture from a parsed tag.
     *
     * @param {Object} [picture] - The picture tag.
     * @param {number[]} picture.data - The picture's data.
     * @param {string} picture.format - The picture's format.
     */
    addPictureFromTag(picture) {
        if (!picture) {
            return;
        }

        const { data, format } = picture;
        const bytes = Uint8Array.from(data);
        const type = formatToMediaType[format.toLowerCase()];

        const blob = new Blob([bytes], { type });
        this._pictureURL = URL.createObjectURL(blob);
    }

    /**
     * Attempts to parse media tags.
     *
     * @returns {Promise} Resolves with the `AudioFile` on success; rejects with
     * an error, if any.
     */
    async addTags() {
        const { file } = this;

        if (this.parsedTags
            || !file
            || !/\.(mp3|mp4|m4a)$/.test(file.name)
        ) {
            return this;
        }

        let tags;
        try {
            tags = await new Promise((resolve, reject) => {
                jsmediatags.read(file, {
                    onSuccess: result => resolve(result.tags),
                    onError: reject
                });
            });
        } catch (err) {
            console.error('failed to parse tags', err);
            throw err;
        }

        ['artist', 'album', 'title'].forEach(key => {
            if (key in tags) {
                this[`_${key}`] = tags[key];
            }
        });

        this.addPictureFromTag(tags.picture);
        this._parsedTags = true;
        return this;
    }
}

