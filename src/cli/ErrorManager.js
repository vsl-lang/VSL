import ParserError from '../vsl/parser/parserError';
import colors from 'colors';

/**
 * Manages error handling for VSL
 */
export default class ErrorManager {
    /**
     * You can change the params later
     * @param  {boolean} shouldColor whether output should be colorize
     */
    constructor(shouldColor: boolean) {
        /**
         * Whether output should be colorized
         * @type {boolean}
         */
        this.shouldColor = shouldColor;
    }
    
    /**
     * Prints that the CLI itself had an error
     * @param  {string} message Error message
     */
    cli(message) {
        console.warn("vsl: " + message);
        process.exit(1);
    }
    
    /**
     * [handle description]
     * @param  {Object}  data
     * @param  {boolean} data.error  error message
     * @param  {string}  src         source file from error
     * @param  {boolean} [exit=true] exit proc or throw?
     */
    handle({ error, src, exit = true } = {}) {
        // Check if the node has positional information
        if (error.node) {
            
        }
        else if (error instanceof ParserError) {
            this.rawError(
                "Syntax Error",
                error.message + ` (${error.position.line}:${error.position.column})`,
                this._highlight(src, error.position)
            )
        }
        else {
            throw error;
        }
    }
    
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
            
            res.push(start + prefix + lines[i]);
            if (i === pos.line) {
                let carets = this._repeat("^", pos.length);
                if (this.shouldColor) carets = carets.yellow;
                
                res.push(
                    this._repeat(" ", maxLineLength) + prefix +
                    this._repeat(" ", pos.column) + carets
                );
            }
        }
        
        return res.join("\n");
    }
    
    /**
     * Prints a raw error
     *
     * @param {string} type  String describing type
     * @param {string} title Main overview of error
     * @param {string} data  Following lines
     */
    rawError(type, title, data) {
        process.stderr.write(`${this.shouldColor ? type.red.bold : type}: ${title}\n\n`)
        process.stderr.write(data.replace(/^|\n/g, "$&    ") + "\n\n");
    }
}
