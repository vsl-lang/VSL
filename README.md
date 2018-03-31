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
  </p>
  <p align="center">
    <!-- <a href="https://staging.vihan.org/VSL/app">Website</a> &mdash; -->
    <a href="https://github.com/vsl-lang/VSL/wiki/Introduction">Language Documentation</a>  &mdash;
    <a href="https://staging.vihan.org/VSL/libvsl/index.html">API Documentation</a>
  </p>
  <p align="center">
    Versatile Scripting Language
  </p>
</p>

VSL is a modern, powerful, fast, and easy to write programming language designed
for the 21st century.


## Download

You can either build from source (see Building) or installed a pre-compiled
binary/executable:

|    Windows    |     macOS     |     Linux     |
| :-----------: | :-----------: | :-----------: |
| [Download][1] | [Download][2] | [Download][3] |


  [1]: https://staging.vihan.org/VSL/vsl.exe
  [2]: https://staging.vihan.org/VSL/macos/vsl
  [3]: https://staging.vihan.org/VSL/linux/vsl

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
$ npm run docs     # Make docs
$ npm run lint     # Lint code and make sure not crap
```

Do note you don't need to generate docs unless you want them for yourself because
the CI will automatically generate docs.

## Development Info

 - Docs are located [here](https://preview.c9users.io/somebody1234/node-vsl/docs/index.html).
 - A bunch of READMEs are located in the dirs which do more complex things

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

So VSL aims to solve _all_ of these problems

 - **Portability**: By leveraging the [LLVM](http://llvm.org/)
bytecode engine VSL can compile to almost all targets and is designed for simple
compatibility with existing C projects.

 - **Fast**: Due to careful design and implementation choices, VSL compiles to
very similar ASM to what something written in a low-level language such as C
would produce.

 - **Safe**: By using syntax sugar, and powerful type-negotiation, VSL has one
of the best type deduction algorithms. Combined with low compilation overhead,
VSL can generate code with bare minimum boilerplate and guarunteed saftey at
compile-time.

 - **Powerful**: VSL uses high-level syntax to be able to write code that works
for all types of programmers, whether you are functional, OO, scripting, or
low-level engineer. Through both high-level interfaces for low-level functions,
you can use VSL for tasks low-level such as read/writing bits from a serial port
to running a server.

 - **Reliability**: through bindings of reliable, trusted, and industry-standard
libraries such as libcurl, and glibc backends, VSL has powerful low-level
pointer interopability and the power of full OO-classes, but assembly-level bit
alignment.

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
