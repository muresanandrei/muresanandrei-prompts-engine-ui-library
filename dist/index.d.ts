import { EventEmitter } from 'eventemitter3';

interface PropConfig {
    type: 'string' | 'number' | 'boolean' | 'function' | 'node' | 'object' | 'enum' | 'array';
    required?: boolean;
    default?: any;
    options?: string[];
    description?: string;
}
interface ComponentConfig {
    displayName?: string;
    category?: string;
    aliases?: string[];
    variants?: string[];
    sizes?: string[];
    isContainer?: boolean;
    accepts?: string[];
    props?: Record<string, PropConfig>;
    defaultProps?: Record<string, any>;
    examples?: Array<{
        prompt: string;
        output: string;
    }>;
    relatedTo?: string[];
}
interface LayoutConfig {
    component?: string;
    props?: Record<string, any>;
    wrapper?: boolean;
    style?: Record<string, string>;
}
interface UIKitSchema {
    name: string;
    version: string;
    components: Record<string, ComponentConfig>;
    layouts?: Record<string, LayoutConfig>;
    pages?: Record<string, string[]>;
}
interface TokenizedResult {
    original: string;
    words: string[];
    phrases: string[];
    normalized: string[];
}
interface GrammarAnalysis {
    nouns: string[];
    verbs: string[];
    adjectives: string[];
    numbers: string[];
    prepositions: Array<{
        prep: string;
        object: string;
    }>;
}
interface ResolvedComponent {
    text: string;
    resolved: ComponentNode | null;
    confidence: number;
    isContainer: boolean;
}
interface ResolvedModifier {
    text: string;
    original: string;
    type: 'variant' | 'size' | 'state' | 'style';
}
interface SemanticRoles {
    action: string | null;
    target: ResolvedComponent | null;
    modifiers: ResolvedModifier[];
    additions: ResolvedComponent[];
    quantity: number;
    container: ResolvedComponent | null;
}
interface Relationship {
    type: 'contains' | 'has' | 'sibling' | 'quantity' | 'layout' | 'related';
    subject: string;
    object: string;
    from?: string;
    to?: string;
}
interface DomainMeaning {
    components: Array<ComponentNode & {
        confidence: number;
    }>;
    props: Record<string, any>;
    layout: LayoutConfig | null;
    variant: string | null;
    size: string | null;
}
interface SemanticAnalysis {
    grammar: GrammarAnalysis;
    roles: SemanticRoles;
    domainMeaning: DomainMeaning;
    relationships: Relationship[];
    normalized: string[];
    embeddings: number[][];
}
type IntentType = 'create_component' | 'create_layout' | 'create_page' | 'modify' | 'combine' | 'query' | 'unknown';
interface Classification {
    label: string;
    value: number;
}
interface Intent {
    type: IntentType;
    confidence: number;
    subtype: string | null;
    alternatives: Classification[];
}
interface ExtractedEntity {
    type: 'component' | 'modifier' | 'layout' | 'quantity' | 'prop';
    value: any;
    confidence: number;
    source: string;
}
interface ProcessingContext {
    raw: string;
    tokens: TokenizedResult;
    semantics: SemanticAnalysis;
    intent: Intent;
    entities: ExtractedEntity[];
    coverage: number;
    availableComponents?: string[];
    enhanced?: any;
}
interface GeneratorResult {
    jsx: string;
    imports: string[];
    error?: string;
    suggestions?: string[];
    parsed?: any;
}
interface EngineResult extends GeneratorResult {
    confidence: number;
    processingTime: number;
    debug: {
        tokens: TokenizedResult;
        semantics: SemanticAnalysis;
        intent: Intent;
        entities: ExtractedEntity[];
        context: ProcessingContext;
    };
}
interface ComponentNode {
    name: string;
    displayName: string;
    category: string;
    props: Array<{
        name: string;
        type: string;
        required: boolean;
        default?: any;
        options?: string[];
        description: string;
    }>;
    variants: string[];
    sizes: string[];
    isContainer: boolean;
    accepts: string[];
    examples: Array<{
        prompt: string;
        output: string;
    }>;
    defaultProps: Record<string, any>;
    relatedTo: string[];
    score?: number;
}
interface CoOccurrence {
    term: string;
    weight: number;
}
interface Plugin {
    name: string;
    initialize(): Promise<void>;
    destroy?(): Promise<void>;
    enhance(context: ProcessingContext): Promise<ProcessingContext>;
    generate?(context: ProcessingContext): Promise<GeneratorResult | null>;
}
interface PluginConfig {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    [key: string]: any;
}
interface TrainingExample {
    prompt: string;
    intent?: IntentType;
    expectedOutput?: GeneratorResult;
    correction?: string;
    timestamp: number;
}
interface TrainingData {
    examples: TrainingExample[];
    version: string;
    lastUpdated: number;
}
interface EngineConfig {
    confidenceThreshold?: number;
    usePlugins?: boolean;
    fallbackToExternal?: boolean;
    debug?: boolean;
}
interface UsePromptEngineReturn {
    ready: boolean;
    error: Error | null;
    generate: (prompt: string) => Promise<EngineResult>;
    learn: (prompt: string, correction: string, expected: GeneratorResult) => Promise<void>;
    registerPlugin: (name: string, plugin: Plugin) => Promise<void>;
    setActivePlugin: (name: string) => void;
}

