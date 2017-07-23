import React from 'react';
import { shape, string } from 'prop-types';

export default function NotFound({ location: { pathname } }) {
    return <div>
        <h1>404 - Not Found</h1>
        <p>The location <code>{pathname}</code> does not exist.</p>
    </div>;
}

NotFound.propTypes = {
    location: shape({
        pathname: string.isRequired
    }).isRequired
};

