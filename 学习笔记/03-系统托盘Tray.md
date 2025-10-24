# Electron 系统托盘（Tray）- 学习笔记

## 📚 章节概述

系统托盘（System Tray）是桌面应用的重要特性之一。通过托盘，应用可以在后台运行，用户可以通过托盘图标快速访问应用功能。本章将学习如何在 Electron 中实现系统托盘功能。

---

## 1️⃣ 什么是系统托盘？

### 定义

系统托盘（也称为通知区域）是操作系统任务栏的一部分，用于显示后台运行程序的图标。

### 位置

- **Windows**: 任务栏右下角（时钟旁边）
- **macOS**: 菜单栏右上角
- **Linux**: 根据桌面环境不同而异（通常在顶部或底部）

### 典型用途

✅ **后台运行**：应用最小化后继续运行  
✅ **快速访问**：右键菜单提供常用功能  
✅ **状态显示**：通过图标或提示显示应用状态  
✅ **通知提醒**：闪烁图标或气泡提示  

### 常见应用案例

- **微信/QQ**：最小化到托盘，接收消息时图标闪烁
- **网易云音乐**：在托盘控制播放/暂停
- **Steam**：后台运行，显示在线状态
- **Dropbox**：显示同步状态

---

## 2️⃣ Electron Tray 模块

### 核心 API

```javascript
const { Tray } = require('electron');

// 创建托盘实例
const tray = new Tray('/path/to/icon.png');

// 设置提示文本（鼠标悬停时显示）
tray.setToolTip('应用名称');

// 设置标题（仅 macOS）
tray.setTitle('标题文本');

// 设置上下文菜单
tray.setContextMenu(menu);

// 销毁托盘图标
tray.destroy();
```

### 事件监听

```javascript
// 点击事件（单击）
tray.on('click', (event, bounds) => {
  console.log('托盘图标被点击');
});

// 右键点击（仅 Windows）
tray.on('right-click', (event, bounds) => {
  console.log('托盘图标被右键点击');
});

// 双击事件
tray.on('double-click', (event, bounds) => {
  console.log('托盘图标被双击');
});

// 鼠标进入
tray.on('mouse-enter', (event, bounds) => {
  console.log('鼠标进入托盘图标');
});

// 鼠标离开
tray.on('mouse-leave', (event, bounds) => {
  console.log('鼠标离开托盘图标');
});
```

### 托盘图标要求

#### Windows
- **格式**: `.ico` 或 `.png`
- **推荐尺寸**: 16x16 像素
- **支持透明背景**

#### macOS
- **格式**: `.png`（必须）
- **推荐尺寸**: 
  - 普通屏幕: 16x16 像素
  - Retina 屏幕: 32x32 像素（命名为 `icon@2x.png`）
- **使用模板图片**: 文件名以 `Template` 结尾（如 `iconTemplate.png`）
  - 系统会自动适配亮色/暗色主题
  - 只使用黑色和透明度

#### Linux
- **格式**: `.png`
- **推荐尺寸**: 22x22 或 24x24 像素

---

## 3️⃣ 实现最小化到托盘

### 基本流程

```
用户点击最小化/关闭按钮
    ↓
阻止默认行为
    ↓
隐藏窗口
    ↓
创建托盘图标
    ↓
用户点击托盘图标
    ↓
显示窗口
    ↓
销毁托盘图标
```

### 完整实现

```javascript
const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // 监听窗口最小化事件
  mainWindow.on('minimize', (event) => {
    event.preventDefault();  // 阻止默认最小化
    mainWindow.hide();       // 隐藏窗口
    createTray();            // 创建托盘
  });

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();  // 阻止退出
      mainWindow.hide();       // 隐藏窗口
      createTray();            // 创建托盘
    }
    return false;
  });
}

// 创建托盘图标
function createTray() {
  // 如果托盘已存在，不重复创建
  if (tray !== null) {
    return;
  }

  // 根据平台选择图标
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, 'assets/iconTemplate.png')  // macOS 模板图标
    : path.join(__dirname, 'assets/icon.png');         // Windows/Linux

  tray = new Tray(iconPath);

  // 设置鼠标悬停提示
  tray.setToolTip('Electron 任务管理器');

  // 创建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        showWindow();
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        // 可以显示关于对话框
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  // 设置上下文菜单
  tray.setContextMenu(contextMenu);

  // 监听托盘图标点击（单击显示/隐藏窗口）
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });

  // 监听双击（Windows 习惯）
  tray.on('double-click', () => {
    showWindow();
  });
}

// 显示窗口
function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();  // 聚焦窗口
  }
}

// 应用启动
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// macOS 特殊处理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在应用退出前清理
app.on('before-quit', () => {
  isQuitting = true;
});
```

