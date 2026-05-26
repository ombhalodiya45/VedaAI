import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WSMessage } from '../types';

const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      ws.close(1008, 'userId required');
      return;
    }

    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(ws);

    ws.on('close', () => {
      clients.get(userId)?.delete(ws);
      if (clients.get(userId)?.size === 0) clients.delete(userId);
    });

    ws.send(JSON.stringify({ type: 'connected', userId }));
  });

  return wss;
}

export function notifyUser(userId: string, message: WSMessage): void {
  const userSockets = clients.get(userId);
  if (!userSockets) return;

  const payload = JSON.stringify(message);
  userSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
