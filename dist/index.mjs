// src/core/Engine.ts
import { EventEmitter as EventEmitter2 } from "eventemitter3";

// src/core/Lexer.ts
var Lexer = class {
  constructor() {
    this.commonPhrases = [
      // Layout phrases
      "two column",
      "three column",
      "four column",
      "full width",
      "half width",
      "side by side",
      "on top of",
      "next to",
      "below the",
      "above the",
      // Component phrases
      "text field",
      "text input",
      "text area",
      "drop down",
      "date picker",
      "color picker",
      "check box",
      "radio button",
      "toggle switch",
      "progress bar",
      "loading spinner",
      "nav bar",
      "navigation bar",
      "side bar",
      "tool tip",
      "pop over",
      "modal dialog",
      // Page phrases
      "landing page",
      "home page",
      "login page",
      "sign up",
      "sign in",
      "log in",
      "log out",
      "contact form",
      "search bar",
      // Modifier phrases
      "with icon",
      "without icon",
      "full screen",
      "fixed position",
      "scroll area",
      "overflow hidden"
    ];
    this.stopWords = /* @__PURE__ */ new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
      "can",
      "need",
      "dare",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "also",
      "now",
      "please",
      "thanks",
      "want",
      "like",
      "need",
      "me",
      "i",
      "my"
    ]);
  }
  /**
   * Main tokenization method
   */
  tokenize(input) {
    const original = input.trim();
    const lowercased = original.toLowerCase();
    const { text: processedText, phrases } = this.extractPhrases(lowercased);
    const words = this.splitIntoWords(processedText);
    const allTokens = [...phrases, ...words];
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
  extractPhrases(text) {
    let processedText = text;
    const foundPhrases = [];
    const sortedPhrases = [...this.commonPhrases].sort((a, b) => b.length - a.length);
    for (const phrase of sortedPhrases) {
      if (processedText.includes(phrase)) {
        foundPhrases.push(phrase);
        processedText = processedText.replace(phrase, " __PHRASE__ ");
      }
    }
    processedText = processedText.replace(/__PHRASE__/g, "");
    return { text: processedText, phrases: foundPhrases };
  }
  /**
   * Split text into individual words
   */
  splitIntoWords(text) {
    return text.replace(/[^\w\s-]/g, " ").split(/\s+/).filter((word) => word.length > 0).filter((word) => word !== "-");
  }
  /**
   * Normalize tokens by removing stop words and applying basic stemming
   */
  normalize(tokens) {
    return tokens.map((token) => token.toLowerCase()).filter((token) => !this.stopWords.has(token)).map((token) => this.basicStem(token));
  }
  /**
   * Very basic stemming - just handles common suffixes
   * For production, use a proper stemmer like Porter Stemmer
   */
  basicStem(word) {
    const suffixes = [
      { suffix: "ing", minLength: 5 },
      { suffix: "ed", minLength: 4 },
      { suffix: "es", minLength: 4 },
      { suffix: "s", minLength: 4 },
      { suffix: "ly", minLength: 5 },
      { suffix: "ment", minLength: 6 },
      { suffix: "ness", minLength: 6 },
      { suffix: "tion", minLength: 6 },
      { suffix: "able", minLength: 6 },
      { suffix: "ible", minLength: 6 }
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
  addPhrase(phrase) {
    if (!this.commonPhrases.includes(phrase.toLowerCase())) {
      this.commonPhrases.push(phrase.toLowerCase());
    }
  }
  /**
   * Add multiple phrases at once
   */
  addPhrases(phrases) {
    phrases.forEach((phrase) => this.addPhrase(phrase));
  }
  /**
   * Check if a word is a stop word
   */
  isStopWord(word) {
    return this.stopWords.has(word.toLowerCase());
  }
  /**
   * Get all recognized phrases
   */
  getPhrases() {
    return [...this.commonPhrases];
  }
};

// src/core/SemanticAnalyzer.ts
var SemanticAnalyzer = class {
  constructor() {
    this.initialized = false;
    this.wordVectors = /* @__PURE__ */ new Map();
    this.synonymGraph = /* @__PURE__ */ new Map();
    this.actionVerbs = /* @__PURE__ */ new Set([
      "create",
      "make",
      "build",
      "generate",
      "add",
      "insert",
      "show",
      "display",
      "render",
      "put",
      "place",
      "arrange",
      "layout",
      "organize",
      "stack",
      "align",
      "change",
      "modify",
      "update",
      "set",
      "edit",
      "remove",
      "delete",
      "hide",
      "clear",
      "need",
      "want",
      "give",
      "get"
    ]);
    this.modifierWords = {
      variants: [
        "primary",
        "secondary",
        "tertiary",
        "ghost",
        "outline",
        "solid",
        "link",
        "danger",
        "warning",
        "success",
        "info",
        "error",
        "default",
        "subtle",
        "prominent"
      ],
      sizes: [
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
        "3xl",
        "tiny",
        "small",
        "medium",
        "large",
        "big",
        "huge",
        "extra small",
        "extra large"
      ],
      states: [
        "disabled",
        "enabled",
        "loading",
        "active",
        "inactive",
        "focused",
        "hovered",
        "pressed",
        "selected",
        "checked",
        "error",
        "valid",
        "invalid",
        "readonly"
      ],
      positions: [
        "left",
        "right",
        "top",
        "bottom",
        "center",
        "start",
        "end",
        "between",
        "around",
        "evenly"
      ]
    };
    this.prepositions = [
      "in",
      "inside",
      "within",
      "into",
      "on",
      "onto",
      "upon",
      "with",
      "without",
      "beside",
      "next to",
      "near",
      "above",
      "over",
      "below",
      "under",
      "beneath",
      "between",
      "among",
      "around",
      "through",
      "for",
      "as"
    ];
  }
  /**
   * Initialize with knowledge base
   */
  async initialize(knowledge) {
    this.knowledge = knowledge;
    await this.buildWordVectors();
    this.buildSynonymGraph();
    this.initialized = true;
  }
  /**
   * Main analysis method
   */
  async analyze(tokens) {
    if (!this.initialized) {
      throw new Error(" not initialized");
    }
    const grammar = this.analyzeGrammar(tokens);
    const roles = this.extractSemanticRoles(tokens, grammar);
    const domainMeaning = this.mapToDomain(grammar, roles);
    const relationships = this.extractRelationships(tokens);
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
  analyzeGrammar(tokens) {
    const words = tokens.words;
    const original = tokens.original.toLowerCase();
    const nouns = [];
    const verbs = [];
    const adjectives = [];
    const numbers = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (this.isNumber(lower)) {
        numbers.push(lower);
        continue;
      }
      if (this.actionVerbs.has(lower) || this.actionVerbs.has(this.getStem(lower))) {
        verbs.push(lower);
        continue;
      }
      if (this.isModifier(lower)) {
        adjectives.push(lower);
        continue;
      }
      if (this.knowledge.findComponent(lower) || this.knowledge.fuzzyFindComponent(lower)) {
        nouns.push(lower);
        continue;
      }
      const pattern = new RegExp(`(?:a|an|the)\\s+${lower}`, "i");
      if (pattern.test(original)) {
        nouns.push(lower);
      }
    }
    const prepositions = this.extractPrepositions(original);
    return { nouns, verbs, adjectives, numbers, prepositions };
  }
  /**
   * Extract semantic roles (who does what to whom)
   */
  extractSemanticRoles(tokens, grammar) {
    const roles = {
      action: null,
      target: null,
      modifiers: [],
      additions: [],
      quantity: 1,
      container: null
    };
    if (grammar.verbs.length > 0) {
      roles.action = this.normalizeAction(grammar.verbs[0]);
    } else {
      roles.action = "create";
    }
    if (grammar.nouns.length > 0) {
      roles.target = this.resolveComponent(grammar.nouns[0]);
      for (let i = 1; i < grammar.nouns.length; i++) {
        const resolved = this.resolveComponent(grammar.nouns[i]);
        if (resolved.isContainer) {
          roles.container = resolved;
        } else {
          roles.additions.push(resolved);
        }
      }
    }
    roles.modifiers = grammar.adjectives.map((adj) => this.resolveModifier(adj));
    if (grammar.numbers.length > 0) {
      roles.quantity = this.parseQuantity(grammar.numbers[0]);
    }
    const quantityMatch = tokens.original.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s/i);
    if (quantityMatch) {
      roles.quantity = this.parseQuantity(quantityMatch[1]);
    }
    return roles;
  }
  /**
   * Map semantic understanding to domain (your UI kit)
   */
  mapToDomain(_grammar, roles) {
    const meaning = {
      components: [],
      props: {},
      layout: null,
      variant: null,
      size: null
    };
    if (roles.target?.resolved) {
      meaning.components.push({
        ...roles.target.resolved,
        confidence: roles.target.confidence
      });
    }
    roles.additions.forEach((addition) => {
      if (addition.resolved) {
        meaning.components.push({
          ...addition.resolved,
          confidence: addition.confidence
        });
      }
    });
    roles.modifiers.forEach((mod) => {
      if (mod.type === "variant") {
        meaning.variant = mod.text;
        meaning.props["variant"] = mod.text;
      } else if (mod.type === "size") {
        meaning.size = mod.text;
        meaning.props["size"] = mod.text;
      } else if (mod.type === "state") {
        meaning.props[mod.text] = true;
      }
    });
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
  extractRelationships(tokens) {
    const relationships = [];
    const text = tokens.original.toLowerCase();
    const containmentPatterns = [
      /(\w+)\s+(?:inside|within|in)\s+(?:a\s+)?(\w+)/gi,
      /(\w+)\s+containing\s+(?:a\s+)?(\w+)/gi,
      /(\w+)\s+with\s+(?:a\s+)?(\w+)/gi
    ];
    containmentPatterns.forEach((pattern) => {
      let match2;
      while ((match2 = pattern.exec(text)) !== null) {
        relationships.push({
          type: "contains",
          subject: match2[2],
          // container
          object: match2[1]
          // contained
        });
      }
    });
    const siblingPattern = /(\w+)\s+(?:and|,)\s+(?:a\s+)?(\w+)/gi;
    let match;
    while ((match = siblingPattern.exec(text)) !== null) {
      relationships.push({
        type: "sibling",
        subject: match[1],
        object: match[2]
      });
    }
    const layoutPatterns = [
      { pattern: /(\d+)\s*columns?/i, type: "layout" },
      { pattern: /grid\s+of\s+(\d+)/i, type: "layout" },
      { pattern: /(\w+)\s+layout/i, type: "layout" }
    ];
    layoutPatterns.forEach(({ pattern, type }) => {
      const layoutMatch = text.match(pattern);
      if (layoutMatch) {
        relationships.push({
          type,
          subject: "layout",
          object: layoutMatch[1]
        });
      }
    });
    return relationships;
  }
  /**
   * Resolve a word to a component
   */
  resolveComponent(word) {
    const text = word.toLowerCase();
    let resolved = this.knowledge.findComponent(text);
    if (resolved) {
      return {
        text,
        resolved,
        confidence: 1,
        isContainer: resolved.isContainer
      };
    }
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
  resolveModifier(word) {
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
  classifyModifier(text) {
    if (this.modifierWords.variants.includes(text)) return "variant";
    if (this.modifierWords.sizes.includes(text)) return "size";
    if (this.modifierWords.states.includes(text)) return "state";
    return "style";
  }
  /**
   * Normalize modifier to standard form
   */
  normalizeModifier(text) {
    const sizeMap = {
      "tiny": "xs",
      "extra small": "xs",
      "small": "sm",
      "medium": "md",
      "large": "lg",
      "big": "lg",
      "huge": "xl",
      "extra large": "xl"
    };
    return sizeMap[text] || text;
  }
  /**
   * Normalize action verb
   */
  normalizeAction(verb) {
    const actionMap = {
      "create": "create",
      "make": "create",
      "build": "create",
      "generate": "create",
      "add": "create",
      "insert": "create",
      "need": "create",
      "want": "create",
      "give": "create",
      "get": "create",
      "show": "display",
      "display": "display",
      "render": "display",
      "put": "place",
      "place": "place",
      "arrange": "layout",
      "layout": "layout",
      "organize": "layout",
      "stack": "layout",
      "align": "layout",
      "change": "modify",
      "modify": "modify",
      "update": "modify",
      "set": "modify",
      "edit": "modify",
      "remove": "delete",
      "delete": "delete",
      "hide": "delete",
      "clear": "delete"
    };
    return actionMap[verb.toLowerCase()] || verb.toLowerCase();
  }
  /**
   * Extract prepositions and their objects
   */
  extractPrepositions(text) {
    const found = [];
    const sortedPreps = [...this.prepositions].sort((a, b) => b.length - a.length);
    for (const prep of sortedPreps) {
      const pattern = new RegExp(`${prep}\\s+(?:a\\s+|an\\s+|the\\s+)?(\\w+)`, "gi");
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
  isModifier(word) {
    const lower = word.toLowerCase();
    return Object.values(this.modifierWords).some((list) => list.includes(lower));
  }
  /**
   * Check if a word is a number
   */
  isNumber(word) {
    const numberWords = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "first",
      "second",
      "third"
    ];
    return numberWords.includes(word) || /^\d+$/.test(word);
  }
  /**
   * Parse quantity from text
   */
  parseQuantity(text) {
    const wordNums = {
      "one": 1,
      "two": 2,
      "three": 3,
      "four": 4,
      "five": 5,
      "six": 6,
      "seven": 7,
      "eight": 8,
      "nine": 9,
      "ten": 10,
      "eleven": 11,
      "twelve": 12,
      "first": 1,
      "second": 2,
      "third": 3
    };
    const lower = text.toLowerCase();
    return wordNums[lower] || parseInt(text) || 1;
  }
  /**
   * Get basic stem of a word
   */
  getStem(word) {
    const suffixes = ["ing", "ed", "es", "s", "ly"];
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
  async buildWordVectors() {
    const allTerms = this.knowledge.getAllTerms();
    const vectorSize = 100;
    for (const term of allTerms) {
      const vector = new Array(vectorSize).fill(0);
      const categories = ["layout", "input", "display", "navigation", "feedback", "container", "misc"];
      const category = this.knowledge.getCategory(term);
      if (category) {
        const idx = categories.indexOf(category);
        if (idx >= 0 && idx < 20) {
          vector[idx] = 1;
        }
      }
      const props = this.knowledge.getRelatedProps(term);
      props.forEach((_prop, i) => {
        if (i < 30) vector[20 + i] = 1;
      });
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
  buildSynonymGraph() {
    const synonyms = this.knowledge.getSynonyms();
    Object.entries(synonyms).forEach(([from, to]) => {
      this.synonymGraph.set(from, to);
    });
    const modifierSynonyms = {
      "big": "large",
      "huge": "xl",
      "small": "sm",
      "tiny": "xs",
      "main": "primary",
      "alt": "secondary",
      "warning": "danger",
      "error": "danger"
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
  getEmbeddings(tokens) {
    return tokens.words.map((word) => {
      const lower = word.toLowerCase();
      return this.wordVectors.get(lower) || new Array(100).fill(0);
    });
  }
  /**
   * Calculate similarity between two words
   */
  similarity(word1, word2) {
    const v1 = this.wordVectors.get(word1.toLowerCase());
    const v2 = this.wordVectors.get(word2.toLowerCase());
    if (!v1 || !v2) return 0;
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
  async addTrainingExample(prompt, expected) {
    console.log("Training example added:", { prompt, expected });
  }
};

// src/core/IntentResolver.ts
var NaiveBayesClassifier = class {
  constructor() {
    this.wordCounts = /* @__PURE__ */ new Map();
    this.classCounts = /* @__PURE__ */ new Map();
    this.vocabulary = /* @__PURE__ */ new Set();
    this.totalDocuments = 0;
  }
  addDocument(text, label) {
    const words = this.tokenize(text);
    this.classCounts.set(label, (this.classCounts.get(label) || 0) + 1);
    this.totalDocuments++;
    if (!this.wordCounts.has(label)) {
      this.wordCounts.set(label, /* @__PURE__ */ new Map());
    }
    const classWords = this.wordCounts.get(label);
    for (const word of words) {
      this.vocabulary.add(word);
      classWords.set(word, (classWords.get(word) || 0) + 1);
    }
  }
  train() {
  }
  retrain() {
  }
  classify(text) {
    const classifications = this.getClassifications(text);
    return classifications[0]?.label || "unknown";
  }
  getClassifications(text) {
    const words = this.tokenize(text);
    const scores = [];
    for (const [label, classCount] of this.classCounts) {
      const logProb = this.calculateLogProbability(words, label, classCount);
      scores.push({ label, value: Math.exp(logProb) });
    }
    const total = scores.reduce((sum, s) => sum + s.value, 0);
    if (total > 0) {
      scores.forEach((s) => s.value /= total);
    }
    return scores.sort((a, b) => b.value - a.value);
  }
  calculateLogProbability(words, label, classCount) {
    const classWords = this.wordCounts.get(label) || /* @__PURE__ */ new Map();
    const totalWordsInClass = Array.from(classWords.values()).reduce((a, b) => a + b, 0);
    const vocabSize = this.vocabulary.size;
    let logProb = Math.log(classCount / this.totalDocuments);
    for (const word of words) {
      const wordCount = classWords.get(word) || 0;
      const probability = (wordCount + 1) / (totalWordsInClass + vocabSize);
      logProb += Math.log(probability);
    }
    return logProb;
  }
  tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 0);
  }
  toJSON() {
    return JSON.stringify({
      wordCounts: Array.from(this.wordCounts.entries()).map(([k, v]) => [k, Array.from(v.entries())]),
      classCounts: Array.from(this.classCounts.entries()),
      vocabulary: Array.from(this.vocabulary),
      totalDocuments: this.totalDocuments
    });
  }
  fromJSON(json) {
    const data = JSON.parse(json);
    this.wordCounts = new Map(data.wordCounts.map(([k, v]) => [k, new Map(v)]));
    this.classCounts = new Map(data.classCounts);
    this.vocabulary = new Set(data.vocabulary);
    this.totalDocuments = data.totalDocuments;
  }
};
var IntentResolver = class {
  constructor() {
    this.trained = false;
    this.storageKey = "prompt_engine_intent_classifier";
    this.classifier = new NaiveBayesClassifier();
  }
  /**
   * Initialize with knowledge base
   */
  async initialize(knowledge) {
    this._knowledge = knowledge;
    await this.trainBaseIntents();
    await this.loadSavedTraining();
    this.trained = true;
  }
  /**
   * Train with base intent examples
   */
  async trainBaseIntents() {
    const trainingData = [
      // CREATE_COMPONENT intent
      { text: "create a button", intent: "create_component" },
      { text: "make a card", intent: "create_component" },
      { text: "add a form", intent: "create_component" },
      { text: "generate input field", intent: "create_component" },
      { text: "build a modal", intent: "create_component" },
      { text: "i need a dropdown", intent: "create_component" },
      { text: "give me a table", intent: "create_component" },
      { text: "add button", intent: "create_component" },
      { text: "create input", intent: "create_component" },
      { text: "make text field", intent: "create_component" },
      { text: "generate a checkbox", intent: "create_component" },
      { text: "i want a slider", intent: "create_component" },
      { text: "need a progress bar", intent: "create_component" },
      { text: "show me a tooltip", intent: "create_component" },
      { text: "primary button", intent: "create_component" },
      { text: "large red button", intent: "create_component" },
      { text: "small card with shadow", intent: "create_component" },
      { text: "danger button", intent: "create_component" },
      { text: "outlined input", intent: "create_component" },
      // CREATE_LAYOUT intent
      { text: "create a two column layout", intent: "create_layout" },
      { text: "make a grid with 3 columns", intent: "create_layout" },
      { text: "sidebar layout", intent: "create_layout" },
      { text: "arrange in rows", intent: "create_layout" },
      { text: "stack vertically", intent: "create_layout" },
      { text: "horizontal layout", intent: "create_layout" },
      { text: "flex container", intent: "create_layout" },
      { text: "grid layout", intent: "create_layout" },
      { text: "three column grid", intent: "create_layout" },
      { text: "centered layout", intent: "create_layout" },
      { text: "responsive grid", intent: "create_layout" },
      { text: "masonry layout", intent: "create_layout" },
      { text: "split view", intent: "create_layout" },
      { text: "side by side", intent: "create_layout" },
      { text: "column layout", intent: "create_layout" },
      { text: "row layout", intent: "create_layout" },
      // CREATE_PAGE intent
      { text: "create a landing page", intent: "create_page" },
      { text: "build a dashboard", intent: "create_page" },
      { text: "make a login page", intent: "create_page" },
      { text: "generate settings page", intent: "create_page" },
      { text: "i need a profile page", intent: "create_page" },
      { text: "home page", intent: "create_page" },
      { text: "about page", intent: "create_page" },
      { text: "contact page", intent: "create_page" },
      { text: "signup page", intent: "create_page" },
      { text: "registration form page", intent: "create_page" },
      { text: "pricing page", intent: "create_page" },
      { text: "checkout page", intent: "create_page" },
      { text: "user dashboard", intent: "create_page" },
      { text: "admin panel", intent: "create_page" },
      { text: "error page", intent: "create_page" },
      { text: "404 page", intent: "create_page" },
      // MODIFY intent
      { text: "change the color", intent: "modify" },
      { text: "make it larger", intent: "modify" },
      { text: "add an icon", intent: "modify" },
      { text: "update the variant", intent: "modify" },
      { text: "set size to large", intent: "modify" },
      { text: "change to primary", intent: "modify" },
      { text: "make it smaller", intent: "modify" },
      { text: "add padding", intent: "modify" },
      { text: "remove border", intent: "modify" },
      { text: "change background", intent: "modify" },
      { text: "update style", intent: "modify" },
      { text: "modify props", intent: "modify" },
      { text: "edit the button", intent: "modify" },
      { text: "adjust spacing", intent: "modify" },
      { text: "increase margin", intent: "modify" },
      // COMBINE intent
      { text: "button inside a card", intent: "combine" },
      { text: "form with inputs and button", intent: "combine" },
      { text: "card containing image and text", intent: "combine" },
      { text: "navbar with logo and links", intent: "combine" },
      { text: "modal with form", intent: "combine" },
      { text: "card with button and image", intent: "combine" },
      { text: "sidebar with navigation", intent: "combine" },
      { text: "header with logo", intent: "combine" },
      { text: "form containing inputs", intent: "combine" },
      { text: "container with children", intent: "combine" },
      { text: "list with items", intent: "combine" },
      { text: "table with rows", intent: "combine" },
      { text: "dropdown in form", intent: "combine" },
      { text: "icon button with text", intent: "combine" },
      // QUERY intent
      { text: "what components do you have", intent: "query" },
      { text: "show me button variants", intent: "query" },
      { text: "list all layouts", intent: "query" },
      { text: "what can you create", intent: "query" },
      { text: "help", intent: "query" },
      { text: "what options are available", intent: "query" },
      { text: "show available sizes", intent: "query" },
      { text: "list components", intent: "query" },
      { text: "what variants exist", intent: "query" },
      { text: "how do i use", intent: "query" },
      { text: "explain button", intent: "query" },
      { text: "describe card component", intent: "query" }
    ];
    trainingData.forEach(({ text, intent }) => {
      this.classifier.addDocument(text, intent);
    });
    this.classifier.train();
  }
  /**
   * Resolve intent from semantic analysis
   */
  async resolve(semantics) {
    if (!this.trained) {
      throw new Error("IntentResolver not trained");
    }
    const text = [
      ...semantics.grammar.verbs,
      ...semantics.grammar.nouns,
      ...semantics.grammar.adjectives
    ].join(" ");
    const classifications = this.classifier.getClassifications(text);
    const primary = classifications[0] || { label: "unknown", value: 0 };
    const refined = this.refineIntent(
      { label: primary.label, value: primary.value },
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
  refineIntent(classification, semantics) {
    let intent = classification.label;
    let confidence = classification.value;
    const { roles, relationships, domainMeaning } = semantics;
    if (intent === "create_component" && roles.target?.resolved) {
      confidence = Math.min(confidence + 0.2, 1);
    }
    if (intent === "create_layout" && relationships.some((r) => r.type === "layout")) {
      confidence = Math.min(confidence + 0.2, 1);
    }
    if (intent === "create_component" && domainMeaning.layout) {
      intent = "create_layout";
    }
    if (relationships.some((r) => r.type === "contains")) {
      if (confidence < 0.7 || intent === "create_component") {
        intent = "combine";
        confidence = Math.max(confidence, 0.7);
      }
    }
    if (domainMeaning.components.length > 1 && intent === "create_component") {
      intent = "combine";
    }
    const pageKeywords = ["page", "dashboard", "landing", "login", "signup", "home", "profile", "settings"];
    if (semantics.grammar.nouns.some((n) => pageKeywords.includes(n.toLowerCase()))) {
      intent = "create_page";
      confidence = Math.max(confidence, 0.8);
    }
    return { intent, confidence };
  }
  /**
   * Get intent subtype for more specific handling
   */
  getSubtype(intent, semantics) {
    switch (intent) {
      case "create_component":
        return semantics.roles.target?.text || null;
      case "create_layout":
        if (semantics.grammar.nouns.includes("grid")) return "grid";
        if (semantics.grammar.nouns.includes("flex")) return "flex";
        if (semantics.grammar.nouns.some((n) => n.includes("column"))) return "columns";
        if (semantics.grammar.nouns.some((n) => n.includes("row"))) return "rows";
        return "auto";
      case "create_page":
        const pageTypes = ["landing", "dashboard", "login", "settings", "profile", "home", "about", "contact"];
        return pageTypes.find(
          (p) => semantics.grammar.nouns.some((n) => n.toLowerCase().includes(p))
        ) || "custom";
      case "modify":
        return semantics.grammar.verbs[0] || "update";
      case "combine":
        return "nested";
      case "query":
        return "info";
      default:
        return null;
    }
  }
  /**
   * Add a training example
   */
  async addTrainingExample(prompt, intent) {
    this.classifier.addDocument(prompt, intent);
    this.classifier.retrain();
    await this.saveTraining();
  }
  /**
   * Save training state
   */
  async saveTraining() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this.storageKey, this.classifier.toJSON());
      }
    } catch (error) {
      console.warn("Could not save training data:", error);
    }
  }
  /**
   * Load saved training
   */
  async loadSavedTraining() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          console.log("Found saved training data");
        }
      }
    } catch (error) {
      console.warn("Could not load saved training:", error);
    }
  }
  /**
   * Reset classifier to base training
   */
  async reset() {
    this.classifier = new NaiveBayesClassifier();
    await this.trainBaseIntents();
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn("Could not clear saved training:", error);
    }
  }
  /**
   * Export training data
   */
  exportTraining() {
    return this.classifier.toJSON();
  }
  /**
   * Import training data
   */
  importTraining(json) {
    this.classifier.fromJSON(json);
  }
};

// src/core/EntityExtractor.ts
var EntityExtractor = class {
  constructor() {
    this.initialized = false;
  }
  async initialize(knowledge) {
    this._knowledge = knowledge;
    this.initialized = true;
  }
  /**
   * Extract all entities from semantic analysis
   */
  async extract(semantics, intent) {
    if (!this.initialized) {
      throw new Error("EntityExtractor not initialized");
    }
    const entities = [];
    const components = this.extractComponents(semantics);
    entities.push(...components);
    const modifiers = this.extractModifiers(semantics);
    entities.push(...modifiers);
    const quantity = this.extractQuantity(semantics);
    if (quantity) {
      entities.push(quantity);
    }
    const layout = this.extractLayout(semantics, intent);
    if (layout) {
      entities.push(layout);
    }
    const props = this.extractProps(semantics);
    entities.push(...props);
    return entities;
  }
  /**
   * Extract component entities
   */
  extractComponents(semantics) {
    const entities = [];
    semantics.domainMeaning.components.forEach((comp) => {
      entities.push({
        type: "component",
        value: {
          name: comp.name,
          displayName: comp.displayName,
          category: comp.category,
          props: comp.props,
          variants: comp.variants,
          sizes: comp.sizes,
          isContainer: comp.isContainer
        },
        confidence: comp.confidence,
        source: "semantic"
      });
    });
    if (semantics.roles.target?.resolved) {
      const exists = entities.some(
        (e) => e.type === "component" && e.value.name === semantics.roles.target.resolved.name
      );
      if (!exists) {
        entities.push({
          type: "component",
          value: semantics.roles.target.resolved,
          confidence: semantics.roles.target.confidence,
          source: "role_target"
        });
      }
    }
    if (semantics.roles.container?.resolved) {
      entities.push({
        type: "component",
        value: {
          ...semantics.roles.container.resolved,
          role: "container"
        },
        confidence: semantics.roles.container.confidence,
        source: "role_container"
      });
    }
    semantics.roles.additions.forEach((addition) => {
      if (addition.resolved) {
        entities.push({
          type: "component",
          value: {
            ...addition.resolved,
            role: "child"
          },
          confidence: addition.confidence,
          source: "role_addition"
        });
      }
    });
    return entities;
  }
  /**
   * Extract modifier entities
   */
  extractModifiers(semantics) {
    const entities = [];
    semantics.roles.modifiers.forEach((mod) => {
      entities.push({
        type: "modifier",
        value: {
          text: mod.text,
          original: mod.original,
          modifierType: mod.type
        },
        confidence: 0.9,
        source: "role_modifier"
      });
    });
    if (semantics.domainMeaning.variant) {
      const exists = entities.some(
        (e) => e.type === "modifier" && e.value.text === semantics.domainMeaning.variant
      );
      if (!exists) {
        entities.push({
          type: "modifier",
          value: {
            text: semantics.domainMeaning.variant,
            modifierType: "variant"
          },
          confidence: 0.95,
          source: "domain_variant"
        });
      }
    }
    if (semantics.domainMeaning.size) {
      const exists = entities.some(
        (e) => e.type === "modifier" && e.value.text === semantics.domainMeaning.size
      );
      if (!exists) {
        entities.push({
          type: "modifier",
          value: {
            text: semantics.domainMeaning.size,
            modifierType: "size"
          },
          confidence: 0.95,
          source: "domain_size"
        });
      }
    }
    return entities;
  }
  /**
   * Extract quantity entity
   */
  extractQuantity(semantics) {
    if (semantics.roles.quantity > 1) {
      return {
        type: "quantity",
        value: semantics.roles.quantity,
        confidence: 0.95,
        source: "role_quantity"
      };
    }
    if (semantics.grammar.numbers.length > 0) {
      const num = this.parseNumber(semantics.grammar.numbers[0]);
      if (num > 1) {
        return {
          type: "quantity",
          value: num,
          confidence: 0.9,
          source: "grammar_number"
        };
      }
    }
    return null;
  }
  /**
   * Extract layout entity
   */
  extractLayout(semantics, intent) {
    const layoutRel = semantics.relationships.find((r) => r.type === "layout");
    if (layoutRel) {
      return {
        type: "layout",
        value: {
          type: layoutRel.object,
          columns: this.parseNumber(layoutRel.object)
        },
        confidence: 0.85,
        source: "relationship"
      };
    }
    if (semantics.domainMeaning.layout) {
      return {
        type: "layout",
        value: semantics.domainMeaning.layout,
        confidence: 0.9,
        source: "domain_layout"
      };
    }
    if (intent.type === "create_layout" && intent.subtype) {
      return {
        type: "layout",
        value: {
          type: intent.subtype
        },
        confidence: 0.8,
        source: "intent_subtype"
      };
    }
    return null;
  }
  /**
   * Extract additional props from context
   */
  extractProps(semantics) {
    const entities = [];
    semantics.grammar.prepositions.forEach((prep) => {
      if (prep.prep === "with") {
        const propName = this.detectPropFromContext(prep.object);
        if (propName) {
          entities.push({
            type: "prop",
            value: {
              name: propName,
              value: true
            },
            confidence: 0.8,
            source: "preposition_with"
          });
        }
      }
    });
    return entities;
  }
  /**
   * Detect prop name from context word
   */
  detectPropFromContext(word) {
    const propMap = {
      "icon": "icon",
      "icons": "icon",
      "shadow": "shadow",
      "shadows": "shadow",
      "border": "bordered",
      "borders": "bordered",
      "rounded": "rounded",
      "radius": "rounded",
      "loading": "loading",
      "spinner": "loading",
      "disabled": "disabled",
      "hover": "hover",
      "animation": "animated",
      "animated": "animated"
    };
    return propMap[word.toLowerCase()] || null;
  }
  /**
   * Parse number from string
   */
  parseNumber(text) {
    const wordNums = {
      "one": 1,
      "two": 2,
      "three": 3,
      "four": 4,
      "five": 5,
      "six": 6,
      "seven": 7,
      "eight": 8,
      "nine": 9,
      "ten": 10,
      "eleven": 11,
      "twelve": 12
    };
    const lower = text.toLowerCase();
    return wordNums[lower] || parseInt(text) || 1;
  }
};

// src/core/ContextBuilder.ts
var ContextBuilder = class {
  /**
   * Build processing context from all analysis results
   */
  build(input) {
    const { raw, tokens, semantics, intent, entities } = input;
    const coverage = this.calculateCoverage(tokens, entities);
    const availableComponents = entities.filter((e) => e.type === "component").map((e) => e.value.name);
    return {
      raw,
      tokens,
      semantics,
      intent,
      entities,
      coverage,
      availableComponents
    };
  }
  /**
   * Calculate how much of the input we understood
   */
  calculateCoverage(tokens, entities) {
    const totalTokens = tokens.normalized.length;
    if (totalTokens === 0) return 0;
    let mappedTokens = 0;
    const componentEntities = entities.filter((e) => e.type === "component");
    mappedTokens += componentEntities.length;
    const modifierEntities = entities.filter((e) => e.type === "modifier");
    mappedTokens += modifierEntities.length;
    const hasQuantity = entities.some((e) => e.type === "quantity");
    if (hasQuantity) mappedTokens += 1;
    const hasLayout = entities.some((e) => e.type === "layout");
    if (hasLayout) mappedTokens += 1;
    const propEntities = entities.filter((e) => e.type === "prop");
    mappedTokens += propEntities.length;
    return Math.min(mappedTokens / totalTokens, 1);
  }
  /**
   * Merge two contexts (useful for multi-turn conversations)
   */
  merge(base, update) {
    return {
      ...base,
      ...update,
      entities: [
        ...base.entities,
        ...update.entities || []
      ],
      coverage: update.coverage ?? base.coverage
    };
  }
  /**
   * Create a minimal context for simple queries
   */
  createMinimal(raw, componentName) {
    return {
      raw,
      tokens: {
        original: raw,
        words: raw.split(/\s+/),
        phrases: [],
        normalized: raw.toLowerCase().split(/\s+/)
      },
      semantics: {
        grammar: {
          nouns: [componentName],
          verbs: ["create"],
          adjectives: [],
          numbers: [],
          prepositions: []
        },
        roles: {
          action: "create",
          target: {
            text: componentName,
            resolved: null,
            confidence: 0.5,
            isContainer: false
          },
          modifiers: [],
          additions: [],
          quantity: 1,
          container: null
        },
        domainMeaning: {
          components: [],
          props: {},
          layout: null,
          variant: null,
          size: null
        },
        relationships: [],
        normalized: [componentName],
        embeddings: []
      },
      intent: {
        type: "create_component",
        confidence: 0.5,
        subtype: componentName,
        alternatives: []
      },
      entities: [{
        type: "component",
        value: { name: componentName },
        confidence: 0.5,
        source: "minimal"
      }],
      coverage: 0.5
    };
  }
  /**
   * Validate context completeness
   */
  validate(context) {
    const missing = [];
    if (context.entities.length === 0) {
      missing.push("entities");
    }
    if (context.intent.type.startsWith("create")) {
      const hasComponent = context.entities.some((e) => e.type === "component");
      if (!hasComponent) {
        missing.push("component");
      }
    }
    if (context.intent.type === "create_layout") {
      const hasLayout = context.entities.some((e) => e.type === "layout");
      if (!hasLayout) {
        missing.push("layout_config");
      }
    }
    return {
      valid: missing.length === 0,
      missing
    };
  }
  /**
   * Get primary component from context
   */
  getPrimaryComponent(context) {
    const components = context.entities.filter((e) => e.type === "component");
    components.sort((a, b) => b.confidence - a.confidence);
    return components[0] || null;
  }
  /**
   * Get all modifiers grouped by type
   */
  getModifiersByType(context) {
    const modifiers = context.entities.filter((e) => e.type === "modifier");
    const grouped = {
      variant: [],
      size: [],
      state: [],
      style: []
    };
    modifiers.forEach((mod) => {
      const type = mod.value.modifierType || "style";
      if (grouped[type]) {
        grouped[type].push(mod);
      }
    });
    return grouped;
  }
  /**
   * Get quantity from context
   */
  getQuantity(context) {
    const quantityEntity = context.entities.find((e) => e.type === "quantity");
    return quantityEntity?.value || 1;
  }
  /**
   * Get layout configuration from context
   */
  getLayout(context) {
    return context.entities.find((e) => e.type === "layout") || null;
  }
  /**
   * Check if context indicates nested/combined components
   */
  isNested(context) {
    const components = context.entities.filter((e) => e.type === "component");
    if (components.length > 1) return true;
    if (context.semantics.relationships.some((r) => r.type === "contains")) {
      return true;
    }
    if (context.intent.type === "combine") return true;
    return false;
  }
  /**
   * Extract container and children for nested structures
   */
  getNestedStructure(context) {
    const components = context.entities.filter((e) => e.type === "component");
    let container = components.find((c) => c.value.role === "container");
    if (!container) {
      container = components.find((c) => c.value.isContainer);
    }
    const children = components.filter((c) => c !== container);
    return { container: container || null, children };
  }
};

// src/knowledge/ComponentGraph.ts
import Fuse from "fuse.js";
var ComponentGraph = class {
  constructor(schema) {
    this.schema = schema;
    this.components = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
    this.relationships = [];
    this.synonyms = /* @__PURE__ */ new Map();
    this.layouts = {};
    this.pageTemplates = {};
    this.buildGraph(schema);
    this.buildSearchIndex();
  }
  /**
   * Build the knowledge graph from schema
   */
  buildGraph(schema) {
    Object.entries(schema.components).forEach(([name, config]) => {
      const node = this.createComponentNode(name, config);
      this.components.set(name.toLowerCase(), node);
      if (!this.categories.has(node.category)) {
        this.categories.set(node.category, []);
      }
      this.categories.get(node.category).push(name);
      if (config.aliases) {
        config.aliases.forEach((alias) => {
          this.synonyms.set(alias.toLowerCase(), name.toLowerCase());
        });
      }
    });
    this.buildRelationships();
    if (schema.layouts) {
      this.layouts = schema.layouts;
    }
    if (schema.pages) {
      this.pageTemplates = schema.pages;
    }
    this.addCommonSynonyms();
  }
  /**
   * Create a component node from config
   */
  createComponentNode(name, config) {
    return {
      name: name.toLowerCase(),
      displayName: config.displayName || this.capitalize(name),
      category: config.category || "misc",
      props: this.parseProps(config.props || {}),
      variants: config.variants || [],
      sizes: config.sizes || [],
      isContainer: config.isContainer || false,
      accepts: config.accepts || [],
      examples: config.examples || [],
      defaultProps: config.defaultProps || {},
      relatedTo: config.relatedTo || []
    };
  }
  /**
   * Parse props configuration
   */
  parseProps(propsConfig) {
    return Object.entries(propsConfig).map(([name, config]) => ({
      name,
      type: config.type || "string",
      required: config.required || false,
      default: config.default,
      options: config.options,
      description: config.description || ""
    }));
  }
  /**
   * Build relationships between components
   */
  buildRelationships() {
    this.components.forEach((node, name) => {
      node.relatedTo.forEach((related) => {
        this.relationships.push({
          from: name,
          to: related.toLowerCase(),
          type: "related",
          subject: name,
          object: related
        });
      });
      node.accepts.forEach((child) => {
        this.relationships.push({
          from: name,
          to: child === "*" ? "any" : child.toLowerCase(),
          type: "contains",
          subject: name,
          object: child
        });
      });
    });
  }
  /**
   * Add common synonyms for UI components
   */
  addCommonSynonyms() {
    const commonSynonyms = {
      // Component synonyms
      "btn": "button",
      "cta": "button",
      "action": "button",
      "textbox": "input",
      "textfield": "input",
      "text input": "input",
      "text field": "input",
      "dropdown": "select",
      "picker": "select",
      "combobox": "select",
      "nav": "navigation",
      "navbar": "navigation",
      "menu": "navigation",
      "popup": "modal",
      "dialog": "modal",
      "overlay": "modal",
      "panel": "card",
      "box": "card",
      "container": "card",
      "img": "image",
      "picture": "image",
      "photo": "image",
      "heading": "title",
      "header": "title",
      "h1": "title",
      "paragraph": "text",
      "copy": "text",
      "label": "text",
      // Modifier synonyms  
      "big": "large",
      "huge": "xl",
      "extra large": "xl",
      "small": "sm",
      "tiny": "xs",
      "extra small": "xs",
      "medium": "md",
      "main": "primary",
      "default": "primary",
      "alt": "secondary",
      "alternate": "secondary",
      "warning": "danger",
      "error": "danger",
      "destructive": "danger",
      "positive": "success",
      "confirm": "success",
      // Layout synonyms
      "horizontal": "row",
      "inline": "row",
      "vertical": "column",
      "stack": "column",
      "stacked": "column",
      "centered": "center",
      "middle": "center"
    };
    Object.entries(commonSynonyms).forEach(([from, to]) => {
      if (!this.synonyms.has(from)) {
        this.synonyms.set(from, to);
      }
    });
  }
  /**
   * Build Fuse.js search index
   */
  buildSearchIndex() {
    const searchableItems = Array.from(this.components.values()).map((comp) => ({
      ...comp,
      searchText: [
        comp.name,
        comp.displayName,
        ...comp.variants,
        ...comp.sizes,
        comp.category
      ].join(" ")
    }));
    this.searchIndex = new Fuse(searchableItems, {
      keys: ["name", "displayName", "searchText", "category"],
      threshold: 0.4,
      includeScore: true
    });
  }
  // ============================================================
  // QUERY METHODS
  // ============================================================
  /**
   * Find a component by exact name or synonym
   */
  findComponent(name) {
    const lower = name.toLowerCase();
    if (this.components.has(lower)) {
      return this.components.get(lower);
    }
    const resolved = this.synonyms.get(lower);
    if (resolved && this.components.has(resolved)) {
      return this.components.get(resolved);
    }
    return null;
  }
  /**
   * Fuzzy find a component
   */
  fuzzyFindComponent(name) {
    const results = this.searchIndex.search(name);
    if (results.length > 0) {
      return {
        ...results[0].item,
        score: 1 - (results[0].score || 0)
      };
    }
    return null;
  }
  /**
   * Find a prop value for a component
   */
  findProp(value, componentName) {
    const lower = value.toLowerCase();
    if (componentName) {
      const component = this.components.get(componentName.toLowerCase());
      if (component) {
        if (component.variants.includes(lower)) {
          return { name: "variant", value: lower };
        }
        const sizeMap2 = {
          "small": "sm",
          "medium": "md",
          "large": "lg",
          "extra small": "xs",
          "extra large": "xl"
        };
        const normalizedSize2 = sizeMap2[lower] || lower;
        if (component.sizes.includes(normalizedSize2)) {
          return { name: "size", value: normalizedSize2 };
        }
        for (const prop of component.props) {
          if (prop.options && prop.options.includes(lower)) {
            return { name: prop.name, value: lower };
          }
        }
      }
    }
    const variants = ["primary", "secondary", "ghost", "danger", "success", "warning", "info", "outline"];
    if (variants.includes(lower)) {
      return { name: "variant", value: lower };
    }
    const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"];
    const sizeMap = {
      "small": "sm",
      "medium": "md",
      "large": "lg",
      "tiny": "xs",
      "huge": "xl",
      "big": "lg"
    };
    const normalizedSize = sizeMap[lower] || lower;
    if (sizes.includes(normalizedSize)) {
      return { name: "size", value: normalizedSize };
    }
    return null;
  }
  /**
   * Get category for a term
   */
  getCategory(term) {
    const component = this.findComponent(term);
    return component?.category || null;
  }
  /**
   * Get related props for a term
   */
  getRelatedProps(term) {
    const component = this.findComponent(term);
    return component?.props.map((p) => p.name) || [];
  }
  /**
   * Get co-occurring terms
   */
  getCoOccurrences(term) {
    const component = this.findComponent(term);
    if (!component) return [];
    const coOccurrences = [];
    this.relationships.filter((r) => r.from === component.name || r.to === component.name).forEach((r) => {
      const other = r.from === component.name ? r.to : r.from;
      if (other && other !== "any") {
        coOccurrences.push({
          term: other,
          weight: r.type === "contains" ? 1 : 0.5
        });
      }
    });
    const sameCategory = this.categories.get(component.category) || [];
    sameCategory.filter((c) => c.toLowerCase() !== component.name).forEach((c) => {
      coOccurrences.push({ term: c, weight: 0.3 });
    });
    return coOccurrences;
  }
  /**
   * Resolve a synonym to its canonical form
   */
  resolveSynonym(term) {
    return this.synonyms.get(term.toLowerCase()) || term.toLowerCase();
  }
  /**
   * Get all synonyms
   */
  getSynonyms() {
    return Object.fromEntries(this.synonyms);
  }
  /**
   * Get all terms in the knowledge base
   */
  getAllTerms() {
    const terms = /* @__PURE__ */ new Set();
    this.components.forEach((comp) => {
      terms.add(comp.name);
      terms.add(comp.displayName);
      comp.variants.forEach((v) => terms.add(v));
      comp.sizes.forEach((s) => terms.add(s));
      comp.props.forEach((p) => {
        terms.add(p.name);
        if (p.options) p.options.forEach((o) => terms.add(o));
      });
    });
    this.synonyms.forEach((_, alias) => terms.add(alias));
    return Array.from(terms);
  }
  /**
   * Get components by category
   */
  getComponentsByCategory(category) {
    const names = this.categories.get(category) || [];
    return names.map((name) => this.components.get(name.toLowerCase())).filter((c) => c !== void 0);
  }
  /**
   * Get all categories
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }
  /**
   * Get layout template
   */
  getLayoutTemplate(type) {
    return this.layouts[type] || null;
  }
  /**
   * Get page template
   */
  getPageTemplate(type) {
    return this.pageTemplates[type] || null;
  }
  /**
   * Get all components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }
  /**
   * Check if a component is a container
   */
  isContainer(name) {
    const component = this.findComponent(name);
    return component?.isContainer || false;
  }
  /**
   * Get what a container can accept
   */
  getAcceptedChildren(containerName) {
    const component = this.findComponent(containerName);
    if (!component || !component.isContainer) return [];
    if (component.accepts.includes("*")) {
      return Array.from(this.components.keys());
    }
    return component.accepts;
  }
  /**
   * Export schema for training data generation
   */
  toTrainingData() {
    const data = [];
    this.components.forEach((comp) => {
      data.push(`create a ${comp.name}`);
      data.push(`make ${comp.name}`);
      data.push(`add ${comp.name}`);
      data.push(`i need a ${comp.name}`);
      data.push(`give me a ${comp.name}`);
      comp.variants.forEach((v) => {
        data.push(`${v} ${comp.name}`);
        data.push(`create a ${v} ${comp.name}`);
        data.push(`make a ${v} ${comp.name}`);
      });
      comp.sizes.forEach((s) => {
        data.push(`${s} ${comp.name}`);
        data.push(`create a ${s} ${comp.name}`);
        const sizeWords = {
          "sm": "small",
          "md": "medium",
          "lg": "large",
          "xs": "tiny",
          "xl": "huge"
        };
        const sizeWord = sizeWords[s];
        if (sizeWord) {
          data.push(`${sizeWord} ${comp.name}`);
        }
      });
      comp.variants.forEach((v) => {
        comp.sizes.forEach((s) => {
          data.push(`${s} ${v} ${comp.name}`);
          data.push(`create a ${s} ${v} ${comp.name}`);
        });
      });
      comp.examples.forEach((ex) => {
        data.push(ex.prompt);
      });
    });
    return data;
  }
  /**
   * Utility to capitalize strings
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// src/generators/JSXGenerator.ts
var JSXGenerator = class {
  constructor(knowledge) {
    this.knowledge = knowledge;
    this.contextHelper = new ContextBuilder();
  }
  /**
   * Generate JSX from processing context
   */
  generate(context) {
    const validation = this.contextHelper.validate(context);
    if (!validation.valid) {
      return {
        jsx: "",
        imports: [],
        error: `Cannot generate: missing ${validation.missing.join(", ")}`,
        suggestions: this.getSuggestions(context)
      };
    }
    if (this.contextHelper.isNested(context)) {
      return this.generateNested(context);
    }
    if (context.intent.type === "create_layout") {
      return this.generateLayout(context);
    }
    if (context.intent.type === "create_page") {
      return this.generatePage(context);
    }
    return this.generateSingleComponent(context);
  }
  /**
   * Generate a single component
   */
  generateSingleComponent(context) {
    const primaryComponent = this.contextHelper.getPrimaryComponent(context);
    if (!primaryComponent) {
      return {
        jsx: "",
        imports: [],
        error: "No component found to generate"
      };
    }
    const componentName = this.capitalize(primaryComponent.value.name);
    const props = this.buildProps(context, primaryComponent);
    const quantity = this.contextHelper.getQuantity(context);
    const propsString = this.propsToString(props);
    const element = propsString ? `<${componentName} ${propsString} />` : `<${componentName} />`;
    let jsx;
    if (quantity > 1) {
      jsx = Array(quantity).fill(element).join("\n");
    } else {
      jsx = element;
    }
    const imports = this.generateImports([componentName]);
    return { jsx, imports };
  }
  /**
   * Generate nested/combined components
   */
  generateNested(context) {
    const { container, children } = this.contextHelper.getNestedStructure(context);
    if (!container && children.length === 0) {
      return {
        jsx: "",
        imports: [],
        error: "No components found for nested structure"
      };
    }
    const imports = [];
    let jsx;
    if (container) {
      const containerName = this.capitalize(container.value.name);
      imports.push(containerName);
      const containerProps = this.buildProps(context, container);
      const propsString = this.propsToString(containerProps);
      const childrenJsx = children.map((child) => {
        const childName = this.capitalize(child.value.name);
        imports.push(childName);
        const childProps = this.buildPropsForChild(child);
        const childPropsStr = this.propsToString(childProps);
        return childPropsStr ? `    <${childName} ${childPropsStr} />` : `    <${childName} />`;
      }).join("\n");
      jsx = propsString ? `<${containerName} ${propsString}>
${childrenJsx}
</${containerName}>` : `<${containerName}>
${childrenJsx}
</${containerName}>`;
    } else {
      const childrenJsx = children.map((child) => {
        const childName = this.capitalize(child.value.name);
        imports.push(childName);
        const childProps = this.buildPropsForChild(child);
        const childPropsStr = this.propsToString(childProps);
        return childPropsStr ? `  <${childName} ${childPropsStr} />` : `  <${childName} />`;
      }).join("\n");
      jsx = `<>
${childrenJsx}
</>`;
    }
    return {
      jsx,
      imports: this.generateImports([...new Set(imports)])
    };
  }
  /**
   * Generate layout component
   */
  generateLayout(context) {
    const layoutEntity = this.contextHelper.getLayout(context);
    const components = context.entities.filter((e) => e.type === "component");
    const quantity = this.contextHelper.getQuantity(context);
    let layoutType = "flex";
    let layoutProps = {};
    if (layoutEntity) {
      const layoutValue = layoutEntity.value;
      if (layoutValue.type === "grid" || layoutValue.columns) {
        layoutType = "grid";
        layoutProps = {
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${layoutValue.columns || 2}, 1fr)`,
            gap: "1rem"
          }
        };
      } else if (layoutValue.type === "columns") {
        layoutType = "grid";
        const cols = parseInt(layoutValue.type) || 2;
        layoutProps = {
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "1rem"
          }
        };
      } else if (layoutValue.type === "rows" || layoutValue.type === "column") {
        layoutProps = {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }
        };
      } else {
        layoutProps = {
          style: {
            display: "flex",
            flexDirection: "row",
            gap: "1rem"
          }
        };
      }
    }
    const imports = [];
    let childrenJsx;
    if (components.length > 0) {
      childrenJsx = components.map((comp) => {
        const name = this.capitalize(comp.value.name);
        imports.push(name);
        return `    <${name} />`;
      }).join("\n");
    } else if (quantity > 1) {
      childrenJsx = Array(quantity).fill(null).map((_, i) => `    <div>Item ${i + 1}</div>`).join("\n");
    } else {
      childrenJsx = "    {/* Add children here */}";
    }
    const styleString = JSON.stringify(layoutProps.style);
    const jsx = `<div style={${styleString}}>
${childrenJsx}
</div>`;
    return {
      jsx,
      imports: this.generateImports(imports)
    };
  }
  /**
   * Generate page component
   */
  generatePage(context) {
    const pageType = context.intent.subtype || "custom";
    const pageTemplate = this.knowledge.getPageTemplate(pageType);
    const imports = [];
    let sections = [];
    if (pageTemplate) {
      sections = pageTemplate.map((section) => {
        const parsed = this.parseTemplateSection(section);
        imports.push(...parsed.imports);
        return parsed.jsx;
      });
    } else {
      sections = [
        "  <header>\n    <h1>Page Title</h1>\n  </header>",
        "  <main>\n    {/* Main content */}\n  </main>",
        "  <footer>\n    {/* Footer */}\n  </footer>"
      ];
    }
    const jsx = `<div className="page ${pageType}-page">
${sections.join("\n\n")}
</div>`;
    return {
      jsx,
      imports: this.generateImports([...new Set(imports)])
    };
  }
  /**
   * Build props for a component from context
   */
  buildProps(context, component) {
    const props = {};
    const modifiers = this.contextHelper.getModifiersByType(context);
    if (modifiers.variant.length > 0) {
      props.variant = modifiers.variant[0].value.text;
    }
    if (modifiers.size.length > 0) {
      props.size = modifiers.size[0].value.text;
    }
    modifiers.state.forEach((state) => {
      props[state.value.text] = true;
    });
    context.entities.filter((e) => e.type === "prop").forEach((prop) => {
      props[prop.value.name] = prop.value.value;
    });
    const componentDef = this.knowledge.findComponent(component.value.name);
    if (componentDef?.defaultProps) {
      Object.entries(componentDef.defaultProps).forEach(([key, value]) => {
        if (!(key in props)) {
        }
      });
    }
    return props;
  }
  /**
   * Build props for a child component
   */
  buildPropsForChild(child) {
    const props = {};
    if (child.value.props) {
    }
    return props;
  }
  /**
   * Convert props object to JSX string
   */
  propsToString(props) {
    const parts = [];
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          parts.push(key);
        }
      } else if (typeof value === "string") {
        parts.push(`${key}="${value}"`);
      } else if (typeof value === "number") {
        parts.push(`${key}={${value}}`);
      } else if (typeof value === "object") {
        parts.push(`${key}={${JSON.stringify(value)}}`);
      }
    });
    return parts.join(" ");
  }
  /**
   * Generate import statements
   */
  generateImports(componentNames) {
    if (componentNames.length === 0) return [];
    const kitComponents = componentNames.filter(
      (name) => this.knowledge.findComponent(name.toLowerCase())
    );
    const imports = [];
    if (kitComponents.length > 0) {
      imports.push(
        `import { ${kitComponents.join(", ")} } from '@/components/ui';`
      );
    }
    return imports;
  }
  /**
   * Parse template section string
   */
  parseTemplateSection(section) {
    const imports = [];
    if (section.includes(">")) {
      const [parent, childrenStr] = section.split(">").map((s) => s.trim());
      imports.push(parent);
      const children = childrenStr.replace(/[\[\]]/g, "").split(",").map((c) => c.trim());
      imports.push(...children);
      const childrenJsx = children.map((c) => `      <${c} />`).join("\n");
      return {
        jsx: `  <${parent}>
${childrenJsx}
  </${parent}>`,
        imports
      };
    }
    imports.push(section);
    return {
      jsx: `  <${section} />`,
      imports
    };
  }
  /**
   * Get suggestions when generation fails
   */
  getSuggestions(context) {
    const suggestions = [];
    if (context.entities.length === 0) {
      suggestions.push('Try specifying a component like "create a button" or "make a card"');
      const available = this.knowledge.getAllComponents().slice(0, 5);
      if (available.length > 0) {
        suggestions.push(`Available components: ${available.map((c) => c.name).join(", ")}`);
      }
    }
    if (context.intent.confidence < 0.5) {
      suggestions.push("Try being more specific about what you want to create");
    }
    return suggestions;
  }
  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// src/plugins/PluginManager.ts
import { EventEmitter } from "eventemitter3";
var PluginManager = class extends EventEmitter {
  constructor() {
    super();
    this.plugins = /* @__PURE__ */ new Map();
    this.activePlugin = null;
    this.pluginOrder = [];
  }
  /**
   * Register a new plugin
   */
  async register(name, plugin) {
    if (typeof plugin.initialize === "function") {
      await plugin.initialize();
    }
    this.plugins.set(name, plugin);
    this.pluginOrder.push(name);
    if (!this.activePlugin) {
      this.activePlugin = name;
    }
    this.emit("plugin:registered", { name, plugin });
  }
  /**
   * Unregister a plugin
   */
  async unregister(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      if (typeof plugin.destroy === "function") {
        await plugin.destroy();
      }
      this.plugins.delete(name);
      this.pluginOrder = this.pluginOrder.filter((n) => n !== name);
      if (this.activePlugin === name) {
        this.activePlugin = this.pluginOrder[0] || null;
      }
      this.emit("plugin:unregistered", { name });
    }
  }
  /**
   * Set the active plugin
   */
  setActive(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is not registered`);
    }
    this.activePlugin = name;
    this.emit("plugin:activated", { name });
  }
  /**
   * Get the active plugin
   */
  getActive() {
    if (!this.activePlugin) return null;
    return this.plugins.get(this.activePlugin) || null;
  }
  /**
   * Enhance context using the active plugin
   */
  async enhance(context) {
    const plugin = this.getActive();
    if (!plugin) return context;
    try {
      const enhanced = await plugin.enhance(context);
      return enhanced;
    } catch (error) {
      this.emit("plugin:error", {
        plugin: this.activePlugin,
        error
      });
      return context;
    }
  }
  /**
   * Generate using the active plugin
   */
  async generate(context) {
    const plugin = this.getActive();
    if (!plugin || typeof plugin.generate !== "function") {
      return null;
    }
    try {
      return await plugin.generate(context);
    } catch (error) {
      this.emit("plugin:error", {
        plugin: this.activePlugin,
        error
      });
      return null;
    }
  }
  /**
   * Run enhancement through all plugins in order
   */
  async enhanceWithAll(context) {
    let result = context;
    for (const name of this.pluginOrder) {
      const plugin = this.plugins.get(name);
      if (plugin) {
        try {
          result = await plugin.enhance(result);
        } catch (error) {
          this.emit("plugin:error", { plugin: name, error });
        }
      }
    }
    return result;
  }
  /**
   * Get list of available plugins
   */
  getAvailablePlugins() {
    return Array.from(this.plugins.keys());
  }
  /**
   * Check if a plugin is registered
   */
  has(name) {
    return this.plugins.has(name);
  }
  /**
   * Get plugin by name
   */
  get(name) {
    return this.plugins.get(name);
  }
  /**
   * Get plugin count
   */
  get count() {
    return this.plugins.size;
  }
};

// src/plugins/LocalAIPlugin.ts
var LocalAIPlugin = class {
  constructor() {
    this.name = "local";
    this.confidenceBoosts = /* @__PURE__ */ new Map();
  }
  async initialize() {
    console.log("LocalAIPlugin initialized");
  }
  async destroy() {
    this.confidenceBoosts.clear();
  }
  /**
   * Enhance context using local heuristics
   */
  async enhance(context) {
    const enhanced = { ...context };
    if (enhanced.intent.confidence < 0.8) {
      const boost = this.getConfidenceBoost(context.raw);
      if (boost > 0) {
        enhanced.intent = {
          ...enhanced.intent,
          confidence: Math.min(enhanced.intent.confidence + boost, 1)
        };
      }
    }
    enhanced.entities = this.verifyEntities(enhanced.entities);
    return enhanced;
  }
  /**
   * Generate using local logic (optional)
   */
  async generate(context) {
    return null;
  }
  /**
   * Learn from a correction
   */
  learn(prompt, correction) {
    const key = this.getPromptKey(prompt);
    const currentBoost = this.confidenceBoosts.get(key) || 0;
    this.confidenceBoosts.set(key, Math.min(currentBoost + 0.1, 0.3));
  }
  /**
   * Get confidence boost for a prompt
   */
  getConfidenceBoost(prompt) {
    const key = this.getPromptKey(prompt);
    return this.confidenceBoosts.get(key) || 0;
  }
  /**
   * Generate a key for the prompt (simplified)
   */
  getPromptKey(prompt) {
    return prompt.toLowerCase().split(/\s+/).slice(0, 3).join("_");
  }
  /**
   * Verify and potentially fix entity mappings
   */
  verifyEntities(entities) {
    return entities.map((entity) => {
      if (entity.confidence < 0.3) {
        return { ...entity, confidence: 0.3 };
      }
      return entity;
    });
  }
};

// src/core/Engine.ts
var PromptEngine = class extends EventEmitter2 {
  constructor(config = {}) {
    super();
    // State
    this.initialized = false;
    this.trainingExamples = [];
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.6,
      usePlugins: config.usePlugins ?? true,
      fallbackToExternal: config.fallbackToExternal ?? false,
      debug: config.debug ?? false
    };
    this.lexer = new Lexer();
    this.semantic = new SemanticAnalyzer();
    this.intent = new IntentResolver();
    this.entities = new EntityExtractor();
    this.contextBuilder = new ContextBuilder();
    this.plugins = new PluginManager();
  }
  /**
   * Initialize the engine with a UI kit schema
   */
  async initialize(schema) {
    try {
      this.knowledge = new ComponentGraph(schema);
      await this.semantic.initialize(this.knowledge);
      await this.intent.initialize(this.knowledge);
      await this.entities.initialize(this.knowledge);
      this.generator = new JSXGenerator(this.knowledge);
      const localPlugin = new LocalAIPlugin();
      await this.plugins.register("local", localPlugin);
      this.addCustomPhrases(schema);
      this.initialized = true;
      this.emit("ready");
      if (this.config.debug) {
        console.log("PromptEngine initialized with schema:", schema.name);
      }
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }
  /**
   * Process a prompt and generate components
   */
  async process(prompt) {
    if (!this.initialized) {
      throw new Error("Engine not initialized. Call initialize() first.");
    }
    const startTime = Date.now();
    try {
      const tokens = this.lexer.tokenize(prompt);
      if (this.config.debug) {
        console.log("Tokens:", tokens);
      }
      const semantics = await this.semantic.analyze(tokens);
      if (this.config.debug) {
        console.log("Semantics:", semantics);
      }
      const intentResult = await this.intent.resolve(semantics);
      if (this.config.debug) {
        console.log("Intent:", intentResult);
      }
      const entitiesResult = await this.entities.extract(semantics, intentResult);
      if (this.config.debug) {
        console.log("Entities:", entitiesResult);
      }
      let context = this.contextBuilder.build({
        raw: prompt,
        tokens,
        semantics,
        intent: intentResult,
        entities: entitiesResult
      });
      const confidence = this.calculateConfidence(context);
      if (this.config.usePlugins && confidence < this.config.confidenceThreshold) {
        context = await this.plugins.enhance(context);
      }
      const result = this.generator.generate(context);
      const engineResult = {
        ...result,
        confidence,
        processingTime: Date.now() - startTime,
        debug: {
          tokens,
          semantics,
          intent: intentResult,
          entities: entitiesResult,
          context
        }
      };
      this.emit("generated", engineResult);
      return engineResult;
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }
  /**
   * Calculate overall confidence score
   */
  calculateConfidence(context) {
    const scores = {
      intent: context.intent.confidence,
      entities: context.entities.length > 0 ? Math.min(context.entities.reduce((sum, e) => sum + e.confidence, 0) / context.entities.length, 1) : 0.2,
      coverage: context.coverage
    };
    return scores.intent * 0.4 + scores.entities * 0.4 + scores.coverage * 0.2;
  }
  /**
   * Learn from a correction
   */
  async learn(prompt, correction, expected) {
    this.trainingExamples.push({
      prompt,
      correction,
      expectedOutput: expected,
      timestamp: Date.now()
    });
    if (expected.jsx) {
      const inferredIntent = this.inferIntentFromOutput(expected);
      await this.intent.addTrainingExample(prompt, inferredIntent);
    }
    await this.semantic.addTrainingExample(prompt, expected);
    const localPlugin = this.plugins.get("local");
    if (localPlugin && typeof localPlugin.learn === "function") {
      localPlugin.learn(prompt, correction);
    }
    this.emit("learned", { prompt, correction, expected });
    if (this.config.debug) {
      console.log("Learned from correction:", { prompt, correction });
    }
  }
  /**
   * Infer intent type from generated output
   */
  inferIntentFromOutput(output) {
    const jsx = output.jsx.toLowerCase();
    if (jsx.includes("page") || jsx.includes("layout")) {
      return "create_page";
    }
    if (jsx.includes("grid") || jsx.includes("flex") || jsx.includes("column")) {
      return "create_layout";
    }
    if ((jsx.match(/<\w+/g) || []).length > 2) {
      return "combine";
    }
    return "create_component";
  }
  /**
   * Add custom phrases from schema
   */
  addCustomPhrases(schema) {
    Object.entries(schema.components).forEach(([name, config]) => {
      if (config.aliases) {
        this.lexer.addPhrases(config.aliases);
      }
      if (config.variants) {
        config.variants.forEach((variant) => {
          this.lexer.addPhrase(`${variant} ${name}`);
        });
      }
    });
    if (schema.layouts) {
      Object.keys(schema.layouts).forEach((layoutName) => {
        this.lexer.addPhrase(layoutName.replace(/-/g, " "));
      });
    }
    if (schema.pages) {
      Object.keys(schema.pages).forEach((pageName) => {
        this.lexer.addPhrase(`${pageName} page`);
      });
    }
  }
  /**
   * Get available components
   */
  getComponents() {
    if (!this.initialized) return [];
    return this.knowledge.getAllComponents().map((c) => c.name);
  }
  /**
   * Get component details
   */
  getComponent(name) {
    if (!this.initialized) return null;
    return this.knowledge.findComponent(name);
  }
  /**
   * Export training data
   */
  exportTrainingData() {
    return [...this.trainingExamples];
  }
  /**
   * Import training data
   */
  async importTrainingData(examples) {
    for (const example of examples) {
      if (example.expectedOutput) {
        await this.learn(
          example.prompt,
          example.correction || "",
          example.expectedOutput
        );
      }
    }
  }
  /**
   * Reset the engine
   */
  async reset() {
    this.trainingExamples = [];
    await this.intent.reset();
    if (this.config.debug) {
      console.log("PromptEngine reset");
    }
  }
  /**
   * Check if engine is ready
   */
  get isReady() {
    return this.initialized;
  }
};

// src/plugins/ClaudePlugin.ts
var ClaudePlugin = class {
  constructor(config) {
    this.name = "claude";
    this.endpoint = "https://api.anthropic.com/v1/messages";
    this.uiKitContext = "";
    this.config = {
      model: "claude-sonnet-4-20250514",
      maxTokens: 1024,
      ...config
    };
  }
  async initialize() {
    if (!this.config.apiKey) {
      throw new Error("Claude API key is required");
    }
    console.log("ClaudePlugin initialized");
  }
  async destroy() {
  }
  /**
   * Set UI kit schema context for Claude
   */
  setUIKitContext(schema) {
    const components = Object.entries(schema.components).map(([name, config]) => ({
      name,
      variants: config.variants,
      sizes: config.sizes,
      props: Object.keys(config.props || {})
    }));
    this.uiKitContext = JSON.stringify({
      kitName: schema.name,
      version: schema.version,
      components
    }, null, 2);
  }
  /**
   * Enhance context using Claude API
   */
  async enhance(context) {
    if (context.intent.confidence > 0.7 && context.coverage > 0.6) {
      return context;
    }
    try {
      const response = await this.askClaude(this.buildEnhancePrompt(context));
      return this.mergeResponse(context, response);
    } catch (error) {
      console.error("Claude enhancement failed:", error);
      return context;
    }
  }
  /**
   * Generate JSX using Claude
   */
  async generate(context) {
    try {
      const prompt = this.buildGeneratePrompt(context);
      const response = await this.askClaude(prompt);
      return this.parseGeneratorResponse(response);
    } catch (error) {
      console.error("Claude generation failed:", error);
      return null;
    }
  }
  /**
   * Make API call to Claude
   */
  async askClaude(prompt) {
    const messages = [
      { role: "user", content: prompt }
    ];
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages
      })
    });
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    return response.json();
  }
  /**
   * Build prompt for context enhancement
   */
  buildEnhancePrompt(context) {
    return `You are helping to understand a UI component creation request.

UI Kit Schema:
${this.uiKitContext}

User Request: "${context.raw}"

Current Understanding:
- Intent: ${context.intent.type} (confidence: ${context.intent.confidence})
- Components found: ${context.entities.filter((e) => e.type === "component").map((e) => e.value.name).join(", ") || "none"}
- Modifiers found: ${context.entities.filter((e) => e.type === "modifier").map((e) => e.value.text).join(", ") || "none"}

Please analyze the request and respond with JSON only:
{
  "intent": "create_component|create_layout|create_page|modify|combine|query",
  "intentConfidence": 0.0-1.0,
  "components": [{"name": "...", "confidence": 0.0-1.0}],
  "props": {"variant": "...", "size": "...", ...},
  "suggestions": ["suggestion1", "suggestion2"]
}`;
  }
  /**
   * Build prompt for JSX generation
   */
  buildGeneratePrompt(context) {
    return `Generate React JSX for this UI component request.

UI Kit Components Available:
${this.uiKitContext}

User Request: "${context.raw}"

Analysis:
- Intent: ${context.intent.type}
- Components: ${context.entities.filter((e) => e.type === "component").map((e) => e.value.name).join(", ")}
- Modifiers: ${JSON.stringify(context.semantics.domainMeaning.props)}

Generate clean, minimal JSX code. Respond with JSON only:
{
  "jsx": "<Component ... />",
  "imports": ["import { Component } from '@/components/ui'"]
}`;
  }
  /**
   * Merge Claude's response with existing context
   */
  mergeResponse(context, response) {
    try {
      const text = response.content[0]?.text || "";
      const parsed = JSON.parse(text);
      const enhanced = { ...context };
      if (parsed.intentConfidence > context.intent.confidence) {
        enhanced.intent = {
          ...enhanced.intent,
          type: parsed.intent,
          confidence: parsed.intentConfidence
        };
      }
      if (parsed.components) {
        parsed.components.forEach((comp) => {
          const exists = enhanced.entities.some(
            (e) => e.type === "component" && e.value.name === comp.name
          );
          if (!exists) {
            enhanced.entities.push({
              type: "component",
              value: { name: comp.name },
              confidence: comp.confidence,
              source: "claude"
            });
          }
        });
      }
      enhanced.enhanced = {
        by: "claude",
        suggestions: parsed.suggestions
      };
      return enhanced;
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      return context;
    }
  }
  /**
   * Parse generation response
   */
  parseGeneratorResponse(response) {
    try {
      const text = response.content[0]?.text || "";
      const parsed = JSON.parse(text);
      return {
        jsx: parsed.jsx || "",
        imports: parsed.imports || []
      };
    } catch (error) {
      return {
        jsx: "",
        imports: [],
        error: "Failed to parse Claude response"
      };
    }
  }
};

