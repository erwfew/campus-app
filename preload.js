/**
 * Electron Preload 脚本
 * 安全隔离：只暴露必要的 API 给渲染进程
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    }
});
