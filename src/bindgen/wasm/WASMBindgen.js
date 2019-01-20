import Bindgen from '../Bindgen';
import WebIDL2 from 'webidl2';
import * as generators from './generators';

import fs from 'fs-extra';
import path from 'path';

function streamFinished(stream) {
    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
    });
}

/**
 * Bindgen for WASM items. This generates, using the VSL dispatch interface,
 * VSL files which communicate with then.
 *
 * ## Options
 *
 *  - `prefix: string = ""`: specifies a prefix to add to every class name.
 */
export default class WASMBindgen extends Bindgen {

    /** @override */
    async alreadyBuilt() {
        return false;
    }

    /**
     * Indents a string
     * @param {string} string
     * @return {string}
     */
    indent(string) {
        return string.split("\n").map(i => `    ${i}`).join("\n");
    }

    /**
     * Formats a TYPE identifier. Adds things like prefixes and prevents
     * conflicts with keywords
     * @param {string} identifier
     * @return {string}
     */
    formatIdentifier(identifier) {
        switch (identifier) {
            case 'interface': return '_interface';
            case 'init': return '_init';

            default: return identifier;
        }
    }

    /**
     * Formats a TYPE reference.
     * @param {Object} type - idlType
     * @return {string}
     */
    formatType(type) {
        if (type.generic) {
            const args = type.idlType
                .map(type => this.formatType(type))
                .join(", ");

            return `${this.convertType(type.baseName)}<${args}>`;
        } else {
            return this.convertType(type.baseName);
        }
    }

    /**
     * Formats a type name to either VSL class or JS
     * @param {string} name
     * @return {string}
     */
    convertType(name) {
        switch (name) {
            case 'DOMHighResTimeStamp': // WHATWG does not define this so temp hack
            case 'short':
            case 'long': return 'Int';

            case 'boolean': return 'Bool';


            case 'DOMString': return 'String';

            case 'sequence': return 'Array';

            case 'any': return 'JSValue';
            case 'void': return 'Void';

            default: return this.formatIdentifier(name);
        }
    }

    /** @private */
    async generate(sourceFile) {
        // Parses a given source path
        const source = await fs.readFile(sourceFile, { encoding: 'utf8' });
        const ast = WebIDL2.parse(source);

        const inputName = path.basename(sourceFile, path.extname(sourceFile));
        const output = path.join(this.outputDirectory, `${this.outputName}.${inputName}.vsl`);

        const outputStream = fs.createWriteStream(output, {
            encoding: 'utf8',
            flags: 'w',
        });

        // Run first layer of process including resolving mixins
        const mixinNameMap = new Map();
        const mixinMap = new Map();
        for (let i = 0; i < ast.length; i++) {
            const item = ast[i];
            const itemType = item.type;

            switch (itemType) {
                case 'includes':
                    const targetName = item.target;
                    const mixinName = item.includes;

                    let mixin;
                    if (mixinNameMap.has(mixinName)) {
                        mixin = mixinNameMap.get(mixinName);
                    } else {
                        mixin = { name: mixinName };
                        mixinNameMap.set(name, mixin);
                    }

                    if (mixinMap.has(targetName)) {
                        mixinMap.get(targetName).push(mixin);
                    } else {
                        mixinMap.set(targetName, [mixin])
                    }

                    break;

                case 'interface mixin':
                    const name = item.name;
                    if (mixinNameMap.has(name)) {
                        mixinNameMap.get(name).value = item.members;
                    } else {
                        mixinNameMap.set(name, { name: name, value: item.members });
                    }

                    break;
            }
        }

        /**
         * Matches itf to references of their properties.
         * @type {Map<string, Object>}
         */
        this.mixinMap = mixinMap;

        for (let i = 0; i < ast.length; i++) {
            const item = ast[i];
            const itemType = item.type;

            switch (itemType) {
                case 'interface':
                    outputStream.write(generators.InterfaceGenerator(item, this));
                    break;

                case 'dictionary':
                    outputStream.write(generators.TupleGenerator(item, this));
                    break;
            }
        }

        outputStream.end();
        await streamFinished(outputStream);
    }

    /** @override */
    async run() {
        await fs.ensureDir(this.outputDirectory);

        await Promise.all(
            this.sources
                .map(
                    sourceFile => this.generate(sourceFile)));
    }

}
