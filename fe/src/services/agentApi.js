const WS_URL = 'ws://localhost:8000/agent/ws';

class AgentWebSocket {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.onStateUpdate = null;
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
  }

  connect(initialPrompt = '') {
    return new Promise((resolve, reject) => {
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

      this.ws.onopen = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'start', prompt: initialPrompt }));
        }
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'session') {
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

      this.ws.onerror = (error) => {
        this.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
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
    
    let url = 'http://localhost:8000/agent/upload-step';
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
    
    let url = 'http://localhost:8000/agent/upload-stl';
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
    
    let url = 'http://localhost:8000/agent/upload-photo';
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
