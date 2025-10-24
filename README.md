# 🚀 Electron 学习项目 - 任务管理器

一个用于系统学习 Electron 框架的实战项目，通过构建一个功能完整的桌面任务管理器应用来掌握 Electron 的核心概念。

![Electron](https://img.shields.io/badge/Electron-27.0.0-blue)
![Node](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 项目简介

这是一个基于 Electron 开发的桌面任务管理器应用，旨在帮助开发者系统学习 Electron 框架的各种特性和最佳实践。

### ✨ 主要功能

#### 📝 任务管理
- ✅ 添加、删除和管理任务
- ✅ 标记任务完成状态
- ✅ 任务数据本地持久化（LocalStorage）
- ✅ 任务统计和完成率显示

#### 🔗 IPC 功能演示
- ✅ **模式 1（单向）**: 动态设置窗口标题
- ✅ **模式 2（双向）**: 文件对话框（打开/保存 JSON 文件）
- ✅ **模式 3（推送）**: 原生菜单控制任务操作

#### 🎨 界面特性
- ✅ 显示系统信息（Node.js、Chrome、Electron 版本）
- ✅ 现代化的 UI 设计
- ✅ 响应式布局
- ✅ 原生应用菜单和快捷键

#### 📌 系统托盘功能
- ✅ **最小化到托盘**: 关闭或最小化窗口时隐藏到系统托盘
- ✅ **托盘菜单**: 右键/单击托盘图标显示功能菜单
- ✅ **快速操作**: 从托盘快速访问任务统计、保存等功能
- ✅ **开机自启**: 支持设置开机自动启动
- ✅ **智能切换**: 单击托盘图标智能显示/隐藏窗口

### 🎯 学习目标

通过本项目，你将学习到：

1. **Electron 基础架构**
   - 主进程（Main Process）的作用和实现
   - 渲染进程（Renderer Process）的工作原理
   - 预加载脚本（Preload Script）的安全使用

2. **核心 API**
   - `app` 模块：应用生命周期管理
   - `BrowserWindow` 模块：窗口创建和配置
   - `contextBridge`：安全的 API 暴露

3. **安全最佳实践**
   - 上下文隔离（Context Isolation）
   - 禁用 Node Integration
   - 内容安全策略（CSP）

4. **前端技术栈**
   - HTML5/CSS3
   - 原生 JavaScript
   - LocalStorage 数据持久化

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 27.x | 桌面应用框架 |
| Node.js | 18+ | JavaScript 运行时 |
| Chromium | (内置) | Web 渲染引擎 |
| HTML5/CSS3 | - | UI 界面 |
| JavaScript | ES6+ | 应用逻辑 |

---

## 📁 项目结构

```
electron练习项目/
├── main.js              # 主进程入口文件
├── preload.js           # 预加载脚本
├── index.html           # 应用主页面
├── renderer.js          # 渲染进程脚本
├── styles.css           # 样式文件
├── package.json         # 项目配置
├── README.md            # 项目说明
└── 学习笔记/
    └── 01-Electron入门基础.md  # 学习笔记
```

### 📄 核心文件说明

- **main.js**: 主进程代码，负责创建窗口、管理应用生命周期
- **preload.js**: 预加载脚本，安全地暴露 Node.js API 给渲染进程
- **index.html**: 应用的用户界面
- **renderer.js**: 渲染进程的业务逻辑（任务管理功能）
- **styles.css**: 应用样式，使用现代化的 CSS 设计

---

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本

### 安装步骤

1. **克隆或下载项目**
   ```bash
   cd electron练习项目
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   npm start
   ```

应用将自动启动，你会看到一个任务管理器窗口。

---

## 💻 使用指南

### 基本操作

1. **添加任务**
   - 在输入框中输入任务内容
   - 点击"添加任务"按钮或按 Enter 键

2. **完成任务**
   - 点击任务前的复选框标记为完成
   - 已完成的任务会显示删除线和降低透明度

3. **删除任务**
   - 点击任务右侧的"🗑️ 删除"按钮

4. **查看统计**
   - 顶部显示总任务数、已完成数和进行中的任务数

### IPC 功能演示

#### 📤 模式 1：设置窗口标题（单向通信）
- 在"设置窗口标题"输入框中输入新标题
- 点击"设置标题"按钮
- 观察窗口标题即时改变

#### 🔄 模式 2：文件操作（双向通信）
- **打开文件**: 点击"📂 打开文件"按钮，选择 JSON 任务文件
- **保存文件**: 点击"💾 保存文件"按钮，将任务保存为 JSON 文件
- 支持快捷键：
  - `Ctrl+O` (Win/Linux) 或 `Cmd+O` (Mac) - 打开文件
  - `Ctrl+S` (Win/Linux) 或 `Cmd+S` (Mac) - 保存文件

#### 🎛️ 模式 3：菜单控制（主进程推送）
使用菜单栏或快捷键：

**文件菜单**:
- 打开任务文件 (`Ctrl+O`)
- 保存任务文件 (`Ctrl+S`)
- 退出 (`Ctrl+Q`)

**任务菜单**:
- 清空所有任务 (`Ctrl+Shift+D`)
- 显示任务统计 (`Ctrl+I`)
- 标记所有为已完成
- 标记所有为未完成

**查看菜单**:
- 重新加载 (`Ctrl+R`)
- 切换开发者工具 (`Ctrl+Shift+I`)
- 放大/缩小 (`Ctrl+Plus` / `Ctrl+-`)

**帮助菜单**:
- 关于
- 学习文档

#### 📌 模式 4：系统托盘

**最小化到托盘**:
- 点击窗口的最小化按钮 → 窗口隐藏到系统托盘
- 点击窗口的关闭按钮 → 窗口隐藏到系统托盘（不退出应用）

**托盘操作**:
- **单击托盘图标**: 切换窗口显示/隐藏
- **双击托盘图标**: 显示窗口
- **右键托盘图标**: 显示上下文菜单

**托盘菜单功能**:
- 📋 显示/隐藏窗口
- 📊 任务统计
- 💾 保存任务
- ⚙️ 设置（开机自启动）
- ℹ️ 关于
- 🚪 退出应用

**开机自启动**:
1. 右键托盘图标（或从应用内托盘菜单）
2. 选择"设置" → "开机自启动"
3. 勾选即可启用

### 系统信息

应用顶部会显示：
- Node.js 版本
- Chrome 版本
- Electron 版本
- 当前操作系统

---

## 📚 代码学习指南

### 1️⃣ 主进程（main.js）

主进程是 Electron 应用的入口，负责：

```javascript
// 创建窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,      // 安全：禁用直接访问 Node.js
      contextIsolation: true        // 安全：启用上下文隔离
    }
  });
  
  mainWindow.loadFile('index.html');
}

// 应用生命周期管理
app.whenReady().then(createWindow);
```

**关键学习点：**
- `BrowserWindow` 的配置选项
- `webPreferences` 的安全设置
- 应用生命周期事件处理

### 2️⃣ 预加载脚本（preload.js）

预加载脚本在渲染进程加载前执行，安全地暴露 API：

```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
```

**关键学习点：**
- `contextBridge` 的使用
- 如何安全地暴露 Node.js API
- preload 脚本的执行时机

### 3️⃣ 渲染进程（renderer.js）

渲染进程处理用户界面逻辑：

```javascript
// 访问预加载脚本暴露的 API
if (window.electronAPI) {
  const versions = window.electronAPI.versions;
  console.log('Node version:', versions.node);
}

// 任务管理逻辑
function addTask() {
  const task = {
    id: taskIdCounter++,
    text: taskText,
    completed: false,
    createdAt: new Date().toLocaleString('zh-CN')
  };
  tasks.push(task);
  saveTasksToStorage();
  renderTasks();
}
```

**关键学习点：**
- 如何访问 electronAPI
- DOM 操作和事件处理
- LocalStorage 数据持久化

---

## 🔒 安全特性

本项目遵循 Electron 安全最佳实践：

1. **上下文隔离**（`contextIsolation: true`）
   - 防止渲染进程直接访问 Electron 内部 API

2. **禁用 Node Integration**（`nodeIntegration: false`）
   - 渲染进程不能直接使用 Node.js

3. **预加载脚本 + contextBridge**
   - 安全地暴露必要的 API

4. **内容安全策略**
   - 在 HTML 中设置 CSP 头部

5. **XSS 防护**
   - 使用 `escapeHtml` 函数清理用户输入

---

## 📖 学习资源

### 项目内资源

- 📝 [Electron入门基础笔记](./学习笔记/01-Electron入门基础.md)
- 📝 [进程间通信（IPC）笔记](./学习笔记/02-进程间通信IPC.md)
- 📝 [系统托盘（Tray）笔记](./学习笔记/03-系统托盘Tray.md)

### 官方资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron API 文档](https://www.electronjs.org/docs/api)
- [Electron 安全指南](https://www.electronjs.org/docs/tutorial/security)

### 推荐教程

- [Electron 官方教程](https://www.electronjs.org/docs/tutorial/tutorial-prerequisites)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - 在线实验工具

---

## 🎯 学习路线

### 第一阶段：基础入门 ✅
- [x] 理解 Electron 架构（主进程 + 渲染进程）
- [x] 创建第一个 Electron 应用
- [x] 掌握基本的窗口管理
- [x] 了解安全最佳实践

### 第二阶段：进阶功能 ✅
- [x] 进程间通信（IPC）- 三种模式全部实现
- [x] 原生菜单和快捷键
- [x] 系统对话框（文件打开/保存）
- [x] 文件系统操作（读写 JSON）
- [x] 系统托盘（Tray）- 完整实现

### 第三阶段：实用特性 📋
- [ ] 原生通知（Notification）
- [ ] 应用打包和分发（electron-builder）
- [ ] 自动更新（electron-updater）
- [ ] 性能优化
- [ ] 多窗口管理

---

## 🐛 常见问题

### Q: 运行 `npm start` 后没有反应？

**A:** 检查以下几点：
1. 确保已运行 `npm install` 安装依赖
2. 检查 Node.js 版本是否 >= 18
3. 查看终端是否有错误信息

### Q: 修改代码后需要重启应用吗？

**A:** 是的，Electron 应用需要重启才能看到代码变更。可以：
- 关闭应用窗口
- 在终端按 `Ctrl + C` 停止进程
- 再次运行 `npm start`

### Q: 如何调试代码？

**A:** 
- **渲染进程**：按 `F12` 或 `Ctrl+Shift+I` 打开开发者工具
- **主进程**：在代码中使用 `console.log()`，在终端查看输出

### Q: 任务数据会保存吗？

**A:** 是的，任务数据保存在浏览器的 LocalStorage 中，关闭应用后重新打开会自动恢复。

---

## 🔧 开发计划

- [ ] 添加任务分类功能
- [ ] 实现任务搜索和过滤
- [ ] 添加任务优先级设置
- [ ] 支持任务导入/导出
- [ ] 添加系统托盘功能
- [ ] 实现原生通知
- [ ] 支持多语言
- [ ] 添加主题切换功能

---

## 📝 版本历史

- **v1.0.0** (2024-10-24)
  - ✨ 初始版本发布
  - ✅ 基础任务管理功能
  - ✅ 系统信息显示
  - ✅ 本地数据持久化

---

## 🤝 贡献

欢迎提出问题和建议！这是一个学习项目，任何改进意见都将帮助其他学习者。

---

## 📄 许可证

MIT License - 自由使用和学习

---

## 👨‍💻 作者

Electron 学习者

---

## 🙏 致谢

- Electron 团队提供的优秀框架
- Electron 中文文档贡献者
- 所有为开源社区做出贡献的开发者

---

**Happy Coding! 🎉**

开始你的 Electron 学习之旅吧！如有问题，请查看学习笔记或官方文档。

