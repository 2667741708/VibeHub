# 🕷️ SVC Spider — 多服务器织网 VS Code 插件

> **创造者的话（Vibe）**：
> "我是一名科研人员，每天要在 3-4 台 GPU 服务器之间来回切换做实验。传统的 Remote-SSH 插件
>  一次只能连一台服务器，导致 AI 助手（Copilot/Cursor）只能看到一个节点的代码。
>  我想要一个像蜘蛛结网一样的插件，把所有服务器同时挂载到同一个 VS Code 工作区里，
>  让我的 AI 能跨服务器看到所有代码和数据，消除信息孤岛。"

---

## 📦 给你的 AI 助手看的说明
> [AI-Guidance: 这是一个中大型 VS Code 扩展项目（TypeScript），包含 13 个核心源码文件。
>  请先阅读下方的架构概览和核心入口文件，理解整体设计后再进行修改。
>  用户如果想修改，请根据自然语言要求定位到对应的模块文件进行局部改写。]
> - **类型**: VS Code Extension（`.vsix` 包）
> - **语言**: TypeScript
> - **环境要求**: Node.js 18+, VS Code 1.80+
> - **核心依赖**: `ssh2`, `ssh2-sftp-client`
> - **构建命令**: `npm install && npm run compile`
> - **打包命令**: `npx @vscode/vsce package`
> - **源码仓库**: https://github.com/2667741708/svc-vscode-extension

## 🏗️ 架构概览

```
用户 → VS Code → SFTP 多路连接池 → svc:// 虚拟文件系统 → 全局资源管理器
```

### 核心模块分工（13 个 TypeScript 文件）

| 文件 | 行数 | 职责 |
|------|------|------|
| `extension.ts` | ~1000 | 扩展主入口：生命周期管理、命令注册、连接状态持久化 |
| `fileSystemProvider.ts` | ~340 | **核心引擎**: 实现 `vscode.FileSystemProvider`，将 SFTP 映射为 `svc://` 虚拟文件系统 |
| `sftpClient.ts` | ~350 | SFTP 连接池：管理多节点 SSH/SFTP 连接，支持连接复用与并发保护 |
| `serverTreeView.ts` | — | 左侧边栏服务器拓扑列表 + tmux 会话树 |
| `serverConfigUI.ts` | — | WebView 配置面板：添加/编辑/导入服务器 |
| `remoteFolderBrowser.ts` | — | 远程目录层级浏览器（Quick Pick UI） |
| `sshTerminal.ts` | — | SSH 终端会话管理器 |
| `tmuxManager.ts` | — | tmux 会话发现、创建、附加、重命名 |
| `serverMonitor.ts` | — | GPU/CPU/进程 实时状态监控 |
| `configManager.ts` | — | 服务器配置持久化（VS Code globalState） |
| `sshConfigParser.ts` | — | 解析 `~/.ssh/config` 自动导入服务器 |
| `cacheManager.ts` | — | 目录缓存（5s TTL）减少网络往返 |
| `ignoreParser.ts` | — | `.gitignore` 风格的文件过滤 |

## 💻 核心入口 `extension.ts`（关键片段）

```typescript
// 激活函数：注册虚拟文件系统、服务器树视图、命令
export async function activate(context: vscode.ExtensionContext) {
    // 1. 注册 svc:// 虚拟文件系统提供程序
    fileSystemProvider = new SVCFileSystemProvider();
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('svc', fileSystemProvider, {
            isCaseSensitive: true, isReadonly: false
        })
    );

    // 2. 注册服务器树视图（左侧边栏）
    registerServerTreeView(context, activeConnections, terminalManager, outputChannel);

    // 3. 连接命令：选择服务器 → SFTP连接 → 浏览远程目录 → 挂载到工作区
    context.subscriptions.push(
        vscode.commands.registerCommand('svc.connect', async () => {
            const server = await ServerConfigUI.showSelectServerDialog(context);
            const sftpConnection = await sftpPool.getConnection(server);
            const browser = new RemoteFolderBrowser(sftpConnection, '/');
            const remoteFolder = await browser.browse();
            fileSystemProvider.setSFTPConnection(sftpConnection, remoteFolder);
            const workspaceUri = vscode.Uri.parse(`svc://${server.host}${remoteFolder}`);
            vscode.workspace.updateWorkspaceFolders(/*...*/);
        })
    );
}
```

## 💻 `fileSystemProvider.ts`（虚拟文件系统核心）

```typescript
// 实现 VS Code 的 FileSystemProvider 接口
// 将所有文件操作（读/写/列目录/创建/删除）映射到 SFTP
export class SVCFileSystemProvider implements vscode.FileSystemProvider {
    // 读取文件内容 → sftp.get(remotePath)
    async readFile(uri: vscode.Uri): Promise<Uint8Array> { /* ... */ }
    // 写入文件 → sftp.put(data, remotePath)
    async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> { /* ... */ }
    // 列出目录 → sftp.list(remotePath)
    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> { /* ... */ }
    // 创建目录 → sftp.mkdir(remotePath)
    async createDirectory(uri: vscode.Uri): Promise<void> { /* ... */ }
    // 删除文件 → sftp.delete(remotePath)
    async delete(uri: vscode.Uri): Promise<void> { /* ... */ }
}
```

## ✨ 主要特性

- 🔌 **多服务器同时挂载** — 在一个工作区内看到所有服务器的文件
- 📂 **远程文件像本地一样编辑** — 改完自动同步回远程
- 🖥️ **内置 SSH 终端** — 一键打开对应节点的 Shell
- 📊 **GPU/CPU 实时监控** — 侧栏显示服务器状态
- 🔄 **tmux 会话管理** — 发现、创建、附加远程 tmux 会话
- 🔒 **密码 + 私钥认证** — 全面安全支持
- 🌍 **零外置依赖** — 纯代码实现，跨平台开箱即用

## 🔀 Fork 建议

如果你想基于此做二次开发，以下是一些常见需求：
- "我想增加 Docker 容器管理" → 修改 `serverMonitor.ts`
- "我想支持 FTP 协议" → 新增一个 `ftpClient.ts` 并修改 `fileSystemProvider.ts`
- "我想改 UI 主题" → 修改 `serverConfigUI.ts` 中的 WebView HTML

---
*由 VibeHub 社区分享 · 直接 Fork: 7 · 间接 Fork: 18 · 2026-03-14*