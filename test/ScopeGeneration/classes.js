import { vsl, compareScope, transform, expectBork } from '../hooks';

export default () => describe('Classes', () => {
    compareScope(
        vsl`class A {}`,
        `Root \n ├ A (Type)\n    ├ class A`
    )
    
    expectBork(
        () => transform(vsl`class A {}\nfunc A() {}`),
        `bork when a class and function name conflict`
    )
    
    expectBork(
        () => transform(vsl`class A {}\nfunc A(a: T) {}`),
        `bork when a class and function name conflict with dif args`
    )
})
