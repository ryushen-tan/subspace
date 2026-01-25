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

      console.log(`[ElevenLabs Service] Connecting to ${url.origin}${url.pathname}...`);
      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        console.log('[ElevenLabs Service] WebSocket connection opened successfully.');
        this.isConnected = true;
        this.onOpen?.();
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[ElevenLabs Service] Received message:', data.type);

        if (data.type === 'partial_transcript' && data.alternatives?.[0]?.text) {
          console.log('[ElevenLabs Service] Partial transcript:', data.alternatives[0].text);
          this.onPartialTranscript?.(data.alternatives[0].text);
        } else if (data.type === 'final_transcript' && data.alternatives?.[0]?.text) {
          console.log('[ElevenLabs Service] Final transcript:', data.alternatives[0].text);
          this.onFinalTranscript?.(data.alternatives[0].text);
        } else if (data.type === 'error') {
          console.error('[ElevenLabs Service] Transcription error from server:', data.error);
          this.onError?.(data.error || 'Transcription error');
        }
      };

      this.ws.onerror = (error) => {
        console.error('[ElevenLabs Service] WebSocket error occurred:', error);
        this.onError?.('WebSocket error');
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log(`[ElevenLabs Service] WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.isConnected = false;
        this.onClose?.();
      };
    });
  }

  async sendAudio(audioArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[ElevenLabs Service] Attempted to send audio but WebSocket is not open.');
      throw new Error('WebSocket is not connected');
    }

    try {
      const base64 = this.arrayBufferToBase64(audioArrayBuffer);
      console.log(`[ElevenLabs Service] Sending audio buffer, size: ${audioArrayBuffer.byteLength} bytes`);
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer_append',
        audio: base64,
      }));
    } catch (error) {
      console.error('[ElevenLabs Service] Error sending audio chunk:', error);
      throw error;
    }
  }

  finalizeTranscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[ElevenLabs Service] Cannot finalize: WebSocket is not open.');
      return;
    }

    console.log('[ElevenLabs Service] Finalizing transcription (sending commit messages)...');
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer_commit',
    }));

    this.ws.send(JSON.stringify({
      type: 'generation_commit',
    }));
  }

  close() {
    if (this.ws) {
      console.log('[ElevenLabs Service] Closing WebSocket manually.');
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
