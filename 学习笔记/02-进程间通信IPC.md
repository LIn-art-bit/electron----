# Electron 进程间通信（IPC）- 学习笔记

## 📚 章节概述

进程间通信（IPC）是 Electron 中最核心的概念之一。由于主进程和渲染进程运行在不同的上下文中，IPC 是它们相互通信的唯一方式。本章将深入学习 IPC 的各种模式和最佳实践。

---

## 1️⃣ 为什么需要 IPC？

### 🎯 核心原因

在 Electron 的进程模型中：
- **主进程**：可以访问 Node.js 和操作系统 API
- **渲染进程**：出于安全考虑，默认无法直接访问系统 API

**IPC 解决的问题：**
- ✅ 从 UI 调用原生 API（如文件对话框、系统通知）
- ✅ 从原生菜单触发 Web 内容的更改
- ✅ 在主进程和渲染进程之间传递数据
- ✅ 响应系统事件并更新 UI

### 📡 IPC 通道的特性

**通道（Channels）** 是 IPC 通信的核心概念：

1. **任意命名**：可以自定义通道名称，如 `'set-title'`、`'dialog:openFile'`
2. **双向通信**：同一通道可在主进程和渲染进程中使用
3. **字符串标识**：通道名称是简单的字符串

**推荐的命名约定：**
```javascript
// 使用命名空间增加可读性
'dialog:openFile'      // 对话框相关
'window:setTitle'      // 窗口相关
'task:save'            // 任务相关
'menu:update'          // 菜单相关
```

---

## 2️⃣ IPC 核心模块

### 🔷 ipcMain（主进程）

用于在主进程中监听和处理来自渲染进程的消息。

**常用 API：**

```javascript
const { ipcMain } = require('electron');

// 监听单向消息
ipcMain.on('channel-name', (event, ...args) => {
  // 处理消息
});

// 处理双向请求（推荐）
ipcMain.handle('channel-name', async (event, ...args) => {
  // 处理请求并返回结果
  return result;
});

// 移除监听器
ipcMain.removeListener('channel-name', handler);
ipcMain.removeAllListeners('channel-name');
```

### 🔷 ipcRenderer（渲染进程）

用于在渲染进程中发送消息和接收响应。

**常用 API：**

```javascript
const { ipcRenderer } = require('electron');

// 发送单向消息
ipcRenderer.send('channel-name', ...args);

// 发送双向请求（推荐）
const result = await ipcRenderer.invoke('channel-name', ...args);

// 监听来自主进程的消息
ipcRenderer.on('channel-name', (event, ...args) => {
  // 处理消息
});

// 移除监听器
ipcRenderer.removeListener('channel-name', handler);
ipcRenderer.removeAllListeners('channel-name');
```

### ⚠️ 安全注意事项

**永远不要直接在渲染进程中暴露 ipcRenderer！**

❌ **错误做法：**
```javascript
// preload.js - 不安全！
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: ipcRenderer  // 危险！暴露了整个 API
});
```

✅ **正确做法：**
```javascript
// preload.js - 安全
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 只暴露特定功能
  setTitle: (title) => ipcRenderer.send('set-title', title),
  openFile: () => ipcRenderer.invoke('dialog:openFile')
});
```

---

## 3️⃣ 模式 1：渲染器到主进程（单向）

### 📤 使用场景

当你需要**触发**主进程的某个操作，但**不需要等待返回值**时使用。

**典型应用：**
- 设置窗口标题
- 触发系统通知
- 记录日志
- 触发后台任务

### 💡 实现步骤

#### 步骤 1：主进程监听消息

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');

function handleSetTitle(event, title) {
  // event.sender 是发送消息的 webContents
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setTitle(title);
}

app.whenReady().then(() => {
  // 监听 'set-title' 通道
  ipcMain.on('set-title', handleSetTitle);
  createWindow();
});
```

**event 对象的重要属性：**
- `event.sender`：发送消息的 webContents
- `event.reply(channel, ...args)`：向发送者回复消息
- `event.returnValue`：用于同步消息（不推荐）

#### 步骤 2：预加载脚本暴露 API

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
});
```

**关键点：**
- 不直接暴露 `ipcRenderer.send`
- 创建特定功能的包装函数
- 限制可传递的参数类型

