import fs from 'fs-extra';
import pug from 'pug';
import path from 'path';
import showdown from 'showdown';
import sass from 'node-sass';
import striptags from 'striptags';

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
        this.markdownRenderer = new showdown.Converter({
            prefixHeaderId: 'section',
            openLinksInNewWindow: true
        });

        /** @private */
        this.sections = {};

        /** @private */
        this.taskQueue = [];
    }

    /**
     * Starts generation
     */
    async generate() {
        // Create 'items' which is basically all the public classes, method,
        // etc that will be documented.
        const items = [].concat(...this.scope.ids.values())
            .filter(scopeItem => !scopeItem.isScopeRestricted);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemWatcher = this.getWatcherForItem(item);

            if (!itemWatcher) continue;

            // Also if the scope item doesn't have a source then it's virtual
            // not real
            if (!item.source) continue;

            // This is creating an object which associates a type of thing, e.g.
            // 'Class', 'Function' with a list of all the classes, functions,
            // etc.
            const typeIdentifier = itemWatcher.typeDescription;
            const allItemsOfType = (this.sections[typeIdentifier] || {
                items: {},
                watcher: itemWatcher
            });

            // Additionally now we are going to group similar things together.
            // This means methods with the same name will be grouped.
            const groupingIdentifier = itemWatcher.urlFor(item);
            const existingGroup = allItemsOfType.items[groupingIdentifier];

            if (existingGroup) {
                existingGroup.instances.push(item);
            } else {
                allItemsOfType.items[groupingIdentifier] = {
                    name: item.rootId,
                    instances: [item]
                };
            }

            this.sections[typeIdentifier] = allItemsOfType;
        }

        // Create output directory
        await fs.emptyDir(this.outputDirectory);

        // Now we go through every single item and we generate it. Each section
        // is a unique type of item (class, function, etc.)
        for (const section of
            Object.values(this.sections)
        ) {
            for (const [itemURL, { name, instances }] of Object.entries(section.items)) {
                // This only obtains the information about the item we'll create
                // the actual HTML later
                const page = await section.watcher.generate(instances, this);

                await this.writeAsset(
                    itemURL,
                    await this.generateHTML(
                        itemURL,
                        page.path,
                        page.opts,
                        {
                            currentItem: instances
                        }
                    )
                );
            }
        }

        // Compile pages
        await this.compilePage('pages/index.pug', 'index.html', {
            name: "Home",
            description: this.module.description
        });

        // Compile the sass and copy it
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

        await this.writeAsset(STYLESHEET_PATH, rendered.css.toString('utf8'))
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
     * Queues a promise to task queue. This allows you to use waitUntilDone to
     * delay until all tasks are done
     * @param {Promise} task
     */
    queueTask(task) {
        this.taskQueue.push(task);
    }

    /**
     * Wait until all tasks are done then returns
     */
    async waitUntilDone() {
        await Promise.all(this.taskQueue);
    }

    /**
     * Compiles a page
     * @param {string} sourceTemplate - Path to .pug source
     * @param {string} outputPath - Desired output path
     * @param {Object} options - Additional options
     */
    async compilePage(sourceTemplate, outputPath, options = {}) {
        await this.writeAsset(
            outputPath,
            await this.generateHTML(
                outputPath,
                sourceTemplate,
                options
            )
        );
    }

    /**
     * Parses comments and their markdown
     * @param {Comment[]} comments
     * @return {string} HTML string
     */
    async render(comments) {
        const data = comments.map(comment => comment.content).join("\n");
        return this.markdownRenderer.makeHtml(data);
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

        return null;
    }

    /**
     * Returns the URL path of a given asset. For example if the user is hosting
     * docs on `/docs` then this will turn `/foo/bar` to `/docs/foo/bar`
     *
     * @param {string} path
     * @return {string} output path
     */
    pathToUrl(path) {
        return path;
    }

    /**
     * Compiles a pug asset at a given path. Passes `this.module` as `module`.
     * @param {string} itemURL - Expected item output location.
     * @param {string} filePath - Path relative to `assets`
     * @param {Object} options - Additional options to pass
     * @param {Object} opts - configuration options
     * @param {?(ScopeItem[])} currentItem - Instances to pass to identify page
     */
    async generateHTML(itemURL, filePath, options, { currentItem = null } = {}) {
        return pug.compileFile(
            path.join(__dirname, 'assets', filePath)
        )({
            STYLESHEET_PATH: STYLESHEET_PATH,
            striptags: striptags,

            pathFor: (targetPath) => {
                return path.relative(path.dirname(itemURL), targetPath);
            },

            currentInstances: currentItem,

            module: this.module,
            docGen: this,
            ...options
        });
    }
}
