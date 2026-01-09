// ============================================================
// CONTEXT BUILDER - Build Full Understanding Context
// ============================================================

import {
  TokenizedResult,
  SemanticAnalysis,
  Intent,
  ExtractedEntity,
  ProcessingContext
} from '../types';

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
export class ContextBuilder {
  /**
   * Build processing context from all analysis results
   */
  build(input: ContextInput): ProcessingContext {
    const { raw, tokens, semantics, intent, entities } = input;

    // Calculate coverage (how much of the input we understood)
    const coverage = this.calculateCoverage(tokens, entities);

    // Get available components from entities
    const availableComponents = entities
      .filter(e => e.type === 'component')
      .map(e => e.value.name);

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
  private calculateCoverage(tokens: TokenizedResult, entities: ExtractedEntity[]): number {
    const totalTokens = tokens.normalized.length;
    if (totalTokens === 0) return 0;

    // Count tokens that we mapped to entities
    let mappedTokens = 0;

    // Component entities
    const componentEntities = entities.filter(e => e.type === 'component');
    mappedTokens += componentEntities.length;

    // Modifier entities
    const modifierEntities = entities.filter(e => e.type === 'modifier');
    mappedTokens += modifierEntities.length;

    // Quantity
    const hasQuantity = entities.some(e => e.type === 'quantity');
    if (hasQuantity) mappedTokens += 1;

    // Layout
    const hasLayout = entities.some(e => e.type === 'layout');
    if (hasLayout) mappedTokens += 1;

    // Props
    const propEntities = entities.filter(e => e.type === 'prop');
    mappedTokens += propEntities.length;

    // Avoid division by zero and cap at 1
    return Math.min(mappedTokens / totalTokens, 1);
  }

  /**
   * Merge two contexts (useful for multi-turn conversations)
   */
  merge(base: ProcessingContext, update: Partial<ProcessingContext>): ProcessingContext {
    return {
      ...base,
      ...update,
      entities: [
        ...base.entities,
        ...(update.entities || [])
      ],
      coverage: update.coverage ?? base.coverage
    };
  }

  /**
   * Create a minimal context for simple queries
   */
  createMinimal(raw: string, componentName: string): ProcessingContext {
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
          verbs: ['create'],
          adjectives: [],
          numbers: [],
          prepositions: []
        },
        roles: {
          action: 'create',
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
        type: 'create_component',
        confidence: 0.5,
        subtype: componentName,
        alternatives: []
      },
      entities: [{
        type: 'component',
        value: { name: componentName },
        confidence: 0.5,
        source: 'minimal'
      }],
      coverage: 0.5
    };
  }

  /**
   * Validate context completeness
   */
  validate(context: ProcessingContext): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    // Must have at least one entity to generate anything
    if (context.entities.length === 0) {
      missing.push('entities');
    }

    // For create intents, must have a component
    if (context.intent.type.startsWith('create')) {
      const hasComponent = context.entities.some(e => e.type === 'component');
      if (!hasComponent) {
        missing.push('component');
      }
    }

    // For layout intent, should have layout info
    if (context.intent.type === 'create_layout') {
      const hasLayout = context.entities.some(e => e.type === 'layout');
      if (!hasLayout) {
        missing.push('layout_config');
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
  getPrimaryComponent(context: ProcessingContext): ExtractedEntity | null {
    const components = context.entities.filter(e => e.type === 'component');
    
    // Sort by confidence
    components.sort((a, b) => b.confidence - a.confidence);
    
    return components[0] || null;
  }

  /**
   * Get all modifiers grouped by type
   */
  getModifiersByType(context: ProcessingContext): Record<string, ExtractedEntity[]> {
    const modifiers = context.entities.filter(e => e.type === 'modifier');
    
    const grouped: Record<string, ExtractedEntity[]> = {
      variant: [],
      size: [],
      state: [],
      style: []
    };

    modifiers.forEach(mod => {
      const type = mod.value.modifierType || 'style';
      if (grouped[type]) {
        grouped[type].push(mod);
      }
    });

    return grouped;
  }

  /**
   * Get quantity from context
   */
  getQuantity(context: ProcessingContext): number {
    const quantityEntity = context.entities.find(e => e.type === 'quantity');
    return quantityEntity?.value || 1;
  }

  /**
   * Get layout configuration from context
   */
  getLayout(context: ProcessingContext): ExtractedEntity | null {
    return context.entities.find(e => e.type === 'layout') || null;
  }

  /**
   * Check if context indicates nested/combined components
   */
  isNested(context: ProcessingContext): boolean {
    const components = context.entities.filter(e => e.type === 'component');
    
    // Multiple components suggest nesting
    if (components.length > 1) return true;
    
    // Has container relationship
    if (context.semantics.relationships.some(r => r.type === 'contains')) {
      return true;
    }
    
    // Intent is combine
    if (context.intent.type === 'combine') return true;
    
    return false;
  }

  /**
   * Extract container and children for nested structures
   */
  getNestedStructure(context: ProcessingContext): {
    container: ExtractedEntity | null;
    children: ExtractedEntity[];
  } {
    const components = context.entities.filter(e => e.type === 'component');
    
    // Find container
    let container = components.find(c => c.value.role === 'container');
    
    // If no explicit container, check if first component is a container type
    if (!container) {
      container = components.find(c => c.value.isContainer);
    }
    
    // Children are non-container components
    const children = components.filter(c => c !== container);
    
    return { container: container || null, children };
  }
}

export default ContextBuilder;
