// 🎯 Voice Payment Button Component - UI component for voice payment
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoicePayment } from '@/hooks/useVoicePayment';

interface VoiceButtonProps {
  onPaymentData: (amount: string, recipient: string, bankAccountId?: string, transcript?: string, language?: 'en-IN' | 'hi-IN') => void;
  bankAccounts?: Array<{ id: string; bankName: string; balance: number }>;
  className?: string;
}

export const VoiceButton = ({ onPaymentData, bankAccounts = [], className = '' }: VoiceButtonProps) => {
  const {
    isListening,
    transcript,
    parsedResult,
    error,
    language,
    startListening,
    stopListening,
    setLanguage,
    clearResult,
  } = useVoicePayment();

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(bankAccounts);
    }
  };

  const handleApplyPaymentData = () => {
    if (parsedResult && parsedResult.amount && parsedResult.recipient) {
      // Find best bank account
      const bankAccountId = parsedResult.bankName
        ? bankAccounts.find(acc => acc.bankName.toLowerCase().includes(parsedResult.bankName!.toLowerCase()))?.id
        : bankAccounts.find(acc => acc.balance >= parsedResult.amount!)?.id || bankAccounts[0]?.id;

      onPaymentData(
        parsedResult.amount.toString(),
        parsedResult.recipient,
        bankAccountId,
        transcript,
        language
      );
      clearResult();
    }
  };

  const handleClear = () => {
    clearResult();
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Language Toggle & Mic Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLanguageToggle}
          className="flex-1"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          {language === 'en-IN' ? 'English' : 'हिंदी'}
        </Button>
        
        <Button
          onClick={handleToggleListening}
          variant={isListening ? 'destructive' : 'default'}
          size="sm"
          className="flex-1"
        >
          {isListening ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Speak
            </>
          )}
        </Button>
      </div>

      {/* Listening Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center"
          >
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-8 bg-primary rounded-full"
                  animate={{
                    scaleY: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-primary">Listening...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Say: "Pay 500 to Rahul from SBI"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-secondary/50 border border-border rounded-lg p-3"
          >
            <p className="text-sm text-muted-foreground mb-1">You said:</p>
            <p className="text-sm font-medium">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Result */}
      <AnimatePresence>
        {parsedResult && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-success/10 border border-success/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-success">Payment Details Detected</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                parsedResult.confidence === 'high' ? 'bg-success/20 text-success' :
                parsedResult.confidence === 'medium' ? 'bg-warning/20 text-warning' :
                'bg-destructive/20 text-destructive'
              }`}>
                {parsedResult.confidence} confidence
              </span>
            </div>
            
            <div className="space-y-2">
              {parsedResult.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-sm font-bold text-foreground">₹{parsedResult.amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              
              {parsedResult.recipient && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recipient:</span>
                  <span className="text-sm font-semibold text-foreground">{parsedResult.recipient}</span>
                </div>
              )}
              
              {parsedResult.bankName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank:</span>
                  <span className="text-sm font-semibold text-foreground">{parsedResult.bankName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleApplyPaymentData}
                size="sm"
                className="flex-1"
                disabled={!parsedResult.amount || !parsedResult.recipient}
              >
                Apply Payment
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
