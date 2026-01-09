// ============================================================
// INTENT RESOLVER - Trainable Intent Classification
// ============================================================

import {
  SemanticAnalysis,
  Intent,
  IntentType,
  Classification
} from '../types';
import { ComponentGraph } from '../knowledge/ComponentGraph';

/**
 * Simple Naive Bayes classifier implementation
 * This can be replaced with a more sophisticated classifier
 */
class NaiveBayesClassifier {
  private wordCounts: Map<string, Map<string, number>>;
  private classCounts: Map<string, number>;
  private vocabulary: Set<string>;
  private totalDocuments: number;

  constructor() {
    this.wordCounts = new Map();
    this.classCounts = new Map();
    this.vocabulary = new Set();
    this.totalDocuments = 0;
  }

  addDocument(text: string, label: string): void {
    const words = this.tokenize(text);

    // Update class count
    this.classCounts.set(label, (this.classCounts.get(label) || 0) + 1);
    this.totalDocuments++;

    // Initialize word counts for this class if needed
    if (!this.wordCounts.has(label)) {
      this.wordCounts.set(label, new Map());
    }
    const classWords = this.wordCounts.get(label)!;

    // Update word counts
    for (const word of words) {
      this.vocabulary.add(word);
      classWords.set(word, (classWords.get(word) || 0) + 1);
    }
  }

  train(): void {
    // Training happens incrementally with addDocument
    // This method exists for API compatibility
  }

  retrain(): void {
    // Re-calculate probabilities if needed
    // For our implementation, this is a no-op
  }

  classify(text: string): string {
    const classifications = this.getClassifications(text);
    return classifications[0]?.label || 'unknown';
  }

  getClassifications(text: string): Classification[] {
    const words = this.tokenize(text);
    const scores: Classification[] = [];

    for (const [label, classCount] of this.classCounts) {
      const logProb = this.calculateLogProbability(words, label, classCount);
      scores.push({ label, value: Math.exp(logProb) });
    }

    // Normalize scores
    const total = scores.reduce((sum, s) => sum + s.value, 0);
    if (total > 0) {
      scores.forEach(s => s.value /= total);
    }

    // Sort by score descending
    return scores.sort((a, b) => b.value - a.value);
  }

  private calculateLogProbability(words: string[], label: string, classCount: number): number {
    const classWords = this.wordCounts.get(label) || new Map();
    const totalWordsInClass = Array.from(classWords.values()).reduce((a, b) => a + b, 0);
    const vocabSize = this.vocabulary.size;

    // Prior probability
    let logProb = Math.log(classCount / this.totalDocuments);

    // Likelihood with Laplace smoothing
    for (const word of words) {
      const wordCount = classWords.get(word) || 0;
      const probability = (wordCount + 1) / (totalWordsInClass + vocabSize);
      logProb += Math.log(probability);
    }

    return logProb;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  toJSON(): string {
    return JSON.stringify({
      wordCounts: Array.from(this.wordCounts.entries()).map(([k, v]) => [k, Array.from(v.entries())]),
      classCounts: Array.from(this.classCounts.entries()),
      vocabulary: Array.from(this.vocabulary),
      totalDocuments: this.totalDocuments
    });
  }

  fromJSON(json: string): void {
    const data = JSON.parse(json);
    this.wordCounts = new Map(data.wordCounts.map(([k, v]: [string, [string, number][]]) => [k, new Map(v)]));
    this.classCounts = new Map(data.classCounts);
    this.vocabulary = new Set(data.vocabulary);
    this.totalDocuments = data.totalDocuments;
  }
}

/**
 * IntentResolver determines what the user wants to do
 * based on semantic analysis of their prompt.
 */
export class IntentResolver {
  private classifier: NaiveBayesClassifier;
  private _knowledge!: ComponentGraph;
  private trained: boolean = false;
  private storageKey = 'prompt_engine_intent_classifier';

  constructor() {
    this.classifier = new NaiveBayesClassifier();
  }

  /**
   * Initialize with knowledge base
   */
  async initialize(knowledge: ComponentGraph): Promise<void> {
    this._knowledge = knowledge;

    // Train with base examples
    await this.trainBaseIntents();

    // Load saved training if available
    await this.loadSavedTraining();

    this.trained = true;
  }