---

## 4️⃣ 托盘菜单设计

### 基本菜单

```javascript
const contextMenu = Menu.buildFromTemplate([
  {
    label: '显示窗口',
    click: () => mainWindow.show()
  },
  {
    label: '退出',
    click: () => app.quit()
  }
]);
```

### 高级菜单（含图标、快捷键、分隔线）

```javascript
const contextMenu = Menu.buildFromTemplate([
  {
    label: '显示窗口',
    icon: path.join(__dirname, 'assets/show.png'),  // 菜单图标
    accelerator: 'CmdOrCtrl+Shift+S',                // 快捷键
    click: () => {
      mainWindow.show();
      mainWindow.focus();
    }
  },
  {
    label: '新建任务',
    icon: path.join(__dirname, 'assets/add.png'),
    accelerator: 'CmdOrCtrl+N',
    click: () => {
      mainWindow.show();
      mainWindow.webContents.send('new-task');  // 发送 IPC 消息
    }
  },
  { type: 'separator' },  // 分隔线
  {
    label: '任务统计',
    submenu: [  // 子菜单
      {
        label: '显示统计',
        click: () => {
          mainWindow.webContents.send('show-stats');
        }
      },
      {
        label: '导出数据',
        click: () => {
          mainWindow.webContents.send('export-data');
        }
      }
    ]
  },
  { type: 'separator' },
  {
    label: '设置',
    submenu: [
      {
        label: '开机自启动',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => {
          // 切换开机自启动
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked
          });
        }
      },
      {
        label: '关闭时最小化到托盘',
        type: 'checkbox',
        checked: true,
        click: (menuItem) => {
          // 保存设置
        }
      }
    ]
  },
  { type: 'separator' },
  {
    label: '关于',
    click: () => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '关于',
        message: 'Electron 任务管理器',
        detail: '版本 1.0.0'
      });
    }
  },
  {
    label: '退出',
    accelerator: 'CmdOrCtrl+Q',
    click: () => {
      isQuitting = true;
      app.quit();
    }
  }
]);
```

---

## 5️⃣ 动态更新托盘

### 更新图标

```javascript
// 根据状态切换图标
function updateTrayIcon(status) {
  if (status === 'busy') {
    tray.setImage(path.join(__dirname, 'assets/icon-busy.png'));
  } else {
    tray.setImage(path.join(__dirname, 'assets/icon.png'));
  }
}

// 显示通知红点（仅 macOS）
tray.setTitle('3');  // 显示数字
```

### 更新菜单

```javascript
function updateTrayMenu(taskCount) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `任务数: ${taskCount}`,
      enabled: false  // 禁用（仅显示）
    },
    { type: 'separator' },
    {
      label: '显示窗口',
      click: () => mainWindow.show()
    },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// 监听任务变化
ipcMain.on('task-count-changed', (event, count) => {
  updateTrayMenu(count);
});
```

### 图标闪烁效果（Windows）

```javascript
let isFlashing = false;
let flashInterval = null;

function startFlashing() {
  if (isFlashing) return;
  
  isFlashing = true;
  const normalIcon = path.join(__dirname, 'assets/icon.png');
  const emptyIcon = nativeImage.createEmpty();
  
  flashInterval = setInterval(() => {
    if (tray.getImage().isEmpty()) {
      tray.setImage(normalIcon);
    } else {
      tray.setImage(emptyIcon);
    }
  }, 500);
}

function stopFlashing() {
  if (!isFlashing) return;
  
  clearInterval(flashInterval);
  isFlashing = false;
  tray.setImage(path.join(__dirname, 'assets/icon.png'));
}

// 收到消息时开始闪烁
ipcMain.on('new-message', () => {
  if (!mainWindow.isVisible()) {
    startFlashing();
  }
});

// 窗口显示时停止闪烁
mainWindow.on('show', () => {
  stopFlashing();
});
```

