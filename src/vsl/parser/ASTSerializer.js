import fs from 'fs-extra';
import path from 'path';
import msgpack from 'msgpack-lite';
import lz4 from 'lz4';
import t from './nodes';
import Scope from '../../vsl/scope/scope';

import { createHash } from 'crypto';
import * as Nodes from './nodes';

// Signature for VSLC file (0VSL\n)
export const VSLC_SIGNATURE = new Uint8Array([0x30, 0x56, 0x53, 0x4C, 0x0A]);

// VSL data signature for version (one byte).
export const VSLC_DS_VERSION = Buffer.from([0xFF, 0xFF]);

// VSL data signature for a source file path (null string).
export const VSLC_DS_SOURCEFILE = Buffer.from([0xFF, 0xA0]);

// VSL data signature for primary data block (remainder of file).
export const VSLC_DS_PRIMARYDATA = Buffer.from([0xFF, 0xF0]);


// Current supported version
export const VSLC_CURRENT_VERSION = 2;



// Bytes which indicate an AST node
export const AST_NODE_EXT = 0x40;
// Bytes which indicate a scope
export const AST_SCOPE_EXT = 0x41;
// Bytes which indicate an Identifier
export const AST_IDENTIFIER_EXT = 0x42;

export const AST_DEC_TO_ENC = new Map([
    // ['isGenerator', '?G'],
    // ['isOverriding', '?O'],
    ['statements', '_s'],
    ['identifier', '_i'],
    ['expression', '_e'],
    ['original', '_o'],
    ['typedId', '_T'],
    ['literal', '_l'],
    ['value', '_v'],
]);

export const AST_ENC_TO_DEC = new Map([...AST_DEC_TO_ENC].map(([key, value]) => [value, key]));

