// Source-independent VSL boostrap code. If you
// use a C-style main(argc: UInt, argv: Pointer<CString>) -> Int
// then that will be transformed into the entry point rather
// than this bootstrap. This will require a cleanup call to call
// the deinit routine which can be called through VSLC_deinit or
// the VSLC_DEINIT macro.

#include <vslnative/vsl.h>
#define VSLC_DEINIT VSLC_deinit

typedef int (*vslmain_t)(vslarray_t);
extern vslmain_t get_vslmain();

vslarray_t vslargs;

int VSLC_DEINIT() {
    deinit_VSLArray(vslargs);
}

int main(int argc, char** argv) {
    vslmain_t vslmain = get_vslmain();
    vslarray_t = init_VSLArray((vslint_t) argc, argv);
    return (*vslmain)(vslarray_t);
}
