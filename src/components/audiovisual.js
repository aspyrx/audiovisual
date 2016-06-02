/*
 * audiovisual.js - React component that uses dancer.js to visualise audio
 */

import React, {Component, PropTypes} from 'react';
import classNames from 'classnames';

import styles from './audiovisual.less';

export default class Audiovisual extends Component {
    static get propTypes() {
        return {
            className: PropTypes.string
        };
    }

    constructor() {
        super();
    }

    render() {
        const {className} = this.props;
        const classes = classNames(styles.audiovisual, className, {

        });
        return (
            <svg className={classes} viewBox="0 0 100 100" preserveAspectRatio="none">
            </svg>
        );
    }
}
