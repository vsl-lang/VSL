import ContentEditable from 'react-contenteditable';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

/**
 * Just the propmt where a user can enter a command and submitted on enter.
 * Provide a `submit(data): Void` function.
 */
export default class Prompt extends Component {
    constructor(props) {
        super(props);
        
        this.setFocus = this.setFocus.bind(this);
        
        this.state = { html: "", isDisabled: false };
    }
    
    onKeyDown(event) {
        switch (event.keyCode) {
            case 13: {
                let value = ReactDOM.findDOMNode(this.contentEditable).textContent
                
                // Disable text area from further editing
                this.setState({ isDisabled: true })
                
                if (this.props.onSubmit) {
                    let res = this.props.onSubmit(value);
                    event.preventDefault(); // Prevent from submitting newline
                }
                
                break;
            }
            case 85: {
                // Handle ctrl+u
                if (event.ctrlKey) {
                    this.setState({ html: "" });
                }
            }
            case 75: {
                // Handle metaKey or ctrl
                if (event.metaKey || event.ctrlKey) {
                    if (this.props.onClear) this.props.onClear();
                }
                break;
            }
            case 8: {
                break;
            }
        }
    }
    
    onChange(event) {
        this.setState({ html: event.target.value })
    }
    
    
    componentDidMount() {
        this.setFocus()
    }
    
    componentWillReceiveProps(nextProps) {
        if (nextProps.isFocused === true) {
            this.setFocus();
        }
    }
    
    setFocus() {
        ReactDOM.findDOMNode(this.contentEditable).focus()
    }
    
    render() {
        return (
            <div className="line">
                <span className="prompt">{this.props.prompt}&gt;</span>
                <ContentEditable
                    ref={c => this.contentEditable = c}
                    html={this.state.html}
                    disabled={this.state.isDisabled}
                    onKeyDown={::this.onKeyDown}
                    onChange={::this.onChange}
                    tagName="span"
                    autoFocus
                />
            </div>
        );
    }
}
