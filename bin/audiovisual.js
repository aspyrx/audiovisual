#!/usr/bin/env node

/**
 * CLI for the `audiovisual` app.
 *
 * @module bin/audiovisual
 */

/* eslint-disable no-console, no-process-exit */

'use strict';

const process = require('process');
const minimist = require('minimist');

const server = require('../lib');

const argvConfig =  {
    string: ['m', 'mflags', 'p'],
    boolean: ['s', 'r', 'q', 'h'],
    default: {
        m: '[.](mp3|wav|ogg)$',
        mflags: 'i',
        p: '10102',
        s: false,
        r: false,
        q: false,
        h: false
    },
    unknown(flag) {
        if (!flag.startsWith('-')) {
            return true;
        }

        console.log(`Unknown flag: '${flag}'`);
        usage();
        process.exit(1);
    }
};

/**
 * Prints CLI usage to `stdout`.
 */
function usage() {
    const desc = {
        h: 'Print this help message and exit.',
        m: 'Regular expression to use to match scanned files.',
        mflags: 'Flags to use in regular expression matching.',
        p: 'Port on which to serve the site.',
        s: 'Scan the files directory for new files.',
        r: 'Whether to scan recursively for files.',
        q: 'Quiet mode; don\'t output anything to stdout.'
    };

    console.log(
        '\nUsage: audiovisual [flags] [directory]\n\n'
        + '\t[directory]: Directory from which to serve audio files.\n'
        + '\t\tIf omitted, no audio files will be served.\n'
        + '\nFlags:'
    );
    Object.keys(desc).forEach(key => {
        const flag = key.length === 1
            ? `-${key}`
            : `--${key}`;
        const value = key in argvConfig.default
            ? `=${argvConfig.default[key]}`
            : '';

        console.log(`\t${flag}${value}\t${desc[key]}\n`);
    });
}

const argv = minimist(process.argv.slice(2), argvConfig);

if (argv.h) {
    usage();
    process.exit(0);
}

const quiet = argv.q;

server({
    filesMatch: new RegExp(argv.m, argv.mflags),
    filesDir: argv._[0],
    scan: argv.s,
    recursive: argv.r,
    quiet
}).then(app => {
    const port = argv.p;
    app.listen(port, () => {
        !quiet && console.log(`audiovisual server listening on *:${port}`);
    });
}, err => {
    console.error(err);
    process.exit(1);
});

