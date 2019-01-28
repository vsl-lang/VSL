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
        constructor(options = {}) {
            this.instance = null;

            // If safe heap is enabled
            this.useSafeHeap = typeof options.useSafeHeap !== 'undefined' ? options.useSafeHeap : true;

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

            // Store null ptr value in first slot.
            this.storeValue(-2);

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
            // Get the pointer. (4 (header align 4) + 4 (length))
            let cptr = this.valueAt32Bit(pointer + 4 + 4);
            return this.cToDOMString(cptr);
        }

        // Bridges C String -> JS
        cToDOMString(pointer) {
            let string = "";
            while (this.valueAt8Bit(pointer) !== 0) {
                string += String.fromCharCode(this.valueAt8Bit(pointer++));
            }
            return string;
        }

        // Pushes a free slot to heap and returns pointer
        storeValue(value) {
            if (this.objectHeapNextFreeSlot === -1) {
                return this.objectHeap.push(value) - 1;
            } else {
                // Otherwise we can store in the free slot and update.
                const targetSlot = this.objectHeapNextFreeSlot;
                const newNextFreeSlot = this.objectHeap[targetSlot];

                // Update new next free slot
                this.objectHeapNextFreeSlot = newNextFreeSlot;

                this.objectHeap[targetSlot] = value;
                return targetSlot;
            }
        }

        // Obtains a value
        getValue(index) {
            if (index === 0 && this.useSafeHeap) {
                throw new TypeError(`attempted to dereference pointer to 0x00`);
            } else {
                return this.objectHeap[index];
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
        valueAt8Bit(pointer) { return new DataView(this.instance.exports.memory.buffer).getUint8(pointer); }
        valueAt32Bit(pointer) { return new DataView(this.instance.exports.memory.buffer).getUint32(pointer, true); }

        writeAt8Bit(pointer, value) {
            const memory = new Uint8Array(this.instance.exports.memory.buffer)
            memory[pointer] = value;
        }

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

                    // Converts a JS string to a JS object
                    'meta.objectheap.fromString': (vslString) => {
                        return this.wrapValue(this.vslToDOMString(vslString));
                    },

                    'meta.objectheap.fromNumber': (number) => {
                        return this.wrapValue(number);
                    },

                    ////////////////////////////////////////////////////////////
                    //                        Dispatch                        //
                    ////////////////////////////////////////////////////////////
                    'dispatch.freeReference': (index) => {
                        this.freeValue(index);
                    },

                    'dispatch.instanceOf': (objectReference, typeReference) => {
                        const object = this.getValue(objectReference);
                        const type = this.getValue(typeReference);
                        return object instanceof type;
                    },

                    'dispatch.readStringLength': (string) => {
                        const stringObject = this.getValue(string);
                        return new TextEncoder('utf8').encode(stringObject).length;
                    },

                    'dispatch.copyString': (string, pointer) => {
                        const stringObject = this.getValue(string);
                        if (typeof stringObject !== 'string') {
                            throw new TypeError(`invalid attempt to cast ${typeof stringObject} to string`);
                        }
                        const utf8String = new TextEncoder('utf8').encode(stringObject);
                        for (let i = 0; i < utf8String.length; i++) {
                            this.writeAt8Bit(pointer + i, utf8String[i]);
                        }
                    },

                    // Performs a single access of <base>.<target> where
                    // <target> is a JS string and <base> references a JS heap
                    // object instance.
                    'dispatch.access': (base, target) => {
                        const baseObject = this.getValue(base);
                        const dispatchTarget = this.vslToDOMString(target);

                        const result = baseObject[dispatchTarget];
                        return this.wrapValue(result);
                    },

                    // Dispatches <base>.<target> with no arguments
                    'dispatch.anon': (base, target) => {
                        const baseObject = this.getValue(base);
                        const dispatchTarget = this.vslToDOMString(target);
                        const dispatchee = baseObject[dispatchTarget];

                        if (typeof dispatchee === 'undefined') {
                            throw new TypeError(`invalid attempt to dispatch undefined function \`${dispatchTarget}\` on \`${baseObject}\``);
                        }

                        const result = dispatchee.call(baseObject);
                        return this.wrapValue(result);
                    },

                    // Allows wasm to dispatch a call. Executes in a form of
                    // <base>.<dispatchTarget> where <base> references a JS
                    'dispatch.dispatch': (base, target, callStack) => {
                        const baseObject = this.getValue(base);
                        const dispatchTarget = this.vslToDOMString(target);
                        const dispatchee = baseObject[dispatchTarget];

                        // Inspect call stack to identify to call with what.
                        const argCount = this.valueAt8Bit(callStack);
                        const args = [];

                        // VSL/WASM interop supports a 8-bit flag specifying
                        // dispatch argument type.
                        let callStackOffset = callStack + 1;
                        for (let i = 0; i < argCount; i++) {
                            // 1 = 8-bit type size
                            const type = this.valueAt8Bit(callStackOffset);
                            callStackOffset += 1;

                            switch (type) {
                                case 0x00: {
                                    // JS heap object reference.
                                    const objectIndex = this.valueAt32Bit(callStackOffset);
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(this.objectHeap[objectIndex]);
                                    break;
                                }

                                case 0x01: {
                                    // JS marshaled object reference.
                                    // Supports top level objects
                                    const object = {};
                                    args.push(object);
                                    break;
                                }

                                case 0x0F: {
                                    // JS lambda
                                    args.push(() => {});
                                    break;
                                }

                                case 0xA0: {
                                    // VSL String
                                    const objectIndex = this.valueAt32Bit(callStackOffset);
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(this.vslToDOMString(objectIndex));
                                    break;
                                }

                                case 0xA1: {
                                    // VSL Integer (32-bit)
                                    const int = this.valueAt32Bit();
                                    callStackOffset += 4; // 4 = 32-bit index size
                                    args.push(int);
                                    break;
                                }

                                default:
                                    throw new TypeError(`unexpected dispatch argument type 0x${type.toString(16).toUpperCase()}.`);
                            }
                        }

                        const result = dispatchee.apply(baseObject, args);
                        return this.wrapValue(result);
                    },


                    // LLVM math intrinsics
                    'log': Math.log,

                    'puts': (pointer) => {
                        console.log(this.cToDOMString(pointer));
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

    const VSL = function VSL(wasmFile, options) {
        let stl = new libvsl(options);
        return fetch(wasmFile)
            .then((response) => response.arrayBuffer())
            .then((buffer) => WebAssembly.compile(buffer))
            .then(module => {
                return WebAssembly.instantiate(module, stl.exports());
            })
            .then(instance => {
                stl.instance = instance;

                // Start with no arguments
                if (options.hideInstance !== true)  {
                    global.__VSLLastInstance = stl;
                }

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
