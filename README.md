<div align="center">
  <img src="https://github.com/letsdiscodev/.github/assets/1017304/8c1d7ecc-4bb7-411a-8da1-e7c4ff465931" alt="Disco Logo" width="150">
  <h1>Disco CLI</h1>
  <p>
    <strong>The official command-line interface for the Disco open-source PaaS.</strong>
  </p>
  <p>
    <a href="https://github.com/letsdiscodev/cli/blob/main/LICENSE"><img src="https://img.shields.io/github/license/letsdiscodev/cli" alt="License"></a>
    <a href="https://discord.gg/7J4vb5uUwU"><img src="https://img.shields.io/discord/1200593573062651914?logo=discord&label=discord" alt="Discord"></a>
    <a href="https://deepwiki.com/letsdiscodev/cli"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
  </p>
</div>

**Disco CLI** is the command-line tool you'll use to interact with the [Disco](https://github.com/letsdiscodev) open-source PaaS. It's your control panel for initializing servers, managing projects, setting environment variables, and deploying applications from the comfort of your terminal.

## What is Disco?

Disco is an open-source web deployment platform that lets you host web apps on your own server or Raspberry Pi with the simplicity of a managed PaaS. It helps you **Deploy Any Web App, Pay Less, and Own It All**.

The Disco ecosystem consists of two main parts:
*   **`disco-cli`** (This repo): The command-line interface you use on your local machine.
*   [**`disco-daemon`**](https://github.com/letsdiscodev/disco-daemon): The agent that runs on your server, executing commands sent by the CLI.

## How the CLI Works

The Disco CLI is the "remote control" for all your Disco-managed servers. It's designed to be intuitive and powerful, providing a seamless bridge between your local development environment and your production infrastructure.

1.  **Initialization (`disco init`)**: The first time you connect to a new server, the CLI uses **SSH** to securely connect, install Docker, and set up the [**disco-daemon**](https://github.com/letsdiscodev/disco-daemon). It also generates a secure API key and saves it to a local configuration file (`~/.disco/config.json`).
2.  **Communication**: For all subsequent commands, the CLI acts as an **API client**, sending secure HTTPS requests to the daemon's REST API. This means you can manage your server from anywhere without needing persistent SSH access.

The CLI is built with [oclif](https://oclif.io/), a robust framework for creating command-line tools.

## Installation

You can install the Disco CLI with a single command. It will automatically detect your operating system (macOS, Linux) and install the appropriate binary.

```bash
curl -fsSL https://cli-assets.letsdisco.dev/install.sh | sh
```

For other installation methods, including Windows, please see our [official documentation](https://docs.letsdisco.dev/get-started/install-the-cli).

## Quick Start

Get your first project deployed in minutes.

1.  **Initialize your server:**
    Provide the CLI with SSH access to your server. It will handle the rest.
    ```bash
    disco init root@server.example.com
    ```

2.  **Connect your GitHub account:**
    Disco uses a GitHub App for seamless, secure access to your repositories. The CLI will guide you through the one-time setup.
    ```bash
    disco github:apps:add
    ```

3.  **Add and deploy your project:**
    Tell Disco about your project's repository. As long as it contains a `Dockerfile` and a `disco.json` file, Disco can deploy it.
    ```bash
    disco projects:add --name my-blog --github your-user/your-repo --domain blog.example.com
    ```
    Once added, your project will deploy automatically. Future deployments are triggered by a simple `git push` to your main branch.

## Core Commands

The CLI organizes commands by topic for easy discoverability. Here are some of the main ones:

| Command Topic | Description                                           |
|---------------|-------------------------------------------------------|
| `init`        | Initialize a new server and install the disco-daemon. |
| `projects`    | Add, list, move, and remove projects.                 |
| `deploy`      | Manually trigger and view deployment logs.            |
| `env`         | Read, set, and remove environment variables.          |
| `postgres`    | Manage PostgreSQL databases and instances.            |
| `domains`     | Add or remove domains from a project.                 |
| `github`      | Manage your GitHub App integration.                   |
| `apikeys`     | List and remove API keys for CI/CD integration.       |
| `logs`        | View application and system logs.                     |

To see all available commands and options, run `disco --help`.

## Contributing

We welcome contributions of all kinds! Whether it's reporting a bug, suggesting a new feature, or submitting a pull request, your help is appreciated.

*   **Bugs & Feature Requests**: Please open an issue on the [GitHub issue tracker](https://github.com/letsdiscodev/cli/issues).
*   **Discussions**: Join our community on [Discord](https://discord.gg/7J4vb5uUwU) to chat with the team and other users.

## License

This project is licensed under the [MIT License](LICENSE).
