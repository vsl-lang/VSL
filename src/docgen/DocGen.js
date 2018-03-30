import ItemDocGen from './ItemDocGen';
import FuncDocGen from './FuncDocGen';
import ClassDocGen from './ClassDocGen';
import InitDocGen from './InitDocGen';
import FieldDocGen from './FieldDocGen';
import TypeAliasDocGen from './TypeAliasDocGen';
import GenericClassDocGen from './GenericClassDocGen';

import DocError from './DocError';
import ItemType from './ItemType';

/**
 * Root documentation generator. This generates JSON representing data which you
 * can pass to a DocWriter instance.
 */
export default class DocGen {
    /**
     * List of all scope items to support
     * @param {ScopeItem[]} items
     */
    constructor(items) {
        /** @type {ScopeItem[]} */
        this.items = items;
    }

    /**
     * Obtains the docgen for the given instance.
     * @param {ScopeItem} item
     * @return {ItemDocGen}
     */
    getGeneratorFor(item) {
        switch (item) {
            case ItemType.Function: return new FuncDocGen(this);
            case ItemType.Class: return new ClassDocGen(this);
            case ItemType.Initializer: return new InitDocGen(this);
            case ItemType.Field: return new FieldDocGen(this);
            case ItemType.TypeAlias: return new TypeAliasDocGen(this);
            case ItemType.GenericClass: return new GenericClassDocGen(this);
            default: throw new DocError(`unknown doc item type`)
        }
    }

    /**
     * Begins generation
     * @param {Gener}
     */
    generate() {
        return {
            version: 1,
            items: this.items.map(
                item => {
                    return new ItemDocGen(this).generate(item);
                }
            )
        };
    }
}
