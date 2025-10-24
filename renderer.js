// 渲染进程脚本
// 负责处理用户界面的交互逻辑

// 任务数据存储
let tasks = [];
let taskIdCounter = 1;

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('渲染进程已加载');
    
    // 显示系统信息
    displaySystemInfo();
    
    // 初始化事件监听器
    initializeEventListeners();
    
    // 初始化 IPC 功能
    initializeIPCFeatures();
    
    // 注册来自主进程的消息监听器
    registerMainProcessListeners();
    
    // 从本地存储加载任务
    loadTasksFromStorage();
    
    // 渲染任务列表
    renderTasks();
});

// 显示系统信息
function displaySystemInfo() {
    // 通过 preload.js 暴露的 API 访问系统信息
    if (window.electronAPI) {
        const versions = window.electronAPI.versions;
        const platform = window.electronAPI.platform;
        
        document.getElementById('node-version').textContent = versions.node;
        document.getElementById('chrome-version').textContent = versions.chrome;
        document.getElementById('electron-version').textContent = versions.electron;
        
        // 显示友好的操作系统名称
        const platformNames = {
            'win32': 'Windows',
            'darwin': 'macOS',
            'linux': 'Linux'
        };
        document.getElementById('platform').textContent = platformNames[platform] || platform;
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    const addBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');
    
    // 点击添加按钮
    addBtn.addEventListener('click', addTask);
    
    // 按 Enter 键添加任务
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

// 添加任务
function addTask() {
    const taskInput = document.getElementById('task-input');
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('请输入任务内容！');
        return;
    }
    
    // 创建任务对象
    const task = {
        id: taskIdCounter++,
        text: taskText,
        completed: false,
        createdAt: new Date().toLocaleString('zh-CN')
    };
    
    // 添加到任务列表
    tasks.push(task);
    
    // 清空输入框
    taskInput.value = '';
    
    // 保存到本地存储
    saveTasksToStorage();
    
    // 重新渲染
    renderTasks();
    
    // 如果窗口不可见（隐藏到托盘），触发托盘图标闪烁
        if (window.electronAPI && window.electronAPI.startTrayFlashing) {
            window.electronAPI.startTrayFlashing();
            console.log('窗口隐藏，触发托盘图标闪烁');
        }
    
    console.log('任务已添加:', task);
}

// 切换任务完成状态
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
        console.log('任务状态已切换:', task);
    }
}

