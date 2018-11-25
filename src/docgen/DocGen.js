import fs from 'fs-extra';
import pug from 'pug';
import path from 'path';
import sass from 'node-sass';

import * as w from './watchers';


const STYLESHEET_SOURCE_PATH = 'styles';
const STYLESHEET_PATH = 'assets/styles.css';

/**
 * This is the documentation generator class. The VSL documentation generator
 * will output HTML files given an output directory.
 */
export default class DocGen {

    /**
     * Creates docgen instance.
     * @param {Object} opts
     * @param {Scope} opts.scope - Scope to generate for
     * @param {VSLModule} opts.module
     * @param {string} opts.outputDirectory
     */
    constructor({ scope, module, outputDirectory }) {
        /**
         * The scope which to generate docs for.
         * @type {Scope}
         */
        this.scope = scope;

        /**
         * Module with information about doc generation.
         * @type {VSLModule}
         */
        this.module = module;

        /**
         * Output directory.
         * @type {string}
         */

        this.outputDirectory = outputDirectory;

        /** @private */
        this.scopeDataMap = new Map();

        /** @private */
        this.itemsToGenerate = [];

        /** @private */
        this.sections = {};
    }

    /**
     * Starts generation
     */
    async generate() {
        const items = [].concat(...this.scope.ids.values())
            .filter(scopeItem => !scopeItem.isScopeRestricted);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemWatcher = this.getWatcherForItem(item);

            if (!itemWatcher) continue;

            const typeIdentifier = itemWatcher.typeDescription;
            const allItemsOfType = (this.sections[typeIdentifier] || {
                items: {},
                watcher: itemWatcher
            });

            const groupingIdentifier = itemWatcher.urlFor(item);
            const existingGroup = allItemsOfType.items[groupingIdentifier];

            if (existingGroup) {
                existingGroup.push(item);
            } else {
                allItemsOfType.items[groupingIdentifier] = [item];
            }

            this.sections[typeIdentifier] = allItemsOfType;
        }

        console.log(Object
            .values(this.sections)
            .map(section => Object.values(section.items)));
        for (const itemPage of
            Object
                .values(this.sections)
                .map(section => Object.values(section.items))
        ) {
            itemPage.watcher.generate(itemPage);
        }

        await fs.emptyDir(this.outputDirectory);

        const rendered = await new Promise((resolve, reject) => {
            sass.render({
                data: `
$theme-color: ${this.module.docopts.themeColor};
@import "main.scss";`,
                includePaths: [path.join(__dirname, 'assets', STYLESHEET_SOURCE_PATH)],
            }, function(err, result) {
                if (err) return reject(err);
                return resolve(result);
            });
        });

        await this.writeAsset(STYLESHEET_PATH, rendered.css.toString('utf8'));

        for (let i = 0; i < this.itemsToGenerate.length; i++) {
            const itemToGenerate = this.itemsToGenerate[i];

            await this.writeAsset(
                itemToGenerate.targetUrl,
                await this.generateHTML(
                    itemToGenerate.path,
                    itemToGenerate.opts
                )
            );
        }
    }

    /**
     * Writes an asset with contents
     * @param {string} filePath
     * @param {string} contents
     */
    async writeAsset(filePath, contents) {
        const targetPath = path.join(this.outputDirectory, filePath);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(
            targetPath,
            contents
        );
    }

    /**
     * Gets all the watchers.
     */
    *watchers() {
        yield new w.ClassDocGenWatcher();
    }

    /**
     * Gets the watcher for an item.
     * @param {ScopeItem} scopeItem
     * @return {?DocGenWatcher}
     */
    getWatcherForItem(scopeItem) {
        for (const watcher of this.watchers()) {
            if (watcher.match(scopeItem)) {
                return watcher;
            }
        }

        console.log(`No watcher for scope item of type ${scopeItem.constructor.name}`);
        return null;
    }

    /**
     * Compiles a pug asset at a given path. Passes `this.module` as `module`.
     * @param {string} filePath - Path relative to `assets`
     * @param {Object} options - Additional options to pass
     */
    async generateHTML(filePath, options) {
        return pug.compileFile(
            path.join(__dirname, 'assets', filePath)
        )({
            STYLESHEET_PATH: path.relative(path.dirname(filePath), STYLESHEET_PATH),
            module: this.module,
            docGen: this,
            ...options
        });
    }
}
