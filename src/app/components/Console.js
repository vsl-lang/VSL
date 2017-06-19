import React, { Component } from 'react';

import ResponseError from './ResponseError';
import Response from './Response';
import Prompt from './Prompt';

import VSLParser from '../../vsl/parser/vslparser';
import VSLTransform from '../../vsl/transform/transform';

const prompt = "vsl";

export default class Console extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            lines: [
                {
                    type: "text",
                    value: `\nVSL v${VERSION} (interactive)\n` +
                           "run `help` for more information.\n\n"
                }
            ],
            isFocused: true
        };
        
        this.unfinished = false;
        this.parser = null;
        
        // Persistent context
        this.previousScope = null;
        this.previousContext = undefined;
    }
    
    componentDidMount() {
        let lines = this.state.lines;
        lines.push({
            type: "prompt",
            prompt: prompt
        });
        this.setState({ lines: lines });
    }
    
    didClickBackground() {
        this.setState({ isFocused: true })
    }
    
    onSubmit(text) {
        if (this.unfinished !== true) {
            this.parser = new VSLParser();
        }
        
        let res;
        try {
            res = this.parser.feed(text);
        } catch(e) {
            let lines = this.state.lines;
            lines.push({
                type: "error",
                name: error.name,
                title: error.message,
                description: error.stack
            });
            lines.push({
                type: "prompt",
                prompt: prompt
            })
            this.setState({ lines: lines });
            return;
        }
        
        if (res.length === 0) {
            this.unfinished = true;
            let lines = this.state.lines;
            
            lines.push({
                type: "prompt",
                prompt: ">>>"
            });
            
            this.setState({ lines: lines })
        } else {
            this.unfinished = false;
            
            // Process text
            res[0].scope.parentScope = this.previousScope;
            this.previousScope = res[0].scope;
            
            let response;
            try {
                this.previousContext = VSLTransform(res, this.previousContext);
                response = {
                    type: "text",
                    value: res[0].scope.toString()
                }
            } catch(error) {
                response = {
                    type: "error",
                    name: error.name,
                    title: error.message,
                    description: error.stack
                }
            }
            
            let lines = this.state.lines;
            lines.push(response);
            lines.push({
                type: "prompt",
                prompt: prompt
            })
            
            this.setState({ lines: lines });
        }
    }
    
    render() {
        return (
            <pre className="console" onClick={::this.didClickBackground}>
                {
                    this.state.lines.map(({type, ...props}, index) => {
                        props.key = index;
                        switch (type) {
                            case "prompt":
                                return (
                                    <Prompt
                                        key={index}
                                        prompt={props.prompt}
                                        isFocused={this.state.isFocused}
                                        onSubmit={::this.onSubmit}
                                    />
                                );
                            case "text":
                                return <Response {...props} />;
                            case "error":
                                return <ResponseError {...props} />;
                            default: throw new TypeError(`Unknown type ${item.type}`);
                        }
                    })
                }
            </pre>
        );
    }
}
