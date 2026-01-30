const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/agent/ws';
const CONNECT_TIMEOUT_MS = 15000;

export { API_BASE };

class AgentWebSocket {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this._closedByUs = false;
    this.onStateUpdate = null;
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  connect(initialPrompt = '') {
    return new Promise((resolve, reject) => {
      this._closedByUs = false;
      // Prevent double-connecting while a socket is already open/connecting
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        if (this.sessionId) {
          resolve(this.sessionId);
          return;
        }
        // If connecting without a session yet, wait for open/close and then continue
        this.ws.addEventListener('open', () => resolve(this.sessionId));
        this.ws.addEventListener('close', () => reject(new Error('Socket closed before session established')));
        return;
      }

      this.ws = new WebSocket(WS_URL);
      let timeoutId = null;

      timeoutId = setTimeout(() => {
        if (this.sessionId != null) return;
        timeoutId = null;
        this._closedByUs = true;
        this.ws?.close();
        this.ws = null;
        const msg = `Connection to ${WS_URL} timed out after ${CONNECT_TIMEOUT_MS / 1000}s. Check that the server is running and the WebSocket endpoint is reachable.`;
        this.onError?.(msg);
        reject(new Error(msg));
      }, CONNECT_TIMEOUT_MS);

      this.ws.onopen = () => {
        if (this._closedByUs) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          this.ws?.close();
          this.ws = null;
          this.sessionId = null;
          return;
        }
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'start', prompt: initialPrompt }));
        }
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'session') {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          this.sessionId = data.session_id;
          this.onConnect?.(data.session_id);
          resolve(data.session_id);
        } else if (data.type === 'response') {
          this.onMessage?.(data.response);
          if (data.state) {
            this.onStateUpdate?.(data.state);
          }
        } else if (data.type === 'state') {
          this.onStateUpdate?.(data.state);
        } else if (data.type === 'error') {
          this.onError?.(data.message);
        }
      };

      this.ws.onerror = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (this._closedByUs) return;
        const msg = `WebSocket connection to ${WS_URL} failed. Check that the server is running and allows secure WebSocket (wss) connections.`;
        this.onError?.(msg);
        reject(new Error(msg));
      };

      this.ws.onclose = (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (this.sessionId == null && !this._closedByUs) {
          const reason = event.reason || `code ${event.code}`;
          const msg = event.code === 1006
            ? `Connection closed before session (${reason}). Code 1006 usually means a reverse proxy or load balancer in front of the server is not forwarding WebSocket upgrades. See docs/websocket-troubleshooting.md.`
            : `Connection closed before session (${reason}). Server may be down or the /agent/ws path may not be enabled.`;
          this.onError?.(msg);
        }
        if (this._closedByUs) this.ws = null;
        this.onDisconnect?.();
      };
    });
  }

  sendMessage(content) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
    }
  }

  runStep() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'step' }));
    }
  }

  getState() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'state' }));
    }
  }

  close() {
    this._closedByUs = true;
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.sessionId = null;
      return;
    }
    this.ws?.close();
    this.ws = null;
    this.sessionId = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async uploadStepFile(file, sessionId = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${API_BASE}/agent/upload-step`;
    if (sessionId) {
      url += `?session_id=${sessionId}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  }

  async uploadStlFile(file, sessionId = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${API_BASE}/agent/upload-stl`;
    if (sessionId) {
      url += `?session_id=${sessionId}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  }

  async uploadPhotoFile(file, paperSize = 'letter', sessionId = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    let url = `${API_BASE}/agent/upload-photo`;
    const params = new URLSearchParams();
    params.append('paper_size', paperSize);
    if (sessionId) {
      params.append('session_id', sessionId);
    }
    url += `?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  }
}

export const agentApi = new AgentWebSocket();
