import fs from 'fs';
import path from 'path';

import { vsl, transform, regenerate } from '../hooks';

export default () => {
    var root = path.join(__dirname, './fixtures');
    var tests = fs.readdirSync(root); // Get all transformers
    for (var i = 0; i < tests.length; i++) {
        var subroot = path.join(root, tests[i]); // ./fixtures/<test>/
        var subtests = fs.readdirSync(subroot); // Get all test dirs

        describe(tests[i], () => {
            for (var i = 0; i < subtests.length; i++) {
                var srcText = path.join(subroot, subtests[i], 'src.vsl');
                var expText = path.join(subroot, subtests[i], 'exp.vsl');

                console.log(srcText);
                var src = vsl(fs.readFileSync(srcText, 'utf-8'));
                var exp = fs.readFileSync(expText, 'utf-8');

                transform(src);
                regenerate(src, exp, true, `should work for ${tests[i]}`);
            }
        });
    }
};
