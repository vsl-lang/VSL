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

            // Local JS heap. This is a linked list. To add is an O(1) operation
            // and freeing is an O(1) operation as well. However, to verify an
            // index is valid is an O(n) operation worst-case
            this.objectHeap = new Array(32);

            // Sets up the heap
            for (let i = 0; i < this.objectHeap.length; i++) {
                if (i === this.objectHeap.length - 1) {
                    this.objectHeap[i] = -1;
                } else {
                    this.objectHeap[i] = i + 1;
                }
            }

            this.objectHeapNextFreeSlot = 0;

            this.__objectheap_global = this.storeValue(window);
            this.__objectheap_undefined = this.storeValue(undefined);
            this.__objectheap_null = this.storeValue(null);
        }

        // Returns the global object.
        get globalObject() {
            return this.objectHeap[this.__objectheap_global];
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

        // Pushes a free slot to heap and returns pointer
        storeValue(value) {
            if (this.objectHeapNextFreeSlot === -1) {
                return this.objectHeap.push(value) - 1;
            } else {
                // Otherwise we can store in the free slot and update.
                const targetSlot = this.objectHeap.heapNextFreeSlot;
                const newNextFreeSlot = this.objectHeap[targetSlot];

                // Update new next free slot
                this.objectHeapNextFreeSlot = newNextFreeSlot;

                this.objectHeap[targetSlot] = value;
                return targetSlot;
            }
        }

        // Frees a value.
        freeValue(index) {
            // This will now point to the next free object
            this.objectHeap[index] = this.objectHeapNextFreeSlot;

            // And the next free object is this one.
            this.objectHeapNextFreeSlot = index;
        }

        // Wraps value if applicable
        wrapValue(value) {
            if (typeof value === 'number' || typeof value === 'boolean') {
                return value;
            } else if (value) {
                return this.storeValue(value);
            } else {
                return value;
            }
        }

        // Dereferences pointer
        valueAt8Bit(pointer) { return new Uint8Array(this.instance.exports.memory.buffer, pointer, 1)[0] }
        valueAt32Bit(pointer) { return new Uint32Array(this.instance.exports.memory.buffer, pointer, 1)[0] }

        exports() {
            return {
                env: {
                    ////////////////////////////////////////////////////////////
                    //                    Debug Intrinsics                    //
                    ////////////////////////////////////////////////////////////
                    'debug.inspect': console.log,

                    ////////////////////////////////////////////////////////////
                    //                   WASM Introspection                   //
                    ////////////////////////////////////////////////////////////
                    'meta.__heap_base': () => this.instance.exports.__heap_base,
                    'meta.__objectheap_global': () => this.__objectheap_global,
                    'meta.__objectheap_undefined': () => this.__objectheap_undefined,
                    'meta.__objectheap_null': () => this.__objectheap_null,


                    ////////////////////////////////////////////////////////////
                    //                        Dispatch                        //
                    ////////////////////////////////////////////////////////////
                    'dispatch.freeReference': (index) => {
                        this.freeValue(index);
                    },

                    // Performs a single access of <base>.<target> where
                    // <target> is a JS string and <base> references a JS heap
                    // object instance.
                    'dispatch.access': (base, target) => {
                        const baseObject = this.objectHeap[base];
                        const dispatchTarget = this.vslToDOMString(target);

                        const result = baseObject[dispatchTarget];
                        return this.wrapValue(result);
                    },

                    // Allows wasm to dispatch a call. Executes in a form of
                    // <base>.<dispatchTarget> where <base> references a JS
                    'dispatch.dispatch': (base, dispatchTarget, callStack) => {
                        const base = this.objectHeap[base];
                        const dispatchTarget = this.vslToDOMString(dispatchTarget);
                        const dispatchee = base[dispatchTarget];

                        // Inspect call stack to identify to call with what.
                        const argCount = this.valueAt8Bit(callStack);
                        const args = [];

                        // VSL/WASM interop supports a 8-bit flag specifying
                        // dispatch argument type.
                        let callStackOffset = callStack + 1;
                        for (let i = 0; i < argCount.length; i++) {
                            // 1 = 8-bit type size
                            const type = this.valueAt8Bit(callStackOffset);
                            callStackOffset += 1;

                            switch (type) {
                                case 0x00:
                                    // JS heap object reference.

                                    const objectIndex = this.valueAt32Bit(callStackOffset);
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(this.objectHeap[objectIndex]);
                                    break;

                                case 0x01:
                                    // JS marshaled object reference.
                                    // Supports top level objects
                                    const object = {};

                                    args.push(object);
                                    break;

                                case 0x0F:
                                    // JS lambda
                                    args.push(() => {});
                                    break;

                                case 0xA0:
                                    // VSL String
                                    const objectIndex = this.valueAt32Bit(callStackOffset);
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(this.vslToDOMString(objectIndex));
                                    break;

                                case 0xA1:
                                    // VSL Integer (32-bit)
                                    const int = this.valueAt32Bit();
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(int);
                                    break;

                                default:
                                    throw new TypeError(`unexpected dispatch argument type 0x${type.toString(16).toUpperCase()}.`);
                            }
                        }

                        this['dispatch.freeReference'](callStack);

                        const result = dispatchee.apply(base, ...args);
                        return this.wrapValue(result);
                    },


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
