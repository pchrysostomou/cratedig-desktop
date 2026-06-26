// Freeze the FastAPI backend into the Tauri sidecar (onedir, Strategy B) and copy
// the folder into src-tauri/binaries/, where Tauri ships it via bundle.resources.
// See DESIGN.md §8.2. Run: `npm run build:sidecar`
// (after `pip install -e ".[dev]"` in backend/ so PyInstaller + deps are present).
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const backend = join(root, "backend");
const venvPy = join(backend, ".venv", "Scripts", "python.exe");
const py = existsSync(venvPy) ? venvPy : "python";

console.log(`Freezing sidecar (onedir) with PyInstaller (${py}) ...`);
execSync(`"${py}" -m PyInstaller cratedig-sidecar.spec --noconfirm --clean`, {
  cwd: backend,
  stdio: "inherit",
});

const src = join(backend, "dist", "cratedig-sidecar");
const dest = join(root, "src-tauri", "binaries", "cratedig-sidecar");
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Sidecar -> ${dest}`);
