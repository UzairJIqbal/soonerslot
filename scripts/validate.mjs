// Sanity checks run locally (`npm run check`) and in CI:
// the manifest parses, every file it references exists, every JS module
// parses, and the ZIP table is well formed.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const fail = (message) => failures.push(message);

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const referenced = [
	manifest.background?.service_worker,
	manifest.action?.default_popup,
	...Object.values(manifest.icons ?? {}),
	"offscreen/offscreen.html",
	"sounds/chime.wav",
	"data/zips.json",
].filter(Boolean);
for (const file of referenced) {
	if (!existsSync(join(root, file))) {
		fail(`manifest/runtime file missing: ${file}`);
	}
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.version !== manifest.version) {
	fail(`version mismatch: package.json ${pkg.version} vs manifest ${manifest.version}`);
}

const jsFiles = [];
const walk = (dir) => {
	for (const name of readdirSync(dir)) {
		if (name.startsWith(".") || name === "node_modules" || name === "dist") {
			continue;
		}
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			walk(path);
		} else if (/\.m?js$/.test(name)) {
			jsFiles.push(path);
		}
	}
};
walk(root);
for (const file of jsFiles) {
	try {
		execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
	} catch (error) {
		fail(`${relative(root, file)}: ${error.stderr.toString().trim()}`);
	}
}

const zips = JSON.parse(readFileSync(join(root, "data/zips.json"), "utf8"));
const zipCount = Object.keys(zips).length;
if (zipCount < 30000) {
	fail(`data/zips.json looks truncated (${zipCount} entries)`);
}

if (failures.length) {
	console.error(`✗ ${failures.length} problem(s):\n  ${failures.join("\n  ")}`);
	process.exit(1);
}
console.log(
	`✓ manifest v${manifest.version}, ${referenced.length} referenced files, ${jsFiles.length} JS files, ${zipCount} ZIP codes`,
);
