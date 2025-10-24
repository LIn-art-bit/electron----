# Electron 入门基础 - 学习笔记

## 📚 章节概述

本笔记涵盖 Electron 官方教程的基础部分，包括环境准备、创建第一个应用以及 Electron 的核心概念。

---

## 1️⃣ 什么是 Electron？

### 定义
Electron 是一个使用 **JavaScript、HTML 和 CSS** 构建**跨平台桌面应用程序**的框架。

### 核心组成
- **Chromium**：提供强大的 Web 渲染引擎
- **Node.js**：提供访问操作系统底层 API 的能力
- **自定义 API**：用于桌面应用开发的专用功能

### 优势
✅ **跨平台**：一套代码可在 Windows、macOS、Linux 上运行  
✅ **Web 技术栈**：前端开发者可快速上手  
✅ **成熟生态**：拥有大量的 npm 包支持  
✅ **强大功能**：可访问系统级 API  

### 典型应用案例
- Visual Studio Code（代码编辑器）
- Slack（团队协作工具）
- Discord（语音聊天应用）
- Figma Desktop（设计工具）

---

## 2️⃣ 环境准备

### 必要条件

1. **Node.js**（建议 v18 或更高版本）
   - 提供 npm 包管理器
   - 提供 JavaScript 运行时

2. **npm** 或 **yarn**
   - 用于安装和管理依赖

3. **代码编辑器**
   - 推荐 VS Code、WebStorm 等

### 验证环境
```bash
node -v    # 检查 Node.js 版本
npm -v     # 检查 npm 版本
```

---

## 3️⃣ 创建第一个 Electron 应用

### 步骤 1：初始化项目

```bash
# 创建项目目录
mkdir my-electron-app
cd my-electron-app

# 初始化 npm 项目
npm init -y
```

### 步骤 2：安装 Electron

```bash
npm install electron --save-dev
```

**为什么用 `--save-dev`？**  
因为 Electron 是开发依赖，最终打包时会被内嵌到应用中。

### 步骤 3：配置 package.json

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "我的第一个 Electron 应用",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "author": "你的名字",
  "license": "MIT",
  "devDependencies": {
    "electron": "^27.0.0"
  }
}
```

**关键配置项：**
- `"main": "main.js"`：指定主进程入口文件
- `"scripts": { "start": "electron ." }`：定义启动命令

---

## 4️⃣ Electron 的进程模型

### 🔷 主进程（Main Process）

**职责：**
- 创建和管理 BrowserWindow 实例
- 控制应用生命周期
- 处理系统级事件
- 管理原生菜单、托盘等

**关键特点：**
- 每个 Electron 应用只有**一个主进程**
- 运行在 **Node.js 环境**中
- 可以访问所有 Node.js API

**代码示例：**
```javascript
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

### 🔷 渲染进程（Renderer Process）

**职责：**
- 渲染 Web 页面（HTML/CSS/JavaScript）
- 处理用户界面交互
- 展示应用内容

**关键特点：**
- 每个 BrowserWindow 对应**一个渲染进程**
- 运行在 **Chromium 环境**中
- 默认**不能直接访问 Node.js API**（安全考虑）

**代码示例：**
```javascript
// renderer.js
document.getElementById('btn').addEventListener('click', () => {
  console.log('按钮被点击了！');
});
```

### 🔷 预加载脚本（Preload Script）

**职责：**
- 在渲染进程加载之前运行
- 安全地暴露 Node.js API 给渲染进程
- 作为主进程和渲染进程的桥梁

**关键特点：**
- 可以访问 Node.js API
- 可以访问部分渲染进程的 DOM API
- 通过 `contextBridge` 安全暴露 API

**代码示例：**
```javascript
// preload.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions
});
```

```javascript
// 在渲染进程中使用
console.log(window.electronAPI.platform);
```

---

## 5️⃣ 核心 API 详解

### app（应用程序模块）

控制应用的生命周期。

