#!/usr/bin/env node
import('../dist/index.js').then((module) => module.run()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
