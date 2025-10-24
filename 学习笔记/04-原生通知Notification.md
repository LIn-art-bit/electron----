# Electron 原生通知（Notification）- 学习笔记

## 📚 章节概述

原生通知（Native Notification）允许 Electron 应用在操作系统级别向用户发送通知。通知会以系统原生的样式显示，与用户的系统设置保持一致，提供更好的用户体验。

---

## 1️⃣ 什么是原生通知？

### 定义

原生通知是操作系统提供的通知机制，应用可以发送消息提醒用户重要事件、状态变化或需要关注的信息。

### 位置和样式

- **Windows 10/11**: 右下角通知中心
- **macOS**: 右上角通知中心
- **Linux**: 取决于桌面环境（通常在顶部或右上角）

### 典型应用场景

✅ **任务提醒**: 任务到期、完成提醒  
✅ **消息通知**: 新消息、评论、@提醒  
✅ **状态更新**: 下载完成、同步完成  
✅ **错误警告**: 连接失败、操作失败  
✅ **定时提醒**: 番茄钟、休息提醒  

---

## 2️⃣ Electron Notification API

### 创建通知

```javascript
const { Notification } = require('electron');

// 基本通知
const notification = new Notification({
  title: '通知标题',
  body: '通知内容'
});

notification.show();
```

### 完整配置选项

```javascript
const notification = new Notification({
  // === 基础选项 ===
  title: '通知标题',              // 必需
  subtitle: '副标题',             // 仅 macOS
  body: '通知正文内容',           // 推荐
  
  // === 视觉选项 ===
  icon: '/path/to/icon.png',     // 图标路径
  silent: false,                  // 是否静音
  
  // === 交互选项 ===
  hasReply: false,                // 是否显示回复按钮（macOS）
  replyPlaceholder: '回复...',    // 回复框占位符（macOS）
  sound: 'default',               // 声音（macOS）
  
  // === Windows 特定 ===
  toastXml: '<toast>...</toast>', // 自定义 Toast XML
  
  // === macOS 特定 ===
  urgency: 'normal',              // 紧急程度: low, normal, critical
  timeoutType: 'default',         // 超时类型: default, never
  
  // === 行为选项 ===
  actions: [                       // 操作按钮（macOS/Linux）
    {
      type: 'button',
      text: '查看'
    }
  ]
});
```

### 事件监听

```javascript
const notification = new Notification({
  title: '新消息',
  body: '你收到了一条新消息'
});

// 显示时触发
notification.on('show', () => {
  console.log('通知已显示');
});

// 点击通知时触发
notification.on('click', () => {
  console.log('用户点击了通知');
  // 通常：显示主窗口或跳转到相关页面
});

// 关闭时触发
notification.on('close', () => {
  console.log('通知已关闭');
});

// 用户回复时触发（仅 macOS）
notification.on('reply', (event, reply) => {
  console.log('用户回复:', reply);
});

// 点击操作按钮时触发
notification.on('action', (event, index) => {
  console.log('点击了操作按钮', index);
});

notification.show();
```

---

## 3️⃣ 在主进程中使用通知

### 基本实现

```javascript
// main.js
const { app, BrowserWindow, Notification } = require('electron');

function showNotification(title, body) {
  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, 'assets/icon.png')
  });

  notification.on('click', () => {
    // 点击通知时显示主窗口
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
}

// 使用示例
app.whenReady().then(() => {
  showNotification('应用已启动', '任务管理器已准备就绪');
});
```

### 检查通知权限（Windows）

```javascript
if (process.platform === 'win32') {
  // Windows 需要设置 AppUserModelID
  app.setAppUserModelId('com.example.task-manager');
}
```

### 静态方法检查支持

```javascript
// 检查系统是否支持通知
if (Notification.isSupported()) {
  console.log('系统支持原生通知');
  showNotification('欢迎', '通知功能可用');
} else {
  console.log('系统不支持原生通知');
}
```

---

## 4️⃣ 在渲染进程中使用通知

### 使用 Web Notification API

```javascript
// renderer.js
// 渲染进程可以使用 Web 标准的 Notification API

// 检查权限
if (Notification.permission === 'granted') {
  showNotification();
} else if (Notification.permission !== 'denied') {
  // 请求权限
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      showNotification();
    }
  });
}

function showNotification() {
  const notification = new Notification('新任务', {
    body: '任务已添加到列表',
    icon: '/assets/icon.png'
  });

  notification.onclick = () => {
    console.log('通知被点击');
  };
}
```

