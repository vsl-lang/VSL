<h1 align="center">
  <a href="https://github.com/vsl-lang/VSL">
    <img height="95" src="https://github.com/vsl-lang/VSL/raw/master/misc/logo.png" alt="VSL: Versatile Scripting Language"/>
  </a>
</h1>

<p align="center">
  <p align="center">
    <a href="https://travis-ci.org/vsl-lang/VSL">
      <img src="https://travis-ci.org/vsl-lang/VSL.svg?branch=master" alt="Build Status"/>
    </a>
    <a href="https://codecov.io/gh/vsl-lang/VSL">
      <img src="https://codecov.io/gh/vsl-lang/VSL/branch/master/graph/badge.svg" alt="Codecov" />
    </a>
    <a href="https://codeclimate.com/github/vsl-lang/VSL/">
      <img src="https://codeclimate.com/github/vsl-lang/VSL/badges/gpa.svg" />
    </a>
  </p>
  <p align="center">
    <a href="#">Website</a> &mdash;
    <a href="#">Download</a> &mdash;
    <a href="http://docs.cheddar.vihan.org/">Documentation</a>
  </p>
  <p align="center">
    Versatile Scripting Language
  </p>
</p>

## Building

Building isn't _too_ diffiult. Usually you'll want to install a pre-built binary
but if you're feeling adventurous or just want to help build VSL (:D) building
from source is simple:

```bash
$ git clone --recursive https://github.com/vsl-lang/VSL
$ npm install
$ npm run build
```

Do note, branch of the `develop` branch to make changes. All PRs go there. Other
commands:

```
$ npm run coverage # Generates testing coverage reports
$ npm test         # Runs all tests
$ npm run dev      # Development build
```

## Problem
Today they are quite a few languages, some popular ones you may of heard of are:
 - Python
 - Java
 - JavaScript
 - C/C++

and while these are all great and well (and have worked). Here are the things
one _wants_ from a programming language:

 - Portability (C/C++ lack here)
 - Ease of Use (Java & C/C++ lack here, but arguable)
 - Rapid prototyping (Java, C/C++, and even JS ES2015+)
 - Saftey: type, memory, etc. (JS & Python lack)
 - Bare-metal speed (yeah...)
 - Powerful and close-to-hardware (JS, Python, and Java lack)

So VSL aims to solve _all_ of these problems. By leveraging the [LLVM](http://llvm.org/)
bytecode engine you're able to reach the limits of portability.

Additionally due to careful design and implementation choices, VSL compiles to
very similar ASM to what a C-implementation would produce.

By using syntax sugar, and powerful type-negotiation, VSL has one of the best
type deduction algorithms. Combined with low compilation overhead, VSL can
generate code with bare minimum boilerplate and guarunteed saftey at compile-time.

VSL uses high-level syntax to be able to write code that works for all types of
programmers, whether you are functional, OO, scripting, or low-level engineer,
VSL works for embedded applications up to server apps.

VSL is also reliable by using trusted libcurl, and glibc backends which are well
established and highly developed libraries for performing tasks at the low-level.
Due to this, VSL has powerful low-level pointer interopability and the power of
full OO-classes, but assembly-level bit alignment.

## Examples
VSL functions both as a scripting and a full-blown language so two alterntaives
are given for all programs. That said, they are many more ways to write many of
these programs, neither more correct than the other.

### Hello, World!

```python
print("Hello, World")
```

```swift
func main(args: String[]) {
  print("Hello, World!")
}
```

### Fizzbuzz

```haskell
let fizzbuzz :: (of: Int) -> String
fizzbuzz(i where i % 3, i % 5) -> "FizzBuzz"
fizzbuzz(i where i % 3) -> "Fizz"
fizzbuzz(i where i % 5) -> "Buzz"
fizzbuzz(i) -> String(for: i)
```

```
func fizzbuzz(to i: Int) {
    for i in 0..i {
        print fizzbuzz(of: i)
    }
}
```