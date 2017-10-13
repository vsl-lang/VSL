var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

let building = null;
fs.watch(path.join(__dirname, '../src/vsl/parser/parser.ne'), (event) => {
    if (event === 'change') {
        
        if (building !== null) {
            building.kill('SIGINT');
        }
        
        building = child_process.spawn(
            'npm', ['run', 'parser'],
            {
                stdio: 'ignore',
                cwd: path.join(__dirname, '..')
            }
        );
        
        building.on('exit', (code, signal) => {
            if (code === 0) {
                building = null;
                console.log("parser rebuilt.");
            }
        });
    }
});