interface PluginEvents {
    'plugin:registered': {
        name: string;
        plugin: Plugin;
    };
    'plugin:unregistered': {
        name: string;
    };
    'plugin:error': {
        plugin: string;
        error: Error;
    };
    'plugin:activated': {
        name: string;
    };
}
/**
 * PluginManager handles registration, lifecycle, and execution
 * of plugins that can enhance the prompt processing.
 */
declare class PluginManager extends EventEmitter<PluginEvents> {
    private plugins;
    private activePlugin;
    private pluginOrder;
    constructor();
    /**
     * Register a new plugin
     */
    register(name: string, plugin: Plugin): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregister(name: string): Promise<void>;
    /**
     * Set the active plugin
     */
    setActive(name: string): void;
    /**
     * Get the active plugin
     */
    getActive(): Plugin | null;
    /**
     * Enhance context using the active plugin
     */
    enhance(context: ProcessingContext): Promise<ProcessingContext>;
    /**
     * Generate using the active plugin
     */
    generate(context: ProcessingContext): Promise<GeneratorResult | null>;
    /**
     * Run enhancement through all plugins in order
     */
    enhanceWithAll(context: ProcessingContext): Promise<ProcessingContext>;
    /**
     * Get list of available plugins
     */
    getAvailablePlugins(): string[];
    /**
     * Check if a plugin is registered
     */
    has(name: string): boolean;
    /**
     * Get plugin by name
     */
    get(name: string): Plugin | undefined;
    /**
     * Get plugin count
     */
    get count(): number;
}

interface EngineEvents {
    'ready': void;
    'error': Error;
    'learned': {
        prompt: string;
        correction: string;
        expected: any;
    };
    'generated': EngineResult;
}
/**
 * PromptEngine is the main entry point for the prompt-to-component system.
 * It orchestrates all the processing stages and manages plugins.
 */
declare class PromptEngine extends EventEmitter<EngineEvents> {
    private config;
    private lexer;
    private semantic;
    private intent;
    private entities;
    private contextBuilder;
    private knowledge;
    private generator;
    plugins: PluginManager;
    private initialized;
    private trainingExamples;
    constructor(config?: EngineConfig);
    /**
     * Initialize the engine with a UI kit schema
     */
    initialize(schema: UIKitSchema): Promise<void>;
    /**
     * Process a prompt and generate components
     */
    process(prompt: string): Promise<EngineResult>;
    /**
     * Calculate overall confidence score
     */
    private calculateConfidence;
    /**
     * Learn from a correction
     */
    learn(prompt: string, correction: string, expected: GeneratorResult): Promise<void>;
    /**
     * Infer intent type from generated output
     */
    private inferIntentFromOutput;
    /**
     * Add custom phrases from schema
     */
    private addCustomPhrases;
    /**
     * Get available components
     */
    getComponents(): string[];
    /**
     * Get component details
     */
    getComponent(name: string): any;
    /**
     * Export training data
     */
    exportTrainingData(): TrainingExample[];
    /**
     * Import training data
     */
    importTrainingData(examples: TrainingExample[]): Promise<void>;
    /**
     * Reset the engine
     */
    reset(): Promise<void>;
    /**
     * Check if engine is ready
     */
    get isReady(): boolean;
}

