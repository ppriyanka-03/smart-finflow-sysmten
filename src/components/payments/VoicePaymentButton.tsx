// 🎤 Voice Payment Button Component - Voice payment integration
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface VoicePaymentButtonProps {
  onPaymentData: (amount: number, recipient: string) => void;
}

export const VoicePaymentButton = ({ onPaymentData }: VoicePaymentButtonProps) => {
  const { isListening, isSupported, error, startListening, stopListening } = useVoice();
  const [lastCommand, setLastCommand] = useState<string>('');

  const handleVoicePayment = async () => {
    const command = await startListening();
    
    if (command) {
      setLastCommand(`Pay ${command.amount} to ${command.recipient}`);
      onPaymentData(command.amount, command.recipient);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={isListening ? stopListening : handleVoicePayment}
        variant={isListening ? 'destructive' : 'outline'}
        className="w-full"
        disabled={isListening}
      >
        {isListening ? (
          <>
            <MicOff className="mr-2 h-4 w-4" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Voice Payment
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Listening... Say "Pay 500 to Rahul"
        </div>
      )}
      
      {error && (
        <div className="text-sm text-destructive text-center">
          {error}
        </div>
      )}
      
      {lastCommand && !isListening && !error && (
        <div className="text-sm text-center text-muted-foreground">
          Last command: {lastCommand}
        </div>
      )}
    </div>
  );
};
