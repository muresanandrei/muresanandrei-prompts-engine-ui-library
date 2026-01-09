// ============================================================
// PROMPT ENGINE - Main Orchestrator
// ============================================================

import { EventEmitter } from 'eventemitter3';
import {
  UIKitSchema,
  EngineConfig,
  EngineResult,
  GeneratorResult,
  ProcessingContext,
  TrainingExample
} from '../types';

import { Lexer } from './Lexer';
import { SemanticAnalyzer } from './SemanticAnalyzer';
import { IntentResolver } from './IntentResolver';
import { EntityExtractor } from './EntityExtractor';
import { ContextBuilder } from './ContextBuilder';
import { ComponentGraph } from '../knowledge/ComponentGraph';
import { JSXGenerator } from '../generators/JSXGenerator';
import { PluginManager } from '../plugins/PluginManager';
import { LocalAIPlugin } from '../plugins/LocalAIPlugin';

interface EngineEvents {
  'ready': void;
  'error': Error;
  'learned': { prompt: string; correction: string; expected: any };
  'generated': EngineResult;
}

/**
 * PromptEngine is the main entry point for the prompt-to-component system.
 * It orchestrates all the processing stages and manages plugins.
 */
export class PromptEngine extends EventEmitter<EngineEvents> {
  private config: Required<EngineConfig>;
  
  // Processing pipeline
  private lexer: Lexer;
  private semantic: SemanticAnalyzer;
  private intent: IntentResolver;
  private entities: EntityExtractor;
  private contextBuilder: ContextBuilder;
  
  // Knowledge and generation
  private knowledge!: ComponentGraph;
  private generator!: JSXGenerator;
  
  // Plugin system
  public plugins: PluginManager;
  
  // State
  private initialized: boolean = false;
  private trainingExamples: TrainingExample[] = [];

  constructor(config: EngineConfig = {}) {
    super();

    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.6,
      usePlugins: config.usePlugins ?? true,
      fallbackToExternal: config.fallbackToExternal ?? false,
      debug: config.debug ?? false
    };

    // Initialize processing pipeline
    this.lexer = new Lexer();
    this.semantic = new SemanticAnalyzer();
    this.intent = new IntentResolver();
    this.entities = new EntityExtractor();
    this.contextBuilder = new ContextBuilder();
    