/**
 * Lexer handles the first stage of processing: breaking down
 * the input prompt into tokens (words and phrases) for further analysis.
 */
declare class Lexer {
    private commonPhrases;
    private stopWords;
    constructor();
    /**
     * Main tokenization method
     */
    tokenize(input: string): TokenizedResult;
    /**
     * Extract known multi-word phrases from text
     */
    private extractPhrases;
    /**
     * Split text into individual words
     */
    private splitIntoWords;
    /**
     * Normalize tokens by removing stop words and applying basic stemming
     */
    private normalize;
    /**
     * Very basic stemming - just handles common suffixes
     * For production, use a proper stemmer like Porter Stemmer
     */
    private basicStem;
    /**
     * Add custom phrases to recognize
     */
    addPhrase(phrase: string): void;
    /**
     * Add multiple phrases at once
     */
    addPhrases(phrases: string[]): void;
    /**
     * Check if a word is a stop word
     */
    isStopWord(word: string): boolean;
    /**
     * Get all recognized phrases
     */
    getPhrases(): string[];
}

/**
 * ComponentGraph represents your UI kit as a searchable knowledge graph.
 * It understands relationships between components, synonyms, and can
 * fuzzy-match user queries to your actual components.
 */
declare class ComponentGraph {
    private components;
    private categories;
    private relationships;
    private synonyms;
    private searchIndex;
    private layouts;
    private pageTemplates;
    private schema;
    constructor(schema: UIKitSchema);
    /**
     * Build the knowledge graph from schema
     */
    private buildGraph;
    /**
     * Create a component node from config
     */
    private createComponentNode;
    /**
     * Parse props configuration
     */
    private parseProps;
    /**
     * Build relationships between components
     */
    private buildRelationships;
    /**
     * Add common synonyms for UI components
     */
    private addCommonSynonyms;
    /**
     * Build Fuse.js search index
     */
    private buildSearchIndex;
    /**
     * Find a component by exact name or synonym
     */
    findComponent(name: string): ComponentNode | null;
    /**
     * Fuzzy find a component
     */
    fuzzyFindComponent(name: string): (ComponentNode & {
        score: number;
    }) | null;
    /**
     * Find a prop value for a component
     */
    findProp(value: string, componentName?: string): {
        name: string;
        value: string;
    } | null;
    /**
     * Get category for a term
     */
    getCategory(term: string): string | null;
    /**
     * Get related props for a term
     */
    getRelatedProps(term: string): string[];
    /**
     * Get co-occurring terms
     */
    getCoOccurrences(term: string): CoOccurrence[];
    /**
     * Resolve a synonym to its canonical form
     */
    resolveSynonym(term: string): string;
    /**
     * Get all synonyms
     */
    getSynonyms(): Record<string, string>;
    /**
     * Get all terms in the knowledge base
     */
    getAllTerms(): string[];
    /**
     * Get components by category
     */
    getComponentsByCategory(category: string): ComponentNode[];
    /**
     * Get all categories
     */
    getCategories(): string[];
    /**
     * Get layout template
     */
    getLayoutTemplate(type: string): LayoutConfig | null;
    /**
     * Get page template
     */
    getPageTemplate(type: string): string[] | null;
    /**
     * Get all components
     */
    getAllComponents(): ComponentNode[];
    /**
     * Check if a component is a container
     */
    isContainer(name: string): boolean;
    /**
     * Get what a container can accept
     */
    getAcceptedChildren(containerName: string): string[];
    /**
     * Export schema for training data generation
     */
    toTrainingData(): string[];
    /**
     * Utility to capitalize strings
     */
    private capitalize;
}

