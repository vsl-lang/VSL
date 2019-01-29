import CompilerCLI from '../helpers/CompilerCLI';

import ParserError from '../../vsl/parser/parserError';
import VSLParser from '../../vsl/parser/vslparser';
import ASTSerializer from '../../vsl/parser/ASTSerializer';

import cluster from 'cluster';
import os from 'os';
import tty from 'tty';
import net from 'net';
import lz4 from 'lz4';

export const DEFAULT_PORT = 8752;
export const DEFAULT_TIMEOUT = 400;
export const SERVER_PORT_KEY = 'VSL_SERVER_PORT_KEY';
export const SERVER_TIMEOUT_KEY = 'VSL_SERVER_TIMEOUT_KEY';
export const COLOR_KEY = 'VSL_COLOR_KEY';

export default class ParserServer extends CompilerCLI {
    usage = "vsl parser-server [options] [port]"

    constructor() {
        super([
            ["Options", [
                ["-h", "--help"          , "Displays this help message",             { run: _ => _.help() }],
                ["--color"               , "Always enables color",                   { color: true }],
                ["--no-color"            , "Always disables color",                  { color: false }]
            ]],
            ["Configuration", [
                ["-t", "--timeout"       , "Configure connection timeout time. For " +
                                           "ICP connections you might want to change " +
                                           "this as latency can be higher.",         { arg: 'timeout', timeout: true }],
                ["-T", "--no-timeout"    , "Disables timeout. Doesn't have any major " +
                                           "downsides if running locally",           { arg: 'timeout', timeout: false }]
            ]]
        ]);
    }

    appInfo() {
        return `Spawns a VSL parser server instance. This runs as an insecure ` +
            `TCP server so it's recommended to run this locally or through a ` +
            `secure socket to ensure integrity. Default port is ${DEFAULT_PORT}. ` +
            `Spawns in a cluster to get true parallelism.`;
    }

    /**
     * @param {string} message - message
     * @param {string} type - 'status', 'error', 'warn'
     */
    printLog(message, type) {
        const colorValue = {
            'status': 32,
            'warn': 33,
            'error': 31,
            'conf': 36
        }[type] || '32';
        const color = this.color ? `\u001B[1;${colorValue}m` : ``;
        const endColor = this.color ? `\u001B[0m` : ``;
        const time = new Date().toISOString();
        const header = `${color}vsl (${time}):${endColor} `;

        process.stdout.write(`${header}${message}\n`);
    }

    run(args) {
        if (cluster.isWorker) {
            this.color = process.env[COLOR_KEY] === 'true';
            this.startWorker(process.env[SERVER_PORT_KEY]);
            return;
        }

        let port = null;
        this.color = tty.isatty(1);
        let timeout = DEFAULT_TIMEOUT; // defualt timeout

        for (let i = 0; i < args.length; i++) {
            if (args[i][0] === "-" && args[i].length > 1) {
                const flagName = this.allArgs[this.aliases[args[i]] || args[i]];
                if (!flagName) this.error.cli(`unknown flag: ${args[i]}`);

                const flagInfo = flagName[3] || flagName[2];

                if (flagInfo.run) flagInfo.run(this);

                if ('output' in flagInfo) {
                    if (outputDirectory) this.error.cli(`multiple output directories.`);
                    outputDirectory = args[++i];
                }

                if ('color' in flagInfo) this.color = !!flagInfo.color;
                if ('timeout' in flagInfo) {
                    if (flagInfo.timeout) {
                        timeout = args[++i] |0;
                        if (isNaN(timeout)) this.error.cli(`timeout must be integer`);
                        this.printLog(`Timeout set to ${timeout}ms`, 'conf');
                    } else {
                        this.printLog('Disabling timeout', 'conf');
                        timeout = -1;
                    }
                }
            } else if (port === null) {
                if (!isNaN(+args[i])) {
                    port = +args[i];
                } else {
                    port = args[i];
                }
            } else {
                this.error.cli(`unknown parameter: ${args[i]}`);
            }
        }

        this.timeout = timeout;

        this.startServer(port || DEFAULT_PORT);
    }