### 通过 IPC 调用主进程通知

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body, options) => {
    ipcRenderer.send('show-notification', { title, body, options });
  }
});

// main.js
ipcMain.on('show-notification', (event, { title, body, options }) => {
  const notification = new Notification({
    title,
    body,
    ...options
  });
  
  notification.show();
});

// renderer.js
window.electronAPI.showNotification('标题', '内容');
```

---

## 5️⃣ 通知最佳实践

### ✅ 推荐做法

#### 1. 明确的标题和内容

```javascript
// ✅ 好：清晰明确
new Notification({
  title: '任务完成',
  body: '您的任务"写周报"已完成'
});

// ❌ 差：信息模糊
new Notification({
  title: '通知',
  body: '有新消息'
});
```

#### 2. 适当的图标

```javascript
const notification = new Notification({
  title: '下载完成',
  body: 'report.pdf 已下载',
  icon: path.join(__dirname, 'assets/download-icon.png')
});
```

#### 3. 合理的触发时机

```javascript
// ✅ 好：重要事件
- 任务完成
- 新消息到达
- 操作失败/成功

// ❌ 差：过于频繁
- 每次鼠标点击
- 每秒的状态更新
- 无关紧要的事件
```

#### 4. 提供交互

```javascript
const notification = new Notification({
  title: '新消息',
  body: '张三：会议时间改了吗？'
});

notification.on('click', () => {
  // 跳转到消息页面
  mainWindow.webContents.send('open-message', messageId);
  mainWindow.show();
});
```

#### 5. 尊重用户设置

```javascript
// 检查用户是否启用了静音模式
const isSilent = app.isInQuietHours?.() || false;

const notification = new Notification({
  title: '提醒',
  body: '该休息了',
  silent: isSilent  // 尊重系统设置
});
```

### ❌ 避免的做法

#### 1. 通知轰炸

```javascript
// ❌ 不要短时间内发送大量通知
for (let i = 0; i < 100; i++) {
  new Notification({ title: `通知 ${i}` }).show();
}

// ✅ 应该合并通知
new Notification({
  title: '批量操作完成',
  body: '已处理 100 个项目'
}).show();
```

#### 2. 内容过长

```javascript
// ❌ 内容太长，会被截断
new Notification({
  title: '提醒',
  body: '这是一条很长很长很长很长很长很长很长很长很长的通知内容...'
});

// ✅ 保持简洁
new Notification({
  title: '文件同步完成',
  body: '已同步 5 个文件，点击查看详情'
});
```

#### 3. 缺少上下文

```javascript
// ❌ 缺少足够信息
new Notification({
  title: '错误',
  body: '操作失败'
});

// ✅ 提供具体信息
new Notification({
  title: '保存失败',
  body: '文件 "report.docx" 保存失败：磁盘空间不足'
});
```

---

## 6️⃣ 平台差异和适配

### Windows

**特点：**
- 通知显示在右下角的操作中心
- 支持 Toast 通知
- 需要设置 AppUserModelID

**配置：**
```javascript
// Windows 特定配置
if (process.platform === 'win32') {
  // 设置应用 ID（开发阶段）
  app.setAppUserModelId(process.execPath);
  
  // 生产环境应使用固定 ID
  // app.setAppUserModelId('com.company.appname');
}

// 自定义 Toast XML（高级）
const notification = new Notification({
  toastXml: `
    <toast>
      <visual>
        <binding template="ToastGeneric">
          <text>标题</text>
          <text>内容</text>
        </binding>
      </visual>
    </toast>
  `
});
```

### macOS

**特点：**
- 通知显示在右上角
- 支持回复功能
- 支持操作按钮
- 支持子标题

**配置：**
```javascript
const notification = new Notification({
  title: '新消息',
  subtitle: '来自张三',  // macOS 专属
  body: '会议时间改了吗？',
  hasReply: true,         // 显示回复按钮
  replyPlaceholder: '输入回复...',
  sound: 'Ping',          // 系统声音
  actions: [              // 操作按钮
    { type: 'button', text: '查看' },
    { type: 'button', text: '忽略' }
  ]
});

