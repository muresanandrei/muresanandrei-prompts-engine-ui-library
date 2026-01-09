// ============================================================
// SEMANTIC ANALYZER - NLP Understanding
// ============================================================

import {
  TokenizedResult,
  SemanticAnalysis,
  GrammarAnalysis,
  SemanticRoles,
  DomainMeaning,
  Relationship,
  ResolvedComponent,
  ResolvedModifier,
} from '../types';
import { ComponentGraph } from '../knowledge/ComponentGraph';

/**
 *  performs deep linguistic analysis on tokenized input.
 * It understands grammar, semantic roles, and maps everything to your
 * UI kit's domain.
 */
export class SemanticAnalyzer {
  private knowledge!: ComponentGraph;
  private wordVectors: Map<string, number[]>;
  private synonymGraph: Map<string, string>;
  private initialized: boolean = false;

  // Grammar patterns
  private actionVerbs: Set<string>;
  private modifierWords: Record<string, string[]>;
  private prepositions: string[];

  constructor() {
    this.wordVectors = new Map();
    this.synonymGraph = new Map();

    // Action verbs that indicate intent
    this.actionVerbs = new Set([
      'create', 'make', 'build', 'generate', 'add', 'insert',
      'show', 'display', 'render', 'put', 'place',
      'arrange', 'layout', 'organize', 'stack', 'align',
      'change', 'modify', 'update', 'set', 'edit',
      'remove', 'delete', 'hide', 'clear',
      'need', 'want', 'give', 'get'
    ]);

    // Modifier categories
    this.modifierWords = {
      variants: [
        'primary', 'secondary', 'tertiary',
        'ghost', 'outline', 'solid', 'link',
        'danger', 'warning', 'success', 'info', 'error',
        'default', 'subtle', 'prominent'
      ],
      sizes: [
        'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl',
        'tiny', 'small', 'medium', 'large', 'big', 'huge',
        'extra small', 'extra large'
      ],
      states: [
        'disabled', 'enabled', 'loading', 'active', 'inactive',
        'focused', 'hovered', 'pressed', 'selected', 'checked',
        'error', 'valid', 'invalid', 'readonly'
      ],
      positions: [
        'left', 'right', 'top', 'bottom', 'center',
        'start', 'end', 'between', 'around', 'evenly'
      ]
    };

    // Prepositions for relationship detection
    this.prepositions = [
      'in', 'inside', 'within', 'into',
      'on', 'onto', 'upon',
      'with', 'without',
      'beside', 'next to', 'near',
      'above', 'over', 'below', 'under', 'beneath',
      'between', 'among',
      'around', 'through',
      'for', 'as'
    ];
  }

  /**
   * Initialize with knowledge base
   */
  async initialize(knowledge: ComponentGraph): Promise<void> {
    this.knowledge = knowledge;

    // Build word vectors from knowledge base
    await this.buildWordVectors();

    // Build synonym graph
    this.buildSynonymGraph();

    this.initialized = true;
  }

  /**
   * Main analysis method
   */
  async analyze(tokens: TokenizedResult): Promise<SemanticAnalysis> {
    if (!this.initialized) {
      throw new Error(' not initialized');
    }

    // Grammatical analysis
    const grammar = this.analyzeGrammar(tokens);

    // Extract semantic roles
    const roles = this.extractSemanticRoles(tokens, grammar);

    // Map to domain
    const domainMeaning = this.mapToDomain(grammar, roles);

    // Extract relationships
    const relationships = this.extractRelationships(tokens);

    // Get embeddings
    const embeddings = this.getEmbeddings(tokens);

    return {
      grammar,
      roles,
      domainMeaning,
      relationships,
      normalized: tokens.normalized,
      embeddings
    };
  }

