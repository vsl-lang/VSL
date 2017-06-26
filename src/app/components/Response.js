import React, { Component } from 'react';

/**
 * A text response for the console. Provide 'value'
 */
export default class Response extends Component {
    render() {
        let { value, id } = this.props;
        return (
            <div className="response" id={id}>
                {value}
            </div>
        );
    }
}
