import { WSMessage } from '@/types';

type MessageHandler = (msg: WSMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: string | null = null;
  private shouldConnect = false;

  connect(userId: string) {
    this.userId = userId;
    this.shouldConnect = true;
    this.createConnection();
  }

  private createConnection() {
    if (!this.userId || !this.shouldConnect) return;
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?userId=${this.userId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handlers.forEach((h) => h(msg));
        } catch {}
      };

      this.ws.onclose = () => {
        if (this.shouldConnect) {
          this.reconnectTimer = setTimeout(() => this.createConnection(), 3000);
        }
      };

      this.ws.onerror = () => this.ws?.close();
    } catch {}
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
