#!/bin/bash

# Get directory script is in
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPTS_DIR/..
SQLPAD_DIR=`pwd`

# Install node modules per package-lock.json
npm i
(cd $SQLPAD_DIR/client && npm i --verbose)
(cd $SQLPAD_DIR/server && npm i --verbose)

# Build front-end
(cd $SQLPAD_DIR/client && npm run build)

# Copy front-end build to server directory
rm -rf server/public
mkdir server/public
cp -r ./client/build/* ./server/public
