import VSLType from './vsltype';

let VSLBinaryOperatorLookup = [];
VSLBinaryOperatorLookup['+'] = [];
VSLBinaryOperatorLookup['+'][VSLType.String][VSLType.Any] = (l, r) => l + r;
VSLBinaryRightOperatorLookup['+'][VSLType.Number][VSLType.Number] = (l, r) => l + r;

VSLBinaryOperatorLookup['-'] = [];
VSLBinaryRightOperatorLookup['-'][VSLType.Number][VSLType.Number] = (l, r) => l - r;

VSLBinaryOperatorLookup['*'] = [];
VSLBinaryRightOperatorLookup['*'][VSLType.String][VSLType.Number] = (l, r) => l.repeat(r);
VSLBinaryRightOperatorLookup['*'][VSLType.Number][VSLType.Number] = (l, r) => l * r;

VSLBinaryOperatorLookup['/'] = [];
VSLBinaryRightOperatorLookup['/'][VSLType.String][VSLType.String] = (l, r) => l.split(r);
VSLBinaryRightOperatorLookup['/'][VSLType.Number][VSLType.Number] = (l, r) => l / r;

VSLBinaryOperatorLookup['**'] = [];
VSLBinaryRightOperatorLookup['**'][VSLType.Number][VSLType.Number] = (l, r) => l ** r;

VSLBinaryOperatorLookup['&'] = [];
VSLBinaryRightOperatorLookup['&'][VSLType.Number][VSLType.Number] = (l, r) => l & r;

VSLBinaryOperatorLookup['|'] = [];
VSLBinaryRightOperatorLookup['|'][VSLType.Number][VSLType.Number] = (l, r) => l | r;

VSLBinaryOperatorLookup['^'] = [];
VSLBinaryRightOperatorLookup['^'][VSLType.Number][VSLType.Number] = (l, r) => l ^ r;

let VSLBinaryRightOperatorLookup = [];
VSLBinaryRightOperatorLookup['+'] = [];
VSLBinaryRightOperatorLookup['+'][VSLType.String][VSLType.Any] = (l, r) => l + r;

let VSLUnaryOperatorLookup = [];
VSLUnaryOperatorLookup['-'][VSLType.Number] = o => -o;
VSLUnaryOperatorLookup['-'][VSLType.String] = o => {
    //from mathias bynens' esrever
	// Step 1: deal with combining marks and astral symbols (surrogate pairs)
	o = o
		// Swap symbols with their combining marks so the combining marks go first
		.replace(/([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g, function($0, $1, $2) {
			// Reverse the combining marks so they will end up in the same order
			// later on (after another round of reversing)
			return reverse($2) + $1;
		})
		// Swap high and low surrogates so the low surrogates go first
		.replace(/([\uD800-\uDBFF])([\uDC00-\uDFFF])/g, '$2$1');
	// Step 2: reverse the code units in the string
	var result = '';
	var index = o.length;
	while (index--)
		result += o.charAt(index);
	return result;
};