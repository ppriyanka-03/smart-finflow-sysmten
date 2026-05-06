// 🎯 Voice Payment Hook - Custom hook for voice payment functionality
import { useState, useCallback, useEffect } from 'react';
import { parseVoicePayment, findBestBankAccount, validateParsedResult, ParsedVoiceResult } from '@/utils/voiceParser';

export interface VoicePaymentHookResult {
  isListening: boolean;
  transcript: string;
  parsedResult: ParsedVoiceResult | null;
  error: string | null;
  language: 'en-IN' | 'hi-IN';
  startListening: (bankAccounts?: Array<{ id: string; bankName: string; balance: number }>) => void;
  stopListening: () => void;
  setLanguage: (lang: 'en-IN' | 'hi-IN') => void;
  clearResult: () => void;
}

export const useVoicePayment = (): VoicePaymentHookResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = language;
        
        recognitionInstance.onstart = () => {
          setIsListening(true);
          setError(null);
        };
        
        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
          
          // Parse on final result
          if (finalTranscript) {
            const parsed = parseVoicePayment(finalTranscript);
            setParsedResult(parsed);
            
            const validation = validateParsedResult(parsed);
            if (!validation.isValid) {
              setError(validation.errors.join(', '));
            } else {
              setError(null);
            }
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Could not understand. Try again.';
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'Microphone not accessible. Please check permissions.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow access.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your connection.';
              break;
            default:
              errorMessage = 'Could not understand. Try again.';
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      } else {
        setError('Speech recognition not supported in this browser.');
      }
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [language]);

  const startListening = useCallback((bankAccounts?: Array<{ id: string; bankName: string; balance: number }>) => {
    if (!recognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    
    setError(null);
    setTranscript('');
    setParsedResult(null);
    
    try {
      recognition.lang = language;
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start listening. Please try again.');
    }
  }, [recognition, language]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const clearResult = useCallback(() => {
    setTranscript('');
    setParsedResult(null);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    parsedResult,
    error,
    language,
    startListening,
    stopListening,
    setLanguage,
    clearResult,
  };
};
