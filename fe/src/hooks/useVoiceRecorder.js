import { useState, useRef, useCallback } from 'react';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    console.log('[useVoiceRecorder] Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log('[useVoiceRecorder] Microphone access granted.');
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('[useVoiceRecorder] MediaRecorder stopped.');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        
        streamRef.current?.getTracks().forEach(track => {
          console.log(`[useVoiceRecorder] Stopping track: ${track.label}`);
          track.stop();
        });
      };
      
      mediaRecorder.start(100);
      console.log('[useVoiceRecorder] MediaRecorder started with 100ms interval.');
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('[useVoiceRecorder] Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[useVoiceRecorder] Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`[useVoiceRecorder] Audio blob created, size: ${audioBlob.size} bytes`);
        return audioBlob;
      }
    }
    console.warn('[useVoiceRecorder] stopRecording called but recorder is not active.');
    return null;
  }, []);

  const cancelRecording = useCallback(() => {
    console.log('[useVoiceRecorder] Cancelling recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  const getAudioArrayBuffer = useCallback(async (audioBlob) => {
    if (!audioBlob) return null;
    return await audioBlob.arrayBuffer();
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    getAudioArrayBuffer,
  };
};
