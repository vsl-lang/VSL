#ifndef VSL_STRING_H_
#define VSL_STRING_H_

#include "vsl.h";

struct VSLString {
    vslint_t length;
    uint8_t* value;
}

typedef VSLString* vslstring_t;

vslstring_t init_VSLString(const char* source) {
        vslstring_t string = (VSLString*) malloc(sizeof(VSLString));
    string->length = strlen(source);
    string->value = source;
    return string;
}

void deinit_VSLString(vslstring_t string) {
    free(string);
}

#endif