 /**
 * Analyze grammatical structure
 */
private analyzeGrammar(tokens: TokenizedResult): GrammarAnalysis {
    const words = tokens.words;
  const original = tokens.original.toLowerCase();

  const nouns: string[] = [];
  const verbs: string[] = [];
  const adjectives: string[] = [];
  const numbers: string[] = [];

  // Stop words - never treat as components
  const stopWords = new Set([
    'a', 'an', 'the', 'to', 'of', 'for', 'and', 'or', 
    'is', 'are', 'it', 'this', 'that', 'with', 'in', 
    'on', 'at', 'by', 'from', 'as', 'into', 'like'
  ]);

  for (const word of words) {
    const lower = word.toLowerCase();

    // 1. Skip stop words entirely
    if (stopWords.has(lower)) {
      continue;
    }

    // 2. Check if it's a number
    if (this.isNumber(lower)) {
      numbers.push(lower);
      continue;
    }

    // 3. Check if it's a verb - BEFORE component check
    if (this.actionVerbs.has(lower) || this.actionVerbs.has(this.getStem(lower))) {
      verbs.push(lower);
      continue;
    }

    // 4. Check if it's a modifier/adjective
    if (this.isModifier(lower)) {
      adjectives.push(lower);
      continue;
    }

    // 5. Check for EXACT component match
    const exactMatch = this.knowledge.findComponent(lower);
    if (exactMatch) {
      nouns.push(lower);
      continue;
    }

    // 6. Check for plural form - convert to singular and try again
    const singular = this.getSingular(lower);
    if (singular !== lower) {
      const singularMatch = this.knowledge.findComponent(singular);
      if (singularMatch) {
        nouns.push(singular);
        continue;
      }
    }

    // 7. Check synonyms
    const synonym = this.synonymGraph.get(lower);
    if (synonym && this.knowledge.findComponent(synonym)) {
      nouns.push(lower);
      continue;
    }

    // 8. Last resort: context-based classification
    const pattern = new RegExp(`(?:a|an|the)\\s+${lower}`, 'i');
    if (pattern.test(original)) {
      const fuzzy = this.knowledge.fuzzyFindComponent(lower);
      if (fuzzy && fuzzy.score > 0.8) {
        nouns.push(lower);
      }
    }
  }

  // Extract prepositions
  const prepositions = this.extractPrepositions(original);

  return { nouns, verbs, adjectives, numbers, prepositions };
}

/**
 * Get singular form of a word
 */
private getSingular(word: string): string {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y'; // e.g., "entries" -> "entry"
  }
  if (word.endsWith('es')) {
    return word.slice(0, -2); // e.g., "boxes" -> "box"
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1); // e.g., "buttons" -> "button"
  }
  return word;
}

  /**
   * Extract semantic roles (who does what to whom)
   */
  private extractSemanticRoles(tokens: TokenizedResult, grammar: GrammarAnalysis): SemanticRoles {
    const roles: SemanticRoles = {
      action: null,
      target: null,
      modifiers: [],
      additions: [],
      quantity: 1,
      container: null
    };

    // Find action
    if (grammar.verbs.length > 0) {
      roles.action = this.normalizeAction(grammar.verbs[0]);
    } else {
      // Default action if no verb found
      roles.action = 'create';
    }

    // Find target (main noun - usually the component)
    if (grammar.nouns.length > 0) {
      roles.target = this.resolveComponent(grammar.nouns[0]);

      // Other nouns are additions or containers
      for (let i = 1; i < grammar.nouns.length; i++) {
        const resolved = this.resolveComponent(grammar.nouns[i]);
        if (resolved.isContainer) {
          roles.container = resolved;
        } else {
          roles.additions.push(resolved);
        }
      }
    }

    // Map adjectives to modifiers
    roles.modifiers = grammar.adjectives.map(adj => this.resolveModifier(adj));

    // Extract quantity from numbers
    if (grammar.numbers.length > 0) {
      roles.quantity = this.parseQuantity(grammar.numbers[0]);
    }

    // Check for quantity words in original text
    const quantityMatch = tokens.original.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s/i);
    if (quantityMatch) {
      roles.quantity = this.parseQuantity(quantityMatch[1]);
    }

    return roles;
  }

  /**
   * Map semantic understanding to domain (your UI kit)
   */
  private mapToDomain(_grammar: GrammarAnalysis, roles: SemanticRoles): DomainMeaning {
    const meaning: DomainMeaning = {
      components: [],
      props: {},
      layout: null,
      variant: null,
      size: null
    };

    // Map target to component
    if (roles.target?.resolved) {
      meaning.components.push({
        ...roles.target.resolved,
        confidence: roles.target.confidence
      });
    }

    // Map additions
    roles.additions.forEach(addition => {
      if (addition.resolved) {
        meaning.components.push({
          ...addition.resolved,
          confidence: addition.confidence
        });
      }
    });

    // Map modifiers to props
    roles.modifiers.forEach(mod => {
      if (mod.type === 'variant') {
        meaning.variant = mod.text;
        meaning.props['variant'] = mod.text;
      } else if (mod.type === 'size') {
        meaning.size = mod.text;
        meaning.props['size'] = mod.text;
      } else if (mod.type === 'state') {
        meaning.props[mod.text] = true;
      }
    });

    // Detect layout from context
    if (roles.container?.resolved) {
      const containerName = roles.container.resolved.name;
      const layout = this.knowledge.getLayoutTemplate(containerName);
      if (layout) {
        meaning.layout = layout;
      }
    }

    return meaning;
  }

  /**
   * Extract relationships between entities
   */
  private extractRelationships(tokens: TokenizedResult): Relationship[] {
    const relationships: Relationship[] = [];
    const text = tokens.original.toLowerCase();

    // Containment patterns
    const containmentPatterns = [
      /(\w+)\s+(?:inside|within|in)\s+(?:a\s+)?(\w+)/gi,
      /(\w+)\s+containing\s+(?:a\s+)?(\w+)/gi,
      /(\w+)\s+with\s+(?:a\s+)?(\w+)/gi
    ];

    containmentPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        relationships.push({
          type: 'contains',
          subject: match[2], // container
          object: match[1]   // contained
        });
      }
    });

    // Sibling patterns
    const siblingPattern = /(\w+)\s+(?:and|,)\s+(?:a\s+)?(\w+)/gi;
    let match;
    while ((match = siblingPattern.exec(text)) !== null) {
      relationships.push({
        type: 'sibling',
        subject: match[1],
        object: match[2]
      });
    }

    // Layout patterns
    const layoutPatterns = [
      { pattern: /(\d+)\s*columns?/i, type: 'layout' as const },
      { pattern: /grid\s+of\s+(\d+)/i, type: 'layout' as const },
      { pattern: /(\w+)\s+layout/i, type: 'layout' as const }
    ];

    layoutPatterns.forEach(({ pattern, type }) => {
      const layoutMatch = text.match(pattern);
      if (layoutMatch) {
        relationships.push({
          type,
          subject: 'layout',
          object: layoutMatch[1]
        });
      }
    });

    return relationships;
  }

  /**
   * Resolve a word to a component
   */
  private resolveComponent(word: string): ResolvedComponent {
    const text = word.toLowerCase();

    // Direct match
    let resolved = this.knowledge.findComponent(text);
    if (resolved) {
      return {
        text,
        resolved,
        confidence: 1.0,
        isContainer: resolved.isContainer
      };
    }

    // Synonym match
    const synonym = this.synonymGraph.get(text);
    if (synonym) {
      resolved = this.knowledge.findComponent(synonym);
      if (resolved) {
        return {
          text: synonym,
          resolved,
          confidence: 0.9,
          isContainer: resolved.isContainer
        };
      }
    }

    // Fuzzy match
    const fuzzy = this.knowledge.fuzzyFindComponent(text);
    if (fuzzy && fuzzy.score > 0.5) {
      return {
        text: fuzzy.name,
        resolved: fuzzy,
        confidence: fuzzy.score,
        isContainer: fuzzy.isContainer
      };
    }

    return {
      text,
      resolved: null,
      confidence: 0,
      isContainer: false
    };
  }

  /**
   * Resolve a modifier word
   */
  private resolveModifier(word: string): ResolvedModifier {
    const text = word.toLowerCase();
    const synonym = this.synonymGraph.get(text) || text;

    return {
      text: this.normalizeModifier(synonym),
      original: text,
      type: this.classifyModifier(synonym)
    };
  }

  /**
   * Classify what type of modifier a word is
   */
  private classifyModifier(text: string): 'variant' | 'size' | 'state' | 'style' {
    if (this.modifierWords.variants.includes(text)) return 'variant';
    if (this.modifierWords.sizes.includes(text)) return 'size';
    if (this.modifierWords.states.includes(text)) return 'state';
    return 'style';
  }

  /**
   * Normalize modifier to standard form
   */
  private normalizeModifier(text: string): string {
    const sizeMap: Record<string, string> = {
      'tiny': 'xs',
      'extra small': 'xs',
      'small': 'sm',
      'medium': 'md',
      'large': 'lg',
      'big': 'lg',
      'huge': 'xl',
      'extra large': 'xl'
    };

    return sizeMap[text] || text;
  }

  /**
   * Normalize action verb
   */
  private normalizeAction(verb: string): string {
    const actionMap: Record<string, string> = {
      'create': 'create',
      'make': 'create',
      'build': 'create',
      'generate': 'create',
      'add': 'create',
      'insert': 'create',
      'need': 'create',
      'want': 'create',
      'give': 'create',
      'get': 'create',
      'show': 'display',
      'display': 'display',
      'render': 'display',
      'put': 'place',
      'place': 'place',
      'arrange': 'layout',
      'layout': 'layout',
      'organize': 'layout',
      'stack': 'layout',
      'align': 'layout',
      'change': 'modify',
      'modify': 'modify',
      'update': 'modify',
      'set': 'modify',
      'edit': 'modify',
      'remove': 'delete',
      'delete': 'delete',
      'hide': 'delete',
      'clear': 'delete'
    };

    return actionMap[verb.toLowerCase()] || verb.toLowerCase();
  }

  /**
   * Extract prepositions and their objects
   */
  private extractPrepositions(text: string): Array<{ prep: string; object: string }> {
    const found: Array<{ prep: string; object: string }> = [];

    // Sort by length to match longer phrases first
    const sortedPreps = [...this.prepositions].sort((a, b) => b.length - a.length);

    for (const prep of sortedPreps) {
      const pattern = new RegExp(`${prep}\\s+(?:a\\s+|an\\s+|the\\s+)?(\\w+)`, 'gi');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        found.push({
          prep,
          object: match[1]
        });
      }
    }

    return found;
  }

  /**
   * Check if a word is a modifier
   */
  private isModifier(word: string): boolean {
    const lower = word.toLowerCase();
    return Object.values(this.modifierWords).some(list => list.includes(lower));
  }

  /**
   * Check if a word is a number
   */
  private isNumber(word: string): boolean {
    const numberWords = [
      'one', 'two', 'three', 'four', 'five',
      'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'first', 'second', 'third'
    ];
    return numberWords.includes(word) || /^\d+$/.test(word);
  }

  /**
   * Parse quantity from text
   */
  private parseQuantity(text: string): number {
    const wordNums: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'first': 1, 'second': 2, 'third': 3
    };

    const lower = text.toLowerCase();
    return wordNums[lower] || parseInt(text) || 1;
  }

  /**
   * Get basic stem of a word
   */
  private getStem(word: string): string {
    const suffixes = ['ing', 'ed', 'es', 's', 'ly'];
    let stem = word.toLowerCase();

    for (const suffix of suffixes) {
      if (stem.endsWith(suffix) && stem.length > suffix.length + 2) {
        stem = stem.slice(0, -suffix.length);
        break;
      }
    }

    return stem;
  }

  /**
   * Build word vectors from knowledge base
   */
  private async buildWordVectors(): Promise<void> {
    const allTerms = this.knowledge.getAllTerms();
    const vectorSize = 100;

    for (const term of allTerms) {
      const vector = new Array(vectorSize).fill(0);

      // Category features (0-19)
      const categories = ['layout', 'input', 'display', 'navigation', 'feedback', 'container', 'misc'];
      const category = this.knowledge.getCategory(term);
      if (category) {
        const idx = categories.indexOf(category);
        if (idx >= 0 && idx < 20) {
          vector[idx] = 1;
        }
      }

      // Related props (20-49)
      const props = this.knowledge.getRelatedProps(term);
      props.forEach((_prop, i) => {
        if (i < 30) vector[20 + i] = 1;
      });

      // Co-occurrence features (50-99)
      const coTerms = this.knowledge.getCoOccurrences(term);
      coTerms.forEach((co, i) => {
        if (i < 50) vector[50 + i] = co.weight;
      });

      this.wordVectors.set(term.toLowerCase(), vector);
    }
  }

  /**
   * Build synonym graph
   */
  private buildSynonymGraph(): void {
    const synonyms = this.knowledge.getSynonyms();
    Object.entries(synonyms).forEach(([from, to]) => {
      this.synonymGraph.set(from, to);
    });

    // Add modifier synonyms
    const modifierSynonyms: Record<string, string> = {
      'big': 'large',
      'huge': 'xl',
      'small': 'sm',
      'tiny': 'xs',
      'main': 'primary',
      'alt': 'secondary',
      'warning': 'danger',
      'error': 'danger'
    };

    Object.entries(modifierSynonyms).forEach(([from, to]) => {
      if (!this.synonymGraph.has(from)) {
        this.synonymGraph.set(from, to);
      }
    });
  }

  /**
   * Get embeddings for tokens
   */
  private getEmbeddings(tokens: TokenizedResult): number[][] {
    return tokens.words.map(word => {
      const lower = word.toLowerCase();
      return this.wordVectors.get(lower) || new Array(100).fill(0);
    });
  }

  /**
   * Calculate similarity between two words
   */
  similarity(word1: string, word2: string): number {
    const v1 = this.wordVectors.get(word1.toLowerCase());
    const v2 = this.wordVectors.get(word2.toLowerCase());

    if (!v1 || !v2) return 0;

    // Cosine similarity
    let dot = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator > 0 ? dot / denominator : 0;
  }

  /**
   * Add training example
   */
  async addTrainingExample(prompt: string, expected: any): Promise<void> {
    // This would store examples for retraining
    // Implementation depends on your storage strategy
    console.log('Training example added:', { prompt, expected });
  }
}