function compare(a, b) {
    for (let i = 0; i < b.length; i++) {
        if (!a || a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

function codec(sourceFileString) {
    const codec = msgpack.createCodec({ preset: true });

    // Preprocess to get the index => line number.
    let newlineIndices = [0];
    if (sourceFileString) {
        let i = 0;
        for (; i < sourceFileString.length; i++) {
            if (sourceFileString[i] === '\n') {
                newlineIndices.push(i);
            }
        }
    }

    function serializeNode(object) {
        const nodeName = object.constructor.name;
        const serializedName = nodeName
            .replace(/Expression/g, '$')
            .replace(/Statement/g, '@');
        const obj = {
            "_t": serializedName,
        };

        // Get all properties
        const props = Object.keys(object)
            .filter(key => !(
                // Exclude key if 1) `== null` 2) `is Scope`
                object[key] == null ||
                [
                    'lazyHooks', 'parentNode', 'relativeName',
                    'argPositionsTreatedOptional', 'stream'
                ].includes(key)
            ))
            .forEach(propName => {
                if (object[propName] instanceof Scope) {
                    obj[propName] = object[propName];
                } else if (propName === 'position') {
                    obj._p = {
                        i: object.position.index,
                        l: object.position.length
                    };
                } else if (AST_DEC_TO_ENC.has(propName)) {
                    obj[AST_DEC_TO_ENC.get(propName)] = object[propName];
                // } else if (propName === 'precedingComments') {
                //     // We don't care about comments
                } else {
                    obj[propName] = object[propName];
                }
            });


        const result = msgpack.encode(obj, { codec });
        return result;
    }

    function unserializeNode(buffer) {
        const node = msgpack.decode(buffer, { codec });
        const nodeType = node._t
            .replace(/\$/g, 'Expression')
            .replace(/@/g, 'Statement');
        const newNode = new t[nodeType];

        for (const [key, value] of Object.entries(node)) {
            if (key.indexOf('_') !== 0) {
                newNode[key] = value;
            } else if (AST_ENC_TO_DEC.has(key)) {
                newNode[AST_ENC_TO_DEC.get(key)] = value;
            } else if (key === '_p') {
                if (sourceFileString) {
                    let line = 0;
                    let lineIndex = 0;

                    for (let i = 0; i < newlineIndices.length; i++) {
                        if (newlineIndices[i] > value.i) {
                            break;
                        } else {
                            lineIndex = newlineIndices[i];
                            line = i;
                        }
                    }

                    newNode.position = {
                        line: line + 1,
                        column: value.i - lineIndex,
                        index: value.i,
                        length: value.l,
                        value: sourceFileString.substr(value.i, value.l)
                    };
                } else {
                    newNode.position = {
                        line: 0,
                        column: 0,
                        index: value.i,
                        length: value.l,
                        value: ""
                    }
                }
            }
        }

        return newNode;
    }

    codec.addExtPacker(AST_SCOPE_EXT, Scope, () => {
        return msgpack.encode({}, { codec });
    });

    codec.addExtUnpacker(AST_SCOPE_EXT, () => {
        return new Scope();
    });

    codec.addExtPacker(AST_IDENTIFIER_EXT, t.Identifier, (id) => {
        return msgpack.encode([id.value, id.position.index, id.position.length], { codec });
    });

    codec.addExtUnpacker(AST_IDENTIFIER_EXT, (buffer) => {
        const [value, index, length] = msgpack.decode(buffer, { codec });
        const newNode = new t.Identifier(value);

        if (sourceFileString) {
            let line = 0;
            let lineIndex = 0;

            for (let i = 0; i < newlineIndices.length; i++) {
                if (newlineIndices[i] > index) {
                    break;
                } else {
                    lineIndex = newlineIndices[i];
                    line = i;
                }
            }

            newNode.position = {
                line: line + 1,
                column: index - lineIndex,
                index: index,
                length: length,
                value: sourceFileString.substr(index, length)
            };
        } else {
            newNode.position = {
                line: 0,
                column: 0,
                index: index,
                length: length,
                value: ""
            };
        }

        return newNode;
    });

    for (const cls of Object.values(t)) {
        if (cls instanceof Function && cls !== t.Identifier) {
            codec.addExtPacker(AST_NODE_EXT, cls, serializeNode);
            codec.addExtUnpacker(AST_NODE_EXT, unserializeNode);
        }
    }

    return codec;
}

/**
 * This serializes and de-serializes a parser
 */
export default class ASTSerializer {

    /**
     * Create a **serialization** instance
     * @param {CodeBlock} ast - Root codeblock
     * @param {Object} [o={}] - Additional options to pass.
     * @param {string} o.sourceFile - The source file this ast is from.
     */
    constructor(ast, { sourceFile = "" } = {}) {
        this._ast = ast;
        this._sourceFile = sourceFile;
    }

    /**
     * Obtains AST
     * @return {Object}
     */
    get ast() { return this._ast }

    /**
     * Serializes and emits to a stream
     * @param {WritableStream} stream
     * @async
     */
    serializeTo(stream) {
        return new Promise((resolve) => {

            const encoder = msgpack.createEncodeStream({ codec: codec() });
            const compressor = lz4.createEncoderStream();

            // Write signature '0VSL\n'
            stream.write(Buffer.from(VSLC_SIGNATURE));

            stream.write(VSLC_DS_VERSION);
            stream.write(Buffer.from([VSLC_CURRENT_VERSION]));

            // Indicates a source file follows
            if (this._sourceFile) {
                stream.write(VSLC_DS_SOURCEFILE);
                stream.write(this._sourceFile + '\n');
            }

            stream.write(VSLC_DS_PRIMARYDATA);

            encoder.pipe(compressor).pipe(stream);
            encoder.write(this._ast);

            encoder.encoder.flush();

            compressor.on('finish', () => {
                resolve();
            });

            compressor.end();
        });
    }

    /**
     * Deserializes into AST given input stream
     * @param {ReadableSteam} stream - Stream to decode
     * @param {Object} [o={}] - additional options
     * @param {?string} [o.compiledFileName=null] - Serialized source as path (if exists).
     * @param {string} [o.overrideSourcePath=null] - When decoding use a custom source path for data
     * @param {string} [o.overrideSourceData=null] - Custom source data string. Used to reannotate AST
     * @param {CompilationStream} [o.overrideCompilationStream=null] - Custom stream to use. Does not use for data instead attached to AST
     * @return {ASTSerializer} serializer with the ast.
     * @throws {TypeError} if couldn't be decoded
     * @async
     */
    static decodeFrom(stream, { compiledFileName, overrideSourcePath, overrideSourceData, overrideSourceStream } = {}) {
        return new Promise((resolve) => {
            stream.setEncoding('binary');

            let data = null;
            stream.on("data", (chunk) => {
                if (!data) {
                    data = Buffer.from(chunk, 'binary');
                } else {
                    data = Buffer.concat([data, Buffer.from(chunk, 'binary')]);
                }
            });

            stream.on("end", () => {
                if (!data) {
                    throw new TypeError(`no vslc data for ${compiledFileName} (${(overrideSourceStream && overrideSourceStream.sourceName) || overrideSourceStream || 'n/a'})`);
                }

                let i = 0;

                // Check magic bytes
                const signature = compare(data, VSLC_SIGNATURE);
                i += VSLC_SIGNATURE.length;
                if (!signature) {
                    throw new TypeError('not a vslc file');
                }

                let sourceName = null;

                // Add three because we read three extra bytes for the full
                // block identifier.
                parser:
                while (i + 1 < data.length) {
                    const blockType = data.readUInt16BE(i);
                    i += 2;

                    switch(blockType) {
                        case VSLC_DS_VERSION.readUInt16BE(): {
                            const version = data.readUInt8(i++);
                            if (version !== VSLC_CURRENT_VERSION) {
                                throw new TypeError(
                                    `Version mismatch vslc type ${version} ` +
                                    `current is ${VSLC_CURRENT_VERSION}`
                                );
                            }
                            break;
                        }

                        case VSLC_DS_SOURCEFILE.readUInt16BE(): {
                            let start = i,
                                char;

                            while ((char = data[i++]) && char !== 0x0A);
                            const sourceFileName = data.slice(start, i - 1).toString();
                            sourceName = path.join(
                                path.dirname(compiledFileName),
                                sourceFileName
                            );
                            break;
                        }

                        case VSLC_DS_PRIMARYDATA.readUInt16BE():
                            (async () => {
                                let source = null;

                                if (overrideSourceData) {
                                    source = overrideSourceData;
                                } else {
                                    const sourceNameToUse = overrideSourcePath || sourceName;
                                    if (sourceNameToUse && await fs.pathExists(sourceNameToUse)) {
                                        source = await fs.readFile(sourceNameToUse, 'utf8');
                                    }
                                }

                                const decompressor = lz4.createDecoderStream();
                                decompressor.write(data.slice(i));

                                const decoder = msgpack.createDecodeStream({ codec: codec(source) })
                                decompressor.pipe(decoder).on("data", (result) => {
                                    if (overrideSourceStream) {
                                        result.stream = result;
                                    }

                                    resolve(result);
                                });
                            })();

                            break parser;

                        default:
                            throw new TypeError(`Unknown vslc block type ${blockType.toString(16)}`);
                    }
                }
            });
        });
    }

    /**
     * Gets the serialized name for a full file path
     * @param {string} fileName
     * @return {string} filename for serialized file
     */
    static getSerializedFilenameFor(fileName) {
        const name = path.basename(fileName, path.extname(fileName));
        return `${name}.${createHash('sha1').update(fileName).digest('hex').substring(0, 7)}.vslc`;
    }

}
