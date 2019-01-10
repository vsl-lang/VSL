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

        // Bridges VSL string -> JS
        vslToDOMString(pointer) {
            let chunk = new Uint8Array(this.instance.exports.memory.buffer);
            let string = "";
            while (this.valueAt(pointer) !== 0) {
                string += String.fromCharCode(this.valueAt(pointer++));
            }
            return string;
        }

        // Dereferences pointer
        valueAt(pointer) {
            return new Uint8Array(this.instance.exports.memory.buffer)[pointer];
        }

        // Obtains heap
        get heap() {
            return new Uint8Array(this.instance.exports.memory.buffer, this.instance.exports.__heap_base);
        }

        exports() {
            return {
                env: {
                    'debug.inspect': console.log,
                    'meta.__heap_base': () => this.instance.exports.__heap_base,

                    // LLVM math intrinsics
                    'log': Math.log,

                    'puts': (pointer) => {
                        console.log(this.vslToDOMString(pointer));
                    },

                    'secureRandom': (size) => {
                        var array = new Uint32Array(1);
                        window.crypto.getRandomValues(array);
                        return array[0];
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
                global.__VSLLastInstance = stl;

                instance.exports.__wasm_call_ctors();
                instance.exports.main(0, []);

                if (document.readyState === 'interactive') {
                    libvsl.lifecycle('loaded', null);
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        libvsl.lifecycle('loaded', null);
                    });
                }

                return stl;
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
