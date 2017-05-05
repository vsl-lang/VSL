/**
 * Highlights a given index range given a code
 *
 * @param {string} code - The specific code which will be used to determine the
 *                        create the index highlight
 * @param {number[]} index - An array in the form of [start, end] which specify
 *                           the indexes to highlight
 * @param {boolean} [highlight=false] - Highlight with ANSI codes the output
 * 
 * @return {Object} contains the needed indices and lines
 * @property {string[]} lines the lines to view
 * @property {number} relativeLine the relative index of the starting line
 * @property {number} startIndex the index to start highlighting at
 * @property {number} relativeEnd the relative end to startIndex to end highlight
 */
export default function bound (code: string, index: number) {
    let i = 0,
        lines = [],
        lineNumber = 0,
        previous = '',
        numberOfBoundingLines = 2,
        keepCurrentLine = false,
        line = 0,
        relativeLine = -1,
        currentLineIndex = 0,
        start = 0,
        startIndex = 0;
        
    while (i <= code.length) {
        if (code[i] === '\n' || i === code.length) {
            // If excess lines & k is false (keep)
            if (lines.length >= numberOfBoundingLines && !keepCurrentLine) {
                lines.shift();
                start++;
            }
            
            if (relativeLine < 0 && keepCurrentLine)
                relativeLine = lines.length;
            lines.push(previous);
            
            lineNumber++;
            currentLineIndex = i + 1;
            
            // Stop if > t
            if (keepCurrentLine && lineNumber - line > numberOfBoundingLines)
                break;
            
            previous = '';
        } else {
            previous += code[i];
        }
        
        if (i === index[0]) {
            startIndex = i - currentLineIndex;
            keepCurrentLine = true;
        }
        
        if (i < index[1])
            line = lineNumber;
        
        i++;
    }
    
    return {
        lines,
        start,
        relativeLine,
        startIndex: startIndex,
        relativeEnd: index[1] - index[0]
    };
}