## General Setup

1. Install Node.js.
2. Install Rust with Cargo.
3. Install/enable Yarn.
4. Create an empty `.env` file in the root dir.
5. Run `yarn` in the root dir.
6. Download `ResourceTool-win-x64.zip` from `https://github.com/OrfeasZ/ZHMTools/releases` and extract into the `src-tauri` directory.
7. Rename `ResourceTool.exe` to `ResourceTool-x86_64-pc-windows-msvc.exe` in the `src-tauri` directory.
8. Download hash list from `https://hitmandb.glaciermodding.org/latest-hashes.7z` and extract into the `src-tauri` directory.
9. Download RPKG from `https://glaciermodding.org/rpkg/` and extract `quickentity_rs.dll` into the `src-tauri` directory.

## Development

Run `yarn tauri dev` in the root directory.

## Building

1. If you are not planning on publishing a release, open `tauri.config.json` and change `tauri.updater.active` to `false`.
2. Run `yarn tauri build` in the root directory.
