class ElevenLabsTranscriptionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ws = null;
    this.onPartialTranscript = null;
    this.onFinalTranscript = null;
    this.onError = null;
    this.onClose = null;
    this.onOpen = null;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = new URL('wss://api.elevenlabs.io/v1/speech-to-text/realtime');
      url.searchParams.append('model_id', 'scribe_v2');
      url.searchParams.append('language_code', 'eng');

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onOpen?.();
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'partial_transcript' && data.alternatives?.[0]?.text) {
          this.onPartialTranscript?.(data.alternatives[0].text);
        } else if (data.type === 'final_transcript' && data.alternatives?.[0]?.text) {
          this.onFinalTranscript?.(data.alternatives[0].text);
        } else if (data.type === 'error') {
          this.onError?.(data.error || 'Transcription error');
        }
      };

      this.ws.onerror = (error) => {
        this.onError?.('WebSocket error');
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onClose?.();
      };
    });
  }

  async sendAudio(audioArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const base64 = this.arrayBufferToBase64(audioArrayBuffer);
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer_append',
        audio: base64,
      }));
    } catch (error) {
      console.error('Error sending audio:', error);
      throw error;
    }
  }

  finalizeTranscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer_commit',
    }));

    this.ws.send(JSON.stringify({
      type: 'generation_commit',
    }));
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  setHandlers({ onPartialTranscript, onFinalTranscript, onError, onClose, onOpen }) {
    this.onPartialTranscript = onPartialTranscript;
    this.onFinalTranscript = onFinalTranscript;
    this.onError = onError;
    this.onClose = onClose;
    this.onOpen = onOpen;
  }
}

export const createTranscriptionService = (apiKey) => {
  return new ElevenLabsTranscriptionService(apiKey);
};
