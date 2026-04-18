# 效园通后端服务

## 快速启动

```bash
# 1. 进入后端目录
cd server

# 2. 安装依赖（首次需要，约 2 分钟）
npm install

# 3. 启动服务
npm start
```

启动成功后会看到：
```
╔══════════════════════════════════════╗
║       效园通 API 服务已启动           ║
║       http://localhost:3000           ║
╚══════════════════════════════════════╝
```

## 注意事项

- 首次 `npm install` 会自动下载 Chromium（约 150MB），用于模拟浏览器登录教务系统
- 确保电脑可以访问外网（下载 Chromium）
- 服务默认运行在 3000 端口，如需修改改 `index.js` 里的 `PORT`

## API 接口

### 课程导入
```
POST /api/import/preview
Content-Type: application/json

{
  "systemType": "zhengfang",    // zhengfang | qingguo | jinzhi
  "school": "杭州万向职业技术学院",
  "eduUrl": "http://jwxt.xxx.edu.cn",
  "username": "你的学号",
  "password": "你的密码",
  "semester": "2025-1"
}
```

### 其他接口
- `GET  /api/health` - 健康检查
- `GET  /api/homework` - 作业列表
- `POST /api/import/confirm` - 确认导入

## 故障排查

### npm install 很慢或卡住
使用淘宝镜像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Chromium 下载失败
设置 PUPPETEER_SKIP_DOWNLOAD 后改用系统 Chrome：
```bash
npm install puppeteer-core
```
然后修改 `scrapers/index.js` 里的 `puppeteer.launch`：
```js
browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox']
})
```

### 端口被占用
修改 `index.js` 里的 `PORT` 变量，同时修改前端 `utils/request.js` 的 `BASE_URL`