#### 步骤 3：渲染进程调用

```javascript
// renderer.js
const titleInput = document.getElementById('title');
const setButton = document.getElementById('btn');

setButton.addEventListener('click', () => {
  const title = titleInput.value;
  // 调用预加载脚本暴露的 API
  window.electronAPI.setTitle(title);
});
```

### 🎯 本项目实践

在我们的任务管理器中：
- 用户输入自定义标题
- 点击按钮更新窗口标题
- 显示当前任务统计

---

## 4️⃣ 模式 2：渲染器到主进程（双向）

### 🔄 使用场景

当你需要从主进程**获取返回值**时使用。

**典型应用：**
- 打开文件/保存对话框
- 读取/写入文件
- 查询数据库
- 调用系统 API 并返回结果

### 💡 实现步骤

#### 步骤 1：主进程使用 handle 处理请求

```javascript
// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!canceled) {
    return filePaths[0];
  }
}

app.whenReady().then(() => {
  // 使用 handle 而不是 on
  ipcMain.handle('dialog:openFile', handleFileOpen);
  createWindow();
});
```

**ipcMain.handle vs ipcMain.on：**

| 特性 | handle | on |
|------|--------|-----|
| 返回值 | ✅ 支持（返回 Promise） | ❌ 不支持 |
| 推荐用途 | 双向通信 | 单向通信 |
| 渲染进程 API | invoke | send |
| 异步支持 | ✅ 原生支持 | ⚠️ 需要手动处理 |

#### 步骤 2：预加载脚本暴露 invoke

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data)
});
```

**关键：** 使用 `invoke` 返回 Promise

#### 步骤 3：渲染进程使用 await

```javascript
// renderer.js
const openButton = document.getElementById('open-btn');
const filePathElement = document.getElementById('filePath');

openButton.addEventListener('click', async () => {
  // invoke 返回 Promise，使用 await
  const filePath = await window.electronAPI.openFile();
  
  if (filePath) {
    filePathElement.innerText = filePath;
  }
});
```

### ⚠️ 错误处理

```javascript
// main.js
ipcMain.handle('risky-operation', async (event, arg) => {
  try {
    const result = await someRiskyOperation(arg);
    return { success: true, data: result };
  } catch (error) {
    // 只有 error.message 会被传递到渲染进程
    console.error('Error in main process:', error);
    return { success: false, error: error.message };
  }
});

// renderer.js
const result = await window.electronAPI.riskyOperation(data);
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

**重要：** 主进程中抛出的错误会被序列化，只有 `message` 属性会传递给渲染进程。

### 🎯 本项目实践

在任务管理器中实现：
- 保存任务到 JSON 文件
- 从 JSON 文件加载任务
- 使用原生文件对话框

---

## 5️⃣ 模式 3：主进程到渲染器进程

### 📥 使用场景

当主进程需要**主动通知**渲染进程更新 UI 时使用。

**典型应用：**
- 菜单项触发 UI 更新
- 系统事件通知（如网络状态变化）
- 后台任务完成通知
- 定时器触发的更新

### 💡 实现步骤

#### 步骤 1：主进程通过 webContents 发送消息

```javascript
// main.js
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 创建菜单
  const menu = Menu.buildFromTemplate([
    {
      label: '任务',
      submenu: [
        {
          label: '清空所有任务',
          click: () => {
            // 通过 webContents.send 发送消息
            mainWindow.webContents.send('clear-tasks');
          }
        },
        {
          label: '显示统计',
          click: () => {
            mainWindow.webContents.send('show-stats');
          }
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
  mainWindow.loadFile('index.html');
}
```

**关键 API：**
```javascript
// 发送消息到特定窗口
mainWindow.webContents.send('channel-name', ...args);

// 发送消息到所有窗口
BrowserWindow.getAllWindows().forEach(win => {
  win.webContents.send('channel-name', ...args);
});
```