/**
 *  performs deep linguistic analysis on tokenized input.
 * It understands grammar, semantic roles, and maps everything to your
 * UI kit's domain.
 */
declare class SemanticAnalyzer {
    private knowledge;
    private wordVectors;
    private synonymGraph;
    private initialized;
    private actionVerbs;
    private modifierWords;
    private prepositions;
    constructor();
    /**
     * Initialize with knowledge base
     */
    initialize(knowledge: ComponentGraph): Promise<void>;
    /**
     * Main analysis method
     */
    analyze(tokens: TokenizedResult): Promise<SemanticAnalysis>;
    /**
     * Analyze grammatical structure
     */
    private analyzeGrammar;
    /**
     * Extract semantic roles (who does what to whom)
     */
    private extractSemanticRoles;
    /**
     * Map semantic understanding to domain (your UI kit)
     */
    private mapToDomain;
    /**
     * Extract relationships between entities
     */
    private extractRelationships;
    /**
     * Resolve a word to a component
     */
    private resolveComponent;
    /**
     * Resolve a modifier word
     */
    private resolveModifier;
    /**
     * Classify what type of modifier a word is
     */
    private classifyModifier;
    /**
     * Normalize modifier to standard form
     */
    private normalizeModifier;
    /**
     * Normalize action verb
     */
    private normalizeAction;
    /**
     * Extract prepositions and their objects
     */
    private extractPrepositions;
    /**
     * Check if a word is a modifier
     */
    private isModifier;
    /**
     * Check if a word is a number
     */
    private isNumber;
    /**
     * Parse quantity from text
     */
    private parseQuantity;
    /**
     * Get basic stem of a word
     */
    private getStem;
    /**
     * Build word vectors from knowledge base
     */
    private buildWordVectors;
    /**
     * Build synonym graph
     */
    private buildSynonymGraph;
    /**
     * Get embeddings for tokens
     */
    private getEmbeddings;
    /**
     * Calculate similarity between two words
     */
    similarity(word1: string, word2: string): number;
    /**
     * Add training example
     */
    addTrainingExample(prompt: string, expected: any): Promise<void>;
}

/**
 * IntentResolver determines what the user wants to do
 * based on semantic analysis of their prompt.
 */
declare class IntentResolver {
    private classifier;
    private _knowledge;
    private trained;
    private storageKey;
    constructor();
    /**
     * Initialize with knowledge base
     */
    initialize(knowledge: ComponentGraph): Promise<void>;
    /**
     * Train with base intent examples
     */
    private trainBaseIntents;
    /**
     * Resolve intent from semantic analysis
     */
    resolve(semantics: SemanticAnalysis): Promise<Intent>;
    /**
     * Refine intent based on semantic evidence
     */
    private refineIntent;
    /**
     * Get intent subtype for more specific handling
     */
    private getSubtype;
    /**
     * Add a training example
     */
    addTrainingExample(prompt: string, intent: IntentType): Promise<void>;
    /**
     * Save training state
     */
    private saveTraining;
    /**
     * Load saved training
     */
    private loadSavedTraining;
    /**
     * Reset classifier to base training
     */
    reset(): Promise<void>;
    /**
     * Export training data
     */
    exportTraining(): string;
    /**
     * Import training data
     */
    importTraining(json: string): void;
}

/**
 * EntityExtractor identifies specific entities in the prompt:
 * - Components (button, card, input)
 * - Modifiers (primary, large, disabled)
 * - Quantities (3 buttons, two columns)
 * - Props (with icon, rounded corners)
 */
