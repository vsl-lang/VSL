import ScopeAliasItem from './scopeAliasItem';
import ScopeTypeItem from './scopeTypeItem';
import GenericInfo from './genericInfo';
import { AliasType } from './scopeAliasItem';
import ScopeForm from '../scopeForm';
import Scope from '../scope';

/**
 * @typedef {Object} TupleParameterDescription
 * @property {string} name - The name of the type.
 * @property {ScopeTypeItem} type - The resolved type.
 * @property {?Node} source - Optional but the source of the node
 */

/**
 * A scope item for a tuple.
 */
export default class ScopeTupleItem extends ScopeTypeItem {

    /**
     * Creates a tuple.
     *
     * @param {ScopeForm} form - The form or type of the scope item.
     * @param {string} rootId - the root identifier in a scope.
     * @param {Object} data - Information about the class
     */
    constructor(form, rootId, data) {
        super(form, rootId, data);
    }

    /**
     * @param {Object} opts - see parent class for more info
     * @param {TupleParameterDescription[]} opts.parameters - Tuple params
     */
    init({ parameters, ...opts }) {
        const subscope = new Scope();
        const staticScope = new Scope();

        for (let i = 0; i < parameters.length; i++) {
            subscope.set(
                new ScopeAliasItem(
                    ScopeForm.definite,
                    parameters[i].name,
                    {
                        source: parameters[i].source,
                        aliasType: AliasType.default,
                        type: parameters[i].type,
                    }
                )
            )
        }

        super.init({
            subscope: subscope,
            staticScope: staticScope,
            isInterface: false,
            genericInfo: new GenericInfo({ parameters: [] }),
            ...opts
        });

        /**
         * Parameters of the tuple.
         * @type {TupleParameterDescription[]}
         */
        this.parameters = parameters;
    }

    /**
     * Determines if the current type can be cast to `type` is castable.
     *
     * @param {ScopeTypeItem} type - If the current type can be cast to this
     *                             type.
     * @return {number} can be treated as a boolean. 0 if cannot be cast, else,
     *                  this is the distance of the cast (lower = more specific)
     */
    castableTo(type) {
        if (type instanceof ScopeTupleItem && this.equal(type)) return true;
        return super.castableTo(type);
    }

    /**
     * Determines whether two `ScopeItem`s matches each other. You can use this
     * to verify a candidate matches the prototype. Always implement
     * `super.equal` as first condition.
     *
     * @param {ScopeItem} ref - The value of the other scope item. It will
     *     be of the same subclass. Passed resolved item
     * @return {bool} Indicates whether or not the `signature` is the same.
     *
     * @override
     */
    equal(ref) {
        if (ref.parameters.length !== this.parameters.length) return false;

        return this.parameters
            .every((param, idx) =>
                param.type.resolved().equal(ref.parameters[idx].type.resolved()) &&
                param.name === ref.parameters[idx].name);
    }

}
