/**
 * Implements a React component for wrapping functions that asynchronously load
 * React components.
 *
 * @module src/async-component
 */

import React from 'react';

/**
 * Callback for the asynchronously-fetched React component.
 *
 * @callback getComponentCB
 * @param {Object} module - The component's module.
 * @param {Function} module.default - The component itself (i.e., the module's
 * default export).
 */

/**
 * Function that asynchronously fetches a React component.
 *
 * @callback getComponent
 * @param {module:src/async-component~getComponentCB} cb - Callback to
 * call with the loaded component.
 */

/**
 * Creates a React component that uses the given function to retrieve the
 * actual component to render only when the returned component is first mounted.
 *
 * Designed for usage with
 * [bundle-loader](https://www.npmjs.com/package/bundle-loader), especially with
 * the `lazy` option enabled.
 *
 * @param {module:src/async-component~getComponent} getComponent -
 * Function to use to fetch the component.
 * @param {Function} [Placeholder=() => null] - React component used as a
 * placeholder while the component is still loading.
 * @returns {module:src/async-component~AsyncComponent} React component that
 * renders as the placeholder until the component loads, at which point it is
 * replaced by the actual component.
 */
export default function asyncComponent(
    getComponent, Placeholder = () => null
) {
    let cached = null;

    /**
     * The wrapper component.
     */
    class AsyncComponent extends React.Component {
        /**
         * Initializes the wrapper component.
         */
        constructor() {
            super();

            this.state = { Component: cached };
        }

        /**
         * React lifecycle handler called when the component is about to be
         * mounted.
         */
        componentWillMount() {
            if (this.state.Component) {
                return;
            }

            getComponent(({ default: Component }) => {
                cached = Component;
                this.setState({ Component });
            });
        }

        /**
         * Renders the component.
         *
         * @returns {ReactElement} The loaded component rendered with the given
         * props, or the placeholder if the component hasn't loaded yet.
         */
        render() {
            const { Component } = this.state;

            return Component
                ? <Component {...this.props} />
                : <Placeholder {...this.props} />;
        }
    }

    return AsyncComponent;
}

