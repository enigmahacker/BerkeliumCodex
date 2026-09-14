---
name: languages-java
version: 1.0.0
description: Java language conventions, Maven and Gradle project builds, JUnit 5 testing, and JVM diagnostics.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Java Enterprise & JVM Engineering

## Purpose
Govern Java development: Maven/Gradle lifecycles, JUnit 5 assertions, and JVM heap configurations.

## When to Activate
Activate when developing Java projects (*.java, pom.xml, build.gradle).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Java source files, build descriptors.

## Preconditions
JDK 17+ and Maven/Gradle wrapper must be present.

## Procedure
1. Detect build tool (Maven mvnw vs Gradle gradlew).
2. Check JDK version compatibility.
3. Inspect package structure (src/main/java, src/test/java).
4. Run compilation: ./mvnw test-compile or ./gradlew testClasses.
5. Run unit tests using JUnit 5 runner.

## Tool Usage
Invoke shell_execute with Maven or Gradle wrapper commands.

## Safety
Ensure build wrappers (mvnw/gradlew) are executed rather than unpinned global binaries.

## Permissions
Safe convention guidelines.

## Verification
Confirm build wrapper exits with BUILD SUCCESS.

## Failure Handling
If ClassNotFoundException occurs, verify dependency scopes in pom.xml.

## Output Contract
JavaBuildSummary with jdkVersion, buildTool, testResults.

## Examples
Running ./mvnw clean test in a Spring Boot application.

## Related Skills
- `build-build`
- `testing-test-execution`
