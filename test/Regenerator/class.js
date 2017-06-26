import { vsl, regenerate } from '../hooks';

const $ = { trim: true }

export default () => describe("Class", () => {
    regenerate(
        vsl`class A {}`,
        `class A: Object {}`, $
    );
    
    regenerate(
        vsl`public class A {}`,
        `public class A: Object {}`, $
    );
    
    regenerate(
        vsl`private class A {}`,
        `private class A: Object {}`, $
    );
    
    regenerate(
        vsl`class A: T {}`,
        `class A: T {}`, $
    );
    
    describe("Functions", () => {
        regenerate(
            vsl`class A {
                func f() {}
            }`,
            `class A: Object {
                func f() {}
            }`, $
        )
        
        regenerate(
            vsl`class A {
                public func f() {}
            }`,
            `class A: Object {
                public func f() {}
            }`, $
        )
        
        regenerate(
            vsl`class A {
                static func f() {}
            }`,
            `class A: Object {
                static func f() {}
            }`, $
        )
        
        regenerate(
            vsl`class A {
                public static func f() {}
            }`,
            `class A: Object {
                public static func f() {}
            }`, $
        )
        
        regenerate(
            vsl`class A {
                public func f() {}
                public func g() {}
            }`,
            `class A: Object {
                public func f() {}
                public func g() {}
            }`, $
        )
    })
    
    describe("Fields", () => {
        regenerate(
            vsl`class A {
                let a
            }`,
            `class A: Object {
                let a
            }`, $
        )
        
        regenerate(
            vsl`class A {
                var a
            }`,
            `class A: Object {
                var a
            }`, $
        )
        
        regenerate(
            vsl`class A {
                public let a
            }`,
            `class A: Object {
                public let a
            }`, $
        )
        
        regenerate(
            vsl`class A {
                let a = 1
            }`,
            `class A: Object {
                let a = 1
            }`, $
        )
        
        regenerate(
            vsl`class A {
                public let a = 1
            }`,
            `class A: Object {
                public let a = 1
            }`, $
        )
        
        regenerate(
            vsl`class A {
                let a: T
            }`,
            `class A: Object {
                let a: T
            }`, $
        )
        
        regenerate(
            vsl`class A {
                let a: T = 1
            }`,
            `class A: Object {
                let a: T = 1
            }`, $
        )
    })
});
