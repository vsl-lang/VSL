import t from '../parser/nodes';
import * as lookups from './lookups';

export default function vslGetTypeChild(from: Node): TypeLookup {
    switch(from.constructor) {
        case t.Identifier: return new lookups.IdLookup(from, vslGetTypeChild);
        case t.Generic: return new lookups.GenericLookup(from, vslGetTypeChild);
        default: throw new TypeError(`No lookup child handler for ${from.constructor.name}`);
    }
}
