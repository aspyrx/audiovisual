/*
 * index.js - Entry point for the app.
 */

import 'normalize-css/normalize.css';
import React from 'react';
import { render } from 'react-dom';
import App from '~/app';

const appDiv = document.createElement('div');

// check for CSS3 flexbox support
if (!('flex' in appDiv.style)) {
    setTimeout(() => window.alert( // eslint-disable-line no-alert
        'Your browser does not appear to support CSS Flexbox. Certain parts of'
        + ' the website may not display correctly. Apologies for any'
        + ' inconvenience!'
    ), 0);
}

appDiv.id = 'app';
document.body.appendChild(appDiv);
render(<App />, appDiv);

if (module.hot) {
    module.hot.accept('~/app', () =>
        render(<App />, appDiv)
    );

    module.hot.dispose(() =>
        document.body.removeChild(appDiv)
    );
}

