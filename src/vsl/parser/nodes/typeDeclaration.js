import Node from './node';

/**
 * Wraps a generic value
 */
export default class TypeDeclaration extends Node {
    
    /**
     * @param  {Identifier} name Generic name.
     * @param  {?Type} defaultType Default generic value
     * @param  {Object} position Position from nearley
     */
    constructor(name, defaultType, position) {
        super(position);
        
        /** @type {Identifier} */
        this.name = name;
        
        /** @type {Type} */
        this.defaultType = defaultType;
    }
    
    /** @override */
    get children() {
        return [ 'name', 'defaultType' ];
    }
}
