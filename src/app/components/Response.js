import React, { Component } from 'react';

/**
 * A text response for the console. Provide 'value'
 */
export default class Response extends Component {
    render() {
        return (
            <div className="response">
                {this.props.value}
            </div>
        );
    }
}
