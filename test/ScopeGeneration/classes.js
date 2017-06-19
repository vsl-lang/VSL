import { vsl, compareScope, transform, expectBork } from '../hooks';

export default () => describe('Classes', () => {
    compareScope(
        vsl`class A {}`,
        `Root
          ├ A (Type)
             ├ class A`
    )
    
    expectBork(
        () => transform(vsl`
            class A {}
            func A() {}
        `),
        `bork when a class and function name conflict`
    )
    
    expectBork(
        () => transform(vsl`
            class A {}
            func A(a: T) {}
        `),
        `bork when a class and function name conflict with dif args`
    )
})
