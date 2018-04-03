import ScopeTraverser from '../vsl/transform/scopetraverser';
import { DeclarationStatement } from '../vsl/parser/nodes/*';

export const Behavior = {
    Hide: 0,
    Propogate: 1
};

/**
 * This is a traverser which basically implements access modifiers. This is used
 * by Compilation classes and essentially finds all declarations and adds them
 * to a specified scope.
 *
 * Specifically, this is used, for example, to take all public modifiers and add
 * it to the shared scope between modules.
 */
export default class PropogateModifierTraverser extends ScopeTraverser {
    /**
     * This takes a configuration object specifying an access modifier and what
     * it should do with it. Additionally provide the target {@link Scope} which
     * we should link to
     * @param  {Object} config An object in the form of:
     *                         `<modifier name>: <behavior>`. Where behavior is
     *                         one of `Behavior`'s (an enum exported too) values
     *                         `p.None` and `p.Propogate` are usually one of the
     *                         two you want. This **must** specify at least
     *                         `public`, `private`, `protected`, and `none`.
     * @param  {func(item: ScopeItem)} callback Called with a ScopeItem which
     *                                          should be propogated, do as you
     *                                          want with this
     */
    constructor(config, callback) {
        super(true);

        /** @private */
        this.config = config;

        /** @private */
        this.callback = callback;
    }

    /**
     * Do NOT pass a top-level config. Rather pass an array of root ASTs.
     *
     * @param {CodeBlock[]} ast Root array of all ASTs.
     * @override
     */
    queue(ast: any) {
        // Overriden to ensure that we only go over top-level declrations and
        // don't waste time going over non-top level decls.
        let parentScope = this.scope[this.scope.length - 1];
        if (parentScope && parentScope.rootScope !== true) return;
        else super.queue(ast);
    }

    /** @override */
    receivedNode(parent, name) {
        let node = parent[name];

        // Only want to run for top-level declarations.
        if (node.parentScope?.rootScope !== true) return;

        // Propogate declarations.
        if (!(node instanceof DeclarationStatement)) return;

        let accessModifiers = node.access;
        const is = (modifier) => accessModifiers.indexOf(modifier) > -1;
        const shouldPropogate = (modifier) =>
            this.config[modifier] === Behavior.Propogate;

        if (is('public')) if (!shouldPropogate('public')) return;
        else if (is('private'))   if (!shouldPropogate('private'))   return;
        else if (is('protected')) if (!shouldPropogate('protected')) return;
        else if (!shouldPropogate('none')) return;

        let ref = node.reference;
        if (ref !== null) {
            this.callback(ref);
        }
    }
}
