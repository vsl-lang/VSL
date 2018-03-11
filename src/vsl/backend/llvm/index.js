import Backend from '../Backend';
import * as w from './watchers';

import LLVMContext from './LLVMContext';

import * as llvm from "llvm-node";

llvm.initializeAllTargets();
llvm.initializeAllTargetMCs();
llvm.initializeAllTargetInfos();
llvm.initializeAllAsmParsers();
llvm.initializeAllAsmPrinters();

/**
 * LLVM backend which directly compiles to LLVM bytecode.
 */
export default class LLVMBackend extends Backend {
    /**
     * Creates llvm backend with given output stream/output location
     * @param {CompilationStream} stream
     * @param {string} [triple=""] LLVM Target Triple
     */
    constructor(stream, triple = llvm.config.LLVM_DEFAULT_TARGET_TRIPLE) {
        super(stream, 'llvm');

        /** @type {llvm.Context} */
        this.context = new llvm.LLVMContext();

        /** @type {llvm.Module} */
        this.module = new llvm.Module('main', this.context);
        this.module.triple = triple;
        this.module.dataLayout = llvm.TargetRegistry
            .lookupTarget(triple)
            .createTargetMachine(triple, "generic")
            .createDataLayout();

        /**
         * Init tasks
         * @type {Function[]}
         */
        this.initTasks = [];
    }

    /**
     * @override
     */
    *watchers() {
        yield* super.watchers();

        // Sort in order of likely occurence
        yield new w.Identifier();
        yield new w.PropertyExpression();
        yield new w.InitializerCall(); // before: FunctionCall
        yield new w.FunctionCall();
        yield new w.Literal();
        yield new w.BitCastExpression();
        yield new w.BinaryExpression();
        yield new w.OrExpression();
        yield new w.AndExpression();
        yield new w.ExpressionStatement();
        yield new w.AssignmentStatement();
        yield new w.IfStatement();
        yield new w.CodeBlock();
        yield new w.ReturnStatement();
        yield new w.InitializerStatement();
        yield new w.RootFunction();
        yield new w.ClassStatement();
        yield new w.NativeBlock();
        yield new w.NoOp();
    }

    /**
     * Add init code
     */
    postgen() {
        const ctorFuncType = llvm.FunctionType.get(
            llvm.Type.getVoidTy(this.context),
            [],
            false
        );

        const ctorTypeInstance = llvm.StructType.create(this.context);
        ctorTypeInstance.setBody([
            llvm.Type.getInt32Ty(this.context),
            ctorFuncType.getPointerTo(),
            llvm.Type.getInt8PtrTy(this.context)
        ])

        const ctorType = llvm.ArrayType.get(ctorTypeInstance, 1);

        const initFunc = llvm.Function.create(
            ctorFuncType,
            llvm.LinkageTypes.InternalLinkage,
            'vsl.init',
            this.module
        );

        const initBlock = llvm.BasicBlock.create(
            this.context,
            'entry',
            initFunc
        );

        const initBuilder = new llvm.IRBuilder(initBlock);

        // Add global var
        new llvm.GlobalVariable(
            this.module,
            ctorType,
            false,
            llvm.LinkageTypes.AppendingLinkage,
            llvm.ConstantArray.get(
                ctorType,
                [
                    llvm.ConstantStruct.get(
                        ctorTypeInstance,
                        [
                            llvm.ConstantInt.get(this.context, 65535, 32),
                            initFunc,
                            llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(this.context))
                        ]
                    )
                ]
            ),
            'llvm.global_ctors'
        );

        // Create init
        const context = new LLVMContext(this);
        context.builder = initBuilder;
        context.parentFunc = initFunc;

        for (let i = 0; i < this.initTasks.length; i++) {
            this.initTasks[i](context);
        }

        initBuilder.createRetVoid();
    }

    /**
     * Writes bitcode to file
     * @param {string} file Output file
     */
    writeBitCodeTo(file) {
        llvm.writeBitcodeToFile(this.module, file);
    }

    /**
     * Returns bytecode
     * @param {string} dump - Dump of byte code as string.
     */
    getByteCode() {
        return this.module.print();
    }

    /**
     * Begins generation.
     * @param {CodeBlock} input
     * @abstract
     */
    start(input) {
        for (let i = 0; i < input.statements.length; i++) {
            this.generate(i, input.statements, new LLVMContext(
                this
            ));
        }
    }
}

export const Targets = new Map([
    ["native", {
        "triple": llvm.config.LLVM_DEFAULT_TARGET_TRIPLE,
        "type": "obj",
        "command": "ld",
        "info": `Compiles to native object files and automatically links. ` +
            ` This is the default target and by default assumes system default` +
            ` target triple.`
    }],
    ["obj", {
        "triple": llvm.config.LLVM_DEFAULT_TARGET_TRIPLE,
        "type": "obj",
        "command": "obj",
        "info": "Compiles into a raw object file. This by default assumes a " +
            "system default target. The CRT is *not* linked, you must manually " +
            "do this. Learn more at (https://git.io/vslerr#crt-not-found)"
    }],
    ["wasm", {
        "triple": "wasm32-unknown-unknown-elf",
        "type": "asm",
        "command": "wasm",
        "info": "This compiles to WebAssembly (wasm) \`.wasm\` files. You must " +
            "have LLVM installed built with \`-DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly\` " +
            "otherwise you will recieve compilation errors. Additionally you must have " +
            "Binaryen (https://git.io/binaryen) installed globally. "
    }]
])
