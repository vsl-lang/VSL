import Backend from '../Backend';

export default class LLIR extends Backend {
    constructor(stream) {
        super(stream, [
            
        ]);
        
        /**
         * Instruction list for top-level expressions
         * @type {string[]}
         */
        this.rootMain = [];
    }
    
    pregen() {
        this.stream.send(
            `; VSL LLIR Compiler\n`
        );
    }
    
    postgen() {
        this.stream.send(
            `define i32 @main(i8**, i32) {\nentry:\n`
        );
        
        for (let i = 0; i < this.rootMain.length; i++) {
            this.stream.send(`    ${this.rootMain[i]}\n`);
        }
        
        this.stream.send(`ret i32 0\n}`)
    }
}
