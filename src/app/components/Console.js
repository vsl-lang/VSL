import React, { Component } from 'react';
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
        let res = this.parser.feed(text);
        
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
            
            let lines = this.state.lines;
            
            lines.push({
                type: "text",
                value: res[0].toString()
            });
            
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
                    this.state.lines.map((item, index) => {
                        switch (item.type) {
                            case "prompt":
                                return (
                                    <Prompt
                                        key={index}
                                        prompt={item.prompt}
                                        isFocused={this.state.isFocused}
                                        onSubmit={::this.onSubmit}
                                    />
                                );
                            case "text":
                                return (
                                    <Response
                                        key={index}
                                        value={item.value}
                                    />
                                );
                            default: throw new TypeError(`Unknown type ${item.type}`);
                        }
                    })
                }
            </pre>
        );
    }
}
