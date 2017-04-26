import colors from 'colors';

function leftPad (str, len) {
    var pad = len - str.length, i = "";
    if (pad <= 0) return str;
    while(pad--) i += " ";
    return i + str;
}

/**
 * Highlights a series of lines & indices as specified by indicator
 * 
 * @param {Object} indicators - The result from indicator(code:index:)
 * @param {bool} [highlight=true] - To highlight output with ANSI
 */
export default function highlight(indicators, highlight: bool = true) {
    var lines = indicators.lines, line,
        start = indicators.startIndex, k = 0,
        end = start + indicators.relativeEnd,
        suffix = " | ",
        indicator = "^",
        l = indicators.start;
    
    if (highlight) {
        suffix = suffix.red
        indicator = indicator.red.bold
    }
    
    var maxLen = ((indicators.start + lines.length) + suffix).length;
        
    for (var i = 0; i < lines.length; i++) {
        lines[i] = leftPad(l++ + suffix, maxLen) + lines[i];
        
        if (i >= indicators.relativeLine && k < end) {
            line = lines[i];
            lines.splice(++i, 0, leftPad(suffix, maxLen));
            
            for(let j = 0; j < line.length && k < end; j++, k++) {
                // if (highlight) lines[i - 1][i] = lines[i - 1][i].bold;
                
                if (k >= start) lines[i] += indicator;
                else lines[i] += " ";
            }
        }
    }
    
    return lines;
}