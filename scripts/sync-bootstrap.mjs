import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Copies the Bootstrap 6 alpha stylesheet into `public/vendor` so it can be
 * linked from `index.html`. Importing it through the app bundle would make the
 * Tailwind PostCSS plugin treat Bootstrap's native `@layer` rules as Tailwind
 * directives.
 */
const source = resolve("node_modules/bootstrap/dist/css/bootstrap.css");
const target = resolve("public/vendor/bootstrap.css");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`Synced Bootstrap CSS to ${target}`);