declare class EntityExtractor {
    private _knowledge;
    private initialized;
    initialize(knowledge: ComponentGraph): Promise<void>;
    /**
     * Extract all entities from semantic analysis
     */
    extract(semantics: SemanticAnalysis, intent: Intent): Promise<ExtractedEntity[]>;
    /**
     * Extract component entities
     */
    private extractComponents;
    /**
     * Extract modifier entities
     */
    private extractModifiers;
    /**
     * Extract quantity entity
     */
    private extractQuantity;
    /**
     * Extract layout entity
     */
    private extractLayout;
    /**
     * Extract additional props from context
     */
    private extractProps;
    /**
     * Detect prop name from context word
     */
    private detectPropFromContext;
    /**
     * Parse number from string
     */
    private parseNumber;
}

interface ContextInput {
    raw: string;
    tokens: TokenizedResult;
    semantics: SemanticAnalysis;
    intent: Intent;
    entities: ExtractedEntity[];
}
/**
 * ContextBuilder combines all analysis results into a unified
 * context object that generators can use to produce output.
 */
declare class ContextBuilder {
    /**
     * Build processing context from all analysis results
     */
    build(input: ContextInput): ProcessingContext;
    /**
     * Calculate how much of the input we understood
     */
    private calculateCoverage;
    /**
     * Merge two contexts (useful for multi-turn conversations)
     */
    merge(base: ProcessingContext, update: Partial<ProcessingContext>): ProcessingContext;
    /**
     * Create a minimal context for simple queries
     */
    createMinimal(raw: string, componentName: string): ProcessingContext;
    /**
     * Validate context completeness
     */
    validate(context: ProcessingContext): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Get primary component from context
     */
    getPrimaryComponent(context: ProcessingContext): ExtractedEntity | null;
    /**
     * Get all modifiers grouped by type
     */
    getModifiersByType(context: ProcessingContext): Record<string, ExtractedEntity[]>;
    /**
     * Get quantity from context
     */
    getQuantity(context: ProcessingContext): number;
    /**
     * Get layout configuration from context
     */
    getLayout(context: ProcessingContext): ExtractedEntity | null;
    /**
     * Check if context indicates nested/combined components
     */
    isNested(context: ProcessingContext): boolean;
    /**
     * Extract container and children for nested structures
     */
    getNestedStructure(context: ProcessingContext): {
        container: ExtractedEntity | null;
        children: ExtractedEntity[];
    };
}

/**
 * JSXGenerator produces React JSX code from the processed context.
 * It handles single components, layouts, and nested structures.
 */
declare class JSXGenerator {
    private knowledge;
    private contextHelper;
    constructor(knowledge: ComponentGraph);
    /**
     * Generate JSX from processing context
     */
    generate(context: ProcessingContext): GeneratorResult;
    /**
     * Generate a single component
     */
    private generateSingleComponent;
    /**
     * Generate nested/combined components
     */
    private generateNested;
    /**
     * Generate layout component
     */
    private generateLayout;
    /**
     * Generate page component
     */
    private generatePage;
    /**
     * Build props for a component from context
     */
    private buildProps;
    /**
     * Build props for a child component
     */
    private buildPropsForChild;
    /**
     * Convert props object to JSX string
     */
    private propsToString;
    /**
     * Generate import statements
     */
    private generateImports;
    /**
     * Parse template section string
     */
    private parseTemplateSection;
    /**
     * Get suggestions when generation fails
     */
    private getSuggestions;
    /**
     * Capitalize first letter
     */
    private capitalize;
}

/**
 * LocalAIPlugin is the default plugin that uses the local
 * processing pipeline without external API calls.
 *
 * This can be enhanced with local ML models like brain.js
 * or TensorFlow.js for improved understanding.
 */
declare class LocalAIPlugin implements Plugin {
    name: string;
    private confidenceBoosts;
    constructor();
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    /**
     * Enhance context using local heuristics
     */
    enhance(context: ProcessingContext): Promise<ProcessingContext>;
    /**
     * Generate using local logic (optional)
     */
    generate(context: ProcessingContext): Promise<GeneratorResult | null>;
    /**
     * Learn from a correction
     */
    learn(prompt: string, correction: string): void;
    /**
     * Get confidence boost for a prompt
     */
    private getConfidenceBoost;
    /**
     * Generate a key for the prompt (simplified)
     */
    private getPromptKey;
    /**
     * Verify and potentially fix entity mappings
     */
    private verifyEntities;
}

