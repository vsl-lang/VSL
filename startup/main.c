#include <vslnative/vsl.h>

typedef int (*vslmain_t)(vslarray_t);
extern vslmain_t get_vslmain();

vslarray_t vslargs;

int VSLC_deinit() {
    deinit_VSLArray(vslargs);
}

int main(int argc, char** argv) {
    vslmain_t vslmain = get_vslmain();
    vslarray_t = init_VSLArray((vslint_t) argc, argv);
    return (*vslmain)(vslarray_t);
}
