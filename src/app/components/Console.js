import React, { Component } from 'react';

import ResponseError from './ResponseError';
import Response from './Response';
import Prompt from './Prompt';

import VSLParser from '../../vsl/parser/vslparser';
import VSLTransform from '../../vsl/transform/transform';

const prompt = {
    type: "prompt",
    prompt: "vsl"
};

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
        this.pushLine(prompt);
    }
    
    didClickBackground() {
        this.setState({ isFocused: true })
    }
    
    onSubmit(text) {
        // Special behavior for help
        if (text === "help") {
            this.pushLineAndPrompt({
                type: "text",
                value: `\nWelcome to VSL!\n\n` +
                       `If you are using VSL for the first time we reccomend referencing\n` +
                       `the getting started guide but that doesn't exist atm. \n\n` +
                       `The following commands are available:\n` +
                       `  help - displays this dialog\n` +
                       `\n`
            });
            return;
        }
        
        if (this.unfinished !== true) {
            this.parser = new VSLParser();
        }
        
        let res;
        try {
            res = this.parser.feed(text);
        } catch(error) {
            this.pushLineAndPrompt({
                type: "error",
                name: error.name,
                title: error.message,
                description: error.stack
            });
            return;
        }
        
        if (res.length === 0) {
            this.unfinished = true;

            this.pushLine({
                type: "prompt",
                prompt: ">>>"
            });
        } else {
            this.unfinished = false;
            
            // Specify scope and inherit + specify old
            res[0].scope.parentScope = this.previousScope;
            this.previousScope = res[0].scope;
            
            // Try transformation
            try {
                this.previousContext = VSLTransform(res, this.previousContext);
                this.pushLineAndPrompt({
                    type: "text",
                    value: res[0].scope.toString()
                });
            } catch(error) {
                this.pushLineAndPrompt({
                    type: "error",
                    name: error.name,
                    title: error.message,
                    description: error.stack
                })
            }
        }
    }
    
    pushLineAndPrompt(item) {
        this.pushLine(item);
        this.pushLine(prompt);
    }
    
    pushLine(message) {
        let lines = this.state.lines;
        lines.push(message);
        this.setState({ lines: lines })
    }
    
    onClear() {
        this.setState({ lines: lines.slice(-1) });
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
                                        onClear={::this.onClear}
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
