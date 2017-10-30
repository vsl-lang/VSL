import ExecutionGraph from '@/LLIR/ExecutionGraph/ExecutionGraph';
import Serialize from '@/LLIR/Serializer/Serialize';

import Backend from '../Backend';
import * as w from './watchers';

/**
 * ## LLIR
 * LLIR is the default VSL
 */
export default class LLIR extends Backend {
    /**
     * Creates LLIR backend with given output stream/output location/
     * @param  {BackendStream} stream A backend stream object set to receive the
     *                                LLVM IR output.
     */
    constructor(stream) {
        super(stream, [
            w.CodeBlock,
            w.AssignmentStatement,
            w.FunctionStatement
        ]);
        
        this.instance = new ExecutionGraph();
    }
    
    postgen() {
        ////////////////////////////////////////////////////////////////////////
        //                             postgen                                //
        ////////////////////////////////////////////////////////////////////////
        
        
        ////////////////////////////////////////////////////////////////////////
        //                            serialize                               //
        ////////////////////////////////////////////////////////////////////////
        let serializer = new Serialize();
        this.instance.serialize(serializer);
        this.stream.write(serializer.buffer.toString('binary'));
    }
}
