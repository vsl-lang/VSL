import FixItColors from '../fixit/FixItColors';
import colorSupport from './colorSupport';

export default class FixItCLIColors extends FixItColors {
    accent(text) {
        return `\u001B[1;${
            colorSupport.has16m ?
            `38;2;167;224;64` :
            `32`
        }m${text}\u001B[0m`
    }
    
    color(text) {
        return `\u001B[1m${text}\u001B[0m`
    }
}
