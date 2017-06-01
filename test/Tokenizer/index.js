describe('Tokenizer', () => {
    describe('Literals', () => {
        require('./integers')();
        require('./string')();
    });
    
    require('./operators')();
})