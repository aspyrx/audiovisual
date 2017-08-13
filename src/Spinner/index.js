/**
 * Loading spinner React component.
 *
 * @module src/Spinner
 */

import React from 'react';

import styles from './index.less';

/**
 * The spinner component.
 *
 * @returns {ReactElement} The rendered spinner.
 */
export default function Spinner() {
    return <div className={styles.spinner} />;
}

