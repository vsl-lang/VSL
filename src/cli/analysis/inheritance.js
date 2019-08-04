import ScopeTypeItem from '../../vsl/scope/items/scopeTypeItem';
import ScopeForm from '../../vsl/scope/scopeForm';

/**
 * Performs inheritance analysis
 * @param {CompilationInstance} instance
 * @param {AnalysisContext} context
 */
export default async function InheritanceAnalysis(instance, context) {
    const selector = context.getArgument(0, 'type name');
    const root = instance.rootCodeBlock;

    const query = new ScopeTypeItem(ScopeForm.query, selector, {});
    const type = root.scope.get(query);

    if (!type) {
        context.errorManager.cli(`No type named \u001B[4m${selector}\u001B[0m.`);
    }

    // Now we need to generate the children we'll use a recursive helper function
    let subclassTree = {
        [`\u001B[1;4;32m${type}\u001B[0m`]: constructSubclassTree(type, true)
    };

    // Get type heirarchy above the current item
    let currentSupertype = type;
    while (
        (currentSupertype = currentSupertype.superclass) &&
        currentSupertype !== ScopeTypeItem.RootClass) {
        subclassTree = {
            [`${currentSupertype}`]: subclassTree
        };
    }

    console.log(context.generateTree('\u001B[2m(Object)\u001B[0m', subclassTree));

}

function constructSubclassTree(type, isTopLevel) {
    const subclasses = {};

    for (let i = 0; i < type.subclasses.length; i++) {
        const subclass = type.subclasses[i];
        const name = `${subclass.selfType.toString()}`;
        subclasses[
            isTopLevel ?
                `\u001B[34m${name}\u001B[0m` :
                name] = constructSubclassTree(subclass);
    }

    return subclasses;
}
