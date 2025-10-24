// Electron 主进程文件
// 主进程负责创建和管理窗口，以及处理系统级事件

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// 全局变量
let mainWindow = null;
let tray = null;
let isQuitting = false;

// 创建浏览器窗口的函数
function createWindow() {
  // 创建一个新的浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      // preload 脚本在渲染进程加载前执行
      // 它可以安全地暴露 Node.js API 给渲染进程
      preload: path.join(__dirname, 'preload.js'),
      // 禁用 nodeIntegration 以提高安全性
      nodeIntegration: false,
      // 启用上下文隔离以提高安全性
      contextIsolation: true
    },
    // 窗口样式
    backgroundColor: '#f0f0f0',
    icon: path.join(__dirname, 'assets/icon.png'), // 可选：添加应用图标
  });

  // 加载应用的 index.html
  mainWindow.loadFile('index.html');

  // 打开开发者工具（学习阶段建议开启）
  mainWindow.webContents.openDevTools();

  // 监听窗口最小化事件 - 最小化到托盘
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
    createTray();
    console.log('窗口已最小化到系统托盘');
  });

  // 监听窗口关闭事件 - 隐藏到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      createTray();
      console.log('窗口已隐藏到系统托盘');
      return false;
    }
  });

  // 监听窗口显示事件
  mainWindow.on('show', () => {
    console.log('窗口已显示');
  });

  // 当窗口被销毁时
  mainWindow.on('closed', () => {
    console.log('窗口已关闭');
    mainWindow = null;
  });

  // 返回窗口实例供其他函数使用
  return mainWindow;
}

// ============ 系统托盘功能 ============

// 创建系统托盘
function createTray() {
  // 如果托盘已存在，不重复创建
  if (tray !== null) {
    return;
  }

  console.log('创建系统托盘...');

  // 创建托盘图标
  let trayIcon;
  
  // 尝试加载 PNG 图标文件
  const iconPath = path.join(__dirname, 'assets/icon.png');
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
    // 调整大小以适配托盘
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
  }
  
  // 如果没有图标文件，创建一个简单的默认图标
  if (!trayIcon || trayIcon.isEmpty()) {
    // 创建一个简单的 16x16 像素的蓝色图标
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        // 创建一个圆形图标
        const dx = x - size / 2;
        const dy = y - size / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < size / 2 - 1) {
          // 蓝紫色
          buffer[offset] = 102;     // R
          buffer[offset + 1] = 126; // G
          buffer[offset + 2] = 234; // B
          buffer[offset + 3] = 255; // A
        } else {
          // 透明
          buffer[offset + 3] = 0;
        }
      }
    }
    
    trayIcon = nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size
    });
  }

  // 创建托盘实例
  tray = new Tray(trayIcon);

  // 保存图标引用（用于闪烁功能）
  normalIcon = trayIcon;

  // 设置提示文本
  tray.setToolTip('Electron 任务管理器 - 点击显示窗口');

  // 创建托盘上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📋 显示窗口',
      click: () => {
        showWindow();
      }
    },
    {
      label: '🔒 隐藏窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: '📊 任务统计',
      click: () => {
        if (mainWindow) {
          showWindow();
          mainWindow.webContents.send('show-task-stats');
        }
      }
    },
    {
      label: '💾 保存任务',
      accelerator: 'CmdOrCtrl+S',
      click: () => {
        if (mainWindow) {
          showWindow();
          mainWindow.webContents.send('request-save-tasks');
        }
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ 设置',
      submenu: [
        {
          label: '开机自启动',
          type: 'checkbox',
          checked: app.getLoginItemSettings().openAtLogin,
          click: (menuItem) => {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              openAsHidden: false
            });
            console.log('开机自启动:', menuItem.checked ? '已启用' : '已禁用');
          }
        },
        {
          label: '关闭时最小化到托盘',
          type: 'checkbox',
          checked: true,
          enabled: false,  // 暂时禁用（始终启用此功能）
          click: () => {
            // 可以在这里添加设置保存逻辑
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'ℹ️ 关于',
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '关于 Electron 任务管理器',
          message: 'Electron 任务管理器',
          detail: '版本 1.0.0\n\n一个用于学习 Electron 的实践项目\n支持 IPC 通信、系统托盘等功能\n\n© 2024 Electron 学习者',
          buttons: ['确定']
        });
      }
    },
    { type: 'separator' },
    {
      label: '🚪 退出',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  // 设置上下文菜单
  tray.setContextMenu(contextMenu);

  // 监听托盘图标点击事件（单击切换窗口显示/隐藏）
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        showWindow();
      }
    }
  });

  // 监听双击事件（显示窗口）
  tray.on('double-click', () => {
    showWindow();
  });

  console.log('系统托盘创建成功');
}

