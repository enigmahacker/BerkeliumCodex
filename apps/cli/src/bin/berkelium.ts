#!/usr/bin/env node
import { main } from '../entrypoint.js';

main().catch((err) => {
  console.error('[Berkelium Fatal Error]:', err);
  process.exit(1);
});
