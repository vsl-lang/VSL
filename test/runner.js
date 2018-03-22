// Test runner
const VSL = require('../lib/vsl');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

var libvsl;
async function start() {
    // First get the module
    const moduleLoader = new VSL.Module(path.join(__dirname, '../libraries/libvsl'));
    try {
        await moduleLoader.load();
    } catch(error) {
        if (error instanceof ModuleError) {
            this.error.module(moduleLoader, error);
        } else {
            throw error;
        }
    }

    const module = moduleLoader.module;
    const group = new VSL.CompilationGroup();
    for (const file of module.sources) {
        const fileStream = group.createStream();
        fileStream.sourceName = file;
        fileStream.send(fs.readFileSync(file, 'utf8'));
    }

    group.metadata.name = module.name

    const index = new VSL.CompilationIndex(group, []);

    try {
        await index.compile();
    } catch(err) {
        errorManager.dynamicHandle(err);
    }

    libvsl = new VSL.CompilationModule(
        'libvsl',
        VSL.HookType.Strong,
        index
    );

    runTests(__dirname);
}

start();

function runTests(dir) {
    const files = fs.readdirSync(dir);

    // Check if VSL file
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dir, files[i]);
        if (fs.statSync(filePath).isDirectory()) {
            runTests(filePath);
        } else if (filePath.endsWith(".vsl")) {
            runTestDir(dir);
            break;
        }
    }
}

const errorManager = new VSL.ErrorManager(true);

async function runTestDir(dir) {
    // Get all VSL files
    const sourceFiles = fs.readdirSync(dir)
        .filter(name => name.endsWith(".vsl"));

    const group = new VSL.CompilationGroup();
    for (let i = 0; i < sourceFiles.length; i++) {
        const stream = group.createStream();
        stream.sourceName = path.join(dir, sourceFiles[i]);
        stream.send(fs.readFileSync(path.join(dir, sourceFiles[i]), 'utf8'));
    }

    const testName = path.basename(dir);
    group.metadata.name = 'test-' + testName;

    const index = new VSL.CompilationIndex(
        group,
        [libvsl]
    );

    const backend = new VSL.LLVM(
        new VSL.CompilationStream()
    );

    index.compile(backend)
        .then(() => {
            const expectedStdout = fs.openSync(path.join(dir, 'stdout.txt'), 'r');
//            const expectedStderr = fs.openSync(path.join(dir, 'stdout.txt'), 'r');

            const instance = child_process.spawn('lli', [], { stdio: 'pipe' })
            instance.stdin.write(backend.getByteCode());
            instance.stdin.end();

            let stdoutOffset = 0;
            instance.stdout.on('data', (data) => {
                const ref = Buffer.allocUnsafe(data.length);
                fs.readSync(expectedStdout, ref, stdoutOffset, data.length);
                stdoutOffset += data.length;

                if (!ref.equals(data)) {
                    console.log(
                        `\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m failed.\u001B[0m\n` +
                        `    Expected \u001B[1mSTDOUT\u001B[0m:\n` +
                        ref.toString('utf8').replace(/^|\n/g, '$&        ') + "\n" +
                        `    Instead got:\n` +
                        data.toString('utf8').replace(/^|\n/g, '$&        ') + "\n"
                    );
                    instance.kill('SIGTERM');
                }
            });

            instance.on('exit', () => {
                console.log(`\u001B[32m✓ \u001B[1m${testName}\u001B[0;32m passed.\u001B[0m`);
            });
        })
        .catch((error) => {
            try {
                errorManager.dynamicHandle(error);
            } catch(unhandledErr) {
                errorManager.rawError(
                    `✗ Test ${testName} failed`,
                    unhandledErr.message,
                    unhandledErr.stack
                );
            }
        });
}
