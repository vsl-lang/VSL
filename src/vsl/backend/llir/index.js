import Backend from '../Backend';
import * as w from './watchers';

export default class LLIR extends Backend {
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
        this.stream.send(
            `; VSL LLIR Compiler\n`
        );
    }
    
    postgen() {
        
        ////////////////////////////////////////////////////////////////////////
        //                             postgen                                //
        ////////////////////////////////////////////////////////////////////////
        for (let i = 0; i < declarations.length; i++) {
            this.stream.send(declarations[i][j]);
            this.stream.send('\n\n\n');
        }
        
        ////////////////////////////////////////////////////////////////////////
        //                             rootMain                               //
        ////////////////////////////////////////////////////////////////////////
        this.stream.send(
            `define i32 @main(i8**, i32) #0 {\nentry:\n`
        );
        
        for (let i = 0; i < this.rootMain.length; i++) {
            this.stream.send(`    ${this.rootMain[i]}\n`);
        }
        
        this.stream.send(`ret i32 0\n}\n\n`)
        
        ////////////////////////////////////////////////////////////////////////
        //                           attributes                               //
        ////////////////////////////////////////////////////////////////////////
        for (let i = 0; i < this.attributes.length; i++) {
            this.stream.send(`attributes #${i} = { ${ this.attributes[i] } }\n`)
        }
    }
}