notification.on('reply', (event, reply) => {
  console.log('用户回复:', reply);
  // 处理回复
});

notification.on('action', (event, index) => {
  if (index === 0) {
    // 查看
  } else {
    // 忽略
  }
});
```

### Linux

**特点：**
- 使用 libnotify
- 样式取决于桌面环境
- 功能可能受限

**配置：**
```javascript
// Linux 基本配置
const notification = new Notification({
  title: '提醒',
  body: '该休息了',
  icon: '/usr/share/icons/hicolor/48x48/apps/myapp.png',
  urgency: 'normal'  // low, normal, critical
});
```

---

## 7️⃣ 高级用法

### 通知队列管理

```javascript
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isShowing = false;
  }

  add(notification) {
    this.queue.push(notification);
    this.processQueue();
  }

  async processQueue() {
    if (this.isShowing || this.queue.length === 0) {
      return;
    }

    this.isShowing = true;
    const notification = this.queue.shift();
    
    notification.show();
    
    notification.on('close', () => {
      this.isShowing = false;
      // 延迟 1 秒后显示下一个
      setTimeout(() => this.processQueue(), 1000);
    });
  }
}

const notificationQueue = new NotificationQueue();

// 使用
notificationQueue.add(new Notification({
  title: '通知 1',
  body: '内容 1'
}));
```

### 通知分组

```javascript
function showGroupedNotification(group, count) {
  const notification = new Notification({
    title: `${group} (${count})`,
    body: `你有 ${count} 条新${group}`,
    tag: group  // 相同 tag 会替换旧通知
  });

  notification.show();
}

// 使用
showGroupedNotification('消息', 5);
showGroupedNotification('评论', 3);
```

### 持久通知

```javascript
const notification = new Notification({
  title: '重要提醒',
  body: '请及时处理',
  timeoutType: 'never'  // macOS: 不自动关闭
});

// 手动关闭
setTimeout(() => {
  notification.close();
}, 30000);  // 30 秒后关闭
```

### 通知统计

```javascript
class NotificationStats {
  constructor() {
    this.shown = 0;
    this.clicked = 0;
    this.closed = 0;
  }

  track(notification) {
    notification.on('show', () => {
      this.shown++;
    });

    notification.on('click', () => {
      this.clicked++;
    });

    notification.on('close', () => {
      this.closed++;
    });

    return notification;
  }

  getStats() {
    return {
      shown: this.shown,
      clicked: this.clicked,
      clickRate: this.shown > 0 ? (this.clicked / this.shown * 100).toFixed(2) + '%' : '0%'
    };
  }
}

const stats = new NotificationStats();

// 使用
const notification = stats.track(new Notification({
  title: '测试',
  body: '内容'
}));

notification.show();
```

---

## 8️⃣ 与其他功能集成

### 配合托盘图标闪烁

```javascript
function notifyWithFlash(title, body) {
  // 发送通知
  const notification = new Notification({ title, body });
  notification.show();

  // 如果窗口隐藏，触发托盘闪烁
  if (mainWindow && !mainWindow.isVisible()) {
    startTrayFlashing();
  }

  // 点击通知时停止闪烁
  notification.on('click', () => {
    stopTrayFlashing();
    mainWindow.show();
  });
}
```

### 配合声音提示

```javascript
function notifyWithSound(title, body) {
  const notification = new Notification({
    title,
    body,
    silent: false  // 播放系统声音
  });

  notification.show();

  // 或使用自定义声音（需要在主进程）
  if (process.platform === 'darwin') {
    notification.sound = 'Ping';  // macOS 系统声音
  }
}
```

### 配合应用Badge（macOS/Linux）

```javascript
const { app } = require('electron');

function notifyWithBadge(title, body, count) {
  // 发送通知
  new Notification({ title, body }).show();

  // 设置 Badge
  if (app.setBadgeCount) {
    app.setBadgeCount(count);  // 显示数字徽章
  }
}

// 清除 Badge
function clearBadge() {
  if (app.setBadgeCount) {
    app.setBadgeCount(0);
  }
}
```

---

## 9️⃣ 常见问题

### Q1: 通知不显示？

**可能原因：**
1. 系统通知被禁用
2. Windows 未设置 AppUserModelID
3. 应用不在前台且系统设置了限制

**解决方法：**
```javascript
// 1. 检查系统支持
if (!Notification.isSupported()) {
  console.error('系统不支持通知');
}

