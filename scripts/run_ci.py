#!/usr/bin/env python3
"""
CI script for claude-code-gui.

Run: python scripts/run_ci.py
Exit 0 = all pass, Exit 1 = failures.
Add new checks here as the project grows.
"""

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).parent.parent


def run_golden_rules():
    print("=== Golden Rules ===")
    result = subprocess.run(
        [sys.executable, "scripts/golden_rules.py", "src", "src-tauri/src",
         "--docs", ".plans/claude-code-gui/docs"],
        cwd=ROOT,
    )
    return result.returncode == 0


def run_type_check():
    print("\n=== TypeScript Type Check ===")
    if not (ROOT / "tsconfig.json").exists():
        print("  [SKIP] tsconfig.json not found (project not yet bootstrapped)")
        return True
    result = subprocess.run(["bun", "run", "tsc", "--noEmit"], cwd=ROOT)
    return result.returncode == 0


def run_rust_check():
    print("\n=== Rust Check ===")
    src_tauri = ROOT / "src-tauri"
    if not src_tauri.exists():
        print("  [SKIP] src-tauri/ not found (project not yet bootstrapped)")
        return True
    result = subprocess.run(["cargo", "check"], cwd=src_tauri)
    return result.returncode == 0


def run_rust_tests():
    print("\n=== Rust Tests ===")
    src_tauri = ROOT / "src-tauri"
    if not src_tauri.exists():
        print("  [SKIP] src-tauri/ not found")
        return True
    result = subprocess.run(["cargo", "test"], cwd=src_tauri)
    return result.returncode == 0


def run_frontend_tests():
    print("\n=== Frontend Tests ===")
    if not (ROOT / "package.json").exists():
        print("  [SKIP] package.json not found (project not yet bootstrapped)")
        return True
    result = subprocess.run(["bun", "run", "test", "--run"], cwd=ROOT)
    return result.returncode == 0


if __name__ == "__main__":
    results = {
        "golden_rules": run_golden_rules(),
        "typescript": run_type_check(),
        "rust_check": run_rust_check(),
        "rust_tests": run_rust_tests(),
        "frontend_tests": run_frontend_tests(),
    }

    print("\n=== CI Summary ===")
    all_pass = True
    for check, passed in results.items():
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False
        print(f"  {status}  {check}")

    print()
    if all_pass:
        print("CI: ALL CHECKS PASSED")
        sys.exit(0)
    else:
        print("CI: FAILURES DETECTED — fix before requesting review")
        sys.exit(1)
