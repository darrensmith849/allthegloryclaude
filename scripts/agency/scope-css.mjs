// Scope the platform's stylesheets under `.ngoma` so they cannot affect the
// rest of All the Glory, and namespace their @keyframes. Idempotent: run it
// after adding CSS to src/platform/styles.  node scripts/agency/scope-css.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";

const ROOT = ".ngoma";
const dir = new URL("../../src/platform/styles/", import.meta.url).pathname;
const files = readdirSync(dir).filter((f) => f.endsWith(".css"));

// Collect keyframe names across all files first.
const keyframes = new Set();
for (const f of files) {
  postcss.parse(readFileSync(join(dir, f), "utf8")).walkAtRules("keyframes", (at) => {
    if (!at.params.startsWith("ngoma-")) keyframes.add(at.params);
  });
}

function scope(selector) {
  const s = selector.trim();
  if (s.startsWith(ROOT) || s.startsWith(`.js ${ROOT}`) || s.startsWith(`:root:has(${ROOT})`)) return s;
  if (s === ":root" || s === "body") return ROOT;
  if (s === "html") return `:root:has(${ROOT})`;
  if (s.startsWith(".js ")) return `.js ${ROOT} ${s.slice(4)}`;
  return `${ROOT} ${s}`;
}

for (const f of files) {
  const path = join(dir, f);
  const root = postcss.parse(readFileSync(path, "utf8"));
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map(scope);
  });
  root.walkAtRules("keyframes", (at) => {
    if (keyframes.has(at.params)) at.params = `ngoma-${at.params}`;
  });
  root.walkDecls(/^animation(-name)?$/, (decl) => {
    decl.value = decl.value.replace(/[a-z][\w-]*/g, (word) => (keyframes.has(word) ? `ngoma-${word}` : word));
  });
  writeFileSync(path, root.toString());
  console.log("scoped", f);
}
