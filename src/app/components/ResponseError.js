import React, { Component } from 'react';

/**
 * An error response for the console. Provide 'title' and 'description'
 */
export default class ResponseErrpr extends Component {
    render() {
        return (
            <div className="response error">
                <div><span className="error-name">{this.props.name || "Error"}: </span>{this.props.title}</div>
                <div className="trace">{this.props.description}</div>
            </div>
        );
    }
}
