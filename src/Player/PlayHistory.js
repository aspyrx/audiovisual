/**
 * Play history data structure module.
 *
 * @module src/Player/PlayHistory
 */

/**
 * A playable item is either an audio file or stream.
 *
 * @typedef {module:src/Player/AudioFile|module:src/Player/AudioStream} Item
 */

/**
 * Tracks history of items played.
 */
export default class PlayHistory {
    /**
     * Initializes a new history instance with an empty item list and history.
     */
    constructor() {
        /**
         * The item list.
         *
         * @private
         * @type {module:src/Player/PlayHistory~Item[]}
         */
        this._items = [];

        /**
         * The history.
         *
         * @private
         * @type {module:src/Player/PlayHistory~Item[]}
         */
        this._hist = [];

        /**
         * The current index in the history, or `null` if there is no
         * currently-selected item.
         *
         * @private
         * @type {number?}
         */
        this._histIndex = null;
    }

    /**
     * Gets the length of the current item list.
     *
     * @returns {number} The length of the current item list.
     */
    get itemsLength() {
        return this._items.length;
    }

    /**
     * Gets the current item list.
     *
     * @returns {module:src/Player/PlayHistory~Item[]} The item list.
     */
    get items() {
        return this._items;
    }

    /**
     * Gets the currently-selected item.
     *
     * @returns {module:src/Player/PlayHistory~Item?} The current-selected item,
     * or `null` if there is none.
     */
    get item() {
        const { _histIndex, _hist } = this;
        return _histIndex === null ? null : _hist[_histIndex];
    }

    /**
     * Sets the currently-selected item, adding it to the front of the history.
     *
     * @param {module:src/Player/PlayHistory~Item} item - The new
     * currently-selected item.
     */
    set item(item) {
        this._hist.unshift(item);
        this._histIndex = 0;
    }

    /**
     * Attempts to select the next item in history. If there are no more next
     * items, the next item in the list is picked, or a random one is picked if
     * `shuffle` is true.
     *
     * @param {boolean} shuffle - `true` to select new items randomly.
     * @returns {module:src/Player/PlayHistory~Item} The next item.
     */
    nextItem(shuffle) {
        const { _histIndex } = this;
        if (_histIndex > 0) {
            this._histIndex--;
            return this.item;
        }

        const { item, _items } = this;
        const index = item === null
            ? 0
            : _items.indexOf(item);
        const { length } = _items;
        const incr = shuffle
            ? Math.floor(Math.random() * (length - 1)) + 1
            : 1;
        const newItem = _items[(index + incr) % length];
        this._hist.unshift(newItem);
        this._histIndex = 0;
        return newItem;
    }

    /**
     * Attempts to select the previous item in the history. If there are no more
     * previous items in the history, nothing happens.
     *
     * @returns {module:src/Player/PlayHistory~Item} The previous item.
     */
    prevItem() {
        if (this._histIndex + 1 >= this._hist.length) {
            return this.item;
        }

        this._histIndex++;
        return this.item;
    }

    /**
     * Append items to the item list.
     *
     * @param {module:src/Player/PlayHistory~Item[]} items - The new items. Can
     * also be a single item.
     */
    addItems(items) {
        this._items = this._items.concat(items);
    }

    /**
     * Removes the given item from the list and the history.
     *
     * @param {module:src/Player/PlayHistory~Item} item - The item to remove.
     */
    removeItem(item) {
        const currItem = this.item;
        const notItem = x => x !== item;
        this._hist = this._hist.filter(notItem);
        this._items = this._items.filter(notItem);

        // fixup _histIndex
        if (currItem !== null && currItem !== item) {
            const { _hist, _histIndex } = this;
            if (_hist[_histIndex] !== currItem) {
                this._histIndex = _hist.indexOf(currItem);
            }
        }
    }
}

