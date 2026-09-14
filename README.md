# Autonome DePIN Node (Desktop Client)

The **Autonome DePIN Node** is an ephemeral compute runner that allows anyone to securely host and execute containerized AI and web3 workloads. By running this desktop client, you can contribute compute power to the network and earn ATMA rewards seamlessly into your Operator Vault smart account.

## Features
- **Ephemeral Workloads:** Sandboxed Docker-based execution ensures host safety.
- **Automated Settlement:** Automatically cryptographically signs compute results and settles transactions on the Bohr Testnet.
- **Live Telemetry:** Monitor your node's CPU, Memory usage, network status, and historical task rewards right from the dashboard.
- **Zero-Gas Submissions:** Integrated with a Paymaster to sponsor settlement transactions.

## Prerequisites
- **Docker Desktop**: You must have Docker Desktop installed and running in the background before launching the node, as it powers the sandboxed compute containers.

---

## Installation Guide

We provide pre-compiled binaries for Linux environments. Choose the package that matches your distribution:

### Debian / Ubuntu (`.deb`)
1. Download the `.deb` package from the `target/release/bundle/deb/` folder.
2. Install it using `dpkg`:
   ```bash
   sudo dpkg -i autonome-desktop_0.1.0_amd64.deb
   ```
3. If there are missing dependencies, run:
   ```bash
   sudo apt-get install -f
   ```

### Fedora / RedHat / CentOS (`.rpm`)
1. Download the `.rpm` package from the `target/release/bundle/rpm/` folder.
2. Install it using `dnf` or `rpm`:
   ```bash
   sudo dnf install autonome-desktop-0.1.0-1.x86_64.rpm
   ```
   *or*
   ```bash
   sudo rpm -i autonome-desktop-0.1.0-1.x86_64.rpm
   ```

### Universal Linux (`.AppImage`)
If you are on an unsupported distribution or prefer portable applications, you can use the AppImage.
1. Download the `.AppImage` file from the `target/release/bundle/appimage/` folder.
2. Make it executable:
   ```bash
   chmod +x autonome-desktop_0.1.0_amd64.AppImage
   ```
3. Run it directly:
   ```bash
   ./autonome-desktop_0.1.0_amd64.AppImage
   ```

---

## Usage
1. Open the **Autonome Node** application.
2. Ensure Docker Desktop is running (the app will notify you if it cannot detect the Docker daemon).
3. Enter your **Operator Vault Address (ERC-4337)**. This is where your rewards (1.5 ATMA / task) will be deposited.
4. Click **Start Node**.
5. The dashboard will populate with real-time CPU and RAM telemetry. Keep the app open in the background to continue processing network requests and earning rewards.

## Troubleshooting
- **Docker not detected:** Ensure Docker Desktop is open and that the Docker socket is accessible.
- **Node immediately shuts down:** Check the built-in system logs for `address already in use` or network connection issues. 
- **Missing ATMA Rewards:** Ensure you are using the correct Bohr Testnet ERC-4337 Smart Account address.