  /**
   * Train with base intent examples
   */
  private async trainBaseIntents(): Promise<void> {
    const trainingData: Array<{ text: string; intent: IntentType }> = [
      // CREATE_COMPONENT intent
      { text: 'create a button', intent: 'create_component' },
      { text: 'make a card', intent: 'create_component' },
      { text: 'add a form', intent: 'create_component' },
      { text: 'generate input field', intent: 'create_component' },
      { text: 'build a modal', intent: 'create_component' },
      { text: 'i need a dropdown', intent: 'create_component' },
      { text: 'give me a table', intent: 'create_component' },
      { text: 'add button', intent: 'create_component' },
      { text: 'create input', intent: 'create_component' },
      { text: 'make text field', intent: 'create_component' },
      { text: 'generate a checkbox', intent: 'create_component' },
      { text: 'i want a slider', intent: 'create_component' },
      { text: 'need a progress bar', intent: 'create_component' },
      { text: 'show me a tooltip', intent: 'create_component' },
      { text: 'primary button', intent: 'create_component' },
      { text: 'large red button', intent: 'create_component' },
      { text: 'small card with shadow', intent: 'create_component' },
      { text: 'danger button', intent: 'create_component' },
      { text: 'outlined input', intent: 'create_component' },

      // CREATE_LAYOUT intent
      { text: 'create a two column layout', intent: 'create_layout' },
      { text: 'make a grid with 3 columns', intent: 'create_layout' },
      { text: 'sidebar layout', intent: 'create_layout' },
      { text: 'arrange in rows', intent: 'create_layout' },
      { text: 'stack vertically', intent: 'create_layout' },
      { text: 'horizontal layout', intent: 'create_layout' },
      { text: 'flex container', intent: 'create_layout' },
      { text: 'grid layout', intent: 'create_layout' },
      { text: 'three column grid', intent: 'create_layout' },
      { text: 'centered layout', intent: 'create_layout' },
      { text: 'responsive grid', intent: 'create_layout' },
      { text: 'masonry layout', intent: 'create_layout' },
      { text: 'split view', intent: 'create_layout' },
      { text: 'side by side', intent: 'create_layout' },
      { text: 'column layout', intent: 'create_layout' },
      { text: 'row layout', intent: 'create_layout' },

      // CREATE_PAGE intent
      { text: 'create a landing page', intent: 'create_page' },
      { text: 'build a dashboard', intent: 'create_page' },
      { text: 'make a login page', intent: 'create_page' },
      { text: 'generate settings page', intent: 'create_page' },
      { text: 'i need a profile page', intent: 'create_page' },
      { text: 'home page', intent: 'create_page' },
      { text: 'about page', intent: 'create_page' },
      { text: 'contact page', intent: 'create_page' },
      { text: 'signup page', intent: 'create_page' },
      { text: 'registration form page', intent: 'create_page' },
      { text: 'pricing page', intent: 'create_page' },
      { text: 'checkout page', intent: 'create_page' },
      { text: 'user dashboard', intent: 'create_page' },
      { text: 'admin panel', intent: 'create_page' },
      { text: 'error page', intent: 'create_page' },
      { text: '404 page', intent: 'create_page' },

      // MODIFY intent
      { text: 'change the color', intent: 'modify' },
      { text: 'make it larger', intent: 'modify' },
      { text: 'add an icon', intent: 'modify' },
      { text: 'update the variant', intent: 'modify' },
      { text: 'set size to large', intent: 'modify' },
      { text: 'change to primary', intent: 'modify' },
      { text: 'make it smaller', intent: 'modify' },
      { text: 'add padding', intent: 'modify' },
      { text: 'remove border', intent: 'modify' },
      { text: 'change background', intent: 'modify' },
      { text: 'update style', intent: 'modify' },
      { text: 'modify props', intent: 'modify' },
      { text: 'edit the button', intent: 'modify' },
      { text: 'adjust spacing', intent: 'modify' },
      { text: 'increase margin', intent: 'modify' },

      // COMBINE intent
      { text: 'button inside a card', intent: 'combine' },
      { text: 'form with inputs and button', intent: 'combine' },
      { text: 'card containing image and text', intent: 'combine' },
      { text: 'navbar with logo and links', intent: 'combine' },
      { text: 'modal with form', intent: 'combine' },
      { text: 'card with button and image', intent: 'combine' },
      { text: 'sidebar with navigation', intent: 'combine' },
      { text: 'header with logo', intent: 'combine' },
      { text: 'form containing inputs', intent: 'combine' },
      { text: 'container with children', intent: 'combine' },
      { text: 'list with items', intent: 'combine' },
      { text: 'table with rows', intent: 'combine' },
      { text: 'dropdown in form', intent: 'combine' },
      { text: 'icon button with text', intent: 'combine' },

      // QUERY intent
      { text: 'what components do you have', intent: 'query' },
      { text: 'show me button variants', intent: 'query' },
      { text: 'list all layouts', intent: 'query' },
      { text: 'what can you create', intent: 'query' },
      { text: 'help', intent: 'query' },
      { text: 'what options are available', intent: 'query' },
      { text: 'show available sizes', intent: 'query' },
      { text: 'list components', intent: 'query' },
      { text: 'what variants exist', intent: 'query' },
      { text: 'how do i use', intent: 'query' },
      { text: 'explain button', intent: 'query' },
      { text: 'describe card component', intent: 'query' },
    ];

    // Train classifier
    trainingData.forEach(({ text, intent }) => {
      this.classifier.addDocument(text, intent);
    });

    this.classifier.train();
  }

