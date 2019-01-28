import PropogateModifierTraverser, { Behavior as p } from './PropogateModifierTraverser';

import CompilationStream from './CompilationStream';
import GroupMetadata from './GroupMetadata';

import ParserError from '../vsl/parser/parserError';
import VSLParser from '../vsl/parser/vslparser';

import TransformationContext from '../vsl/transform/transformationContext';
import VSLPreprocessor from '../vsl/transform/transformers/vslpreprocessor';
import VSLScopeTransformer from '../vsl/transform/transformers/vslscopetransformer';
import VSLPretransformer from '../vsl/transform/transformers/vslpretransformer';
import VSLTransformer from '../vsl/transform/transformers/vsltransformer';
import TransformError from '../vsl/transform/transformError';
import ScopeTraverser from '../vsl/transform/scopetraverser';
import { CodeBlock } from '../vsl/parser/nodes/*';
import Scope from '../vsl/scope/scope';

import ASTSerializer from '../vsl/parser/ASTSerializer';

import { createWriteStream, createReadStream, mkdirs, pathExists, stat } from 'fs-extra';
import path from 'path';

// import LLIR from '../vsl/backend/llir';
// import JSBackend from '../vsl/backend/js';
import LLVMBackend from '../vsl/backend/llvm';

import e from '../vsl/errors'

export const PROPAGATION_CONFIG = {
    protected: p.Propogate,
    private: p.Hide,
    public: p.Propogate,
    none: p.Propogate
};

/**
 * Represents the compilation of a single module. This doesn't actually have any
 * knowledge of a {@link VSLModule} or native modules, rather this represents a
 * group of 'streams' and handled their accesss scopes through the
 * {@link PropogateModifierTraverser}. This specifically uses:
 *
 *     {
 *         protected: p.Propogate,
 *         private: p.Hide,
 *         public: p.Propogate,
 *         none: p.Propogate
 *     }
 *
 * If you want to inject modules you can set a shared scope instance by using
 * the CompilationGroup.lazyHook() which will specify a scope hook to other
 * {@link CompilationGroup}s.
 *
 * @example
 * let compilationGroup = new CompilationGroup()
 *
 * for (let file in files) {
 * 	let fileStream = compilationGroup.createStream()
 * 	fileStream.send(fs.readFileSync(file));
 * }
 *
 * let result = await compilationGroup.compile();
 *
 * @example
 * let compilationGroup = new CompilationGroup();
 *
 * let stream = compilationGroup.createStream();
 * stream.send(prompt('vsl> '));
 * stream.handleRequest(done => done(prompt('>>>> ')));
 *
 * compilationGroup.compile();
 *
 * @example
 * let compilationGroup = new CompilationGroup()
 *
 * for (let file of files) {
 *     let fileStream = compilationGroup.createStream()
 *     let res = await fs.
 * }
 */
export default class CompilationGroup {
    /**
     * Creates an empty compilation group. If using a VSLModule object or
     * similar you can access the {@link GroupMetadata} field for providing
     * applicable info. Use `.createStream()` to add a stream, then call
     * compile. Streams are the input source for compilation.
     */
    constructor() {
        /** @private */
        this.sources = [];

        // Map<name, CompilationHook>
        /** @private */
        this.hooks = new Map();

        // Strong hooks = hooks that are binded to every stream in the group.
        /** @private */
        this.strongHooks = new Map();

        // Manages global scope
        /**
         * The root global scope of the entire module, each child statement is
         * an individual stream.
         *
         * @readonly
         * @type {?CodeBlock}
         */
        this.globalScope = null;

        /** @private */
        this.context = new TransformationContext();

        /**
         * An auto-generated list of metadata for this group. It may not be
         * fully filled so make sure you specify fields that you know the values
         * of before passing it to other functions & classes.
         * @type {GroupMetadata}
         */
        this.metadata = new GroupMetadata();

        /**
         * Compilation server to use if applicable
         * @type {?CompilationServerClient}
         */
        this.compilationServer = null;

        /** @private */
        this.callback = () => {};
    }