// 删除任务
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage();
    renderTasks();
    console.log('任务已删除, ID:', taskId);
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('task-list');
    
    // 清空列表
    taskList.innerHTML = '';
    
    // 如果没有任务，显示提示
    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="empty-message">暂无任务，添加一个开始吧！</li>';
        updateTaskStats();
        return;
    }
    
    // 渲染每个任务
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="task-content">
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTask(${task.id})"
                    class="task-checkbox"
                >
                <div class="task-details">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <span class="task-time">${task.createdAt}</span>
                </div>
            </div>
            <button 
                onclick="deleteTask(${task.id})"
                class="btn btn-danger btn-small"
                title="删除任务"
            >
                🗑️ 删除
            </button>
        `;
        
        taskList.appendChild(li);
    });
    
    // 更新统计信息
    updateTaskStats();
}

// 更新任务统计
function updateTaskStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
}

// 保存任务到本地存储
function saveTasksToStorage() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('taskIdCounter', taskIdCounter.toString());
    } catch (e) {
        console.error('保存任务失败:', e);
    }
}

// 从本地存储加载任务
function loadTasksFromStorage() {
    try {
        const savedTasks = localStorage.getItem('tasks');
        const savedCounter = localStorage.getItem('taskIdCounter');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        
        if (savedCounter) {
            taskIdCounter = parseInt(savedCounter, 10);
        }
        
        console.log('已加载任务:', tasks.length);
    } catch (e) {
        console.error('加载任务失败:', e);
    }
}

// 转义 HTML 以防止 XSS 攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 将函数暴露到全局作用域，以便 HTML 中的 onclick 可以访问
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

// ============ IPC 功能实现 ============

// 初始化 IPC 演示功能
function initializeIPCFeatures() {
    console.log('初始化 IPC 功能...');
    
    // 【模式 1：单向通信】设置窗口标题
    const setTitleBtn = document.getElementById('set-title-btn');
    const titleInput = document.getElementById('title-input');
    
    if (setTitleBtn && titleInput) {
        setTitleBtn.addEventListener('click', () => {
            const title = titleInput.value.trim();
            if (title) {
                // 单向发送消息到主进程
                window.electronAPI.setTitle(title);
                console.log('已发送设置标题请求:', title);
                titleInput.value = '';
                showNotification('窗口标题已更新！', 'success');
            } else {
                showNotification('请输入标题！', 'warning');
            }
        });
        
        // 支持 Enter 键
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                setTitleBtn.click();
            }
        });
    }
    
    // 【模式 2：双向通信】文件操作
    const openFileBtn = document.getElementById('open-file-btn');
    const saveFileBtn = document.getElementById('save-file-btn');
    
    if (openFileBtn) {
        openFileBtn.addEventListener('click', handleOpenFile);
    }
    
    if (saveFileBtn) {
        saveFileBtn.addEventListener('click', handleSaveFile);
    }
    
    // 【托盘图标闪烁】测试功能
    const startFlashBtn = document.getElementById('start-flash-btn');
    const stopFlashBtn = document.getElementById('stop-flash-btn');
    
    if (startFlashBtn) {
        startFlashBtn.addEventListener('click', () => {
            if (window.electronAPI && window.electronAPI.startTrayFlashing) {
                window.electronAPI.startTrayFlashing();
                console.log('手动触发托盘图标闪烁');
                showNotification('托盘图标开始闪烁！最小化窗口查看效果', 'info');
            }
        });
    }
    
    if (stopFlashBtn) {
        stopFlashBtn.addEventListener('click', () => {
            if (window.electronAPI && window.electronAPI.stopTrayFlashing) {
                window.electronAPI.stopTrayFlashing();
                console.log('停止托盘图标闪烁');
                showNotification('托盘图标停止闪烁', 'info');
            }
        });
    }
}

// 处理打开文件（双向 IPC）
async function handleOpenFile() {
    try {
        console.log('请求打开文件...');
        updateFileStatus('正在打开文件...', 'info');
        
        // 使用 invoke 发送请求并等待返回
        const result = await window.electronAPI.openFile();
        
        if (result.success) {
            console.log('文件已加载:', result.filePath);
            
            // 加载任务数据
            loadTasksFromFile(result.data);
            
            updateFileStatus(`已加载: ${result.filePath}`, 'success');
            showNotification('任务文件加载成功！', 'success');
        } else if (result.canceled) {
            console.log('用户取消了文件选择');
            updateFileStatus('已取消', 'info');
        } else {
            console.error('加载文件失败:', result.error);
            updateFileStatus('加载失败', 'error');
            showNotification('加载文件失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('打开文件时出错:', error);
        updateFileStatus('错误', 'error');
        showNotification('打开文件失败！', 'error');
    }
}

// 处理保存文件（双向 IPC）
async function handleSaveFile() {
    try {
        console.log('请求保存文件...');
        updateFileStatus('正在保存文件...', 'info');
        
        // 准备要保存的数据
        const dataToSave = {
            tasks: tasks,
            taskIdCounter: taskIdCounter,
            savedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        // 使用 invoke 发送请求并等待返回
        const result = await window.electronAPI.saveFile(dataToSave);
        
        if (result.success) {
            console.log('文件已保存:', result.filePath);
            updateFileStatus(`已保存: ${result.filePath}`, 'success');
            showNotification('任务文件保存成功！', 'success');
        } else if (result.canceled) {
            console.log('用户取消了保存');
            updateFileStatus('已取消', 'info');
        } else {
            console.error('保存文件失败:', result.error);
            updateFileStatus('保存失败', 'error');
            showNotification('保存文件失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('保存文件时出错:', error);
        updateFileStatus('错误', 'error');
        showNotification('保存文件失败！', 'error');
    }
}

// 从文件数据加载任务
function loadTasksFromFile(data) {
    if (data && data.tasks && Array.isArray(data.tasks)) {
        tasks = data.tasks;
        taskIdCounter = data.taskIdCounter || (tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1);
        
        // 保存到本地存储
        saveTasksToStorage();
        
        // 重新渲染
        renderTasks();
        
        console.log('已从文件加载', tasks.length, '个任务');
    } else {
        throw new Error('无效的文件格式');
    }
}

// 更新文件状态显示
function updateFileStatus(message, type = 'info') {
    const statusElement = document.getElementById('file-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `file-status ${type}`;
        
        // 3 秒后清除状态
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'file-status';
        }, 3000);
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 简单的通知实现
    const notificationClass = type === 'success' ? 'notification-success' :
                             type === 'error' ? 'notification-error' :
                             type === 'warning' ? 'notification-warning' : 'notification-info';
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // 可以在这里添加更复杂的通知 UI
    // 暂时使用控制台输出
}

// 【模式 3：主进程到渲染器】注册来自主进程的消息监听器
function registerMainProcessListeners() {
    console.log('注册主进程消息监听器...');
    
    // 监听加载任务命令
    window.electronAPI.onLoadTasks((data) => {
        console.log('收到主进程的加载任务命令');
        try {
            loadTasksFromFile(data);
            showNotification('任务已从文件加载', 'success');
        } catch (error) {
            console.error('加载任务失败:', error);
            showNotification('加载任务失败', 'error');
        }
    });
    
    // 监听保存任务请求
    window.electronAPI.onRequestSaveTasks(() => {
        console.log('收到主进程的保存任务请求');
        handleSaveFile();
    });
    
    // 监听清空所有任务命令
    window.electronAPI.onClearAllTasks(() => {
        console.log('收到主进程的清空任务命令');
        if (confirm('确定要清空所有任务吗？此操作无法撤销！')) {
            tasks = [];
            saveTasksToStorage();
            renderTasks();
            showNotification('所有任务已清空', 'success');
        }
    });
    
    // 监听显示任务统计命令
    window.electronAPI.onShowTaskStats(() => {
        console.log('收到主进程的显示统计命令');
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        
        const message = `📊 任务统计\n\n` +
                       `总任务数: ${total}\n` +
                       `已完成: ${completed}\n` +
                       `进行中: ${pending}\n` +
                       `完成率: ${completionRate}%`;
        
        alert(message);
    });
    
    // 监听标记所有为已完成
    window.electronAPI.onCompleteAllTasks(() => {
        console.log('收到主进程的标记全部完成命令');
        tasks.forEach(task => task.completed = true);
        saveTasksToStorage();
        renderTasks();
        showNotification('所有任务已标记为完成', 'success');
    });
    
    // 监听标记所有为未完成
    window.electronAPI.onUncompleteAllTasks(() => {
        console.log('收到主进程的标记全部未完成命令');
        tasks.forEach(task => task.completed = false);
        saveTasksToStorage();
        renderTasks();
        showNotification('所有任务已标记为未完成', 'success');
    });
    
    console.log('主进程消息监听器注册完成');
}

