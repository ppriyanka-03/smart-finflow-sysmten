// 🎤 Voice Payment Service - Web Speech API Integration
// Handles speech recognition for voice-based payments

interface VoicePaymentCommand {
  amount: number;
  recipient: string;
  confidence: number;
}

class VoiceService {
  private recognition: any = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Check if speech recognition is supported
  isBrowserSupported(): boolean {
    return this.isSupported;
  }

  // Start listening for voice commands
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        // Recognition ended
      };

      this.recognition.start();
    });
  }

  // Stop listening
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // Parse voice command to extract amount and recipient
  parseVoiceCommand(transcript: string): VoicePaymentCommand | null {
    try {
      const lowerTranscript = transcript.toLowerCase();
      
      // Extract amount (numbers in the transcript)
      const amountMatch = lowerTranscript.match(/(\d+)/);
      if (!amountMatch) {
        return null;
      }
      
      const amount = parseInt(amountMatch[1], 10);
      
      // Extract recipient (words after "to" or "pay")
      const recipientMatch = lowerTranscript.match(/(?:pay|to)\s+([a-z\s]+)/i);
      const recipient = recipientMatch ? recipientMatch[1].trim() : 'Unknown';
      
      return {
        amount,
        recipient,
        confidence: 0.85, // Default confidence score
      };
    } catch (error) {
      console.error('Error parsing voice command:', error);
      return null;
    }
  }

  // Validate parsed command
  validateCommand(command: VoicePaymentCommand): boolean {
    return (
      command.amount > 0 &&
      command.amount <= 100000 && // Max limit of 1 lakh
      command.recipient.length > 0 &&
      command.recipient.length <= 50
    );
  }
}

export const voiceService = new VoiceService();
