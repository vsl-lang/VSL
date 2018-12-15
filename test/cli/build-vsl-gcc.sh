#!/usr/bin/env sh
node $VSL build $RUNNER_DIR/test.vsl -o $RUNNER_OUT_1 --verbose --linker GCC
$RUNNER_OUT_1
