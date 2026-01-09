// ============================================================
// LOCAL AI PLUGIN - Default Plugin Using Local Processing
// ============================================================

import {
  Plugin,
  ProcessingContext,
  GeneratorResult
} from '../types';

/**
 * LocalAIPlugin is the default plugin that uses the local
 * processing pipeline without external API calls.
 * 
 * This can be enhanced with local ML models like brain.js
 * or TensorFlow.js for improved understanding.
 */
export class LocalAIPlugin implements Plugin {
  name = 'local';
  private confidenceBoosts: Map<string, number>;

  constructor() {
    this.confidenceBoosts = new Map();
  }

  async initialize(): Promise<void> {
    // Load any local models or configuration
    console.log('LocalAIPlugin initialized');
  }

  async destroy(): Promise<void> {
    // Cleanup resources
    this.confidenceBoosts.clear();
  }

  /**
   * Enhance context using local heuristics
   */
  async enhance(context: ProcessingContext): Promise<ProcessingContext> {
    // Apply local enhancements
    const enhanced = { ...context };

    // Boost confidence based on learned patterns
    if (enhanced.intent.confidence < 0.8) {
      const boost = this.getConfidenceBoost(context.raw);
      if (boost > 0) {
        enhanced.intent = {
          ...enhanced.intent,
          confidence: Math.min(enhanced.intent.confidence + boost, 1)
        };
      }
    }

    // Verify entity mappings
    enhanced.entities = this.verifyEntities(enhanced.entities);

    return enhanced;
  }

  /**
   * Generate using local logic (optional)
   */
  async generate(context: ProcessingContext): Promise<GeneratorResult | null> {
    // Local plugin doesn't generate directly
    // It just enhances the context for the main generator
    return null;
  }

  /**
   * Learn from a correction
   */
  learn(prompt: string, correction: string): void {
    // Simple learning: boost confidence for similar prompts
    const key = this.getPromptKey(prompt);
    const currentBoost = this.confidenceBoosts.get(key) || 0;
    this.confidenceBoosts.set(key, Math.min(currentBoost + 0.1, 0.3));
  }

  /**
   * Get confidence boost for a prompt
   */
  private getConfidenceBoost(prompt: string): number {
    const key = this.getPromptKey(prompt);
    return this.confidenceBoosts.get(key) || 0;
  }

  /**
   * Generate a key for the prompt (simplified)
   */
  private getPromptKey(prompt: string): string {
    // Simple key: first few words normalized
    return prompt
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
  }

  /**
   * Verify and potentially fix entity mappings
   */
  private verifyEntities(entities: ProcessingContext['entities']): ProcessingContext['entities'] {
    return entities.map(entity => {
      // Ensure minimum confidence
      if (entity.confidence < 0.3) {
        return { ...entity, confidence: 0.3 };
      }
      return entity;
    });
  }
}

export default LocalAIPlugin;
