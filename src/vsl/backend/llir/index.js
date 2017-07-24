import Backend from '../Backend';
import * as w from './watchers';

/**
 * ## LLIR
 * LLIR is the default VSL
 */
export default class LLIR extends Backend {
    /**
     * Creates LLIR backend with given output stream/output location/
     * @param  {BackendStream} stream A backend stream object set to receive the
     *                                LLVM IR output.
     */
    constructor(stream) {
        super(stream, [
            w.CodeBlock,
            w.AssignmentStatement
        ]);
        
        /**
         * Expression counter. Intermediate values stored here
         * @type {string}
         */
        this.register = 0;
        
        /**
         * Instruction list for top-level expressions
         * @type {string[]}
         */
        this.rootMain = [];
        
        /**
         * Top-level declrations
         * @type {string[]}
         */
        this.declarations = [];
        
        /**
         * ScopeTypeItem declaration map (type item -> IR)
         * @type {Map<ScopeTypeItem, string>}
         */
        this.typeDecls = new Map();
        
        /**
         * attribute counter.
         *
         * 1 = attributes for `main`
         * @type {Number}
         */
        this.attributes = [
            `noinline nounwind`
        ];
    }
    
    pregen() {
        this.stream.write(
            `; VSL LLIR Compiler\n`
        );
    }
    
    postgen() {
        
        ////////////////////////////////////////////////////////////////////////
        //                             postgen                                //
        ////////////////////////////////////////////////////////////////////////
        for (let i = 0; i < this.declarations.length; i++) {
            this.stream.write(this.declarations[i]);
            this.stream.write('\n\n');
        }
        
        ////////////////////////////////////////////////////////////////////////
        //                             rootMain                               //
        ////////////////////////////////////////////////////////////////////////
        this.stream.write(
            `define i32 @main(i8**, i32) #0 {\nentry:\n`
        );
        
        for (let i = 0; i < this.rootMain.length; i++) {
            this.stream.write(`${this.rootMain[i]}\n`);
        }
        
        this.stream.write(`    ret i32 0\n}\n\n`)
        
        ////////////////////////////////////////////////////////////////////////
        //                           attributes                               //
        ////////////////////////////////////////////////////////////////////////
        for (let i = 0; i < this.attributes.length; i++) {
            this.stream.write(`attributes #${i} = { ${ this.attributes[i] } }\n`)
        }
    }
}