// 2. Windows 设置 ID
if (process.platform === 'win32') {
  app.setAppUserModelId(process.execPath);
}

// 3. 测试基本通知
new Notification({
  title: '测试',
  body: '如果看到这个说明通知正常'
}).show();
```

### Q2: 如何自定义通知样式？

**答：** 
- Windows: 使用 `toastXml` 自定义 Toast 模板
- macOS: 使用系统原生样式，可配置图标、按钮
- Linux: 样式由桌面环境决定
- 不推荐过度自定义，保持系统原生风格

### Q3: 通知在 macOS 上不播放声音？

**解决：**
```javascript
const notification = new Notification({
  title: '提醒',
  body: '内容',
  silent: false,
  sound: 'default'  // 或 'Ping', 'Pop' 等系统声音
});
```

### Q4: 如何限制通知频率？

**实现防抖：**
```javascript
class RateLimitedNotification {
  constructor(interval = 5000) {
    this.lastTime = 0;
    this.interval = interval;
  }

  show(title, body) {
    const now = Date.now();
    if (now - this.lastTime < this.interval) {
      console.log('通知频率过高，已跳过');
      return;
    }

    this.lastTime = now;
    new Notification({ title, body }).show();
  }
}

const rateLimited = new RateLimitedNotification(5000);
rateLimited.show('标题', '内容');
```

### Q5: 如何处理通知权限？

```javascript
// 渲染进程
if ('Notification' in window) {
  if (Notification.permission === 'denied') {
    console.log('用户拒绝了通知权限');
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('权限结果:', permission);
    });
  }
}
```

---

## 🔟 性能优化

### 1. 避免频繁通知

```javascript
// 使用防抖
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedNotify = debounce((title, body) => {
  new Notification({ title, body }).show();
}, 2000);
```

### 2. 通知去重

```javascript
const shownNotifications = new Set();

function showUniqueNotification(id, title, body) {
  if (shownNotifications.has(id)) {
    console.log('通知已显示，跳过');
    return;
  }

  shownNotifications.add(id);
  const notification = new Notification({ title, body });
  
  notification.on('close', () => {
    // 5 分钟后可以再次显示相同通知
    setTimeout(() => shownNotifications.delete(id), 300000);
  });

  notification.show();
}
```

### 3. 资源清理

```javascript
const notifications = [];

function createNotification(title, body) {
  const notification = new Notification({ title, body });
  notifications.push(notification);

  notification.on('close', () => {
    const index = notifications.indexOf(notification);
    if (index > -1) {
      notifications.splice(index, 1);
    }
  });

  return notification;
}

// 应用退出时清理
app.on('before-quit', () => {
  notifications.forEach(n => n.close());
  notifications.length = 0;
});
```

---

## 🎯 本章学习要点总结

✅ **理解原生通知的作用和使用场景**  
✅ **掌握 Notification API 的基本用法**  
✅ **了解主进程和渲染进程中的通知实现**  
✅ **处理通知事件（点击、关闭等）**  
✅ **适配不同平台的通知特性**  
✅ **实现通知最佳实践（频率控制、合理触发）**  
✅ **与托盘、Badge 等功能集成**  

---

## 📖 延伸学习

1. **Toast Notifications (Windows)**：深入了解 Windows Toast XML
2. **User Notifications Framework (macOS)**：macOS 通知高级特性
3. **libnotify (Linux)**：Linux 通知系统
4. **Push Notifications**：结合服务器的推送通知

---

## 💡 实践建议

1. **先实现基本通知**：标题 + 内容
2. **添加点击交互**：点击通知时的行为
3. **配合其他功能**：托盘闪烁 + 通知
4. **优化用户体验**：合理的触发时机和频率
5. **测试多平台**：Windows、macOS、Linux

---

**更新时间**：2024-10-24  
**适用版本**：Electron 27.x  
**上一章节**：系统托盘（Tray）  
**下一章节**：应用打包和分发

---

## 📝 练习题

1. 实现添加任务时发送通知
2. 点击通知时聚焦到对应任务
3. 实现通知静音模式开关
4. 配合托盘闪烁实现完整提醒
5. 添加通知统计功能

