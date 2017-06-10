import ScopeItem from '../scopeItem';

/**
 * Describes a function declaration. Usually a top, nested, or class-level
 * declaration.
 */
export default class ScopeFuncItem extends ScopeItem {

    /**
     * Creates a spot for a function in a scope. Use this when you need to
     * handle overloading etc. For lambdas you probably want to use a normal
     *
     * @param {string} rootId - The root primary identifier of this type. (not mangled)
     * @param {ScopeFuncItemArgument[]} args - The arguments of the function.
     */
    constructor(rootId: string, args: ScopeFuncItemArgument[]) {
        super(rootId);

        /** @type {ScopeFuncItemArgument[]} */
        this.args = args;
    }

    /** @override */
    equal(ref: ScopeItem): boolean {
        if (!(ref instanceof ScopeFuncItem)) return false;
        if (ref.args.length > this.args.length) return false;

        // Basically go left -> right filling in each arg, placing default if
        // applicable.
        let i = 0;
        for (; i < ref.args.length; i++) {
            // If they have different names that's a bork.
            if (ref.args[i].name !== this.args[i].name) {
                return false;
            }

            // Check the arg types match
            if (this.args[i].type !== ref.args[i].type) {
                return false;
            }
        }

        // If they are remaining arguments, ensure they are all optional
        for (; i < this.args.length; i++) {
            if (this.args[i].optional === false) return false;
        }

        return true;
    }

    /** @override */
    toString() {
        return `func ${this.rootId}(${this.args.join(", ")})`;
    }
}
