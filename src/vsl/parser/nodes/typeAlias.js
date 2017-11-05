import DeclarationStatement from './declarationStatement';

/**
 * Represents a static (compile-time) typealias.
 */
export default class TypeAlias extends DeclarationStatement {
    
    /**
     * @param {string[]} access - The access modifiers of the node
     * @param {Identiier} name - Name of the new alias
     * @param {Type} type - The type expression the name is to be set to.
     * @param {Object} position - A position object from nearley.
     */
    constructor(
        access: string[],
        name: Identifier,
        type: Type,
        position: Object
    ) {
        super(access, position);
        
        /** @type {Identifier} */
        this.name = name;
        
        /** @type {Type} */
        this.type = type;
    }
    
    /** @override */
    get children() {
        return ['name', 'type']
    }
}
