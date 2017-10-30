import ParserError from '../vsl/parser/parserError';
import c from './colorSupport';

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
        
        /**
         * prefix to prefix log messages with
         * @type {String}
         */
        this.prefix = "vsl: ";
    }
    
    /**
     * Prints that the CLI itself had an error
     * @param  {string} message Error message
     */
    cli(message) {
        console.warn(this.prefix + message);
        process.exit(1);
    }
    
    /**
     * Prints a module error.
     *
     * @param {Module} obj - Module object (before run)
     * @param {ModuleError} error - Error object.
     */
    module(obj, error) {
        let moduleDescribedName = obj.module.name ? " " + obj.module.name : "";
        let moduleDescribedNameColored = this.shouldColor ?
            `\u001B[1m${moduleDescribedName}\u001B[0m` :
            moduleDescribedName;
        
        let modulePrefixColor = this.shouldColor ?
            `\u001B[35mModule\u001B[0m` :
            `Module`;
        
        let modulePrefix = modulePrefixColor + moduleDescribedNameColored + ": ";
        console.warn(this.setRed(this.prefix) + modulePrefix + error.message);
        console.warn(`  module @ ${obj.rootPath}`);
        process.exit(1);
    }
    
    /**
     * [handle description]
     * @param  {Object}  data
     * @param  {boolean} data.error        error message
     * @param  {string}  data.src          source file from error
     * @param  {boolean} [data.exit=false] exit proc or throw?
     */
    handle({ error, src, exit = false } = {}) {
        let fileName = error.stream && error.stream.sourceName ?
                `${error.stream.sourceName}` : "";
        
        if (!error.position && error.node) error.position = error.node.position || null;
        
        let position = error.position ? `${error.position.line + 1}:${error.position.column}` : "";
        let location = !(position || fileName) ? "" : ` (${[fileName, position].filter(Boolean).join(":")})`;
        

        // Check if the node has positional information
        if (error.node) {
            let name = error.name || "Compiler Error";
            
            this.rawError(
                name,
                error.message + location,
                this._highlight(src, error.node.position)
            )
        }
        else if (error instanceof ParserError) {
            this.rawError(
                "Syntax Error",
                error.message + location,
                error.position ? this._highlight(src, error.position) : ""
            )
        }
        else {
            throw error;
        }
        
        if (exit === true) {
            process.exit(1);
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
        
        let prefix = this.setYellow(" | ");
        
        for (let i = startLine; i <= endLine; i++) {
            let start = this.setYellow(this._leftPad(i + 1 + "", maxLineLength));
            
            res.push(start + prefix + lines[i]);
            if (i === pos.line) {
                let carets = this.setYellow(this._repeat("^", pos.length));
                
                res.push(
                    this._repeat(" ", maxLineLength) + prefix +
                    this._repeat(" ", pos.column) + carets
                );
            }
        }
        
        return res.join("\n");
    }
    
    /** @private */
    setYellow(text) {
        if (!this.shouldColor) return text;
        return `\u001B[${
            c.has16m ?
            "38;2;251;150;51" :
            "33"
        }m${text}\u001B[0m`
    }
    
    /** @private */
    setRed(text) {
        if (!this.shouldColor) return text;
        return `\u001B[1;${
            c.has256 ?
            "38;5;202" :
            "31"
        }m${text}\u001B[0m`
    }
    
    /**
     * Prints a raw error
     *
     * @param {string} type  String describing type
     * @param {string} title Main overview of error
     * @param {string} data  Following lines
     */
    rawError(type, title, data) {
        process.stderr.write(`${this.setRed(type)}: ${title}\n\n`)
        process.stderr.write(data.replace(/^|\n/g, "$&    ") + "\n\n");
    }
}