---

## 6️⃣ 平台差异处理

### Windows 特性

```javascript
if (process.platform === 'win32') {
  // Windows 支持气泡提示
  tray.displayBalloon({
    icon: path.join(__dirname, 'assets/icon.png'),
    title: '新消息',
    content: '你有一条新任务'
  });

  // 监听气泡点击
  tray.on('balloon-click', () => {
    mainWindow.show();
  });

  // 右键点击显示菜单
  tray.on('right-click', () => {
    tray.popUpContextMenu();
  });
}
```

### macOS 特性

```javascript
if (process.platform === 'darwin') {
  // 使用模板图标（自动适配亮色/暗色主题）
  const icon = nativeImage.createFromPath(
    path.join(__dirname, 'assets/iconTemplate.png')
  );
  icon.setTemplateImage(true);
  tray.setImage(icon);

  // 设置标题（显示在图标旁边）
  tray.setTitle('3');

  // 按住 Option 键点击时的替代菜单
  const altMenu = Menu.buildFromTemplate([
    {
      label: '开发者选项',
      click: () => {
        mainWindow.webContents.openDevTools();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.setPressedImage(path.join(__dirname, 'assets/iconHighlight.png'));
}
```

### Linux 特性

```javascript
if (process.platform === 'linux') {
  // Linux 桌面环境差异较大，需要测试
  // 某些环境可能不支持托盘
  
  // 设置图标
  tray.setImage(path.join(__dirname, 'assets/icon.png'));
  
  // 某些环境需要显式设置菜单
  tray.setContextMenu(contextMenu);
}
```

---

## 7️⃣ 用户体验优化

### 智能显示/隐藏

```javascript
function toggleWindow() {
  if (mainWindow.isVisible()) {
    // 如果窗口可见但不在最前面
    if (!mainWindow.isFocused()) {
      mainWindow.focus();
    } else {
      mainWindow.hide();
    }
  } else {
    showWindow();
  }
}

tray.on('click', toggleWindow);
```

### 记住窗口位置

```javascript
let windowState = {
  bounds: { x: 0, y: 0, width: 1000, height: 700 },
  isMaximized: false
};

function createWindow() {
  mainWindow = new BrowserWindow({
    ...windowState.bounds,
    // ...其他配置
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // 保存窗口状态
  mainWindow.on('close', () => {
    windowState.bounds = mainWindow.getBounds();
    windowState.isMaximized = mainWindow.isMaximized();
    // 可以保存到配置文件
  });
}
```

### 托盘提示

```javascript
function showTrayNotification(message) {
  // 更新提示文本
  tray.setToolTip(message);

  // Windows 气泡提示
  if (process.platform === 'win32') {
    tray.displayBalloon({
      title: '任务提醒',
      content: message,
      icon: path.join(__dirname, 'assets/icon.png')
    });
  }

  // macOS 通知
  if (process.platform === 'darwin') {
    const { Notification } = require('electron');
    new Notification({
      title: '任务提醒',
      body: message
    }).show();
  }
}
```

---

## 8️⃣ 常见问题

### Q1: 托盘图标不显示？

**A:** 检查：
1. 图标文件路径是否正确
2. 图标格式和尺寸是否符合要求
3. 是否在 `app.whenReady()` 之后创建
4. Linux 环境是否支持托盘

```javascript
// 调试：检查图标是否存在
const fs = require('fs');
const iconPath = path.join(__dirname, 'assets/icon.png');
if (!fs.existsSync(iconPath)) {
  console.error('图标文件不存在:', iconPath);
}
```

### Q2: 关闭窗口后应用退出了？

**A:** 需要阻止默认关闭行为：

```javascript
let isQuitting = false;

mainWindow.on('close', (event) => {
  if (!isQuitting) {
    event.preventDefault();  // 关键！
    mainWindow.hide();
    return false;
  }
});

app.on('before-quit', () => {
  isQuitting = true;  // 真正退出时设置标志
});
```