interface ClaudeConfig extends PluginConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}
/**
 * ClaudePlugin integrates with Anthropic's Claude API
 * for enhanced understanding and generation.
 *
 * Use this when local processing confidence is low.
 */
declare class ClaudePlugin implements Plugin {
    name: string;
    private config;
    private endpoint;
    private uiKitContext;
    constructor(config: ClaudeConfig);
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    /**
     * Set UI kit schema context for Claude
     */
    setUIKitContext(schema: UIKitSchema): void;
    /**
     * Enhance context using Claude API
     */
    enhance(context: ProcessingContext): Promise<ProcessingContext>;
    /**
     * Generate JSX using Claude
     */
    generate(context: ProcessingContext): Promise<GeneratorResult | null>;
    /**
     * Make API call to Claude
     */
    private askClaude;
    /**
     * Build prompt for context enhancement
     */
    private buildEnhancePrompt;
    /**
     * Build prompt for JSX generation
     */
    private buildGeneratePrompt;
    /**
     * Merge Claude's response with existing context
     */
    private mergeResponse;
    /**
     * Parse generation response
     */
    private parseGeneratorResponse;
}

interface OpenAIConfig extends PluginConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}
/**
 * OpenAIPlugin integrates with OpenAI's API
 * for enhanced understanding and generation.
 */
declare class OpenAIPlugin implements Plugin {
    name: string;
    private config;
    private endpoint;
    private systemPrompt;
    constructor(config: OpenAIConfig);
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    /**
     * Set UI kit schema context
     */
    setUIKitContext(schema: UIKitSchema): void;
    /**
     * Enhance context using OpenAI
     */
    enhance(context: ProcessingContext): Promise<ProcessingContext>;
    /**
     * Generate JSX using OpenAI
     */
    generate(context: ProcessingContext): Promise<GeneratorResult | null>;
    /**
     * Make API call to OpenAI
     */
    private chat;
    /**
     * Build enhancement prompt
     */
    private buildEnhancePrompt;
    /**
     * Build generation prompt
     */
    private buildGeneratePrompt;
    /**
     * Merge response with context
     */
    private mergeResponse;
    /**
     * Parse generator response
     */
    private parseGeneratorResponse;
}

/**
 * React hook for using the PromptEngine in components
 *
 * @example
 * ```tsx
 * import { usePromptEngine } from 'prompt-engine';
 * import mySchema from './my-ui-kit-schema';
 *
 * function App() {
 *   const { ready, generate, learn } = usePromptEngine(mySchema);
 *   const [result, setResult] = useState(null);
 *
 *   const handleGenerate = async () => {
 *     const output = await generate("create a primary button");
 *     setResult(output);
 *   };
 *
 *   if (!ready) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate}>Generate</button>
 *       {result && <pre>{result.jsx}</pre>}
 *     </div>
 *   );
 * }
 * ```
 */
declare function usePromptEngine(schema: UIKitSchema, config?: EngineConfig): UsePromptEngineReturn;

export { type Classification, ClaudePlugin, type CoOccurrence, type ComponentConfig, ComponentGraph, type ComponentNode, ContextBuilder, type DomainMeaning, type EngineConfig, type EngineResult, EntityExtractor, type ExtractedEntity, type GeneratorResult, type GrammarAnalysis, type Intent, IntentResolver, type IntentType, JSXGenerator, type LayoutConfig, Lexer, LocalAIPlugin, OpenAIPlugin, type Plugin, type PluginConfig, PluginManager, type ProcessingContext, PromptEngine, type PropConfig, type Relationship, type ResolvedComponent, type ResolvedModifier, type SemanticAnalysis, SemanticAnalyzer, type SemanticRoles, type TokenizedResult, type TrainingData, type TrainingExample, type UIKitSchema, type UsePromptEngineReturn, PromptEngine as default, usePromptEngine };
