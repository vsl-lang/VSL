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
    class libvsl {
        constructor(instance) {
            this.instance = instance;
        }

        exports() {
            return {
                env: {
                    'puts': (startIndex) => {
                        let chunk = new Uint8Array(this.instance.exports.memory.buffer);
                        let string = "";
                        while (chunk[startIndex] !== 0) {
                            string += String.fromCharCode(chunk[startIndex]);
                            startIndex++;
                        }
                        console.log(string);
                    }
                }
            };
        }

        lifecycle(dispatchName, event) {
            const dispatchTarget = this.instance.exports[dispatchName];
            dispatchTarget();
        }
    }

    const VSL = function VSL(wasmFile) {
        let stl = new libvsl();
        return fetch(wasmFile)
            .then((response) => response.arrayBuffer())
            .then((buffer) => WebAssembly.compile(buffer))
            .then(module => {
                return WebAssembly.instantiate(module, stl.exports());
            })
            .then(instance => {
                stl.instance = instance;
                // Start with no arguments
                instance.exports.main(0, []);
                global.__VSLLastInstance = instance;

                if (document.readyState === 'interactive') {
                    libvsl.lifecycle('loaded', null);
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        libvsl.lifecycle('loaded', null);
                    });
                }

                return instance;
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
