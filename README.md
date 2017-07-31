# audiovisual

[![npm][npm-status]][npm]

An audio visualizer built using React.

[npm]: https://www.npmjs.com/package/audiovisual (npm)
[npm-status]: https://nodei.co/npm/audiovisual.png (npm status)

## CLI usage

1. Install globally: `npm install -g audiovisual`
2. Start the server: `audiovisual [flags] [directory]`
    - You can specify a directory containing songs to serve.
    - The first time you serve a folder (and any time you want to rescan for
      updated songs), you'll need to use the `-s` flag.
        - This will create a file named `.audiovisual.json` in the root of the
          folder containing a list of all matched files.
        - The server parses media tags from `.{mp3,mp4,m4a}` files using
          [jsmediatags](https://github.com/aadsm/jsmediatags)
            - This might take a while, so please be patient!
        - If you want to scan recursively into subdirectories, use the `-r`
          option.
    - Check below for more options, including customizing file matching
      expressions.
3. Navigate to the site ([localhost:10102](http://localhost:10102) by default)
   and enjoy your audiovisual experience!

### CLI options

```

Usage: audiovisual [flags] [directory]

        [directory]: Directory from which to serve audio files.
                If omitted, no audio files will be served.

Flags:
        -h=false        Print this help message and exit.

        -m=[.](mp3|wav|ogg)$    Regular expression to use to match scanned files.

        --mflags=i      Flags to use in regular expression matching.

        -p=10102        Port on which to serve the site.

        -s=false        Scan the files directory for new files.

        -r=false        Whether to scan recursively for files.

        -q=false        Quiet mode; don't output anything to stdout.

```

## Node.js API

1. Install as dependency: `npm install audiovisual`
2. In your code:

```javascript
const audiovisual = require('audiovisual');

/**
 * Configuration options.
 *
 * @typedef {Object} Options
 *
 * @property {string} [filesDir] - Directory from which to serve audio files.
 * If omitted, no audio files will be served.
 * @property {boolean} [scan] - `true` to scan `filesDir` for updated files.
 * @property {boolean} [recursive] - `true` to scan recursively.
 * @property {RegExp} [filesMatch=/[.](mp3|wav|ogg)$/i] - Regular expression to
 * use to match files during scanning.
 * @property {boolean} [quiet] - `true` for quiet mode; don't output anything to
 * `stdout`.
 */
const options = {};

const app = audiovisual(options);
```

## Development

Several build-related scripts are included that can be run using
`npm run <script>`:
- `doc`: generates HTML documentation and places it into `doc`
- `lint`: runs [eslint] on all source files
- `build`: builds the project and places the bundle into `dist`
- `dist`: same as above, excepts does production-level optimizations
- `watch`: watches for changes, automatically rebuilding when necessary
- `live`: starts a [webpack-dev-server] and enables [hot module replacement].
  Access the server at [http://localhost:8080](http://localhost:8080).

[eslint]: https://eslint.org/
[webpack-dev-server]: https://webpack.js.org/guides/development/#using-webpack-dev-server
[hot module replacement]: https://webpack.js.org/guides/hot-module-replacement/

