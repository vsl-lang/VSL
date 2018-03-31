import fs from 'fs-extra';
import path from 'path';

import pug from 'pug';
import less from 'less';

import render from './helpers/render';

import HTMLClassGenerator from './HTMLClassGenerator';
import HTMLFuncGenerator from './HTMLFuncGenerator';
import HTMLTypealiasGenerator from './HTMLTypealiasGenerator';

import { DOC_VERSION } from '../DocGen';
import DocError from '../DocError';

export const ASSET_DIRECTORY = 'assets';

/**
 * Generates HTML documentation.
 */
export default class HTMLGen {
    /**
     * Creates HTML generator with output directory. Assumes write access
     * exists.
     * @param {string} outputDirectory
     */
    constructor(outputDirectory) {
        /** @type {string} */
        this.outputDirectory = outputDirectory;

        /** @type {Map<string, string>} */
        this.glossay = new Map();
    }

    /**
     * Gets the path of an output file.
     * @param {string} filePath
     * @return {string}
     */
    getOutPath(filePath) {
        return path.join(this.outputDirectory, filePath);
    }


    /**
     * Creates a file write stream
     * @param {string} filePath
     * @return {WriteStream}
     */
    createFile(filePath) {
        return fs.createWriteStream(this.getOutPath(filePath));
    }

    /**
     * Obtains an asset path
     * @param {string} asset
     * @return {string} path
     */
    getAssetPath(asset) {
        return path.join(__dirname, ASSET_DIRECTORY, asset);
    }

    /**
     * Copies an asset to the output directory
     * @param {string} name - asset name
     * @param {string} path - Output path
     */
    copyAsset(name, path) {
        let out = this.createFile(path);
        let source = fs.createReadStream(this.getAssetPath(asset));
        source.pipe(out);
    }

    /**
     * Obtains HTML generator for type
     * @param {string} type
     * @return {HTMLGenerator}
     * @throws {DocError}
     */
    getGeneratorForType(type) {
        switch (type) {
            case 'class_generic':
            case 'class': return new HTMLClassGenerator(this);
            case 'function': return new HTMLFuncGenerator(this);
            case 'typealias': return new HTMLTypealiasGenerator(this);
            default: throw new DocError(
                `Unknown type ${type}`
            )
        }
    }

    /**
     * Generates an item
     * @param {item}
     * @throws {DocError}
     */
    generateItem(item) {
        this.getGeneratorForType(item.ty).generate(item);
    }

    /**
     * Creates an HTML from the root asset
     * @param {string} output
     * @param {string} asset - Path to HTML file
     * @return {Function}
     */
    getHTMLFor(output, asset) {
        const rootPath = path.join('.', path.relative(path.dirname(output), '.'));
        const template = pug.compileFile(this.getAssetPath(asset));

        return async (data = {}) => {
            await this.writeOutFile(
                output,
                template({
                    items: this.items,
                    module: this.module,
                    rootPath: rootPath,
                    render: (text) => render(text, rootPath, this),
                    ...data
                })
            );
        };
    }

    /**
     * Writes a file
     * @param {string} output - The relative path
     * @param {string} content
     */
    async writeOutFile(output, content) {
        const outPath = this.getOutPath(output);

        await fs.mkdirp(path.dirname(outPath));
        await fs.writeFile(outPath, content, 'utf8')
    }

    get items() { return this._items || []; }
    set items(value) { this._items = value; }

    get module() { return this._module || {}; }
    set module(value) { this._module = value; }

    /**
     * Begins generation from a JSON
     * @param {Object} json The documentation JSON
     * @throws {DocError}
     */
    async generate(json) {
        const version = json.version;
        if (version !== DOC_VERSION) {
            throw new DocError(`Unsupported version ${version || 'na'}`);
        }

        const items = json.items;

        this.items = items;
        this.module = json.module;

        // First we'll copy CSS
        const style = this.createFile('style.css');
        const styleSource = this.getAssetPath('style.less');
        fs.readFile(styleSource, 'utf8')
            .then(content => less.render(content, { filename: styleSource }))
            .then(({ css }) => style.write(css, 'utf8'));

        this.getHTMLFor('index.html', 'home.pug')();

        await Promise.all(
            items.map(
                item => this.getGeneratorForType(item.ty).generate(item)
            )
        );
    }
}
