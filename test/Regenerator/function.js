import { vsl, regenerate } from '../hooks';

const $ = { trim: true };

export default () => describe("Function", () => {
    regenerate(
        vsl`func f() {}`,
        `func f() {}`, $
    );
    
    regenerate(
        vsl`func f() external(f)`,
        `func f() external(f)`, $
    );
    
    regenerate(
        vsl`func f() -> T {}`,
        `func f() -> T {}`, $
    );
    
    regenerate(
        vsl`func f() -> T external(f)`,
        `func f() -> T external(f)`, $
    );
    
    regenerate(
        vsl`func f(a: T) {}`,
        `func f(a: T) {}`, $
    );
    
    regenerate(
        vsl`func f(a: T, b: U) {}`,
        `func f(a: T, b: U) {}`, $
    );
    
    regenerate(
        vsl`func f(a: T<U>) {}`,
        `func f(a: T<U>) {}`, $
    );
    
    regenerate(
        vsl`public func f() {}`,
        `public func f() {}`, $
    );
    
    regenerate(
        vsl`@test public func f() {}`,
        `@test public func f() {}`, $
    );
    
    regenerate(
        vsl`@test(*) public func f() {}`,
        `@test(*) public func f() {}`, $
    );
});