// 显示主窗口
function showWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    
    // 窗口显示时停止闪烁
    stopTrayFlashing();
    
    console.log('窗口已显示');
  }
}

// 销毁托盘
function destroyTray() {
  if (tray !== null) {
    tray.destroy();
    tray = null;
    console.log('系统托盘已销毁');
  }
}

// ============ 托盘图标闪烁功能 ============

let isFlashing = false;
let flashInterval = null;
let normalIcon = null;
let emptyIcon = null;

// 开始闪烁托盘图标
function startTrayFlashing() {
  // 如果已经在闪烁或托盘不存在，直接返回
  if (isFlashing || tray === null) {
    return;
  }

  console.log('开始托盘图标闪烁');
  isFlashing = true;

  // 如果 normalIcon 还没有初始化，不能闪烁
  if (!normalIcon) {
    console.warn('托盘图标未初始化，无法开始闪烁');
    isFlashing = false;
    return;
  }
  
  // 创建空图标（透明）
  if (!emptyIcon) {
    emptyIcon = nativeImage.createEmpty();
  }

  // 设置闪烁间隔（每500毫秒切换一次）
  let showIcon = false;
  flashInterval = setInterval(() => {
    if (tray) {
      if (showIcon) {
        tray.setImage(normalIcon);
      } else {
        tray.setImage(emptyIcon);
      }
      showIcon = !showIcon;
    } else {
      // 如果托盘被销毁，停止闪烁
      stopTrayFlashing();
    }
  }, 500);
}

// 停止闪烁托盘图标
function stopTrayFlashing() {
  if (!isFlashing) {
    return;
  }

  console.log('停止托盘图标闪烁');
  
  // 清除闪烁定时器
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }

  // 恢复正常图标
  if (tray && normalIcon) {
    tray.setImage(normalIcon);
  }

  isFlashing = false;
}

// ============ 原生通知功能 ============

// 显示系统通知
function showNotification(title, body, options = {}) {
  // 检查系统是否支持通知
  if (!Notification.isSupported()) {
    console.warn('系统不支持原生通知');
    return null;
  }

  console.log('显示通知:', title);

  // 创建通知
  const notification = new Notification({
    title: title,
    body: body,
    icon: options.icon || path.join(__dirname, 'assets/icon.png'),
    silent: options.silent || false,
    ...options
  });

  // 监听点击事件
  notification.on('click', () => {
    console.log('通知被点击');
    
    // 显示主窗口
    showWindow();
    
    // 停止托盘闪烁
    stopTrayFlashing();
    
    // 如果有回调函数，执行它
    if (options.onClick) {
      options.onClick();
    }
  });

  // 监听显示事件
  notification.on('show', () => {
    console.log('通知已显示');
  });

  // 监听关闭事件
  notification.on('close', () => {
    console.log('通知已关闭');
  });

  // 显示通知
  notification.show();

  return notification;
}

// 显示任务相关通知
function showTaskNotification(taskData) {
  const { action, taskText, taskCount } = taskData;

  let title, body;

  switch (action) {
    case 'added':
      title = '✅ 任务已添加';
      body = `新任务：${taskText}`;
      break;
    case 'completed':
      title = '🎉 任务已完成';
      body = `已完成：${taskText}`;
      break;
    case 'deleted':
      title = '🗑️ 任务已删除';
      body = `已删除：${taskText}`;
      break;
    case 'cleared':
      title = '🧹 任务已清空';
      body = `已清空 ${taskCount} 个任务`;
      break;
    case 'loaded':
      title = '📂 任务已加载';
      body = `已加载 ${taskCount} 个任务`;
      break;
    default:
      title = '📝 任务更新';
      body = taskText || '任务状态已更新';
  }

  showNotification(title, body, {
    silent: false,
    onClick: () => {
      // 点击通知后的额外操作
      if (mainWindow) {
        mainWindow.webContents.send('focus-task', taskData);
      }
    }
  });
}

