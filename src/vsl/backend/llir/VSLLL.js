import LL from '@/Generator/LL/LL';
import LLVMChainMain from './nodes/LLVMChainMain';

/**
 * VSLLL is a subclass of the {@link LL} backend, this adds a couple nodes which
 * allow for more idomatic graphs.
 *
 * @extends {LL}
 */
export default class VSLLL extends LL {
    /** @override */
    *watchers() {
        yield new LLVMChainMain();
        yield* super.watchers()
    }
}
