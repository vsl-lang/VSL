// Test runner
const VSL = require('../lib/vsl');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

var aTestErrored = false;

async function loadLibvsl() {
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

    return new VSL.CompilationModule(
        'libvsl',
        VSL.HookType.Strong,
        index
    );
}

async function start() {
    runTests(__dirname)
        .then(() => {
        if (aTestErrored) process.exit(1);
    });
}

start();

async function runTests(dir) {
    const files = fs.readdirSync(dir);

    // Check if VSL file
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(dir, files[i]);
        if (fs.statSync(filePath).isDirectory()) {
            await runTests(filePath);
        } else if (filePath.endsWith(".vsl")) {
            await runTestDir(dir);
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
        [ await loadLibvsl() ]
    );

    const backend = new VSL.LLVM(
        new VSL.CompilationStream()
    );

    const stdoutFile = path.join(dir, 'stdout.txt');
    const errorRefFile = path.join(dir, 'error.txt');

    const testShouldPass = fs.existsSync(stdoutFile);

    if (testShouldPass) {
        const expectedStdout = fs.readFileSync(stdoutFile, 'utf8');

        return await new Promise(async (resolve) => {
            try {
                await index.compile(backend)

                const instance = child_process.spawn('lli', ['-O2'], { stdio: 'pipe' })
                instance.stdin.write(backend.getByteCode());
                instance.stdin.end();

                let actualStdout = "";
                instance.stdout.on('data', (data) => {
                    actualStdout += data.toString('utf8');
                });

                instance.on('exit', (errorCode, signal) => {
                    if (instance.killed) return;
                    if (errorCode === 0) {
                        if (actualStdout !== expectedStdout) {
                            console.log(
                                `\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m failed.\u001B[0m\n` +
                                `    Expected \u001B[1mSTDOUT\u001B[0m:\n` +
                                expectedStdout.replace(/^|\n/g, '$&        ') + "\n" +
                                `    Instead got:\n` +
                                actualStdout.replace(/^|\n/g, '$&        ') + "\n"
                            );
                            aTestErrored = true;
                            instance.kill('SIGTERM');
                        }

                        console.log(`\u001B[32m✓ \u001B[1m${testName}\u001B[0;32m passed.\u001B[0m`);
                    } else {
                        console.log(`\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m errored with ${errorCode || signal}.\u001B[0m`);
                        aTestErrored = true;
                    }
                    resolve();
                });
            } catch (error) {
                try {
                    console.log(`\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m failed.\u001B[0m\n`);
                    errorManager.dynamicHandle(error);
                    aTestErrored = true;
                } catch(unhandledErr) {
                    errorManager.rawError(
                        `✗ Test ${testName} failed`,
                        unhandledErr.message,
                        unhandledErr.stack
                    );
                    aTestErrored = true;
                } finally {
                    resolve();
                }
            }
        });
    } else if (fs.existsSync(errorRefFile)) {
        const errorName = fs.readFileSync(errorRefFile, 'utf8').trim();
        if (!VSL.Error[errorName]) {
            console.log(`\u001B[31m✗✗✗ Test \u001B[1m${testName}\u001B[0;31m with invalid error ${errorName}\u001B[0m`);
            aTestErrored = true;
        }

        try {
            await index.compile(backend);
            console.log(`\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m unexpectedly passed (expected error \u001B[33m${errorName}\u001B[31m).\u001B[0m\n`);
            aTestErrored = true;
        } catch(error) {
            const actualErrorName = (Object.entries(VSL.Error)
                .find(([name, value]) => value === error.ref) || ["unknown error"])[0];

            if (error && error.ref === VSL.Error[errorName]) {
                console.log(`\u001B[32m✓ \u001B[1m${testName}\u001B[0;32m correctly errored with \u001B[33m${errorName}\u001B[32m.\u001B[0m`);
            } else {
                aTestErrored = true;
                try {
                    console.log(`\u001B[31m✗ Test \u001B[1m${testName}\u001B[0;31m failed (expected error \u001B[33m${errorName}\u001B[31m but got \u001B[33m${actualErrorName}\u001B[31m).\u001B[0m\n`);
                    errorManager.dynamicHandle(error);
                } catch(unhandledErr) {
                    errorManager.rawError(
                        `✗ Test ${testName} failed (expected error \u001B[33m${errorName}\u001B[31m but got \u001B[33m${actualErrorName}\u001B[31m).\u001B[0m\n`,
                        unhandledErr.message,
                        unhandledErr.stack
                    );
                }
            }
        }
    } else {
        console.log(`\u001B[31m✗✗✗ Test \u001B[1m${testName}\u001B[0;31m missing type\u001B[0m`);
        aTestErrored = true;
    }
}
