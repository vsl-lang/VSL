import { valid, validDir } from '../hooks';

describe('Parser', () => {
    require('./expressions')();
    require('./whatever')();
    require('./functions')();
    require('./classes')();
    require('./interfaces')();
    require('./comments')();
    require('./collections')();
    require('./examples')();

    // Temporarially disable
    // validDir`../libraries/libc`;
    // validDir`../libraries/libcurl`;
    // validDir`../libraries/libvsl`;
    
    // Global codeblock
    valid``;
    valid`\n`;
    valid`\n`;
    valid`1 + 1`;
    valid`\n1 + 1`;
    valid`\n1 + 1\n`;
    valid`\n\n`;
    valid`\n\n1 + 1\n\n`;
    valid`1 + 1\n\n1 + 1`;
})