// ============ IPC 处理器 ============

// 【模式 1：单向通信】渲染器到主进程 - 设置窗口标题
function handleSetTitle(event, title) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.setTitle(title);
  console.log('窗口标题已设置为:', title);
}

// 【模式 2：双向通信】打开文件对话框
async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON 文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    title: '选择任务文件'
  });

  if (!canceled && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      return {
        success: true,
        data: JSON.parse(content),
        filePath: filePaths[0]
      };
    } catch (error) {
      console.error('读取文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  return { success: false, canceled: true };
}

// 【模式 2：双向通信】保存文件对话框
async function handleFileSave(event, data) {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存任务文件',
    defaultPath: 'tasks.json',
    filters: [
      { name: 'JSON 文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (!canceled && filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('任务已保存到:', filePath);
      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      console.error('保存文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  return { success: false, canceled: true };
}

// 创建应用菜单
function createMenu(mainWindow) {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开任务文件...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await handleFileOpen();
            if (result.success) {
              mainWindow.webContents.send('load-tasks', result.data);
            }
          }
        },
        {
          label: '保存任务文件...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('request-save-tasks');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '任务',
      submenu: [
        {
          label: '清空所有任务',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('clear-all-tasks');
          }
        },
        {
          label: '显示任务统计',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('show-task-stats');
          }
        },
        { type: 'separator' },
        {
          label: '标记所有为已完成',
          click: () => {
            mainWindow.webContents.send('complete-all-tasks');
          }
        },
        {
          label: '标记所有为未完成',
          click: () => {
            mainWindow.webContents.send('uncomplete-all-tasks');
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: '切换开发者工具',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: '实际大小',
          accelerator: 'CmdOrCtrl+0',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'Electron 任务管理器',
              detail: '版本 1.0.0\n\n一个用于学习 Electron 的实践项目\n\n© 2024 Electron 学习者'
            });
          }
        },
        {
          label: '学习文档',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://www.electronjs.org/zh/docs/latest/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Windows 平台配置（用于原生通知）
if (process.platform === 'win32') {
  // 设置 AppUserModelID 以启用通知功能
  // 开发环境使用 execPath，生产环境应使用固定 ID
  app.setAppUserModelId(process.execPath);
}

// Electron 完成初始化并准备创建浏览器窗口时调用此方法
// 某些 API 只能在此事件发生后使用
app.whenReady().then(() => {
  console.log('Electron 应用已准备就绪');
  
  // 注册 IPC 监听器
  // 模式 1：单向通信
  ipcMain.on('set-title', handleSetTitle);
  
  // 模式 2：双向通信
  ipcMain.handle('dialog:openFile', handleFileOpen);
  ipcMain.handle('dialog:saveFile', handleFileSave);
  
  // 托盘图标闪烁
  ipcMain.on('tray:start-flashing', () => {
    startTrayFlashing();
  });
  
  ipcMain.on('tray:stop-flashing', () => {
    stopTrayFlashing();
  });
  
  // 原生通知
  ipcMain.on('show-notification', (event, { title, body, options }) => {
    showNotification(title, body, options);
  });
  
  ipcMain.on('show-task-notification', (event, taskData) => {
    showTaskNotification(taskData);
  });
  
  // 创建窗口
  createWindow();
  
  // 创建应用菜单
  createMenu(mainWindow);

  // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
  // 通常会在应用中重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 在应用退出之前设置退出标志
app.on('before-quit', () => {
  isQuitting = true;
  console.log('应用准备退出');
});

// 当所有窗口都关闭时的处理
// 注意：有托盘时不要退出应用，让应用在后台运行
app.on('window-all-closed', () => {
  // macOS 上即使关闭所有窗口，应用通常也会继续运行
  // 其他平台如果有托盘则保持运行
  if (process.platform !== 'darwin' && tray === null) {
    app.quit();
  }
  console.log('所有窗口已关闭');
});

// 应用即将退出时清理资源
app.on('will-quit', () => {
  destroyTray();
  console.log('应用即将退出，清理资源');
});

// 在这个文件中你可以包含应用特定的主进程代码
// 你也可以将它们放在单独的文件中，然后在这里引入

