import * as llvm from "llvm-node";
import toLLVMType from './toLLVMType';
import getFunctionName from '../helpers/getFunctionName';
import TypeContext from '../../../scope/TypeContext';

/**
 * Generates enumeration comparator object.
 * @param {ScopeEnumComparatorFuncItem} comparator the LLVM enumeration comparator item
 * @param {LLVMContext} context
 * @return {llvm.Function}
 */
export function generateEnumerationComparator(comparator, context) {
    const existingComparator = comparator.backendRef.get(TypeContext.empty());
    if (existingComparator) return existingComparator;

    const typeContext = context.typeContext;
    const comparatorFunction = llvm.Function.create(
        llvm.FunctionType.get(
            toLLVMType(comparator.returnType, context.backend),
            comparator.args.map(arg => toLLVMType(arg.type, context.backend)),
            false
        ),
        llvm.LinkageTypes.InternalLinkage,
        getFunctionName(comparator, typeContext),
        context.module
    );

    comparatorFunction.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);

    comparator.backendRef = comparatorFunction;

    const comparatorArgs = comparatorFunction.getArguments();

    const entryBlock = llvm.BasicBlock.create(context.ctx, "entry", comparatorFunction);

    context.builder = new llvm.IRBuilder(entryBlock);
    context.parentFunc = comparatorFunction;

    let result;
    switch (comparator.comparatorType) {
        case "==":
            result = context.builder.createICmpEQ(comparatorArgs[0], comparatorArgs[1]);
            break;
        case "!=":
            result = context.builder.createICmpNE(comparatorArgs[0], comparatorArgs[1]);
            break;
        default:
            throw new BackendError(
                `Attempted to create unexpected enum comparator with unknown ` +
                `identifier of ${comparator.comparatorType}`,
                comparator.owner.owner.source
            );
    }

    context.builder.createRet(result);

    return comparatorFunction;
}
