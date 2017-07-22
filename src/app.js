import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import asyncComponent from 'components/asyncComponent';
import Spinner from 'components/spinner';
import NotFound from 'bundle-loader?lazy!./404';
import Player from 'bundle-loader?lazy!./player';

import './app.less';

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

