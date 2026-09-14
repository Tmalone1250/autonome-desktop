# Autonome DePIN Node Desktop

Autonome DePIN Node Desktop is the desktop companion application for the Autonome ecosystem, providing a native node running experience built with Tauri, React, and Tailwind CSS. It acts as an Ephemeral Compute Runner for decentralized compute tasks.

## Installation

We provide pre-compiled binaries for Linux distributions. You can find the built install files in the `src-tauri/target/release/bundle/` directory.

### Debian / Ubuntu (.deb)
To install the `.deb` package on Debian-based systems (Ubuntu, Linux Mint, Pop!_OS, etc.):
```bash
sudo apt install ./src-tauri/target/release/bundle/deb/autonome-desktop_0.1.0_amd64.deb
```
Alternatively, use `dpkg`:
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/autonome-desktop_0.1.0_amd64.deb
sudo apt --fix-broken install
```

### Fedora / RHEL / CentOS (.rpm)
To install the `.rpm` package on RPM-based systems (Fedora, openSUSE, etc.):
```bash
sudo dnf install src-tauri/target/release/bundle/rpm/autonome-desktop-0.1.0-1.x86_64.rpm
```
*(On older systems, use `sudo yum localinstall ...` instead)*

### AppImage (Universal Linux)
AppImages are standalone executables that run on almost any Linux distribution without installation.
1. Make the AppImage executable:
   ```bash
   chmod +x src-tauri/target/release/bundle/appimage/autonome-desktop_0.1.0_amd64.AppImage
   ```
2. Run the application:
   ```bash
   ./src-tauri/target/release/bundle/appimage/autonome-desktop_0.1.0_amd64.AppImage
   ```

## Local Development

If you prefer to build and run the node locally from source:

1. **Install Prerequisites**: Ensure you have Node.js, npm, and Rust installed. You may also need system dependencies for Tauri (e.g., `libwebkit2gtk-4.1-dev`).
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run in Development Mode**:
   ```bash
   npm run tauri dev
   ```
4. **Build from Source**:
   ```bash
   npm run tauri build
   ```

## Integration

The Autonome desktop application integrates with the local Autonome FastAPI backend. Ensure you have the `autonome-worker` and `autonome-orchestrator` containers running via Docker Compose (`docker compose up -d` in the `/autonome` repository) for full end-to-end functionality.