// src/plugins/OpenAIPlugin.ts
var OpenAIPlugin = class {
  constructor(config) {
    this.name = "openai";
    this.endpoint = "https://api.openai.com/v1/chat/completions";
    this.systemPrompt = "";
    this.config = {
      model: "gpt-4",
      maxTokens: 1024,
      ...config
    };
  }
  async initialize() {
    if (!this.config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    console.log("OpenAIPlugin initialized");
  }
  async destroy() {
  }
  /**
   * Set UI kit schema context
   */
  setUIKitContext(schema) {
    const components = Object.entries(schema.components).map(([name, config]) => ({
      name,
      variants: config.variants,
      sizes: config.sizes,
      isContainer: config.isContainer
    }));
    this.systemPrompt = `You are a UI component generator assistant.
You help users create React components from natural language descriptions.

Available UI Kit Components:
${JSON.stringify(components, null, 2)}

Always respond with valid JSON only, no markdown or explanation.`;
  }
  /**
   * Enhance context using OpenAI
   */
  async enhance(context) {
    if (context.intent.confidence > 0.7 && context.coverage > 0.6) {
      return context;
    }
    try {
      const response = await this.chat([
        { role: "system", content: this.systemPrompt },
        { role: "user", content: this.buildEnhancePrompt(context) }
      ]);
      return this.mergeResponse(context, response);
    } catch (error) {
      console.error("OpenAI enhancement failed:", error);
      return context;
    }
  }
  /**
   * Generate JSX using OpenAI
   */
  async generate(context) {
    try {
      const response = await this.chat([
        { role: "system", content: this.systemPrompt },
        { role: "user", content: this.buildGeneratePrompt(context) }
      ]);
      return this.parseGeneratorResponse(response);
    } catch (error) {
      console.error("OpenAI generation failed:", error);
      return null;
    }
  }
  /**
   * Make API call to OpenAI
   */
  async chat(messages) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    return response.json();
  }
  /**
   * Build enhancement prompt
   */
  buildEnhancePrompt(context) {
    return `Analyze this UI component request: "${context.raw}"

Current analysis:
- Intent: ${context.intent.type} (confidence: ${context.intent.confidence.toFixed(2)})
- Components: ${context.entities.filter((e) => e.type === "component").map((e) => e.value.name).join(", ") || "none"}

Respond with JSON:
{
  "intent": "create_component|create_layout|create_page|modify|combine",
  "confidence": 0.0-1.0,
  "components": [{"name": "string", "confidence": 0.0-1.0}],
  "props": {},
  "layout": null
}`;
  }
  /**
   * Build generation prompt
   */
  buildGeneratePrompt(context) {
    const components = context.entities.filter((e) => e.type === "component").map((e) => e.value.name);
    return `Generate React JSX for: "${context.raw}"

Components to use: ${components.join(", ")}
Props: ${JSON.stringify(context.semantics.domainMeaning.props)}

Respond with JSON:
{
  "jsx": "<Component />",
  "imports": ["import { X } from '@/components/ui'"]
}`;
  }
  /**
   * Merge response with context
   */
  mergeResponse(context, response) {
    try {
      const text = response.choices[0]?.message?.content || "";
      const parsed = JSON.parse(text);
      const enhanced = { ...context };
      if (parsed.confidence > context.intent.confidence) {
        enhanced.intent = {
          ...enhanced.intent,
          type: parsed.intent,
          confidence: parsed.confidence
        };
      }
      if (parsed.components) {
        parsed.components.forEach((comp) => {
          const exists = enhanced.entities.some(
            (e) => e.type === "component" && e.value.name === comp.name
          );
          if (!exists) {
            enhanced.entities.push({
              type: "component",
              value: { name: comp.name },
              confidence: comp.confidence,
              source: "openai"
            });
          }
        });
      }
      enhanced.enhanced = {
        by: "openai",
        raw: parsed
      };
      return enhanced;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      return context;
    }
  }
  /**
   * Parse generator response
   */
  parseGeneratorResponse(response) {
    try {
      const text = response.choices[0]?.message?.content || "";
      const parsed = JSON.parse(text);
      return {
        jsx: parsed.jsx || "",
        imports: parsed.imports || []
      };
    } catch (error) {
      return {
        jsx: "",
        imports: [],
        error: "Failed to parse OpenAI response"
      };
    }
  }
};