    /**
     * Starts a WORKER on a port
     * @param {number} port
     */
    startWorker(port) {
        const clusterId = cluster.worker.id;
        const timeout = +process.env[SERVER_TIMEOUT_KEY];
        this.printLog(`Starting worker ${clusterId}`, 'status');

        let connectionCounter = 0;

        const server = net.createServer({
            allowHalfOpen: true,
            pauseOnConnect: false
        }, (c) => {
            const connectionIndex = connectionCounter++;
            const instance = `${clusterId}.${connectionIndex}`;

            this.printLog(`Instance ${instance} started; listening.`, 'status');

            let startTime = process.hrtime(),
                dataEndTime,
                parserEndTime;

            // Timeout if client abruptly stops sending
            if (timeout !== -1) {
                c.setTimeout(timeout, () => {
                    this.printLog(`Socket (${instance}) timeout.`, 'warn');
                    c.end();
                });
            }


            // Decompress data as it comes in
            const decompressor = lz4.createDecoderStream();
            c.pipe(decompressor);

            let data = "";
            decompressor.on('data', (chunk) => {
                data += chunk;
            });

            // When all done
            c.on('close', () => {
                const timeFormat = parserEndTime ? ` (${parserEndTime}ms)` : '';
                this.printLog(`Instance ${instance} completed${timeFormat}`, 'status');
            });

            c.on('error', (error) => {
                this.printLog(`Uncaught error at instance ${instance}.\n${error.stack}`, 'error');
            })

            // When all data is received
            c.on('end', () => {
                const timeTookToReceiveData = process.hrtime(startTime);
                dataEndTime = ((timeTookToReceiveData[0] + timeTookToReceiveData[1] / 1e9) * 1e3).toFixed(4);

                this.printLog(`Instance ${instance} processed ${data.length} bytes (${dataEndTime}ms)`, 'status');

                const parser = new VSLParser();

                let results;
                try {
                    results = parser.feed(data);
                } catch(error) {
                    // Handle parser errors
                    if (error instanceof ParserError) {
                        this.printLog(`Instance ${instance} parser error.`, 'warn');
                        results = null;
                        c.write(Buffer.from([0x01]));
                        c.end();
                    } else {
                        this.printLog(`Instance ${instance} internal error error.\n${error}`, 'error');
                        throw error;
                    }
                } finally {
                    // Serialize results and send them back
                    if (results) {
                        const serializer = new ASTSerializer(results[0]);
                        serializer.serializeTo(c)
                            .then(() => {
                                const timeTookToParse = process.hrtime(startTime);
                                parserEndTime = ((timeTookToParse[0] + timeTookToParse[1] / 1e9) * 1e3 - +dataEndTime).toFixed(4);
                                // Close TCP when finished
                                c.end();
                            })
                            .catch((error) => {
                                this.printLog(`Instance ${instance} failed serialization\n${error}`, 'error');
                            });
                    }
                }
            });
        });

        this.server = server;

        server.listen(port, () => {
            const address = server.address();
            const location = typeof address === 'string' ? `ICP ${address}` : `TCP [${address.address}]:${address.port} over ${address.family}`;
            this.printLog(`Worker ${cluster.worker.id} at ${location}`, 'conf');
        });

        server.on('close', () => {
            this.printLog(`Closing server.`, 'status');
        });

        server.on('error', (e) => {
            this.printLog(`Uncaught server error.\n${e}`, 'error');
        });
    }

    /**
     * Starts the MASTER server on a port
     * @param {number} port
     */
    startServer(port) {
        const locationType = isNaN(+port) ? 'path' : 'port';
        this.printLog(`Starting on ${locationType} ${port}`, 'status');

        const workerCount = os.cpus().length;

        this.printLog(`Forking ${workerCount} worker(s)`, 'status');

        for (let i = 0; i < workerCount; i++) {
            const worker = cluster.fork({
                [SERVER_PORT_KEY]: port,
                [SERVER_TIMEOUT_KEY]: this.timeout,
                [COLOR_KEY]: this.color
            });
        }

        process.on('exit', () => {
            this.printLog(`Master exiting.`, 'status');
        });

        process.on('SIGINT', () => {
            this.printLog(`Received SIGINT...`, 'status');

            if (this.server) {
                this.server.close(() => {
                    process.exit(0);
                });

                setTimeout(() => {
                    this.printLog(`Unresponsive server. Forcing exit...`, 'warn');
                    process.exit(0);
                }, 500);
            } else {
                process.exit(0);
            }
        });
    }
}