#### 步骤 2：预加载脚本暴露监听器

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 暴露监听函数
  onClearTasks: (callback) => {
    ipcRenderer.on('clear-tasks', () => callback());
  },
  onShowStats: (callback) => {
    ipcRenderer.on('show-stats', () => callback());
  },
  // 更通用的方式
  onUpdateCounter: (callback) => {
    // 不要直接传递 event 对象
    ipcRenderer.on('update-counter', (_event, value) => callback(value));
  }
});
```

**安全要点：**
- ❌ 不要直接传递 `event` 对象到回调（会泄露 `event.sender`）
- ✅ 只传递需要的数据参数
- ✅ 使用自定义处理函数包装

#### 步骤 3：渲染进程注册回调

```javascript
// renderer.js
// 注册监听器
window.electronAPI.onClearTasks(() => {
  tasks = [];
  saveTasksToStorage();
  renderTasks();
  console.log('所有任务已清空');
});

window.electronAPI.onShowStats(() => {
  const stats = calculateStats();
  alert(`总任务: ${stats.total}\n已完成: ${stats.completed}`);
});
```

### 🔄 可选：返回回复

渲染进程可以向主进程发送回复：

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => {
    ipcRenderer.on('update-counter', (_event, value) => callback(value));
  },
  // 添加发送回复的功能
  sendCounterValue: (value) => {
    ipcRenderer.send('counter-value', value);
  }
});

// renderer.js
window.electronAPI.onUpdateCounter((value) => {
  const newValue = currentValue + value;
  updateUI(newValue);
  // 发送回复给主进程
  window.electronAPI.sendCounterValue(newValue);
});

// main.js
ipcMain.on('counter-value', (event, value) => {
  console.log('Received counter value:', value);
  // 可以在这里做进一步处理
});
```

### 🎯 本项目实践

在任务管理器中实现：
- 菜单栏控制任务操作
- 清空所有任务
- 显示任务统计
- 快捷键支持

---

## 6️⃣ 模式 4：渲染器到渲染器

### 🔀 实现方式

Electron 没有直接的渲染器到渲染器通信 API。有两种方式：

#### 方式 1：主进程作为中转站

```javascript
// 渲染器 A
window.electronAPI.sendToRendererB('hello from A');

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  sendToRendererB: (msg) => ipcRenderer.send('to-renderer-b', msg)
});

// main.js
ipcMain.on('to-renderer-b', (event, msg) => {
  // 转发给渲染器 B
  rendererBWindow.webContents.send('message-from-a', msg);
});

// 渲染器 B
window.electronAPI.onMessageFromA((msg) => {
  console.log('Received:', msg);
});
```

#### 方式 2：MessagePort（高级）

使用 Web 标准的 MessagePort API 进行直接通信（较复杂，不在本章详述）。

---

## 7️⃣ 数据序列化

### 📦 结构化克隆算法

Electron 使用 **HTML 结构化克隆算法** 序列化 IPC 消息。

**✅ 可以传递的类型：**
```javascript
// 基本类型
ipcRenderer.send('channel', 42);
ipcRenderer.send('channel', 'string');
ipcRenderer.send('channel', true);

// 对象和数组
ipcRenderer.send('channel', { key: 'value' });
ipcRenderer.send('channel', [1, 2, 3]);

// Date 对象
ipcRenderer.send('channel', new Date());

// RegExp
ipcRenderer.send('channel', /pattern/g);

// Blob（浏览器环境）
ipcRenderer.send('channel', new Blob(['data']));

// ArrayBuffer 和 TypedArray
ipcRenderer.send('channel', new Uint8Array([1, 2, 3]));
```

**❌ 不能传递的类型：**
```javascript
// DOM 元素
ipcRenderer.send('channel', document.getElementById('btn')); // ❌

// 函数
ipcRenderer.send('channel', () => {}); // ❌

// Symbol
ipcRenderer.send('channel', Symbol('test')); // ❌

// 包含循环引用的对象
const obj = {};
obj.self = obj;
ipcRenderer.send('channel', obj); // ❌

// Node.js 特定对象（如 Stream）
ipcRenderer.send('channel', fs.createReadStream('file')); // ❌

// Electron 对象（如 BrowserWindow）
ipcRenderer.send('channel', win); // ❌
```

**解决方案：**
```javascript
// 传递 DOM 元素的数据而不是元素本身
const element = document.getElementById('btn');
ipcRenderer.send('channel', {
  id: element.id,
  textContent: element.textContent,
  value: element.value
});

// 传递函数的结果而不是函数本身
const result = myFunction();
ipcRenderer.send('channel', result);
```

