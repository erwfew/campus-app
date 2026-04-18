const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 430,
        height: 900,
        minWidth: 375,
        minHeight: 700,
        title: '效园通',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true
        },
        frame: true,
        resizable: true,
        backgroundColor: '#f5f6fa'
    });

    win.loadFile('index.html');

    // 开发时打开开发者工具
    // win.webContents.openDevTools();

    // 拦截新窗口打开，防止恶意跳转
    win.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
