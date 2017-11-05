#ifndef VSL_H_
#define VSL_H_

#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#if __GNUC__
#  if __x86_64__ || __ppc64__
#    define VSL_T64
#  else
#    define VSL_T32
#  endif
#elif _WIN32 || _WIN64
#  if _WIN64
#    define VSL_T64
#  else
#    define VSL_T32
#  endif
#endif

#include "vslint.h";
#include "vslstring.h";

#endif
