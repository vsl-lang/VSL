import Backend from '../Backend';
import * as w from './watchers';

import generatePriorityMap from './helpers/generatePriorityMap';

import LLVMContext from './LLVMContext';

import * as llvm from "llvm-node";

llvm.initializeAllTargets();
llvm.initializeAllTargetMCs();
llvm.initializeAllTargetInfos();
llvm.initializeAllAsmParsers();
llvm.initializeAllAsmPrinters();

// Uncomment following lines to debug bad calls:
// ((c) => {
//     llvm.IRBuilder.prototype.createInBoundsGEP = function() {
//         console.trace();
//         return c.apply(this, arguments);
//     };
// })(llvm.IRBuilder.prototype.createInBoundsGEP);

/**
 * LLVM backend which directly compiles to LLVM bytecode. The LLVM backends
 * supports customizable targets through modifying the target triple. It
 * performs rough analysis of code and evaluates the results of the optimization
 * passes.
 *
 * The LLVM backends conservatively generates dynamic instructions and RTTI. By
 * taking advantage of the dynamic dispatch pass which analyzes and mitigates
 * excess runtime complexity in cases where the lookup can be statically
 * determined it uses that.
 *
 * Additionally the LLVM backend offers introspection through the
 * {@link LLVMBackend#callbackSymbolName} which would take a VSL `Object` with
 * RTTI, downcastable.
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
         * @type {Map<string, Function[]>}
         */
        this.initTasks = new Map();

        /**
         * Init tasks
         * @type {Map<string, Function[]>}
         */
        this.deinitTasks = new Map();

        /**
         * List of compiler options.
         *
         * @type {Object}
         * @property {boolean} [trapOnOverflow=false] - Traps on arithmetic overflow
         * @property {boolean} [disableAllocCheck=true] - Enabling prevents traps on out of memory cases
         * @property {boolean} [disableRTTI=false] - Disables RTTI
         * @property {boolean} [isParallel=false] - Enables safe parallelism
         */
        this.options = {
            trapOnOverflow: false,
            disableAllocCheck: true,
            disableRTTI: false,
            isParallel: false
        };

        /**
         * Set this to the symbol name of a callback function. This will be
         * called if the final value in main is an expression.
         *
         * You can use this to make a REPL. Easiest way is to create a VSL which
         * exports using `@foreign` a function accepting `Object` parameter and
         * using Reflection and runtime APIs.
         *
         * If this is used however expect a runtime penalty. This means the
         * objects will be forced to be dynamic and RTTI will be inserted.
         *
         * @type {?string}
         */
        this.callbackSymbolName = null;

        /**
         * Evaluates to the regular expression library being used. If so
         * @param {?string}
         */
        this.regularExpressionLibrary = null;
    }

    /**
     * Adds an init task with priority.
     * @param {number} priority - 0 is highest.
     * @param {Function} func - What to call to gen task. Takes a context.
     */
    addInitTask(priority, func) {
        if (this.initTasks.has(priority)) {
            this.initTasks.get(priority).push(func);
        } else {
            this.initTasks.set(priority, [func])
        }
    }

    /**
     * Adds an deinit task with priority.
     * @param {number} priority - 0 is highest.
     * @param {Function} func - What to call to gen task. Takes a context.
     */
    addDeinitTask(priority, func) {
        if (this.deinitTasks.has(priority)) {
            this.deinitTasks.get(priority).push(func);
        } else {
            this.deinitTasks.set(priority, [func])
        }
    }

    /**
     * @override
     */
    *watchers() {
        yield* super.watchers();

        // Sort in order of likely occurence
        yield new w.Identifier();
        yield new w.Self();
        yield new w.PropertyExpression();

        yield new w.InitializerCall(); // before: FunctionCall
        yield new w.FunctionCall();

        yield new w.Literal();
        yield new w.EnumerationStatement();
        yield new w.BinaryExpression();
        yield new w.UnaryExpression();

        yield new w.BitCastExpression();
        yield new w.ForcedCastExpression();
        yield new w.CastExpression();

        yield new w.OrExpression();
        yield new w.AndExpression();
        yield new w.AssignmentExpression();
        yield new w.ExpressionStatement();
        yield new w.Tuple();

        yield new w.DynamicFieldStatement(); // before: LazyAssignmentStatement
        yield new w.LazyAssignmentStatement(); // before: AssignmentStatement
        yield new w.AssignmentStatement();

        yield new w.IfStatement();
        yield new w.Generic();
        yield new w.Ternary();
        yield new w.WhileStatement();
        yield new w.InitDelegationCall();
        yield new w.DoWhileStatement();
        yield new w.CodeBlock();
        yield new w.ReturnStatement();
        yield new w.InitializerStatement();
        yield new w.Function();
        yield new w.ClassStatement();
        yield new w.NativeBlock();
        yield new w.NoOp();
    }

    /**
     * Add init code
     */
    postgen() {
        generatePriorityMap(this.initTasks, this, 'llvm.global_ctors', 'init');
        generatePriorityMap(this.deinitTasks, this, 'llvm.global_dtors', 'deinit');
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

export const NATIVE_TRIPLE = llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
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
        "command": "nold",
        "info": "Compiles into a raw object file. This by default assumes a " +
            "system default target. The CRT is *not* linked, you must manually " +
            "do this. Learn more at (https://git.io/vslerr#crt-not-found)"
    }],
    ["asm", {
        "triple": llvm.config.LLVM_DEFAULT_TARGET_TRIPLE,
        "type": "asm",
        "command": "nold",
        "info": "Compiles into an assembly file. The CRT is *not* linked, you " +
            "must manually do this. Learn more at (https://git.io/vslerr#crt-not-found)"
    }],
    ["wasm", {
        "triple": "wasm32-unknown-unknown",
        "type": "asm",
        "command": "wasm",
        "info": "This compiles to WebAssembly (wasm) \`.wasm\` files. You must " +
            "have LLVM installed built with \`-DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly\` " +
            "otherwise you will recieve compilation errors. Additionally you must have " +
            "Binaryen (https://git.io/binaryen) installed globally. "
    }]
])
