import { vsl, compareScope, transform, expectBork } from '../hooks';

export default () => describe('Functions', () => {
    compareScope(
        vsl`func f(a: T) {}`,
        `Root
         ├ f (Func)
            ├ func f(a: T)`
    )
    
    compareScope(
        vsl`func f(a: T) {}
        func f(b: T) {}`,
        `Root
         ├ f
            ├ Func
              ├ func f(a: T)
            ├ Func
              ├ func f(b: T)`
    )
    
    expectBork(
        () => transform(
            vsl`func f(a: T) {}
            func f(a: T) {}`
        ),
        `bork as f(a: T) and f(a: T) conflict`
    )
    
    expectBork(
        () => transform(
            vsl`func f() {}
            func f() {}`
        ),
        `bork as f() and f() conflict`
    )
    
    expectBork(
        () => transform(
            vsl`func f(a: T, b: T) {}
            func f(a: T, b: T) {}`
        ),
        `bork as f(a: T, b: T) and f(a: T, b: T) conflict`
    )
    
    compareScope(
        vsl`func f(a: T,b: U) {}
        func f(a: T, b: V) {}`,
        `Root
         ├ f
            ├ Func
              ├ func f(a: T, b: U)
            ├ Func
              ├ func f(a: T, b: V)`
    )
})
