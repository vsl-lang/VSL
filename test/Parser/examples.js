import { vsl, valid, invalid } from '../hooks';

export default () => describe('Examples', () => {
    valid`\
print("Hello, World")`;
    valid`\
func main(args: String[]) {
  print("Hello, World!")
}`;
    valid`\
let fizzbuzz :: (of: Int) -> String
fizzbuzz(i where i % 3, i % 5) -> "FizzBuzz"
fizzbuzz(i where i % 3) -> "Fizz"
fizzbuzz(i where i % 5) -> "Buzz"
fizzbuzz(i) -> String(for: i)`;
    valid`\
func fizzbuzz(to i: Int) {
    for i in 0..i {
        print fizzbuzz(of: i)
    }
}`;
})