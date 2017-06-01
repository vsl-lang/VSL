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
     */
    constructor(rootId: string, body: FunctionBody) {
        super(rootId);
    }
    
    /** @private */
    _equal(ref: ScopeFuncItem) {
        
    }
    
    /** @override */
    equal(ref: ScopeItem): boolean {
        return ref instanceof ScopeFuncItem && this._equal(ref);
    }
}