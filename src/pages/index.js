/*
 * index.js - Index page for the app.
 */

import React, {Component} from 'react';

import Audiovisual from '../components/audiovisual.js';
import styles from './index.less';

export default class Index extends Component {
    constructor() {
        super();
    }

    render() {
        return (
            <div className={styles.container}>
                <Audiovisual className="audiovisual" />
            </div>
        );
    }
}

