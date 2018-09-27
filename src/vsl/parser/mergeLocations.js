/**
 * Merges locations
 * @param {Object} locA
 * @param {Object} locB
 */
export default function mergeLocations(locA, locB) {
    // If they are on same line
    if (locA.line === locB.line) {
        const maxCol = Math.max(locA.column, locB.column);
        const minCol = Math.min(locA.column, locB.column);

        const minIdx = Math.min(locA.index, locB.index);

        return {
            line: locA.line,
            column: minCol,
            length: maxCol - minCol,
            index: minIdx
        }
    } else {
        return lobB;
    }
}
