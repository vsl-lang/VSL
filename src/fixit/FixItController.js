import FixIt from './FixIt';

/**
 * Controls and centralizes FIX-IT behavior. This is a helper class but if it
 * doesn't do what you want feel free to use `FixIt` directly instead of this.
 */
export default class FixItController {
    /**
     * Takes promises as main way of I/O.
     *
     * @param  {func(prompt: ?string): Promise} input - A function which may get
     *                                                a 'prompt' which should
     *                                                be displayed but if null
     *                                                input should be direct.
     *                                                This should resolve to the
     *                                                input as a string.
     *
     * @param  {func(value: string): Promise}  output - This should print out
     *                                                the passed value and
     *                                                resolve when the string
     *                                                is finished evaluating.
     *                                                This function will only
     *                                                recieve one line at a time
     *                                                which means that value
     *                                                will never have a newline.
     *                                                This means you should
     *                                                append a newline after
     *                                                each call to this.
     */
    constructor(input, output) {
        /** @private */
        this.input = input;
        
        /** @private */
        this.output = output;
        
        /** @type {?FixItColors} */
        this.colorizer = null;
    }
    
    /** @private */
    // Interfaces input from a FixIt
    async streamInput(input) {
        return await this.input(this._colorText(this._capitalize(input) + "? "));
    }
    
    /** @private */
    // Interfaces output from a FixIt
    async streamOutput(value) {
        return await this.output(value);
    }
    
    /** @private */
    _capitalize(string) {
        return string[0].toUpperCase() + string.substring(1);
    }
    
    /** @private */
    _color(string) {
        return this.colorizer ? this.colorizer.accent(string) : string;
    }
    
    /** @private */
    _colorText(string) {
        return this.colorizer ? this.colorizer.color(string) : string;
    }
    
    /**
     * Returns nil if error cannot be handled, make sure to also pass the string
     * EXACTLY as it was passed to the parser. This will return the fixed
     * string, this may return the source string.
     *
     * @param  {Error}  error Any error, but will only be able to handle errors
     *                        w/ a `ref` because that provides comp. debug info.
     * @param  {string} source The source code EXACTLY how it was presented to
     *                         the parser.
     * @return {Promise} null if cannot be handled. Otherwise is the resulting
     *                   string. This resolves to the value.
     */
    async receive(error, source) {
        let { ref, node } = error;
        
        // If we don't have a ref then we can't do anything duh.
        if (!ref || !node) return null;
        
        let { fixits } = ref;
        if (!fixits || fixits.length <= 0) return null;
        
        let fixit = new FixIt(source, node, ::this.streamInput, ::this.streamOutput);
        
        await this.output(this._color(`FIX-IT: `));
        await this.output(`    • ${fixits.length} available FIX-IT${fixits.length !== 1 ? "s" : ""}`);
        await this.output(``);
        await this.output(this._colorText(`What would you like to do?`));
        
        for (let i = 0; i < fixits.length; i++) {
            await this.output(`    ${this._color(`[${i + 1}]`)}. ${this._capitalize(fixits[i].d)}`);
        }
        
        await this.output(`    ${this._color(`[${fixits.length + 1}]`)}. Exit`);
        
        let response;
        do {
            let input = await this.input(this._colorText(`Your selection: `));
            response = +input - 1;
        } while (!(Number.isInteger(response) && response >= 0 && response <= fixits.length));
        
        if (response === fixits.length) return null;
        let chosenFixit = fixits[response];
        
        return await fixit.applyFixIt(chosenFixit);
    }
}
