/**
 * Main app module.
 *
 * @module src/App
 */

import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import asyncComponent from 'src/async-component';
import Spinner from 'src/Spinner';
import Player from 'bundle-loader?lazy!src/Player';

import NotFound from 'bundle-loader?lazy!./NotFound';
import './index.less';

/**
 * React component for the entire app.
 *
 * @returns {ReactElement} The app's elements.
 */
export default function App() {
    return <BrowserRouter>
        <Switch>
            <Route
                path='/' exact
                component={asyncComponent(Player, Spinner)}
            />
            <Route component={asyncComponent(NotFound, Spinner)} />
        </Switch>
    </BrowserRouter>;
}