    /**
     * Returns a compilationStream which you can setup to send data.
     * @return {CompilationStream} A stream which you can send data to/from
     */
    createStream() {
        let stream = new CompilationStream();
        stream.owningGroup = this;
        this.sources.push(stream);
        return stream;
    }

    /**
     * Parses a CompilationStream and returns the AST
     * @private
     */
    async parse(stream) {
        // Check if we can use cache
        // Cache this if there is a dir specified.
        if (this.metadata.cacheDirectory && stream.sourceName) {
            const cacheFilename = ASTSerializer.getSerializedFilenameFor(stream.sourceName);
            const cacheFile = path.join(this.metadata.cacheDirectory, cacheFilename);

            if (await pathExists(cacheFile)) {
                const cacheMadeTime = (await stat(cacheFile)).mtimeMs;
                const sourceModifiedTime = (await stat(stream.sourceName)).mtimeMs;

                if (cacheMadeTime >= sourceModifiedTime) {
                    const deserializedAst = await ASTSerializer.decodeFrom(createReadStream(cacheFile), {
                        compiledFileName: cacheFile,
                        overrideSourceStream: stream
                    });
                    return deserializedAst;
                } else {
                    // console.log(`rebuilding ${stream.sourceName} ${cacheMadeTime} < ${sourceModifiedTime}`);
                }
            }
        }

        let parserResult;

        if (this.compilationServer) {
            while (null !== await stream.receive()) {
                // Keep obtaining data
            }

            // Now that all the stream data is loaded we'll compile it on the
            // server
            const result = await this.compilationServer.parse(stream, {
                overrideSourceData: stream.data, // Used to reannotate AST
                overrideSourceStream: stream
            });

            parserResult = result;
        } else {
            let dataBlock, ast;
            let parser = new VSLParser();

            while (null !== (dataBlock = await stream.receive())) {
                try {
                    ast = parser.feed(dataBlock);
                } catch(error) {
                    // Re-add sourceName if applicable
                    if (error instanceof ParserError)
                        error.stream = stream;

                    // Rethrow error
                    throw error;
                }
                if (ast.length > 0) break;
            }

            if (ast.length === 0) {
                // TODO: expand error handling here
                throw new ParserError(
                    `Unexpected token EOF`,
                    null,
                    stream
                );
            }

            parserResult = ast[0];
        }

        // Cache this if there is a dir specified.
        if (this.metadata.cacheDirectory && stream.sourceName) {
            const cacheFilename = ASTSerializer.getSerializedFilenameFor(stream.sourceName);
            const cacheWriteStream = createWriteStream(
                path.join(this.metadata.cacheDirectory, cacheFilename),
                { flags: 'w+' }
            );

            const serializer = new ASTSerializer(parserResult, {
                sourceFile: path.relative(this.metadata.cacheDirectory, stream.sourceName)
            });

            await serializer.serializeTo(cacheWriteStream);
        }

        parserResult.stream = stream;

        return parserResult;
    }

    /**
     * Lazily 'hooks' a CompilationHook to the current one. Call this *before*
     * {@link CompilationGroup~compile}.
     *
     * @param  {CompilationHook} hook A compilation hook with the desirded
     *                                module and metadata setup. This name is
     *                                the reference it's added by.
     */
    lazyHook(hook) {
        this.hooks.set(hook.name, hook);
    }

    /**
     * If a lazy hook is not already binded. You can register a function to be
     * called which should generate the lazy hook.
     * @param {function(name: string)} hook
     */
    lazyHookCallback(hook) {
        this.callback = hook;
    }

    /**
     * Te name of a {@link ComilationHook} which should be binded and hooked to
     * every file rather than on-demand. Examples of this are the standard
     * library.
     *
     * @param  {CompilationHook} hook Name of the module exactly as it appears
     *                                in the {@link CompilationHook}
     */
    strongHook(hook) {
        this.strongHooks.set(hook.name, hook);
    }

