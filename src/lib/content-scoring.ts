/**
 * Content Scoring Utilities
 * Readability metrics, word counts, and quality analysis
 */

export interface ContentScore {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  readabilityScore: number; // 0-100 (Flesch Reading Ease)
  readingLevel: string;
  avgWordsPerSentence: number;
  qualityRating: "excellent" | "good" | "needs-work" | "poor";
  suggestions: string[];
}

/**
 * Calculate syllable count for a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  
  // Subtract silent e at end
  if (word.endsWith("e") && count > 1) count--;
  
  // Handle special cases
  if (word.endsWith("le") && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
    count++;
  }
  
  return Math.max(1, count);
}

/**
 * Calculate Flesch Reading Ease score
 * Higher scores = easier to read (0-100 scale)
 */
function calculateFleschReadingEase(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get reading level from Flesch score
 */
function getReadingLevel(score: number): string {
  if (score >= 90) return "5th Grade";
  if (score >= 80) return "6th Grade";
  if (score >= 70) return "7th Grade";
  if (score >= 60) return "8th-9th Grade";
  if (score >= 50) return "10th-12th Grade";
  if (score >= 30) return "College";
  return "Professional";
}

/**
 * Generate content suggestions based on analysis
 */
function generateSuggestions(
  wordCount: number,
  avgWordsPerSentence: number,
  readabilityScore: number,
  content: string
): string[] {
  const suggestions: string[] = [];
  
  // Word count suggestions
  if (wordCount < 10) {
    suggestions.push("Add more detail to this content block");
  } else if (wordCount > 150) {
    suggestions.push("Consider breaking this into smaller blocks");
  }
  
  // Sentence length
  if (avgWordsPerSentence > 25) {
    suggestions.push("Use shorter sentences for clarity");
  }
  
  // Readability
  if (readabilityScore < 40) {
    suggestions.push("Simplify language for broader audience");
  }
  
  // Passive voice detection (simple check)
  const passivePatterns = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
  if (passivePatterns.test(content)) {
    suggestions.push("Consider using active voice");
  }
  
  // Jargon detection
  const jargonWords = ["utilize", "leverage", "synergy", "paradigm", "holistic", "scalable"];
  const lowerContent = content.toLowerCase();
  const foundJargon = jargonWords.filter((j) => lowerContent.includes(j));
  if (foundJargon.length > 0) {
    suggestions.push(`Replace jargon: ${foundJargon.join(", ")}`);
  }
  
  // Check for call-to-action (for certain block types)
  if (wordCount > 20 && !content.match(/\b(learn|try|start|get|discover|join|sign up|contact)\b/i)) {
    suggestions.push("Consider adding a call-to-action");
  }
  
  return suggestions;
}

/**
 * Analyze content and return scoring metrics
 */
export function analyzeContent(text: string | null | undefined): ContentScore {
  const content = text || "";
  
  // Basic counts
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = content.length;
  
  // Sentence count (split by . ! ?)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  
  // Syllable count
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  // Calculate readability
  const readabilityScore = calculateFleschReadingEase(wordCount, sentenceCount, syllableCount);
  const readingLevel = getReadingLevel(readabilityScore);
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  // Quality rating
  let qualityRating: ContentScore["qualityRating"];
  if (wordCount < 5) {
    qualityRating = "poor";
  } else if (readabilityScore >= 60 && wordCount >= 15 && avgWordsPerSentence <= 20) {
    qualityRating = "excellent";
  } else if (readabilityScore >= 40 && wordCount >= 10) {
    qualityRating = "good";
  } else if (readabilityScore >= 20 || wordCount >= 5) {
    qualityRating = "needs-work";
  } else {
    qualityRating = "poor";
  }
  
  // Generate suggestions
  const suggestions = generateSuggestions(wordCount, avgWordsPerSentence, readabilityScore, content);
  
  return {
    wordCount,
    charCount,
    sentenceCount,
    readabilityScore,
    readingLevel,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    qualityRating,
    suggestions,
  };
}

/**
 * Get color for quality rating
 */
export function getQualityColor(rating: ContentScore["qualityRating"]): string {
  switch (rating) {
    case "excellent":
      return "#22c55e";
    case "good":
      return "#3b82f6";
    case "needs-work":
      return "#f59e0b";
    case "poor":
      return "#ef4444";
  }
}

/**
 * Get badge label for quality rating
 */
export function getQualityLabel(rating: ContentScore["qualityRating"]): string {
  switch (rating) {
    case "excellent":
      return "✨ Excellent";
    case "good":
      return "👍 Good";
    case "needs-work":
      return "⚠️ Needs Work";
    case "poor":
      return "❌ Poor";
  }
}

/**
 * Calculate SLA status for review
 */
export interface SLAStatus {
  hoursInReview: number;
  isOverdue: boolean;
  isWarning: boolean;
  statusLabel: string;
  statusColor: string;
}

export function calculateSLAStatus(submittedAt: Date | null | undefined): SLAStatus {
  if (!submittedAt) {
    return {
      hoursInReview: 0,
      isOverdue: false,
      isWarning: false,
      statusLabel: "Not submitted",
      statusColor: "#6b7280",
    };
  }
  
  const now = new Date();
  const submitted = new Date(submittedAt);
  const hoursInReview = Math.round((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
  
  const isOverdue = hoursInReview >= 48;
  const isWarning = hoursInReview >= 24 && hoursInReview < 48;
  
  let statusLabel: string;
  let statusColor: string;
  
  if (isOverdue) {
    statusLabel = `🚨 ${hoursInReview}h overdue`;
    statusColor = "#ef4444";
  } else if (isWarning) {
    statusLabel = `⚠️ ${hoursInReview}h in review`;
    statusColor = "#f59e0b";
  } else if (hoursInReview < 1) {
    statusLabel = "Just submitted";
    statusColor = "#3b82f6";
  } else {
    statusLabel = `${hoursInReview}h in review`;
    statusColor = "#22c55e";
  }
  
  return {
    hoursInReview,
    isOverdue,
    isWarning,
    statusLabel,
    statusColor,
  };
}


