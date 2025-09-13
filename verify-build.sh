#!/bin/bash
# Post-build verification script for Render deployment

echo "=== Build Verification Script ==="
echo "Current working directory: $(pwd)"
echo "Contents of current directory:"
ls -la

echo -e "\n=== Checking for dist folder ==="
if [ -d "dist" ]; then
    echo "✅ dist folder exists"
    echo "Contents of dist folder:"
    ls -la dist/
    
    if [ -f "dist/main.js" ]; then
        echo "✅ main.js found in dist folder"
        echo "File size: $(wc -c < dist/main.js) bytes"
    else
        echo "❌ main.js NOT found in dist folder"
    fi
else
    echo "❌ dist folder does not exist"
fi

echo -e "\n=== Node.js version ==="
node --version

echo -e "\n=== NPM version ==="
npm --version

echo -e "\n=== Environment Variables Check ==="
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "PORT: ${PORT:-'not set'}"

echo -e "\n=== Attempting to start application ==="
echo "Command: node ./dist/main.js"
echo "This would be executed next..."