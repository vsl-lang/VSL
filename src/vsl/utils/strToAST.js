import VSLParser from '../parser/vslparser';

/**
 * Converts a string to a raw VSL AST. Must be processed.
 */
export default function strToAst(src: string) {
    return new VSLParser().feed(src);
}