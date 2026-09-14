# Autonome DePIN Desktop Application (`autonome-desktop/`)

The **Autonome DePIN Desktop Application** is a cross-platform desktop client built with **Tauri v2**, **Rust**, and **React**. It enables non-technical hardware owners to turn their machine into a DePIN compute node, hosting sandboxed AI workloads, generating cryptographic execution proofs, and earning automated ATMA rewards directly into cold smart account vaults.

---

## Technical Stack & Architecture

- **Desktop Framework**: Tauri v2 (Rust backend, webview frontend)
- **Frontend Stack**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Sidecar Execution Engine**: `worker-bin` (PyInstaller bundle of `autonome/worker.py`)
- **Isolation Engine**: Docker Desktop integration via `@tauri-apps/plugin-shell`
- **Persistence**: Browser `localStorage` for vault address & local SQLite database inside sidecar binary (`~/.autonome/worker.db`)

```
 ┌─────────────────────────────────────────────────────────────┐
 │               Tauri Desktop App (React / Webview)           │
 │ ┌───────────────────┐ ┌───────────────────┐ ┌─────────────┐ │
 │ │ Vault Config Card │ │ Telemetry Dashboard│ │ Live Console│ │
 │ └─────────┬─────────┘ └─────────▲─────────┘ └─────────────┘ │
 └───────────┼─────────────────────┼───────────────────────────┘
             │ (IPC Spawn)         │ (HTTP Poll 127.0.0.1:8000)
             ▼                     │
 ┌─────────────────────────────────┴───────────────────────────┐
 │       PyInstaller Sidecar Binary (`binaries/worker-bin`)     │
 │ ┌──────────────────────┐ ┌────────────────────────────────┐ │
 │ │ FastAPI Daemon (8000)│ │ Docker Container Executor      │ │
 │ └──────────────────────┘ └────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Zero-Configuration Ephemeral Security**:
   - The worker automatically generates an isolated, ephemeral EOA wallet (`~/.autonome/worker_key.json`) on first boot.
   - Operators never manage or export private keys.
2. **Cold ERC-4337 Vault Routing**:
   - Hardware operators input their cold Smart Account Vault address into the UI.
   - Address persists in `localStorage` and automatically syncs to the worker sidecar via `POST /set_vault`.
   - On-chain settlements route ATMA rewards (1.5 ATMA / task) directly to the vault, completely decoupled from the node's execution environment.
3. **Pre-Flight Sanity Checks**:
   - Automatically checks for Docker Engine/Desktop availability via `docker info` IPC call before enabling the node start button.
4. **Graceful Startup & Shutdown**:
   - On launch, tests port `8000` availability and sends `/shutdown` to clean up any orphaned sidecar processes from previous crashes.
   - On stop, triggers `/shutdown` HTTP call before forcefully terminating the child process.
5. **Real-Time Telemetry & Console**:
   - Displays real-time CPU usage percentage, process RAM consumption, active network (Bohr Testnet), node status, and historical task logs.

---

## Directory Structure

```
autonome-desktop/
├── binaries/                  # Bundled sidecar binaries
│   └── worker-bin-x86_64-unknown-linux-gnu   # Compiled PyInstaller sidecar binary
├── src/                       # React frontend source code
│   ├── App.tsx                # Main desktop control panel, telemetry & IPC controller
│   ├── index.html             # Webview HTML template
│   └── main.tsx               # React application entrypoint
├── src-tauri/                 # Rust Tauri backend
│   ├── src/
│   │   ├── lib.rs             # Tauri command handlers & plugin setup
│   │   └── main.rs            # Rust main function
│   ├── Cargo.toml             # Rust package manifest & dependencies
│   ├── tauri.conf.json        # Tauri configuration file & sidecar definitions
│   └── capabilities/          # Tauri v2 security capabilities & permissions
├── vite.config.ts             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS styling config
└── package.json               # Node.js project manifest
```

---

## Prerequisites for Building

1. **Rust Toolchain**: Installed via `rustup` (`cargo`, `rustc` version 1.75+)
2. **Node.js**: v18+ and `npm`
3. **Docker Engine / Desktop**: Running on host OS
4. **PyInstaller Binary**: Built via `./build_worker.sh` in `autonome/` and placed in `binaries/`

---

## Development Setup

### 1. Compile Python Sidecar Binary (if not already compiled)

```bash
cd autonome
./build_worker.sh
```

Ensure the output binary is located at:
`autonome-desktop/binaries/worker-bin-x86_64-unknown-linux-gnu`

### 2. Install Desktop Dependencies

```bash
cd autonome-desktop
npm install
```

### 3. Launch Tauri Application in Development Mode

```bash
npm run tauri dev
```

This launches the Vite dev server on port `5173` and compiles the Rust desktop container.

---

## Packaging Production Installers

To create standalone distribution packages (`.AppImage`, `.deb`, `.dmg`, or `.exe`):

```bash
npm run tauri build
```

Installers are generated in `src-tauri/target/release/bundle/`.
