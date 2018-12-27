function highlightTime(time, t1 = 50, t2 = 2) {
    return time > t1 ? '31' : time > t2 ? '33' : '32'
}

/**
 * Pretty prints performance breakdown
 * @param {Map} benchmarks - From transformation context
 * @return {string} STDOUT string
 */
export default function prettyPrintPerformance(benchmarks) {
    let str = "";
    let sortedBenchmarks = [...benchmarks].sort(
        ([key1, _1], [key2, _2]) => key1 > key2
    );

    let time = 0;
    for (let [key, values] of sortedBenchmarks) {
        let totalTime = values.reduce((a, b) => a + b, 0);
        let timePer = totalTime / values.length;
        time += +totalTime;
        str += `\u001B[1m${key}\u001B[0m \u001B[2m(${values.length} calls)\u001B[0m: `;
        str += `\u001B[${highlightTime(totalTime)}m${totalTime.toFixed(2)}ms\u001B[0m`;
        str += ` (\u001B[${highlightTime(timePer, 0.8, 0.3)}m${timePer.toFixed(2)}ms\u001B[0m per)`;
        str += '\n';
    }
    str += `\u001B[1mTotal Time: \u001B[${highlightTime(time, 120, 80)}m${time.toFixed(2)}ms\u001B[0m\n`;
    return str;
}
