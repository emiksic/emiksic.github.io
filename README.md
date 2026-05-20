# Reforge

A browser-based tool for defining and exporting your coding style. Pick a language, configure formatting preferences, and download ready-to-use config files for your project — no build step, no dependencies.

## What it does

1. **Select a language** — C++, C, Python, or JavaScript
2. **Configure style** — indentation, braces, spacing, naming conventions, and more
3. **Export** — saves config files directly to a folder (or downloads a ZIP as fallback)

## Generated files

| Language | Files |
|---|---|
| C / C++ | `.clang-format`, `.clang-tidy`, `.editorconfig`, `.vscode/settings.json` |
| Python | `pyproject.toml` (black + ruff + isort), `.editorconfig`, `.vscode/settings.json` |
| JavaScript | `.prettierrc`, `.editorconfig`, `.vscode/settings.json` |

All exports also include a `README.md` with setup instructions for that language.

## Features

- **Live preview** — syntax-highlighted code updates in real time as you change options
- **Presets** — one-click starting points (Google, LLVM, Linux Kernel, Allman, GNU for C/C++; PEP 8, Black, Google for Python; Airbnb, Standard, Prettier for JS)
- **AI prompt** — generates a prompt you can paste into an AI assistant to enforce your style in generated code
- **Shareable link** — current config is encoded in the URL hash, so you can share or bookmark it
- **AI-only options** — naming conventions, comment density, error handling style, etc. (not enforced by formatters, but included in the AI prompt)

## Usage

Open `index.html` in a browser — no server needed.

To save files, click **Save to folder** and pick your project root. Browsers that don't support the File System Access API will download a ZIP instead.

## Tech

Plain HTML + CSS + JS. No frameworks, no bundler, no npm.
