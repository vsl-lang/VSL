/**
 * @typedef {Object} ExpressionItem
 * @property {?string} [modifier=null] - `"not"` or `null`
 * @property {string} key - The key to filter
 * @property {string} value - The value to filter
 */

/**
 * Matches a filtering expression such as `os: win32 NOT arch: wasm`
 */
export default class FilterExpression {

    /**
     * Converts a target triple to filter target
     * @param {string} triple
     * @return {Object} to apply filter to
     */
    static tripleToTarget(triple) {
        const [ arch, vendor, os = 'unknown' ] = triple.split(`-`);
        return { arch, vendor, os };
    }

    /**
     * Expression which matches all
     * @type {FilterExpression}
     */
    static get all() {
        return new FilterExpression([]);
    }

    /**
     * Expression which matches nothing
     * @type {FilterExpression}
     */
    static get none() {
        return new FilterExpression([{ key: 'groundControlTo', value: 'MajorTom' }]);
    }

    /**
     * Creates a filter expression given `key: value` and `NOT` expressions.
     * @param {ExpressionItem[]} expression - the filter expression
     * @param {Object} [options={}] - Options
     * @throws {TypeError} throws type error if the string is invalid.
     */
    constructor(expression, options = {}) {
        let lambda = (object) => true;

        this._sourceExpression = expression.slice();

        for (const item of expression) {
            const oldLambda = lambda;
            lambda = (object) => {
                let result = object[item.key] && String(object[item.key]).startsWith(item.value);

                if (item.modifier == "not") {
                    result = !result;
                }

                return oldLambda(object) && result;
            };
        }

        this._lambda = lambda;
    }

    /**
     * Converts to encoded string representation
     * @return {string}
     */
    toString() {
        return this._sourceExpression
            .map(item => `${item.modifier ? `${item.modifier} ` : ''}${item.key}: ${item.value}`).join(' ')
    }

    /**
     * Appends a filter expression to check
     * @param {FilterExpression}
     */
    append(expression) {
        const oldLambda = this._lambda;
        this._sourceExpression.push(...expression._sourceExpression);
        this._lambda = (object) => oldLambda(object) || expression.test(object);
    }

    /**
     * Tests on the provided object
     * @param  {Object} object test object to test
     * @return {boolean}
     */
    test(object) {
        return this._lambda(object);
    }

}