---

## 8️⃣ 旧方法对比（了解即可）

### ⚠️ ipcRenderer.sendSync（不推荐）

**同步发送消息，会阻塞渲染进程！**

```javascript
// 主进程
ipcMain.on('synchronous-message', (event, arg) => {
  event.returnValue = 'pong'; // 同步返回
});

// 渲染进程
const result = ipcRenderer.sendSync('synchronous-message', 'ping');
console.log(result); // 'pong'
```

**为什么不推荐：**
- ⚠️ 阻塞渲染进程直到收到回复
- ⚠️ 会导致界面卡顿
- ⚠️ 影响用户体验

**改用：**
```javascript
// 使用 invoke（异步）
const result = await ipcRenderer.invoke('message', 'ping');
```

### ⚠️ event.reply（可用但不够优雅）

```javascript
// 主进程
ipcMain.on('async-message', (event, arg) => {
  // 使用 event.reply 回复
  event.reply('async-reply', 'pong');
});

// 渲染进程
ipcRenderer.send('async-message', 'ping');
ipcRenderer.on('async-reply', (event, arg) => {
  console.log(arg); // 'pong'
});
```

**为什么不够优雅：**
- 需要两个通道（发送和接收）
- 难以匹配请求和响应
- 代码分散

**改用 invoke/handle：**
```javascript
// 主进程
ipcMain.handle('message', async (event, arg) => {
  return 'pong';
});

// 渲染进程
const result = await ipcRenderer.invoke('message', 'ping');
console.log(result); // 'pong'
```

---

## 9️⃣ IPC 最佳实践

### ✅ 推荐做法

1. **使用 invoke/handle 进行双向通信**
   ```javascript
   // 清晰、类型安全、易于理解
   const result = await ipcRenderer.invoke('operation', args);
   ```

2. **通道命名使用命名空间**
   ```javascript
   'dialog:openFile'
   'window:setTitle'
   'app:getVersion'
   ```

3. **在预加载脚本中限制暴露的 API**
   ```javascript
   // 只暴露必要的功能
   contextBridge.exposeInMainWorld('electronAPI', {
     openFile: () => ipcRenderer.invoke('dialog:openFile')
     // 不要暴露整个 ipcRenderer
   });
   ```

4. **验证和清理输入**
   ```javascript
   ipcMain.handle('save-data', async (event, data) => {
     // 验证数据
     if (!data || typeof data !== 'object') {
       throw new Error('Invalid data');
     }
     // 清理数据
     const sanitized = sanitizeData(data);
     return await saveToFile(sanitized);
   });
   ```

5. **使用 TypeScript 增强类型安全**
   ```typescript
   // preload.d.ts
   interface ElectronAPI {
     openFile: () => Promise<string | undefined>;
     saveFile: (data: TaskData) => Promise<boolean>;
   }
   
   declare global {
     interface Window {
       electronAPI: ElectronAPI;
     }
   }
   ```

### ❌ 避免的做法

1. **不要在渲染进程中启用 nodeIntegration**
   ```javascript
   // 危险！
   webPreferences: {
     nodeIntegration: true  // ❌
   }
   ```

2. **不要直接暴露整个 ipcRenderer**
   ```javascript
   // 不安全！
   contextBridge.exposeInMainWorld('ipc', ipcRenderer); // ❌
   ```

3. **避免使用 sendSync**
   ```javascript
   // 会阻塞 UI！
   const result = ipcRenderer.sendSync('operation'); // ❌
   ```

4. **不要传递不可序列化的对象**
   ```javascript
   // 会失败
   ipcRenderer.send('channel', document.body); // ❌
   ipcRenderer.send('channel', () => {}); // ❌
   ```

---

## 🔟 常见问题

### Q1: invoke 和 send 有什么区别？

**A:**
| 特性 | invoke | send |
|------|--------|------|
| 通信方向 | 双向（等待返回） | 单向（不等待） |
| 返回值 | ✅ Promise | ❌ 无 |
| 主进程接收 | handle | on |
| 使用场景 | 需要结果 | 只是通知 |

