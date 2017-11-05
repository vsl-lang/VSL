#ifndef VSL_INT_H_
#define VSL_INT_H_

#include "vsl.h";

#if VSL_T64
# define VSLInt uint64_t;
#elif VSL_T32
# define VSLInt uint64_t;
#else
# define VSLInt int;
#endif

typedef VSLInt vslint_t;

#endif
