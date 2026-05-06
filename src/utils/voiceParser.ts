// 🎯 Voice Parser Utility - Smart voice parsing for natural language payment commands
// Supports English (en-IN) and Hindi (hi-IN)

export interface ParsedVoiceResult {
  amount: number | null;
  recipient: string | null;
  bankName: string | null;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

// Bank keywords for detection
const BANK_KEYWORDS = {
  'sbi': ['sbi', 'state bank', 'state bank of india'],
  'hdfc': ['hdfc', 'hdfc bank'],
  'icici': ['icici', 'icici bank'],
  'axis': ['axis', 'axis bank'],
  'kotak': ['kotak', 'kotak mahindra'],
  'pnb': ['pnb', 'punjab national'],
  'bob': ['bob', 'bank of baroda'],
  'yes': ['yes', 'yes bank'],
  'canara': ['canara', 'canara bank'],
  'union': ['union', 'union bank'],
};

// Payment action keywords
const ACTION_KEYWORDS = {
  english: ['pay', 'send', 'transfer', 'bhejo', 'bhej', 'de', 'diya', 'dijiye', 'karo'],
  hindi: ['bhejo', 'bhej', 'de', 'diya', 'dijiye', 'karo', 'pay', 'send', 'transfer'],
};

// Preposition keywords for recipient detection
const RECIPIENT_KEYWORDS = {
  english: ['to', 'for', 'ko', 'ke liye', 'towards'],
  hindi: ['ko', 'ke liye', 'towards'],
};

// Preposition keywords for bank detection
const FROM_KEYWORDS = {
  english: ['from', 'using', 'via', 'se', 'se bank', 'bank se', 'ka'],
  hindi: ['se', 'se bank', 'bank se', 'ka'],
};

/**
 * Parse voice input and extract payment details
 */
export const parseVoicePayment = (text: string): ParsedVoiceResult => {
  const normalizedText = text.toLowerCase().trim();
  const result: ParsedVoiceResult = {
    amount: null,
    recipient: null,
    bankName: null,
    rawText: text,
    confidence: 'low',
  };

  // Extract amount
  result.amount = extractAmount(normalizedText);

  // Extract recipient
  result.recipient = extractRecipient(normalizedText);

  // Extract bank name
  result.bankName = extractBank(normalizedText);

  // Calculate confidence based on extracted fields
  const extractedFields = [
    result.amount !== null,
    result.recipient !== null,
    result.bankName !== null,
  ].filter(Boolean).length;

  if (extractedFields === 3) {
    result.confidence = 'high';
  } else if (extractedFields === 2) {
    result.confidence = 'medium';
  } else {
    result.confidence = 'low';
  }

  return result;
};

/**
 * Extract amount from voice text
 */
const extractAmount = (text: string): number | null => {
  // Match numeric amounts (500, 1000, 200)
  const numericMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
  if (numericMatch) {
    return parseFloat(numericMatch[1].replace(/,/g, ''));
  }

  // Match Hindi number words
  const hindiNumbers: Record<string, number> = {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
    'chhah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'bees': 20, 'tees': 30, 'chaalis': 40, 'pachaas': 50,
    'sath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90, 'sau': 100,
    'hazār': 1000, 'hazaar': 1000, 'ek hazār': 1000,
  };

  for (const [word, value] of Object.entries(hindiNumbers)) {
    if (text.includes(word)) {
      return value;
    }
  }

  return null;
};

/**
 * Extract recipient name from voice text
 */
const extractRecipient = (text: string): string | null => {
  // Remove common words and payment keywords
  const stopWords = [
    'pay', 'send', 'transfer', 'rupees', 'rs', '₹', 'rupee',
    'to', 'from', 'using', 'via', 'please', 'bhejo', 'bhej', 'de',
    'karo', 'dijiye', 'ko', 'ke', 'liye', 'se', 'bank',
    'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'bob',
  ];

  let cleanedText = text.toLowerCase();
  stopWords.forEach(word => {
    cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });

  // Split by common delimiters
  const words = cleanedText
    .split(/[\s,]+/)
    .filter(word => word.length > 2 && isNaN(parseFloat(word)));

  // Return the first meaningful word as recipient
  if (words.length > 0) {
    return capitalizeFirstLetter(words[0]);
  }

  return null;
};

/**
 * Extract bank name from voice text
 */
const extractBank = (text: string): string | null => {
  for (const [bank, keywords] of Object.entries(BANK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return bank.toUpperCase();
      }
    }
  }
  return null;
};

/**
 * Find best matching bank account based on:
 * 1. Exact name match
 * 2. Sufficient balance
 * 3. Highest balance
 */
export const findBestBankAccount = (
  bankAccounts: Array<{ id: string; bankName: string; balance: number }>,
  detectedBank: string | null,
  requiredAmount: number
): string | null => {
  if (!bankAccounts || bankAccounts.length === 0) {
    return null;
  }

  // Try exact match first
  if (detectedBank) {
    const exactMatch = bankAccounts.find(
      account => account.bankName.toLowerCase().includes(detectedBank.toLowerCase())
    );
    if (exactMatch && exactMatch.balance >= requiredAmount) {
      return exactMatch.id;
    }
  }

  // Find accounts with sufficient balance
  const sufficientBalanceAccounts = bankAccounts.filter(
    account => account.balance >= requiredAmount
  );

  if (sufficientBalanceAccounts.length > 0) {
    // Return account with highest balance
    const highestBalance = sufficientBalanceAccounts.reduce((prev, current) =>
      prev.balance > current.balance ? prev : current
    );
    return highestBalance.id;
  }

  // If no sufficient balance, return account with highest balance
  const highestBalance = bankAccounts.reduce((prev, current) =>
    prev.balance > current.balance ? prev : current
  );
  return highestBalance.id;
};

/**
 * Validate parsed result
 */
export const validateParsedResult = (result: ParsedVoiceResult): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (result.amount === null) {
    errors.push('Amount not detected');
  } else if (result.amount <= 0) {
    errors.push('Invalid amount');
  } else if (result.amount > 1000000) {
    errors.push('Amount exceeds maximum limit');
  }

  if (!result.recipient || result.recipient.length < 2) {
    errors.push('Recipient name not detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to capitalize first letter
 */
const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
