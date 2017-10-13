/**
 * Matches a generic error from a parser
 */
export default class ParserError {
    /**
     * You don't need to provide an error message but it's reccomended to be
     * more specific
     * @param  {string} message  error message
     * @param  {Object} position position from nearley
     */
    constructor(message: string, position: Object) {
        /** @type {string} */
        this.message = message;
        
        /** @type {Object} */
        this.position = position;
    }

    toString() {
        return this.position ?
            `${this.message} (${this.position.line}:${this.position.column})` :
            this.message;
    }
}
