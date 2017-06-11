export default class ErrorManager {
    cli(message) {
        console.warn("vsl: " + message);
        process.exit(1);
    }
}