    /**
     * Compiles the sources. It's reccomended to use a `CompilationIndex` to
     * manage this because configuration and modules happen there. If backend
     * and stream are not provided, the code will merely be prepared for
     * compilation.
     *
     * @param  {?Backend}  backend The backend which will manage
     *                             compilation. Do not reuse backends.
     */
    async compile(backend) {
        // == 0: Check Cache ==
        if (this.metadata.cacheDirectory) {
            await mkdirs(this.metadata.cacheDirectory);
        }

        // === 1: Parse ===
        // Parse all ASTs in parallel
        let asts = await Promise.all( this.sources.map(::this.parse) );

        // === 2: Environment Setup ===
        // This will be our new AST of the entire module with a global shared
        // scope
        let block = new CodeBlock(asts, null);
        block.scope = new Scope();

        this.globalScope = block;

        // Go through each import statement that each file specifies
        // O: KEEP
        this.strongHooks.forEach(hook => {
            if (hook.context) this.context.merge(hook.context);
            hook.scope.forEach(scopeItem => {
                block.scope.set(scopeItem)
            });
        });

        // Handle modules, this adds lazyHooks to the scope
        // Each file manages its own imports so we'll check here
        for (let i = 0; i < asts.length; i++) {
            const file = asts[i];

            // Also lets setup CodeBlock as a top-level scope
            file.scope.parentScope = block.scope;

            for (let j = 0; j < file.lazyHooks.length; j++) {
                const hookNode = file.lazyHooks[j];

                hookNode.parentScope = file;

                let hook = this.hooks.get(hookNode.name);

                if (!hook) {
                    await this.callback(hookNode.name);
                    hook = this.hooks.get(hookNode.name);

                    throw new TransformError(
                        `Could not find module named ${hookNode.name}`,
                        hookNode,
                        e.UNDEFINED_MODULE
                    );
                }

                hook.scope.forEach(scopeItem => {
                    let res =  file.scope.set(scopeItem);
                    if (res === false) throw new TransformError(
                        `Importing module \`${hookNode.value}\` results in ` +
                        `duplicate declaration of \`${scopeItem.toString()}\``,
                        hookNode,
                        e.DUPLICATE_BY_IMPORT
                    );
                });
            };
        };

        // === 3: Setup AST ===
        // Setup for processing by setting up and connecting the AST graph
        // nodes
        new ScopeTraverser(true).queue(block);

        // === 4: Pre-processor ===
        // Now that basic STL etc. are registered, we can pre-proc the AST
        // and pre-populate compilation info.
        new VSLPreprocessor(this.context).queue(block);

        // === 4B: Scope Sharing ===
        // Hook all the news ASTs together
        // This will addd the public, protected, and no-access-modifier
        // declarations to our new scope (`block`).
        new PropogateModifierTraverser(
            PROPAGATION_CONFIG,
            (scopeItem) => block.scope.set(scopeItem)
        ).queue(asts); // `asts` is already an ast of sorts.


        // === 5: Scope Generation ===
        // This will finish generating the type scope. The next transformer
        // performs type deduction.
        new VSLScopeTransformer(this.context).queue(block);

        // === 5B: Scope Sharing ===
        // Hook all the news ASTs together (again)
        new PropogateModifierTraverser(
            PROPAGATION_CONFIG,
            (scopeItem) => block.scope.set(scopeItem)
        ).queue(asts); // `asts` is already an ast of sorts.

        // === 6B: Early Expression Resolution ===
        new VSLPretransformer(this.context).queue(block);

        // Resolves early expressions
        new PropogateModifierTraverser(
            PROPAGATION_CONFIG,
            (scopeItem) => block.scope.set(scopeItem)
        ).queue(asts); // `asts` is already an ast of sorts.

        // === 6B: Early Evaluated Hooks ===

        // === 6C: Expression Resolution ===
        // Now `block` is our AST with all the important things.
        // The VSLTransformer will do remaining checks so we'll use it to do the
        // type checking etc.
        new VSLTransformer(this.context).queue(block);

        // Run it through the backend
        if (backend) {
            backend.run(block.statements);
        }
        return;
    }
}
