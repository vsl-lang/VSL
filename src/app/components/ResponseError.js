import React, { Component } from 'react';
import ParserError from '../../vsl/parser/parserError';

/**
 * An error response for the console. Provide 'title' and 'description'
 */
export default class ResponseError extends Component {
    
    /** @private */
    _repeat(str, len) {
        let res = "";
        while(len --> 0) res += str;
        return res;
    }
    
    /** @private */
    _leftPad(str, len) {
        var pad = len - str.length, i = "";
        if (pad <= 0) return str;
        while(pad--) i += " ";
        return i + str;
    }
    
    /** @private */
    _highlight(code, pos) {
        let lines = code.split(/\r?\n/);
        
        let startLine = Math.max(0, pos.line - 2);
        let endLine   = Math.min(lines.length - 1, pos.line + 2);
        
        let maxLineLength = (endLine + "").length;
        let res = [];
        
        let prefix = " | ";
        if (this.shouldColor) prefix = prefix.yellow;
        
        for (let i = startLine; i <= endLine; i++) {
            let start = this._leftPad(i + 1 + "", maxLineLength);
            if (this.shouldColor) start = start.yellow;
            
            res.push(
                <div key={i}>
                    <span className="accent">{start + prefix}</span>{lines[i]}
                </div>
            );
            if (i === pos.line) {
                let carets = this._repeat("^", pos.length);
                if (this.shouldColor) carets = carets.yellow;
                
                res.push(
                    <div key={`i${i}`}>
                        <span className="accent">
                            {
                                this._repeat(" ", maxLineLength) + prefix +
                                this._repeat(" ", pos.column) + carets
                            }
                        </span>
                    </div>
                );
            }
        }
        
        return res;
    }
    
    render() {
        let desc, indicator,
            name = this.props.error.name;
        
        // Position
        if (this.props.error.node) {
            indicator = this._highlight(this.props.code, this.props.error.node.position);
            desc = <div className="desc indicator">{indicator}</div>
        } else if (this.props.error instanceof ParserError) {
            name = "Syntax Error"
            indicator = this._highlight(this.props.code, this.props.error.position);
            desc = <div className="desc indicator">{indicator}</div>
        } else {
            desc = <div className="desc trace">{this.props.error.stack}</div>
        }
        
        return (
            <div className="response error">
                <div className="message">
                    <span className="error-name">{name}: </span>
                    {this.props.error.message}
                </div>
                {desc}
            </div>
        );
    }
}