    // Initialize plugin system
    this.plugins = new PluginManager();
  }

  /**
   * Initialize the engine with a UI kit schema
   */
  async initialize(schema: UIKitSchema): Promise<void> {
    try {
      // Build knowledge base from schema
      this.knowledge = new ComponentGraph(schema);

      // Initialize processors with knowledge
      await this.semantic.initialize(this.knowledge);
      await this.intent.initialize(this.knowledge);
      await this.entities.initialize(this.knowledge);

      // Initialize generator
      this.generator = new JSXGenerator(this.knowledge);

      // Register default local plugin
      const localPlugin = new LocalAIPlugin();
      await this.plugins.register('local', localPlugin);

      // Add custom phrases from schema
      this.addCustomPhrases(schema);

      this.initialized = true;
      this.emit('ready');

      if (this.config.debug) {
        console.log('PromptEngine initialized with schema:', schema.name);
      }
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Process a prompt and generate components
   */
  async process(prompt: string): Promise<EngineResult> {
    if (!this.initialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      // Step 1: Tokenize
      const tokens = this.lexer.tokenize(prompt);
      if (this.config.debug) {
        console.log('Tokens:', tokens);
      }

      // Step 2: Semantic analysis
      const semantics = await this.semantic.analyze(tokens);
      if (this.config.debug) {
        console.log('Semantics:', semantics);
      }

      // Step 3: Intent resolution
      const intentResult = await this.intent.resolve(semantics);
      if (this.config.debug) {
        console.log('Intent:', intentResult);
      }

      // Step 4: Entity extraction
      const entitiesResult = await this.entities.extract(semantics, intentResult);
      if (this.config.debug) {
        console.log('Entities:', entitiesResult);
      }

      // Step 5: Build context
      let context = this.contextBuilder.build({
        raw: prompt,
        tokens,
        semantics,
        intent: intentResult,
        entities: entitiesResult
      });

      // Step 6: Calculate confidence
      const confidence = this.calculateConfidence(context);

      // Step 7: Plugin enhancement if needed
      if (this.config.usePlugins && confidence < this.config.confidenceThreshold) {
        context = await this.plugins.enhance(context);
      }

      // Step 8: Generate JSX
      const result = this.generator.generate(context);

      const engineResult: EngineResult = {
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

      this.emit('generated', engineResult);

      return engineResult;
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(context: ProcessingContext): number {
    const scores = {
      intent: context.intent.confidence,
      entities: context.entities.length > 0 
        ? Math.min(context.entities.reduce((sum, e) => sum + e.confidence, 0) / context.entities.length, 1)
        : 0.2,
      coverage: context.coverage
    };

    // Weighted average
    return (
      scores.intent * 0.4 +
      scores.entities * 0.4 +
      scores.coverage * 0.2
    );
  }

  /**
   * Learn from a correction
   */
  async learn(
    prompt: string,
    correction: string,
    expected: GeneratorResult
  ): Promise<void> {
    // Store training example
    this.trainingExamples.push({
      prompt,
      correction,
      expectedOutput: expected,
      timestamp: Date.now()
    });

    // Update intent classifier
    if (expected.jsx) {
      // Infer intent from expected output
      const inferredIntent = this.inferIntentFromOutput(expected);
      await this.intent.addTrainingExample(prompt, inferredIntent);
    }

    // Update semantic analyzer
    await this.semantic.addTrainingExample(prompt, expected);

    // Notify local plugin
    const localPlugin = this.plugins.get('local') as LocalAIPlugin | undefined;
    if (localPlugin && typeof localPlugin.learn === 'function') {
      localPlugin.learn(prompt, correction);
    }

    this.emit('learned', { prompt, correction, expected });

    if (this.config.debug) {
      console.log('Learned from correction:', { prompt, correction });
    }
  }

  /**
   * Infer intent type from generated output
   */
  private inferIntentFromOutput(output: GeneratorResult): any {
    const jsx = output.jsx.toLowerCase();
    
    if (jsx.includes('page') || jsx.includes('layout')) {
      return 'create_page';
    }
    if (jsx.includes('grid') || jsx.includes('flex') || jsx.includes('column')) {
      return 'create_layout';
    }
    if ((jsx.match(/<\w+/g) || []).length > 2) {
      return 'combine';
    }
    return 'create_component';
  }

  /**
   * Add custom phrases from schema
   */
  private addCustomPhrases(schema: UIKitSchema): void {
    // Add component name variations
    Object.entries(schema.components).forEach(([name, config]) => {
      // Add aliases as phrases
      if (config.aliases) {
        this.lexer.addPhrases(config.aliases);
      }
      
      // Add component + variant combinations
      if (config.variants) {
        config.variants.forEach(variant => {
          this.lexer.addPhrase(`${variant} ${name}`);
        });
      }
    });

    // Add layout phrases
    if (schema.layouts) {
      Object.keys(schema.layouts).forEach(layoutName => {
        this.lexer.addPhrase(layoutName.replace(/-/g, ' '));
      });
    }

    // Add page phrases
    if (schema.pages) {
      Object.keys(schema.pages).forEach(pageName => {
        this.lexer.addPhrase(`${pageName} page`);
      });
    }
  }

  /**
   * Get available components
   */
  getComponents(): string[] {
    if (!this.initialized) return [];
    return this.knowledge.getAllComponents().map(c => c.name);
  }

  /**
   * Get component details
   */
  getComponent(name: string): any {
    if (!this.initialized) return null;
    return this.knowledge.findComponent(name);
  }

  /**
   * Export training data
   */
  exportTrainingData(): TrainingExample[] {
    return [...this.trainingExamples];
  }

  /**
   * Import training data
   */
  async importTrainingData(examples: TrainingExample[]): Promise<void> {
    for (const example of examples) {
      if (example.expectedOutput) {
        await this.learn(
          example.prompt,
          example.correction || '',
          example.expectedOutput
        );
      }
    }
  }

  /**
   * Reset the engine
   */
  async reset(): Promise<void> {
    this.trainingExamples = [];
    await this.intent.reset();
    
    if (this.config.debug) {
      console.log('PromptEngine reset');
    }
  }

  /**
   * Check if engine is ready
   */
  get isReady(): boolean {
    return this.initialized;
  }
}

export default PromptEngine;
