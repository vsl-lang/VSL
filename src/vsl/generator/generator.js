/**
 * Controls LLVM IR genereration. Handles expressions, registers, and related
 * operations.
 */
export default class Generator {
    constructor() {
        /**
         * A stack of the currently generated stack. 
         * @type {GeneratorScope[]}
         */
        this.generatorStack = [];
        
        /**
         * Contains the generated IR
         * Do __NOT__ directly write to. Probably shuold be a buffer or a
         * Uint8Array
         * 
         * @type {String}
         */
        this.generated = "";
    }
    
    begin(rootName, stl) {
        let string = stl["string"];
        this.root(
`
; vsl=v1.0
; emp=v3.0

define ${string} @load() {

}
define i32 @main() {
    
    call notail i32 @${rootName}()
}`
        );
    }
    
    root(string) {
        this.generated = string + "\n";
    }
}