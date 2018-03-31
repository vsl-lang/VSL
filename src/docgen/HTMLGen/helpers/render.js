import marked, { Renderer } from 'marked';

const renderer = new Renderer();
renderer.code = (code, lang) => {
    return `<pre><code>${code}/code></pre>`;
};

marked.setOptions({ renderer });

/**
 * Renders the markdown
 * @param {string} markdown
 * @param {string} rootPath
 * @param {HTMLGen} gen The generator
 * @return {string} HTML
 */
export default function render(markdown, rootPath, gen) {
    let text = markdown;

    for (const [word, desc] of gen.glossay) {
        text = text.split(word).join(
            `<a href="${rootPath}/glossay.html${word}" title="${value}">${word}</a>`
        );
    }

    return marked(text);
}
