/**
 * Various context items for an analysis
 */
export default class AnalysisContext {

    /**
     * You shouldn't need to construct this. Analysis CLI does this for you.
     * @param {Object} o - Options
     * @param {ErrorManager} o.errorManager
     * @param {string} o.commandName
     * @param {string[]} o.args
     */
    constructor({ commandName, errorManager, args }) {
        /**
         * Report all errors through this
         * @type {ErrorManager}
         */
        this.errorManager = errorManager;

        /**
         * Command name of current command
         * @type {string}
         */
        this.commandName = commandName;

        /**
         * Provides raw access to arguments
         * @type {string[]}
         */
        this.arguments = args;
    }

    /**
     * Helpers function to generate a tree from an object. If they are cycles
     * then behavior is undefined (likely infinite loop).
     * @param {string} name - Name to prefix at beginning of tree
     * @param {Object} tree
     * @return {string}
     */
    generateTree(name, tree) {
        // So this takes an object so what we do is we generate the children
        // then string them together.
        let output = `${name}`;

        const entries = [...Object.entries(tree)];
        for (let i = 0; i < entries.length; i++) {
            const isLastEntry = i === entries.length - 1;
            const [parent, child] = entries[i];

            // Ok now generate subtree again but splitting on lines
            const subtree = this.generateTree(parent, child).split('\n');

            if (isLastEntry) {
                output += '\n ╰ ' + subtree.join('\n   ');
            } else {
                output += '\n ├ ' + subtree.join('\n │ ');
            }
        }

        return output;
    }

    /**
     * Obtain an argument otherwise throw error.
     * @param {number} argumentIndex - index of argument starting at zero
     * @param {string} description - If not, the error needs to show what type it is.
     * @return {string} argument. Fatally exits if not provided
     */
    getArgument(argumentIndex, description) {
        const arg = this.arguments[argumentIndex];
        if (!arg) {
            this.errorManager.cli(`The \u001B[1;4m${this.commandName}\u001B[0m takes a ${description} parameter.`);
        }
        return arg;
    }

}