**示例：**
```javascript
// 需要返回值 - 使用 invoke
const path = await window.electronAPI.openFile();

// 不需要返回值 - 使用 send
window.electronAPI.setTitle('New Title');
```

### Q2: 为什么不能直接在渲染进程中 require('electron')？

**A:** 安全原因！启用 `contextIsolation: true` 后，渲染进程无法直接访问 Node.js API。必须通过 preload 脚本和 contextBridge 暴露。

### Q3: 如何在 IPC 中传递大量数据？

**A:** 
```javascript
// 方式 1：直接传递（小数据）
ipcRenderer.invoke('save-data', largeArray);

// 方式 2：使用文件系统（大数据）
// 渲染进程先请求临时文件路径
const tempPath = await ipcRenderer.invoke('get-temp-path');
// 主进程写入大数据到临时文件
// 渲染进程读取文件路径

// 方式 3：分块传输
for (let chunk of largeData) {
  await ipcRenderer.invoke('save-chunk', chunk);
}
```

### Q4: 如何取消 IPC 监听器？

**A:**
```javascript
// 保存监听器引用
const handler = (event, value) => {
  console.log(value);
};

ipcRenderer.on('channel', handler);

// 移除特定监听器
ipcRenderer.removeListener('channel', handler);

// 移除所有监听器
ipcRenderer.removeAllListeners('channel');
```

### Q5: event.sender 是什么？

**A:** 
```javascript
ipcMain.on('message', (event, data) => {
  // event.sender 是发送消息的 webContents
  console.log(event.sender.id);
  
  // 可以通过它获取窗口
  const win = BrowserWindow.fromWebContents(event.sender);
  
  // 可以回复消息
  event.reply('response', 'data');
  
  // 或直接发送
  event.sender.send('response', 'data');
});
```

---

## 🎯 本章学习要点总结

✅ **理解 IPC 的三种主要模式**
- 渲染器 → 主进程（单向）：`send` + `on`
- 渲染器 ⇄ 主进程（双向）：`invoke` + `handle`
- 主进程 → 渲染器：`webContents.send` + `on`

✅ **掌握 contextBridge 的安全使用**
- 不直接暴露 ipcRenderer
- 创建特定功能的包装函数

✅ **了解数据序列化限制**
- 可传递：基本类型、对象、数组、Date
- 不可传递：DOM、函数、循环引用

✅ **遵循 IPC 最佳实践**
- 优先使用 invoke/handle
- 使用命名空间命名通道
- 验证和清理输入数据

---

## 📖 延伸学习

1. **MessagePort API**：渲染器间直接通信
2. **SharedWorker**：多窗口共享数据
3. **WebContents**：深入了解 webContents API
4. **错误处理**：IPC 错误处理的高级技巧

---

## 💡 实践练习

在本项目中，我们实现了：

1. ✅ **设置窗口标题**（单向 IPC）
2. ✅ **文件保存/加载**（双向 IPC）
3. ✅ **菜单控制任务**（主进程到渲染器）
4. ✅ **任务统计更新**（组合使用）

**建议练习：**
1. 添加任务导出为 CSV 功能
2. 实现任务搜索功能
3. 添加系统通知功能
4. 实现任务自动保存

---

**更新时间**：2024-10-24  
**适用版本**：Electron 27.x  
**上一章节**：Electron 入门基础  
**下一章节**：原生菜单和对话框

---

## 📝 快速参考

```javascript
// 单向：渲染器 → 主进程
// preload.js
contextBridge.exposeInMainWorld('api', {
  send: (data) => ipcRenderer.send('channel', data)
});
// main.js
ipcMain.on('channel', (event, data) => { /* ... */ });

// 双向：渲染器 ⇄ 主进程
// preload.js
contextBridge.exposeInMainWorld('api', {
  invoke: (data) => ipcRenderer.invoke('channel', data)
});
// main.js
ipcMain.handle('channel', async (event, data) => { return result; });

// 主进程 → 渲染器
// main.js
mainWindow.webContents.send('channel', data);
// preload.js
contextBridge.exposeInMainWorld('api', {
  on: (callback) => ipcRenderer.on('channel', (e, data) => callback(data))
});
```

