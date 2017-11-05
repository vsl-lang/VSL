#ifndef VSL_ARRAY_H_
#define VSL_ARRAY_H_

#include "vsl.h";

struct VSLArray {
    vslint_t length;
    void** values;
}

typedef VSLArray* vslarray_t;

vslarray_t init_VSLArray(vslint_t size, void** values) {
    vslarray_t array = (VSLArray*) malloc(sizeof(VSLArray));
    array->length = size;
    array->values = values;
    return string;
}

void deinit_VSLArray(vslarray_t array) {
    free(array);
}

void* index_VSLArray(vslint_t index, vslarray_t array) {
    if (index >= array->length) return NULL;
    return array->values[index];
}

#endif
