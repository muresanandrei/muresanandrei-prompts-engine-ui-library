// ============================================================
// ENTITY EXTRACTOR - Extract Components, Props, Values
// ============================================================

import {
  SemanticAnalysis,
  Intent,
  ExtractedEntity
} from '../types';
import { ComponentGraph } from '../knowledge/ComponentGraph';

/**
 * EntityExtractor identifies specific entities in the prompt:
 * - Components (button, card, input)
 * - Modifiers (primary, large, disabled)
 * - Quantities (3 buttons, two columns)
 * - Props (with icon, rounded corners)
 */
export class EntityExtractor {
  private _knowledge!: ComponentGraph;
  private initialized: boolean = false;

  async initialize(knowledge: ComponentGraph): Promise<void> {
    this._knowledge = knowledge;
    this.initialized = true;
  }

  /**
   * Extract all entities from semantic analysis
   */
  async extract(semantics: SemanticAnalysis, intent: Intent): Promise<ExtractedEntity[]> {
    if (!this.initialized) {
      throw new Error('EntityExtractor not initialized');
    }

    const entities: ExtractedEntity[] = [];

    // Extract components
    const components = this.extractComponents(semantics);
    entities.push(...components);

    // Extract modifiers
    const modifiers = this.extractModifiers(semantics);
    entities.push(...modifiers);

    // Extract quantity
    const quantity = this.extractQuantity(semantics);
    if (quantity) {
      entities.push(quantity);
    }

    // Extract layout info
    const layout = this.extractLayout(semantics, intent);
    if (layout) {
      entities.push(layout);
    }

    // Extract props from context
    const props = this.extractProps(semantics);
    entities.push(...props);

    return entities;
  }

  /**
   * Extract component entities
   */
  private extractComponents(semantics: SemanticAnalysis): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // From domain meaning
    semantics.domainMeaning.components.forEach(comp => {
      entities.push({
        type: 'component',
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
        source: 'semantic'
      });
    });

    // From semantic roles
    if (semantics.roles.target?.resolved) {
      // Avoid duplicates
      const exists = entities.some(e => 
        e.type === 'component' && 
        e.value.name === semantics.roles.target!.resolved!.name
      );
      
      if (!exists) {
        entities.push({
          type: 'component',
          value: semantics.roles.target.resolved,
          confidence: semantics.roles.target.confidence,
          source: 'role_target'
        });
      }
    }

    // Container
    if (semantics.roles.container?.resolved) {
      entities.push({
        type: 'component',
        value: {
          ...semantics.roles.container.resolved,
          role: 'container'
        },
        confidence: semantics.roles.container.confidence,
        source: 'role_container'
      });
    }

    // Additions
    semantics.roles.additions.forEach(addition => {
      if (addition.resolved) {
        entities.push({
          type: 'component',
          value: {
            ...addition.resolved,
            role: 'child'
          },
          confidence: addition.confidence,
          source: 'role_addition'
        });
      }
    });

    return entities;
  }

  /**
   * Extract modifier entities
   */
  private extractModifiers(semantics: SemanticAnalysis): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    semantics.roles.modifiers.forEach(mod => {
      entities.push({
        type: 'modifier',
        value: {
          text: mod.text,
          original: mod.original,
          modifierType: mod.type
        },
        confidence: 0.9,
        source: 'role_modifier'
      });
    });

    // Also extract from domain meaning props
    if (semantics.domainMeaning.variant) {
      const exists = entities.some(e => 
        e.type === 'modifier' && 
        e.value.text === semantics.domainMeaning.variant
      );
      
      if (!exists) {
        entities.push({
          type: 'modifier',
          value: {
            text: semantics.domainMeaning.variant,
            modifierType: 'variant'
          },
          confidence: 0.95,
          source: 'domain_variant'
        });
      }
    }

    if (semantics.domainMeaning.size) {
      const exists = entities.some(e => 
        e.type === 'modifier' && 
        e.value.text === semantics.domainMeaning.size
      );
      
      if (!exists) {
        entities.push({
          type: 'modifier',
          value: {
            text: semantics.domainMeaning.size,
            modifierType: 'size'
          },
          confidence: 0.95,
          source: 'domain_size'
        });
      }
    }

    return entities;
  }

  /**
   * Extract quantity entity
   */
  private extractQuantity(semantics: SemanticAnalysis): ExtractedEntity | null {
    if (semantics.roles.quantity > 1) {
      return {
        type: 'quantity',
        value: semantics.roles.quantity,
        confidence: 0.95,
        source: 'role_quantity'
      };
    }

    // Check grammar numbers
    if (semantics.grammar.numbers.length > 0) {
      const num = this.parseNumber(semantics.grammar.numbers[0]);
      if (num > 1) {
        return {
          type: 'quantity',
          value: num,
          confidence: 0.9,
          source: 'grammar_number'
        };
      }
    }

    return null;
  }

  /**
   * Extract layout entity
   */
  private extractLayout(semantics: SemanticAnalysis, intent: Intent): ExtractedEntity | null {
    // From relationships
    const layoutRel = semantics.relationships.find(r => r.type === 'layout');
    if (layoutRel) {
      return {
        type: 'layout',
        value: {
          type: layoutRel.object,
          columns: this.parseNumber(layoutRel.object)
        },
        confidence: 0.85,
        source: 'relationship'
      };
    }

    // From domain meaning
    if (semantics.domainMeaning.layout) {
      return {
        type: 'layout',
        value: semantics.domainMeaning.layout,
        confidence: 0.9,
        source: 'domain_layout'
      };
    }

    // From intent subtype
    if (intent.type === 'create_layout' && intent.subtype) {
      return {
        type: 'layout',
        value: {
          type: intent.subtype
        },
        confidence: 0.8,
        source: 'intent_subtype'
      };
    }

    return null;
  }

  /**
   * Extract additional props from context
   */
  private extractProps(semantics: SemanticAnalysis): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Check prepositions for additional info
    semantics.grammar.prepositions.forEach(prep => {
      if (prep.prep === 'with') {
        // "with icon", "with shadow", etc.
        const propName = this.detectPropFromContext(prep.object);
        if (propName) {
          entities.push({
            type: 'prop',
            value: {
              name: propName,
              value: true
            },
            confidence: 0.8,
            source: 'preposition_with'
          });
        }
      }
    });

    return entities;
  }

  /**
   * Detect prop name from context word
   */
  private detectPropFromContext(word: string): string | null {
    const propMap: Record<string, string> = {
      'icon': 'icon',
      'icons': 'icon',
      'shadow': 'shadow',
      'shadows': 'shadow',
      'border': 'bordered',
      'borders': 'bordered',
      'rounded': 'rounded',
      'radius': 'rounded',
      'loading': 'loading',
      'spinner': 'loading',
      'disabled': 'disabled',
      'hover': 'hover',
      'animation': 'animated',
      'animated': 'animated'
    };

    return propMap[word.toLowerCase()] || null;
  }

  /**
   * Parse number from string
   */
  private parseNumber(text: string): number {
    const wordNums: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12
    };

    const lower = text.toLowerCase();
    return wordNums[lower] || parseInt(text) || 1;
  }
}

export default EntityExtractor;