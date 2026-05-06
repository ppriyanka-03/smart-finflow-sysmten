// 🎤 Voice Payment Hook - React integration for voice payments
import { useState, useCallback } from 'react';
import { voiceService, VoicePaymentCommand } from '@/services/voiceService';

interface UseVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => Promise<VoicePaymentCommand | null>;
  stopListening: () => void;
}

export const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupported = voiceService.isBrowserSupported();

  const startListening = useCallback(async (): Promise<VoicePaymentCommand | null> => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return null;
    }

    setIsListening(true);
    setError(null);

    try {
      const transcript = await voiceService.startListening();
      const command = voiceService.parseVoiceCommand(transcript);
      
      if (!command) {
        setError('Could not parse voice command. Please try again.');
        return null;
      }

      if (!voiceService.validateCommand(command)) {
        setError('Invalid payment amount or recipient. Please try again.');
        return null;
      }

      return command;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recognize speech');
      return null;
    } finally {
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  };
};