### Q3: 如何完全退出应用？

**A:** 区分关闭窗口和退出应用：

```javascript
// 托盘菜单中的退出
{
  label: '退出',
  click: () => {
    isQuitting = true;  // 设置退出标志
    app.quit();         // 退出应用
  }
}
```

### Q4: macOS 托盘图标颜色不对？

**A:** 使用模板图标：

```javascript
// 图标文件命名为 iconTemplate.png
// 图标应该是黑色和透明度
const icon = nativeImage.createFromPath(iconPath);
icon.setTemplateImage(true);  // 标记为模板图标
tray.setImage(icon);
```

### Q5: 托盘图标模糊？

**A:** 提供高分辨率图标：

```javascript
// 同时提供 icon.png (16x16) 和 icon@2x.png (32x32)
// Electron 会自动选择合适的版本
```

---

## 9️⃣ 最佳实践

### ✅ 推荐做法

1. **提供清晰的托盘菜单**
   ```javascript
   // 功能明确，层级不超过 2 层
   - 显示窗口 (快捷键)
   - 常用功能 1
   - 常用功能 2
   ─────────────
   - 设置
   ─────────────
   - 退出 (快捷键)
   ```

2. **区分关闭和最小化**
   ```javascript
   // 让用户选择关闭按钮的行为
   - 点击关闭按钮：最小化到托盘
   - 托盘菜单"退出"：真正退出
   ```

3. **提供视觉反馈**
   ```javascript
   // 状态变化时更新图标或提示
   - 有新消息：图标闪烁
   - 忙碌状态：切换图标
   - 数量提示：显示数字
   ```

4. **平台适配**
   ```javascript
   // 根据平台调整行为
   - Windows: 右键显示菜单，双击打开窗口
   - macOS: 单击切换窗口，使用模板图标
   - Linux: 兼容性测试
   ```

### ❌ 避免的做法

1. ❌ 不提供退出方式
   ```javascript
   // 必须在托盘菜单提供"退出"选项
   ```

2. ❌ 托盘菜单过于复杂
   ```javascript
   // 避免超过 3 层菜单嵌套
   ```

3. ❌ 没有视觉反馈
   ```javascript
   // 用户不知道点击托盘图标会发生什么
   ```

4. ❌ 忽略平台差异
   ```javascript
   // 不同平台用户习惯不同
   ```

---

## 🔟 完整示例

### 项目结构

```
electron-app/
├── main.js
├── preload.js
├── renderer.js
├── index.html
└── assets/
    ├── icon.png          # Windows/Linux 托盘图标
    ├── icon@2x.png       # 高分辨率版本
    ├── iconTemplate.png  # macOS 模板图标
    └── iconTemplate@2x.png
```

### 完整代码见本项目实现

---

## 🎯 本章学习要点总结

✅ **理解系统托盘的作用和使用场景**  
✅ **掌握 Tray 模块的核心 API**  
✅ **实现窗口隐藏和托盘切换**  
✅ **设计友好的托盘菜单**  
✅ **处理不同平台的差异**  
✅ **优化用户体验**  

---

## 📖 延伸学习

1. **原生通知（Notification）**：与托盘配合使用
2. **开机自启动**：`app.setLoginItemSettings()`
3. **全局快捷键**：`globalShortcut` 模块
4. **多托盘图标**：状态指示

---

## 💡 实践建议

1. **先实现基本功能**：创建托盘、隐藏/显示窗口
2. **添加托盘菜单**：提供常用功能快捷入口
3. **优化用户体验**：记住窗口位置、智能切换
4. **测试多平台**：Windows、macOS、Linux

---

**更新时间**：2024-10-24  
**适用版本**：Electron 27.x  
**上一章节**：进程间通信（IPC）  
**下一章节**：原生通知（Notification）

---

## 📝 练习题

1. 实现托盘图标闪烁功能
2. 添加"开机自启动"设置
3. 显示任务数量在托盘图标上（macOS）
4. 实现右键菜单快速添加任务
5. 保存并恢复窗口位置和大小

