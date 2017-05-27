import strToAST from '../utils/strToAST';

/*global include*/
const STL = {
    Int: strToAST(include("./Int.vsl")),
    Number: strToAST(include("./Number.vsl")),
    String: strToAST(include("./String.vsl"))
};

export default STL;