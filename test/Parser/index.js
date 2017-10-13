'use strict';

var _hooks = require('../hooks');

describe('Parser', function () {
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
    _hooks.valid``;
    _hooks.valid`\n`;
    _hooks.valid`\n`;
    _hooks.valid`1 + 1`;
    _hooks.valid`\n1 + 1`;
    _hooks.valid`\n1 + 1\n`;
    _hooks.valid`\n\n`;
    _hooks.valid`\n\n1 + 1\n\n`;
    _hooks.valid`1 + 1\n\n1 + 1`;
});