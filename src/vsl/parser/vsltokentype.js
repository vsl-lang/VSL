const VSLTokenType = Object.freeze({
    Integer: 0,
    Decimal: 1,
    String: 2,
    Regex: 3,
    SpecialArgument: 4,
    SpecialIdentifier: 5,
    Identifier: 6,
    Documentation: 7,
    NativeBlock: 8
}); 

export default VSLTokenType;