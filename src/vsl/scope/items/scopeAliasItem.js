import ScopeItem from '../scopeItem';

/**
 * References an alias or such to any value. This is used for example in thigns
 * like assignments.
 */
export default class ScopeAliasItem extends ScopeItem {

    /**
     * Creates an alias, an item representing a value. This will store a
     * ScopeItem for the instance which it represents. For example an object of
     * type `class A {}` would be `ScopeAliasItem(of: A.ref)`
     *
     * Additionally we'll keep track of variable candidates here. This will be
     * verified as the code is generated which will allow us to maintain
     * ambiguity for deffered resolution
     *
     * @param {string} rootId - The root primary identifier of this type.
     * @param {ScopeItem[]} candidates - The possible type of the item.
     * @param {Node} source - The source expression which the item was declared.
     */
    constructor(rootId: string, candidates: ScopeItem[], source: Node) {
        super(rootId);

        /**
         * All the possible types the alias can have. The generator will resolve
         * ambiguity between multiple but if they are 0 we can do nothing.
         *
         * Make sure to bind to the reference for type updating.
         *
         * @type {ScopeItem[]}
         */
        this.candidates = candidates;

        /**
         * `true` if the type ever escapes the scope this means it is places
         * within a closure, or is ever returned. This is needed for memory
         * allocation as we don't want to RC every time. Instead we'll copy the
         * mem ref. to a object & unwrap if applicable. We can inline too but
         * avoiding branch analysis and domain masking is probably more complex
         * then initally is needed.
         *
         * @type {boolean}
         */
        this.escapesScope = false;

        /**
         * The source node in which this item was declared. Do note that this
         * might now always be the same but you can assume it will have type
         * info e.g. `.typeCandidates`.
         *
         * @type {Node}
         */
        this.source = source;
    }

    /** @override */
    equal(ref: ScopeItem): boolean {
        return ref instanceof ScopeAliasItem && ref.rootId === this.rootId;
    }

    /** @return {string} */
    toString() {
        return `${this.rootId}: ${this.candidates ? this.candidates.join(", ") : "n/a"}`;
    }
}
