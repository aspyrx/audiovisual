/**
 * Entry point for the app.
 *
 * @module src/index
 */

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import App from 'src/App';

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

/**
 * Starts the app by rendering it into the page.
 */
function start() {
    render(<AppContainer>
        <App />
    </AppContainer>, appDiv);
}

start();

if (module.hot) {
    module.hot.accept('src/App', start);

    module.hot.dispose(() =>
        document.body.removeChild(appDiv)
    );
}

