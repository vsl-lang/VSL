'use strict';

const defaultParent = {
    get: function () { return false; },
    set: function () { return false; },
    has: function () { return false; }
};

/**
 * Scope class.
 */
export default class Scope {
    /**
     * Creates a Scope object.
     * @param {Scope} parent The parent scope.
     */
    constructor (parent=defaultParent) {
        this.parent = parent;
        this.variables = {};
    }
    
    /**
     * Gets a variable from the scope.
     * @param {string} variable The name of the variable.
     * @return {object} The value of the variable.
     */
    get (variable) {
        if (this.parent.has(variable))
            return this.parent.get(variable);
        
        return this.variables[variable];
    }
    
    /**
     * Sets a variable in the scope to a certain value.
     * @param {string} variable The name of the variable.
     * @param {string} value The value to set the variable to.
     */
    set (variable, value) {
        if (this.parent.has(variable))
            this.parent.set(variable, value);
        
        this.variables[variable] = value;
    }
    
    /**
     * Checks if the scope contains a variable.
     * @param {string} variable The name of the variable.
     * @return {boolean} Whether the scope contains the variable.
     */
    has (variable) {
        return (typeof this.variables[variable] !== 'undefined') || this.parent.has(variable);
    }
}