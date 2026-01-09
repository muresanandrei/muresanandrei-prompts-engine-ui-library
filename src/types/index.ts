// ============================================================
// PROMPT ENGINE - TYPE DEFINITIONS
// ============================================================

// ------------------------------------------------------------
// Component Schema Types
// ------------------------------------------------------------

export interface PropConfig {
  type: 'string' | 'number' | 'boolean' | 'function' | 'node' | 'object' | 'enum' | 'array';
  required?: boolean;
  default?: any;
  options?: string[];
  description?: string;
}

export interface ComponentConfig {
  displayName?: string;
  category?: string;
  aliases?: string[];
  variants?: string[];
  sizes?: string[];
  isContainer?: boolean;
  accepts?: string[];
  props?: Record<string, PropConfig>;
  defaultProps?: Record<string, any>;
  examples?: Array<{ prompt: string; output: string }>;
  relatedTo?: string[];
}

export interface LayoutConfig {
  component?: string;
  props?: Record<string, any>;
  wrapper?: boolean;
  style?: Record<string, string>;
}

export interface UIKitSchema {
  name: string;
  version: string;
  components: Record<string, ComponentConfig>;
  layouts?: Record<string, LayoutConfig>;
  pages?: Record<string, string[]>;
}

// ------------------------------------------------------------
// Lexer Types
// ------------------------------------------------------------

export interface TokenizedResult {
  original: string;
  words: string[];
  phrases: string[];
  normalized: string[];
}

// ------------------------------------------------------------
// Semantic Analysis Types
// ------------------------------------------------------------

export interface GrammarAnalysis {
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  numbers: string[];
  prepositions: Array<{ prep: string; object: string }>;
}

export interface ResolvedComponent {
  text: string;
  resolved: ComponentNode | null;
  confidence: number;
  isContainer: boolean;
}

export interface ResolvedModifier {
  text: string;
  original: string;
  type: 'variant' | 'size' | 'state' | 'style';
}

export interface SemanticRoles {
  action: string | null;
  target: ResolvedComponent | null;
  modifiers: ResolvedModifier[];
  additions: ResolvedComponent[];
  quantity: number;
  container: ResolvedComponent | null;
}

export interface Relationship {
  type: 'contains' | 'has' | 'sibling' | 'quantity' | 'layout' | 'related';
  subject: string;
  object: string;
  from?: string;
  to?: string;
}

export interface DomainMeaning {
  components: Array<ComponentNode & { confidence: number }>;
  props: Record<string, any>;
  layout: LayoutConfig | null;
  variant: string | null;
  size: string | null;
}

export interface SemanticAnalysis {
  grammar: GrammarAnalysis;
  roles: SemanticRoles;
  domainMeaning: DomainMeaning;
  relationships: Relationship[];
  normalized: string[];
  embeddings: number[][];
}

// ------------------------------------------------------------
// Intent Types
// ------------------------------------------------------------

export type IntentType = 
  | 'create_component' 
  | 'create_layout' 
  | 'create_page' 
  | 'modify' 
  | 'combine' 
  | 'query'
  | 'unknown';

export interface Classification {
  label: string;
  value: number;
}

export interface Intent {
  type: IntentType;
  confidence: number;
  subtype: string | null;
  alternatives: Classification[];
}

// ------------------------------------------------------------
// Entity Types
// ------------------------------------------------------------

export interface ExtractedEntity {
  type: 'component' | 'modifier' | 'layout' | 'quantity' | 'prop';
  value: any;
  confidence: number;
  source: string;
}

// ------------------------------------------------------------
// Context Types
// ------------------------------------------------------------

export interface ProcessingContext {
  raw: string;
  tokens: TokenizedResult;
  semantics: SemanticAnalysis;
  intent: Intent;
  entities: ExtractedEntity[];
  coverage: number;
  availableComponents?: string[];
  enhanced?: any;
}

// ------------------------------------------------------------
// Generator Types
// ------------------------------------------------------------

export interface GeneratorResult {
  jsx: string;
  imports: string[];
  error?: string;
  suggestions?: string[];
  parsed?: any;
}

// ------------------------------------------------------------
// Engine Result Types
// ------------------------------------------------------------

export interface EngineResult extends GeneratorResult {
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

// ------------------------------------------------------------
// Knowledge Graph Types
// ------------------------------------------------------------

export interface ComponentNode {
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
  examples: Array<{ prompt: string; output: string }>;
  defaultProps: Record<string, any>;
  relatedTo: string[];
  score?: number;
}

export interface CoOccurrence {
  term: string;
  weight: number;
}

// ------------------------------------------------------------
// Plugin Types
// ------------------------------------------------------------

export interface Plugin {
  name: string;
  initialize(): Promise<void>;
  destroy?(): Promise<void>;
  enhance(context: ProcessingContext): Promise<ProcessingContext>;
  generate?(context: ProcessingContext): Promise<GeneratorResult | null>;
}

export interface PluginConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  [key: string]: any;
}

// ------------------------------------------------------------
// Training Types
// ------------------------------------------------------------

export interface TrainingExample {
  prompt: string;
  intent?: IntentType;
  expectedOutput?: GeneratorResult;
  correction?: string;
  timestamp: number;
}

export interface TrainingData {
  examples: TrainingExample[];
  version: string;
  lastUpdated: number;
}

// ------------------------------------------------------------
// Engine Configuration
// ------------------------------------------------------------

export interface EngineConfig {
  confidenceThreshold?: number;
  usePlugins?: boolean;
  fallbackToExternal?: boolean;
  debug?: boolean;
}

// ------------------------------------------------------------
// Hook Types
// ------------------------------------------------------------

export interface UsePromptEngineReturn {
  ready: boolean;
  error: Error | null;
  generate: (prompt: string) => Promise<EngineResult>;
  learn: (prompt: string, correction: string, expected: GeneratorResult) => Promise<void>;
  registerPlugin: (name: string, plugin: Plugin) => Promise<void>;
  setActivePlugin: (name: string) => void;
}
