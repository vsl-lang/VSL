import { VSLLexer } from '../vsl/lexer';
import { readFile } from 'fs-promise';

async function VSLParse() {
    let tokens = (new VSLLexer()).tokenize(
        await readFile(process.argv[process.argv.length - 1]
    ));
}

//TODO: parse tokens w/ nearley