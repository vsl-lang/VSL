import WASMBindgen from './wasm/WASMBindgen';

/**
 * Obtains bindgen by name
 * @param {string} name
 * @param {...any} args - Arguments to a {@link Bindgen}
 * @return {?Bindgen} null if no bindgen object found
 */
export default function locateBindgen(name, ...args) {
    switch (name) {
        case "wasm":
            return new WASMBindgen(...args);
        default:
            return null;
    }
}