// src/usePromptEngine.ts
import { useState, useEffect, useCallback } from "react";
function usePromptEngine(schema, config) {
  const [engine, setEngine] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const eng = new PromptEngine(config);
        await eng.initialize(schema);
        if (mounted) {
          setEngine(eng);
          setReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [schema, config]);
  const generate = useCallback(async (prompt) => {
    if (!engine) {
      throw new Error("Engine not initialized");
    }
    return engine.process(prompt);
  }, [engine]);
  const learn = useCallback(async (prompt, correction, expected) => {
    if (!engine) return;
    return engine.learn(prompt, correction, expected);
  }, [engine]);
  const registerPlugin = useCallback(async (name, plugin) => {
    if (!engine) return;
    return engine.plugins.register(name, plugin);
  }, [engine]);
  const setActivePlugin = useCallback((name) => {
    if (!engine) return;
    engine.plugins.setActive(name);
  }, [engine]);
  return {
    ready,
    error,
    generate,
    learn,
    registerPlugin,
    setActivePlugin
  };
}
export {
  ClaudePlugin,
  ComponentGraph,
  ContextBuilder,
  EntityExtractor,
  IntentResolver,
  JSXGenerator,
  Lexer,
  LocalAIPlugin,
  OpenAIPlugin,
  PluginManager,
  PromptEngine,
  SemanticAnalyzer,
  PromptEngine as default,
  usePromptEngine
};
