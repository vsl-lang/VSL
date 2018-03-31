/**
 * Identifies the type of a doc item.
 */
export default {
    Root: Symbol('VSL.Root'),
    Function: Symbol('VSL.Function'),
    Class: Symbol('VSL.Class'),
    Method: Symbol('VSL.Method'),
    Initializer: Symbol('VSL.Initializer'),
    Field: Symbol('VSL.Field'),
    TypeAlias: Symbol('VSL.TypeAlias'),
    GenericClass: Symbol('VSL.GenericClass'),
};
