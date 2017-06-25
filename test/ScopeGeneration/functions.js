import { vsl, compareScope, transform, expectBork } from '../hooks';

export default () => describe('Functions', () => {
    compareScope(
        vsl`func f(a: T) {}`,
        `Root\n ├ f (Func)\n    ├ func f(a: T)`
    )
    
    compareScope(
        vsl`func f(a: T) {}\nfunc f(b: T) {}`,
        `Root\n ├ f\n    ├ Func\n      ├ func f(a: T)\n    ├ Func\n      ├ func f(b: T)`
    )
    
    expectBork(
        () => transform(
            vsl`func f(a: T) {}\nfunc f(a: T) {}`
        ),
        `bork as f(a: T) and f(a: T) conflict`
    )
    
    expectBork(
        () => transform(
            vsl`func f() {}\nfunc f() {}`
        ),
        `bork as f() and f() conflict`
    )
    
    expectBork(
        () => transform(
            vsl`func f(a: T, b: T) {}\nfunc f(a: T, b: T) {}`
        ),
        `bork as f(a: T, b: T) and f(a: T, b: T) conflict`
    )
    
    compareScope(
        vsl`func f(a: T,b: U) {}\nfunc f(a: T, b: V) {}`,
        `Root\n ├ f\n    ├ Func\n      ├ func f(a: T, b: U)\n    ├ Func\n      ├ func f(a: T, b: V)`
    )
})
