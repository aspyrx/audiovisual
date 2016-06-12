# audiovisual
An audio visualizer built using React.

## Usage
1. Clone the repo.
2. Install the dependencies: `npm install`
    - Or with [ied](https://github.com/alexanderGugel/ied): `ied install && ied run dist`
3. Start the server: `node . [options]`
    - You can specify a folder containing songs to serve using the `--f` option.
    - The first time you serve a folder (and any time you want to rescan for changes), you'll need to use the `--s` option.
        - This will create a file named `.files.json` in the root of the folder containing a list of all matched files.
        - The server parses media tags from .mp3 files using [jsmediatags](https://github.com/aadsm/jsmediatags)
            - This might take a while, so please be patient!
        - If you want to scan recursively into subdirectories, use the `--r` option.
    - Check below for more options, including customizing file matching expressions.
4. Navigate to the site ([localhost:10102](http://localhost:10102) by default) and enjoy your audiovisual experience!

### Options
- `--f`: Directory from which files should be served. (required)
- `--m`: [Regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
    to use to match files. (default: `[.](mp3|wav|ogg)$`)
- `--mflags`: Flags to use in regular expression matching. (default: `i`)
- `--[no]s`: Scan the files directory for new files. (default: `false`)
- `--[no]r`: Whether to scan recursively for files. (default: `false`)
- `--[no]v`: Output verbose information. (default: `false`)
- `--p`: Port on which to serve the site. (default: 10102)

