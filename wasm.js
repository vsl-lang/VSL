/**
 * VSL WebAssembly (WASM) wrapper. VSL does reference libc and therefore if
 * you attempt to natively use some VSL-compiled WASM you may get errors. Use
 * this to inject libc compatibility.
 *
 * This exposes the `window._VSL`. Alternatively available using
 * `module.exports` through a module system. Pass the path of the WASM file
 * and it will be fetched and a promised module will be returned.
 */
(function(global) {
    const libvsl = {
        env: {
            'puts': (startIndex) => {
                let chunk = new Uint8Array(instance.exports.memory.buffer);
                let string = "";
                while (chunk[startIndex] !== 0) {
                    string += String.fromCharCode(chunk[startIndex]);
                    startIndex++;
                }
                console.log(string);
            }
        }
    };

    const VSL = function VSL(wasmFile) {
        let instance;
        return fetch(wasmFile)
            .then((response) => response.arrayBuffer())
            .then((buffer) => WebAssembly.compile(buffer))
            .then(module => {
                return WebAssembly.instantiate(module, libvsl);
            })
            .then(i => {
                instance = i;
                // Start with no arguments
                i.exports.main(0, []);
                return i;
            })
    };

    if (typeof module !== 'undefined') {
        module.exports = {
            VSL: VSL,
            libvsl: libvsl
        };
    }

    global.VSL = VSL;
    global.libvsl = libvsl;
})(window || global);
