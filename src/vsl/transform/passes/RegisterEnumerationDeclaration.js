import RegisterClassDeclaration from './RegisterClassDeclaration';
import t from '../../parser/nodes';



/**
 * Finalizes an entry for an enum decl.
 */
export default class RegisterEnumerationDeclaration extends RegisterClassDeclaration {
    constructor() {
        super(t.EnumerationStatement, "Register::EnumerationDeclaration");
    }
}
