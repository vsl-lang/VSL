import t from '../parser/nodes';
import * as lookups from './lookups';
import TypeLookupError from './typeLookupError';

export default function vslGetTypeChild(from: Node): TypeLookup {
    switch(from.constructor) {
        case t.Identifier: return new lookups.IdLookup(from, vslGetTypeChild);
        case t.Generic: return new lookups.GenericLookup(from, vslGetTypeChild);
        default: throw new TypeLookupError(
            `Invalid node in type expression`,
            from
        );
    }
}