  /**
   * Resolve intent from semantic analysis
   */
  async resolve(semantics: SemanticAnalysis): Promise<Intent> {
    if (!this.trained) {
      throw new Error('IntentResolver not trained');
    }

    // Build text for classification
    const text = [
      ...semantics.grammar.verbs,
      ...semantics.grammar.nouns,
      ...semantics.grammar.adjectives
    ].join(' ');

    // Get classification
    const classifications = this.classifier.getClassifications(text);
    const primary = classifications[0] || { label: 'unknown', value: 0 };

    // Refine based on semantic analysis
    const refined = this.refineIntent(
      { label: primary.label as IntentType, value: primary.value },
      semantics
    );

    return {
      type: refined.intent,
      confidence: refined.confidence,
      subtype: this.getSubtype(refined.intent, semantics),
      alternatives: classifications.slice(1, 3)
    };
  }

  /**
   * Refine intent based on semantic evidence
   */
  private refineIntent(
    classification: { label: IntentType; value: number },
    semantics: SemanticAnalysis
  ): { intent: IntentType; confidence: number } {
    let intent = classification.label;
    let confidence = classification.value;

    const { roles, relationships, domainMeaning } = semantics;

    // Boost confidence if semantic roles align
    if (intent === 'create_component' && roles.target?.resolved) {
      confidence = Math.min(confidence + 0.2, 1);
    }

    if (intent === 'create_layout' && relationships.some(r => r.type === 'layout')) {
      confidence = Math.min(confidence + 0.2, 1);
    }

    // Override intent based on strong semantic signals
    if (intent === 'create_component' && domainMeaning.layout) {
      intent = 'create_layout';
    }

    // Containment relationships suggest combining
    if (relationships.some(r => r.type === 'contains')) {
      if (confidence < 0.7 || intent === 'create_component') {
        intent = 'combine';
        confidence = Math.max(confidence, 0.7);
      }
    }

    // Multiple components suggest combining
    if (domainMeaning.components.length > 1 && intent === 'create_component') {
      intent = 'combine';
    }

    // Page-related nouns
    const pageKeywords = ['page', 'dashboard', 'landing', 'login', 'signup', 'home', 'profile', 'settings'];
    if (semantics.grammar.nouns.some(n => pageKeywords.includes(n.toLowerCase()))) {
      intent = 'create_page';
      confidence = Math.max(confidence, 0.8);
    }

    return { intent, confidence };
  }

  /**
   * Get intent subtype for more specific handling
   */
  private getSubtype(intent: IntentType, semantics: SemanticAnalysis): string | null {
    switch (intent) {
      case 'create_component':
        return semantics.roles.target?.text || null;

      case 'create_layout':
        if (semantics.grammar.nouns.includes('grid')) return 'grid';
        if (semantics.grammar.nouns.includes('flex')) return 'flex';
        if (semantics.grammar.nouns.some(n => n.includes('column'))) return 'columns';
        if (semantics.grammar.nouns.some(n => n.includes('row'))) return 'rows';
        return 'auto';

      case 'create_page':
        const pageTypes = ['landing', 'dashboard', 'login', 'settings', 'profile', 'home', 'about', 'contact'];
        return pageTypes.find(p =>
          semantics.grammar.nouns.some(n => n.toLowerCase().includes(p))
        ) || 'custom';

      case 'modify':
        return semantics.grammar.verbs[0] || 'update';

      case 'combine':
        return 'nested';

      case 'query':
        return 'info';

      default:
        return null;
    }
  }

  /**
   * Add a training example
   */
  async addTrainingExample(prompt: string, intent: IntentType): Promise<void> {
    this.classifier.addDocument(prompt, intent);
    this.classifier.retrain();

    // Save to storage
    await this.saveTraining();
  }

  /**
   * Save training state
   */
  private async saveTraining(): Promise<void> {
      // No-op: Engine handles persistence via TrainingStore
    // try {
    //   if (typeof localStorage !== 'undefined') {
    //     localStorage.setItem(this.storageKey, this.classifier.toJSON());
    //   }
    // } catch (error) {
    //   console.warn('Could not save training data:', error);
    // }
  }

  /**
   * Load saved training
   */
  private async loadSavedTraining(): Promise<void> {
      // No-op: Engine handles persistence via TrainingStore
    // try {
    //   if (typeof localStorage !== 'undefined') {
    //     const saved = localStorage.getItem(this.storageKey);
    //     if (saved) {
    //       // We could merge here, but for simplicity we just note it exists
    //       console.log('Found saved training data');
    //     }
    //   }
    // } catch (error) {
    //   console.warn('Could not load saved training:', error);
    // }
  }

  /**
   * Reset classifier to base training
   */
  async reset(): Promise<void> {
    this.classifier = new NaiveBayesClassifier();
    await this.trainBaseIntents();

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn('Could not clear saved training:', error);
    }
  }

  /**
   * Export training data
   */
  exportTraining(): string {
    return this.classifier.toJSON();
  }

  /**
   * Import training data
   */
  importTraining(json: string): void {
    this.classifier.fromJSON(json);
  }
}

export default IntentResolver;
