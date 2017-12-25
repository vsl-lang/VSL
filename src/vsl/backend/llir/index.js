import ExecutionGraph from '@/LLIR/ExecutionGraph/ExecutionGraph';
import MemoryStore from '@/LLIR/ExecutionGraph/Store/MemoryStore';
import Serialize from '@/LLIR/Serializer/Serialize';

import Backend from '../Backend';
import * as w from './watchers';

import VSLLL from './VSLLL';
import LLEnv from '@/Generator/LL/LLEnv';

import LLIRContext from './llirContext';
import LLVMChainMain from './nodes/LLVMChainMain';

import child_process from 'child_process';

/**
 * ## LLIR
 * LLIR is the default VSL
 */
export default class LLIR extends Backend {
    /**
     * Creates LLIR backend with given output stream/output location/
     * @param {LLIRConfig} config Configuration for LL output + execution.
     */
    constructor(llirconfig) {
        super('llvm');

        this.instance = new ExecutionGraph(MemoryStore, 'main');
        this._rootChain = new LLVMChainMain();
        this.instance.main.getBody().setAtom(this._rootChain);
        this._config = llirconfig;
    }

    /**
     * @override
     */
    *watchers() {
        yield* super.watchers();
        yield new w.CodeBlock();
        yield new w.AssignmentStatement();
        yield new w.ExternalFunctionStatement();
        yield new w.ExpressionStatement();
    }

    /**
     * Begins generation.
     * @param {CodeBlock} input
     * @abstract
     */
    start(input) {
        for (let i = 0; i < input.statements.length; i++) {
            this.generate(i, input.statements, new LLIRContext(
                this,
                this.instance.main,
                this.instance.main.getBody()
            ));
        }
    }

    postgen() {
        ////////////////////////////////////////////////////////////////////////
        //                             postgen                                //
        ////////////////////////////////////////////////////////////////////////


        ////////////////////////////////////////////////////////////////////////
        //                                run                                 //
        ////////////////////////////////////////////////////////////////////////
        let ll = new VSLLL('main', LLEnv.default);
        ll.setGraph(this.instance);
        let code = ll.module.print();

        console.log(`\u001B[2m\n${code}\u001B[0m`);
        let lli = child_process.spawn(
            this._config.LLIPath,
            [
                `-load=${this._config.libcPath}`,
            ],
            {
                stdio: ['pipe', process.stdout, process.stderr]
            }
        );

        lli.stdin.write(code);
    }
}
