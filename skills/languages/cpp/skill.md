---
name: languages-cpp
version: 1.0.0
description: C/C++ modern standards (C++17/20), CMake build configuration, Clang-Tidy, and memory safety.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Modern C++ & Native Systems Engineering

## Purpose
Enforce modern C++ standards, RAII memory management, CMake configuration, and ASan sanitizers.

## When to Activate
Activate when working on native C/C++ projects, MLX native kernels, or llama.cpp bindings.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
C/C++ source files (*.cpp, *.hpp, *.cc), CMakeLists.txt.

## Preconditions
C++ compiler (clang++, g++) and CMake must be available.

## Procedure
1. Inspect CMakeLists.txt for target definitions and compiler flags.
2. Enforce RAII memory ownership: prefer std::unique_ptr and std::shared_ptr over raw pointers.
3. Configure build with AddressSanitizer (-fsanitize=address) to catch memory corruption.
4. Run build via cmake --build build.
5. Run CTest test runner to verify native test suite passes.

## Tool Usage
Call shell_execute with cmake commands.

## Safety
Never disable memory sanitizers when testing native pointers or buffer mutations.

## Permissions
Safe convention guidelines.

## Verification
Confirm build succeeds and ASan reports 0 memory leaks or buffer overflows.

## Failure Handling
If segmentation fault occurs, inspect AddressSanitizer crash log for buffer bounds.

## Output Contract
CppBuildReport with compiler, cmakeTarget, asanStatus.

## Examples
Building and testing native Apple Metal C++ kernels for MLX.

## Related Skills
- `build-build`
- `testing-test-execution`
