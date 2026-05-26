#!/bin/sh
node dist/workers/generationWorker.js &
node dist/index.js