**常用事件：**
```javascript
// 当 Electron 完成初始化时
app.whenReady().then(() => {
  createWindow();
});

// 当所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 特有：点击 Dock 图标
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

### BrowserWindow（窗口模块）

创建和管理浏览器窗口。

**常用配置：**
```javascript
const win = new BrowserWindow({
  width: 1200,           // 窗口宽度
  height: 800,           // 窗口高度
  minWidth: 800,         // 最小宽度
  minHeight: 600,        // 最小高度
  resizable: true,       // 是否可调整大小
  frame: true,           // 是否有边框
  transparent: false,    // 是否透明
  backgroundColor: '#fff', // 背景色
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,    // 禁用直接访问 Node.js
    contextIsolation: true     // 启用上下文隔离
  }
});
```

### contextBridge（上下文桥接）

安全地暴露 API 到渲染进程。

**使用示例：**
```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
  // 暴露只读数据
  version: '1.0.0',
  
  // 暴露函数
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  
  // 暴露异步函数
  invoke: async (channel, ...args) => {
    return await ipcRenderer.invoke(channel, ...args);
  }
});
```

---

## 6️⃣ 安全最佳实践

### 🔒 重要安全原则

1. **启用上下文隔离**
   ```javascript
   webPreferences: {
     contextIsolation: true
   }
   ```

2. **禁用 nodeIntegration**
   ```javascript
   webPreferences: {
     nodeIntegration: false
   }
   ```

3. **使用 preload 脚本和 contextBridge**
   - 不要直接暴露整个 Node.js API
   - 只暴露必要的功能

4. **内容安全策略（CSP）**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self'">
   ```

5. **验证和清理用户输入**
   - 防止 XSS 攻击
   - 防止 SQL 注入

---

## 7️⃣ 项目文件结构

```
my-electron-app/
├── package.json         # 项目配置和依赖
├── main.js              # 主进程入口文件
├── preload.js           # 预加载脚本
├── index.html           # 主页面
├── renderer.js          # 渲染进程脚本
├── styles.css           # 样式文件
└── node_modules/        # 依赖包
```

**推荐的组织方式：**
```
electron-app/
├── src/
│   ├── main/           # 主进程代码
│   │   └── main.js
│   ├── renderer/       # 渲染进程代码
│   │   ├── index.html
│   │   ├── renderer.js
│   │   └── styles.css
│   └── preload/        # 预加载脚本
│       └── preload.js
├── assets/             # 资源文件
│   └── icons/
├── package.json
└── README.md
```

---

## 8️⃣ 运行和调试

### 启动应用
```bash
npm start
```

### 调试技巧

1. **打开开发者工具**
   ```javascript
   mainWindow.webContents.openDevTools();
   ```

2. **主进程调试**
   ```bash
   # 使用 VS Code 调试器
   # 或者在终端查看 console.log 输出
   ```

3. **渲染进程调试**
   - 直接在 DevTools 中调试
   - 使用 `console.log()`

---

## 9️⃣ 常见问题

### Q1: 渲染进程无法访问 Node.js API？
**A:** 这是安全设计。应该：
- 使用 preload 脚本
- 通过 contextBridge 暴露必要的 API
- 或使用 IPC 通信

### Q2: 如何在不同平台运行？
**A:** Electron 自动处理跨平台兼容性，但要注意：
```javascript
// 检测平台
if (process.platform === 'win32') {
  // Windows 特定代码
} else if (process.platform === 'darwin') {
  // macOS 特定代码
} else if (process.platform === 'linux') {
  // Linux 特定代码
}
```

### Q3: 应用启动失败怎么办？
**A:** 检查：
1. package.json 中的 `main` 字段是否正确
2. 主进程文件是否存在
3. Electron 是否正确安装
4. Node.js 版本是否兼容

---

## 🎯 本章节学习要点总结

✅ **理解 Electron 的双进程架构**（主进程 + 渲染进程）  
✅ **掌握基本项目结构和配置**  
✅ **了解 preload 脚本的作用**  
✅ **熟悉安全最佳实践**  
✅ **能够创建和运行第一个 Electron 应用**  

---

## 📖 延伸学习

1. **官方文档**：https://www.electronjs.org/docs
2. **进程间通信（IPC）**：下一章节内容
3. **应用打包和分发**：electron-builder
4. **自动更新**：electron-updater

---

## 💡 实践建议

1. **动手实践**：自己创建项目，不要只看代码
2. **修改示例**：尝试修改窗口大小、颜色等属性
3. **查阅文档**：遇到问题先查官方文档
4. **循序渐进**：先掌握基础，再学习高级特性

---

**更新时间**：2024-10-24  
**适用版本**：Electron 27.x  
**下一章节**：进程间通信（IPC）

---

## 📝 练习题

1. 尝试修改窗口的初始大小和位置
2. 添加一个新的 HTML 页面并加载它
3. 在 preload.js 中暴露一个自定义函数
4. 实现一个简单的按钮点击计数器
5. 尝试修改应用的背景颜色和字体

**提示**：参考本项目的代码实现！

