# audiovisual
An audio visualizer built using React.

## Usage
1. Clone the repo.
2. Install the dependencies: `npm install`
    - Or with [ied](https://github.com/alexanderGugel/ied): `ied install && ied run dist`
3. Start the server: `node . [options]`
    - You'll need to specify the folder containing the files to serve, using the `--f` option.
    - The first time you run the server (and any time you want to rescan the folder), you'll need to use the `--s` option.
        - This will create a file named `.files.json` in the root of the folder containing a list of all matched files.
        - If you want to scan recursively into subdirectories, use the `--r` option.
    - Check below for more options!
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

