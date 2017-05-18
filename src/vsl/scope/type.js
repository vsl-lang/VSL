import ScopeItem from './scopeItem';

/**
 * Represents all information about a VSL type. This includes:
 * 
 *  - Type name
 *  - Declaration node
 *  - other?
 */
export default class Type extends ScopeItem {
    
    /**
     * @param {string} name - The name of the type as a string
     */
    constructor(name: string) {
        super(name);
    }
}