#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const diagramsDir = path.join(repoRoot, "docs", "diagrams");
const generatedDir = path.join(diagramsDir, "generated");

mkdirSync(generatedDir, { recursive: true });

if (!existsSync(diagramsDir)) {
  process.exit(0);
}

const files = readdirSync(diagramsDir)
  .filter((name) => name.endsWith(".mmd"))
  .map((name) => path.join(diagramsDir, name));

if (files.length === 0) {
  console.log("No Mermaid source files found; skipping diagram rendering.");
  process.exit(0);
}

for (const sourcePath of files) {
  const basename = path.basename(sourcePath, ".mmd");
  const outputPath = path.join(generatedDir, `${basename}.svg`);
  execFileSync("npx", ["mmdc", "-i", sourcePath, "-o", outputPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

console.log(`Rendered ${files.length} Mermaid diagram(s).`);
