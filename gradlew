#!/bin/sh

# Attempt to locate Gradle from PATH or GRADLE_HOME
if command -v gradle >/dev/null 2>&1; then
    exec gradle "$@"
fi

DIRNAME=$(dirname "$0")
CLASSPATH="$DIRNAME/gradle/wrapper/gradle-wrapper.jar"

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVACMD="$JAVA_HOME/bin/java"
else
    JAVACMD="java"
fi

exec "$JAVACMD" -jar "$CLASSPATH" "$@"
