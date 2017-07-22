import React from 'react';

export default function asyncComponent(
    getComponent, Placeholder = () => null
) {
    let cached = null;

    return class AsyncComponent extends React.Component {
        constructor() {
            super();

            this.state = { Component: cached };
        }

        componentWillMount() {
            if (this.state.Component) {
                return;
            }

            getComponent(({ default: Component }) => {
                cached = Component;
                this.setState({ Component });
            });
        }

        render() {
            const { Component } = this.state;

            return Component
                ? <Component {...this.props} />
                : <Placeholder {...this.props} />;
        }
    };
}

