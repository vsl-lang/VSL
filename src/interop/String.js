import VSLType from './VSLType';
import Number from './Number';

export default class String extends VSLType {

    /**
     * Converts from a JS string. Automatically converts to UTF8.
     * @param {string} string - JS string object
     * @return {String}
     */
    static from(string) {
        const utf8String = Buffer.from(string);
        const stringLength = VSL.Number.from(utf8String.length, { signed: false }).toBuffer();

        const stringBuffer = Buffer.concat([stringLength, utf8String]);
        return new String(stringBuffer);
    }

    /**
     * Returns string as JavaScript string
     * @return {string}
     */
    toString() {
        return this.data.slice(8).toString();
    }

}
