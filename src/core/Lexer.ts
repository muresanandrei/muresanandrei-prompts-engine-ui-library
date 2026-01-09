// ============================================================
// LEXER - Tokenization and Normalization
// ============================================================

import { TokenizedResult } from '../types';

/**
 * Lexer handles the first stage of processing: breaking down
 * the input prompt into tokens (words and phrases) for further analysis.
 */
export class Lexer {
  private commonPhrases: string[];
  private stopWords: Set<string>;

  constructor() {
    // Multi-word phrases that should be kept together
    this.commonPhrases = [
      // Layout phrases
      'two column', 'three column', 'four column',
      'full width', 'half width',
      'side by side', 'on top of',
      'next to', 'below the', 'above the',
      
      // Component phrases
      'text field', 'text input', 'text area',
      'drop down', 'date picker', 'color picker',
      'check box', 'radio button', 'toggle switch',
      'progress bar', 'loading spinner',
      'nav bar', 'navigation bar', 'side bar',
      'tool tip', 'pop over', 'modal dialog',
      
      // Page phrases
      'landing page', 'home page', 'login page',
      'sign up', 'sign in', 'log in', 'log out',
      'contact form', 'search bar',
      
      // Modifier phrases
      'with icon', 'without icon',
      'full screen', 'fixed position',
      'scroll area', 'overflow hidden'
    ];

    // Words to potentially filter out (but keep for context)
    this.stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but',
      'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with',
      'at', 'by', 'from', 'as', 'into', 'through',
      'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'just', 'also', 'now', 'please', 'thanks',
      'want', 'like', 'need', 'me', 'i', 'my'
    ]);
  }

  /**
   * Main tokenization method
   */
  tokenize(input: string): TokenizedResult {
    const original = input.trim();
    const lowercased = original.toLowerCase();
    
    // Extract multi-word phrases first
    const { text: processedText, phrases } = this.extractPhrases(lowercased);
    
    // Split remaining text into words
    const words = this.splitIntoWords(processedText);
    
    // Combine phrases and words, maintaining order approximately
    const allTokens = [...phrases, ...words];
    
    // Create normalized version (stemmed, no stop words)
    const normalized = this.normalize(allTokens);

    return {
      original,
      words: allTokens,
      phrases,
      normalized
    };
  }

  /**
   * Extract known multi-word phrases from text
   */
  private extractPhrases(text: string): { text: string; phrases: string[] } {
    let processedText = text;
    const foundPhrases: string[] = [];

    // Sort phrases by length (longest first) to avoid partial matches
    const sortedPhrases = [...this.commonPhrases].sort((a, b) => b.length - a.length);

    for (const phrase of sortedPhrases) {
      if (processedText.includes(phrase)) {
        foundPhrases.push(phrase);
        // Replace with placeholder to avoid re-matching parts
        processedText = processedText.replace(phrase, ' __PHRASE__ ');
      }
    }

    // Remove placeholders
    processedText = processedText.replace(/__PHRASE__/g, '');

    return { text: processedText, phrases: foundPhrases };
  }

  /**
   * Split text into individual words
   */
  private splitIntoWords(text: string): string[] {
    return text
      .replace(/[^\w\s-]/g, ' ')  // Remove punctuation except hyphens
      .split(/\s+/)
      .filter(word => word.length > 0)
      .filter(word => word !== '-');
  }

  /**
   * Normalize tokens by removing stop words and applying basic stemming
   */
  private normalize(tokens: string[]): string[] {
    return tokens
      .map(token => token.toLowerCase())
      .filter(token => !this.stopWords.has(token))
      .map(token => this.basicStem(token));
  }

  /**
   * Very basic stemming - just handles common suffixes
   * For production, use a proper stemmer like Porter Stemmer
   */
  private basicStem(word: string): string {
    // Handle common suffixes
    const suffixes = [
      { suffix: 'ing', minLength: 5 },
      { suffix: 'ed', minLength: 4 },
      { suffix: 'es', minLength: 4 },
      { suffix: 's', minLength: 4 },
      { suffix: 'ly', minLength: 5 },
      { suffix: 'ment', minLength: 6 },
      { suffix: 'ness', minLength: 6 },
      { suffix: 'tion', minLength: 6 },
      { suffix: 'able', minLength: 6 },
      { suffix: 'ible', minLength: 6 }
    ];

    for (const { suffix, minLength } of suffixes) {
      if (word.length >= minLength && word.endsWith(suffix)) {
        return word.slice(0, -suffix.length);
      }
    }

    return word;
  }

  /**
   * Add custom phrases to recognize
   */
  addPhrase(phrase: string): void {
    if (!this.commonPhrases.includes(phrase.toLowerCase())) {
      this.commonPhrases.push(phrase.toLowerCase());
    }
  }

  /**
   * Add multiple phrases at once
   */
  addPhrases(phrases: string[]): void {
    phrases.forEach(phrase => this.addPhrase(phrase));
  }

  /**
   * Check if a word is a stop word
   */
  isStopWord(word: string): boolean {
    return this.stopWords.has(word.toLowerCase());
  }

  /**
   * Get all recognized phrases
   */
  getPhrases(): string[] {
    return [...this.commonPhrases];
  }
}

export default Lexer;
