/**
 * WebSocket 广播模块
 * 从 app.js 抽出，避免 routes → app 的循环依赖
 */
const WebSocket = require('ws');

const wsClients = new Set();

function addClient(ws) {
  wsClients.add(ws);
}

function removeClient(ws) {
  wsClients.delete(ws);
}

function getClientCount() {
  return wsClients.size;
}

/**
 * 向指定频道广播消息
 * @param {string} channel - 频道名（空字符串=全部）
 * @param {object} data - 消息数据
 */
function broadcast(channel, data) {
  const payload = JSON.stringify({ channel, data, timestamp: Date.now() });
  for (const ws of wsClients) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!ws._channel || !channel || ws._channel === channel) {
        ws.send(payload);
      }
    }
  }
}

module.exports = { addClient, removeClient, getClientCount, broadcast };
