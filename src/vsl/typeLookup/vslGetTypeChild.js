import t from '../parser/nodes';
import * as lookups from './lookups';

export default function vslGetLookupChild(from: Node): TypeLookup {
    switch(from.constructor) {
        case t.Identifier: return new lookups.IdLookup(from, vslGetLookupChild);
        case t.Generic: return new lookups.GenericLookup(from, vslGetLookupChild);
        default: throw new TypeError(`No lookup child handler for ${from.constructor.name}`);
    }
}
