import util from 'util';

import VSLTokenizer from '../src/vsl/parser/vsltokenizer';
export VSLTokenizer from '../src/vsl/parser/vsltokenizer';

import VSLParser from '../src/vsl/parser/vslparser';
export VSLParser from '../src/vsl/parser/vslparser';

export VSLTokenType from '../src/vsl/parser/vsltokentype';

function vslStr(source) {
    return source.isVSL ? source : vsl(source);
}

/**
 * VSL code tagged literal
 */
export function vsl(source) {
    if (source instanceof Array) source = source[0];
    return {
        src: source,
        formattedLine: source.replace(/([}{()])\n/g, "$1").replace(/\n/g, "\\n").replace(/ +/g, " "),
        formatted: source.indexOf("\n") > -1 ? "\n" + source.replace(/^/gm, "    ") : source,
        isVSL: true
    };
}

/**
 * Parses VSL code (tempalte string)
 */
export function parseVSL(source) {
    if (source instanceof Array) source = source[0];
    let res;
    try {
        let p = new VSLParser().feed(source);
        if (p.length === 0) return null;
        res = p;
    } catch (e) {
        return null;
    }
    return p
}


/**
 * Verifies if a syntax is a valid syntax
 * 
 * @param {string} source - string to validate
 */
export function valid(source) {
    source = vslStr(source);
    it(`should parse \`${source.formattedLine}\``, () => {
        let res;
        try {
            res = new VSLParser().feed(source.src);
        } catch(e) {
            throw new TypeError(
                `Parser Error: \`${source.formatted}\` expected to be valid but threw error` +
                `: \n ${e}`
            );
        }
        if (res.length === 0) {
            throw new TypeError(
            `Parser Error: \`${source.formatted}\` expected to be valid but threw error` +
            ` (incomplete source)`
            );
        }
    });
};

export function invalid(source) {
    source = vslStr(source);
    it(`should break on \`${source.formattedLine}\``, () => {
        let res;
        
        try {
            res = new VSLParser().feed(source.src);
        } catch(e) {
            return;
        }
        
        if (res.length > 0) {
            throw new TypeError(
                `Parse Error: \`${source.formatted}\` expected to break but worked.`
            );
        }
    });
}

/**
 * Returns the tokenizes array from a string.
 * 
 * @param {string} source - string to tokenize
 * @return {(Object|string)[]} - result
 */
export function tokenize( string ) {
    return new VSLTokenizer().tokenize(string)
}

/**
 * Determines if two tokenized items are equal.
 * 
 * @param {(Object|string)[]} actual - Actual value
 * @param {(Object|string)[]} expected - Expected value
 * @return {boolean|Objcet} True if worked, otherwise returns object
 */
export function compareToken(actual, expected) {
    if (actual.length !== expected.length) return false;
    let same = true;
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] instanceof Array) {
            if (actual[i][0] !== expected[i][0] ||
                actual[i][1] !== expected[i][1]) {
                same = false;
                break;
            }
        } else {
            if (actual[i].value !== expected[i].value) {
                same = false;
                break;
            }
        }
    }
    
    if (same === false) {
        return actual;
    } else {
        return true;
    }
}

/**
 * Expects the function to break
 */
export function expectBork(f, desc = "") {
    return () => {
        try {
            f()
            throw new Error(`Expected \`${desc}\` to break but worked.`);
        } catch(e) {
            return true;
        }
    }
}

/**
 * Determines if two tokenized items are equal.
 * 
 * @param {string} source - Actual value
 * @param {(Object|string)[]} expected - Expected value
 * @return {boolean} True if same, false otherwise
 */
export function compareTokenizer(source, expected) {
    return () => {
        let result = compareToken(tokenize(source), expected);
        if (result !== true) {
            throw new Error(
                `Tokenizer Error: \`${source}\` expected to output: \n` +
                `    ${util.inspect(expected)}\n` +
                `but instead outputted: \n` +
                `    ${util.inspect(result)}`
            );
        }
    }
}