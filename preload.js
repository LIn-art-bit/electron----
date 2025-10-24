// Preload 脚本
// 在渲染进程加载之前运行，可以访问 Node.js API
// 通过 contextBridge 安全地暴露 API 给渲染进程

const { contextBridge, ipcRenderer } = require('electron');

// 使用 contextBridge 暴露 API 到渲染进程
// 这比直接使用 nodeIntegration 更安全
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 系统信息 ==========
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  getCurrentTime: () => new Date().toLocaleString('zh-CN'),

  // ========== 模式 1：渲染器 → 主进程（单向）==========
  // 设置窗口标题
  setTitle: (title) => ipcRenderer.send('set-title', title),

  // ========== 模式 2：渲染器 ⇄ 主进程（双向）==========
  // 打开文件对话框并读取内容
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // 保存文件对话框并写入内容
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),

  // ========== 模式 3：主进程 → 渲染器 ==========
  // 监听从主进程发来的加载任务命令
  onLoadTasks: (callback) => {
    ipcRenderer.on('load-tasks', (_event, data) => callback(data));
  },

  // 监听从主进程发来的保存任务请求
  onRequestSaveTasks: (callback) => {
    ipcRenderer.on('request-save-tasks', () => callback());
  },

  // 监听从主进程发来的清空任务命令
  onClearAllTasks: (callback) => {
    ipcRenderer.on('clear-all-tasks', () => callback());
  },

  // 监听从主进程发来的显示统计命令
  onShowTaskStats: (callback) => {
    ipcRenderer.on('show-task-stats', () => callback());
  },

  // 监听从主进程发来的全部标记为完成命令
  onCompleteAllTasks: (callback) => {
    ipcRenderer.on('complete-all-tasks', () => callback());
  },

  // 监听从主进程发来的全部标记为未完成命令
  onUncompleteAllTasks: (callback) => {
    ipcRenderer.on('uncomplete-all-tasks', () => callback());
  },

  // ========== 托盘图标闪烁 ==========
  // 开始托盘图标闪烁
  startTrayFlashing: () => {
    ipcRenderer.send('tray:start-flashing');
  },

  // 停止托盘图标闪烁
  stopTrayFlashing: () => {
    ipcRenderer.send('tray:stop-flashing');
  }
});

// 当 DOM 加载完成时
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
  console.log('Node version:', process.versions.node);
  console.log('Chrome version:', process.versions.chrome);
  console.log('Electron version:', process.versions.electron);
  console.log('IPC API 已暴露到 window.electronAPI');
});

