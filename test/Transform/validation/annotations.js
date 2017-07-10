import { validate, invalidate } from '../../hooks';

export default () => describe("Annotations", () => {
    validate`@primitive(Integer) class Int {}`;
    validate`@primitive(Integer, *) class Int {}`;
    validate`@primitive(Integer, _precType) class Int {}`;
    
    invalidate`@primitive class Int {}`;
    invalidate`@primitive class Int {}`;
    invalidate`@primitive(Integer, *, foo) class Int {}`;
    
    validate`@inline func f() {}`;
    invalidate`@inline class A {}`;
    invalidate`@inline(*) func f() {}`;
})
