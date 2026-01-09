// ============================================================
// COMPONENT GRAPH - Knowledge Base for UI Kit
// ============================================================

import Fuse from 'fuse.js';
import {
  UIKitSchema,
  ComponentConfig,
  ComponentNode,
  PropConfig,
  LayoutConfig,
  CoOccurrence,
  Relationship
} from '../types';

/**
 * ComponentGraph represents your UI kit as a searchable knowledge graph.
 * It understands relationships between components, synonyms, and can
 * fuzzy-match user queries to your actual components.
 */
export class ComponentGraph {
  private components: Map<string, ComponentNode>;
  private categories: Map<string, string[]>;
  private relationships: Relationship[];
  private synonyms: Map<string, string>;
  private searchIndex!: Fuse<ComponentNode & { searchText: string }>;
  private layouts: Record<string, LayoutConfig>;
  private pageTemplates: Record<string, string[]>;
  private schema: UIKitSchema;

  constructor(schema: UIKitSchema) {
    this.schema = schema;
    this.components = new Map();
    this.categories = new Map();
    this.relationships = [];
    this.synonyms = new Map();
    this.layouts = {};
    this.pageTemplates = {};

    this.buildGraph(schema);
    this.buildSearchIndex();
  }

  /**
   * Build the knowledge graph from schema
   */
  private buildGraph(schema: UIKitSchema): void {
    // Process components
    Object.entries(schema.components).forEach(([name, config]) => {
      const node = this.createComponentNode(name, config);
      this.components.set(name.toLowerCase(), node);

      // Index by category
      if (!this.categories.has(node.category)) {
        this.categories.set(node.category, []);
      }
      this.categories.get(node.category)!.push(name);

      // Index aliases as synonyms
      if (config.aliases) {
        config.aliases.forEach(alias => {
          this.synonyms.set(alias.toLowerCase(), name.toLowerCase());
        });
      }
    });

    // Build relationships
    this.buildRelationships();

    // Store layouts and page templates
    if (schema.layouts) {
      this.layouts = schema.layouts;
    }
    if (schema.pages) {
      this.pageTemplates = schema.pages;
    }

    // Add common synonyms
    this.addCommonSynonyms();
  }

  /**
   * Create a component node from config
   */
  private createComponentNode(name: string, config: ComponentConfig): ComponentNode {
    return {
      name: name.toLowerCase(),
      displayName: config.displayName || this.capitalize(name),
      category: config.category || 'misc',
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
  private parseProps(propsConfig: Record<string, PropConfig>): ComponentNode['props'] {
    return Object.entries(propsConfig).map(([name, config]) => ({
      name,
      type: config.type || 'string',
      required: config.required || false,
      default: config.default,
      options: config.options,
      description: config.description || ''
    }));
  }

  /**
   * Build relationships between components
   */
  private buildRelationships(): void {
    this.components.forEach((node, name) => {
      // Related components
      node.relatedTo.forEach(related => {
        this.relationships.push({
          from: name,
          to: related.toLowerCase(),
          type: 'related',
          subject: name,
          object: related
        });
      });

      // Container relationships
      node.accepts.forEach(child => {
        this.relationships.push({
          from: name,
          to: child === '*' ? 'any' : child.toLowerCase(),
          type: 'contains',
          subject: name,
          object: child
        });
      });
    });
  }

  /**
   * Add common synonyms for UI components
   */
  private addCommonSynonyms(): void {
    const commonSynonyms: Record<string, string> = {
      // Component synonyms
      'btn': 'button',
      'cta': 'button',
      'action': 'button',
      'textbox': 'input',
      'textfield': 'input',
      'text input': 'input',
      'text field': 'input',
      'dropdown': 'select',
      'picker': 'select',
      'combobox': 'select',
      'nav': 'navigation',
      'navbar': 'navigation',
      'menu': 'navigation',
      'popup': 'modal',
      'dialog': 'modal',
      'overlay': 'modal',
      'panel': 'card',
      'box': 'card',
      'container': 'card',
      'img': 'image',
      'picture': 'image',
      'photo': 'image',
      'heading': 'title',
      'header': 'title',
      'h1': 'title',
      'paragraph': 'text',
      'copy': 'text',
      'label': 'text',

      // Modifier synonyms  
      'big': 'large',
      'huge': 'xl',
      'extra large': 'xl',
      'small': 'sm',
      'tiny': 'xs',
      'extra small': 'xs',
      'medium': 'md',
      'main': 'primary',
      'default': 'primary',
      'alt': 'secondary',
      'alternate': 'secondary',
      'warning': 'danger',
      'error': 'danger',
      'destructive': 'danger',
      'positive': 'success',
      'confirm': 'success',

      // Layout synonyms
      'horizontal': 'row',
      'inline': 'row',
      'vertical': 'column',
      'stack': 'column',
      'stacked': 'column',
      'centered': 'center',
      'middle': 'center'
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
  private buildSearchIndex(): void {
    const searchableItems = Array.from(this.components.values()).map(comp => ({
      ...comp,
      searchText: [
        comp.name,
        comp.displayName,
        ...comp.variants,
        ...comp.sizes,
        comp.category
      ].join(' ')
    }));

    this.searchIndex = new Fuse(searchableItems, {
      keys: ['name', 'displayName', 'searchText', 'category'],
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
  findComponent(name: string): ComponentNode | null {
    const lower = name.toLowerCase();

    // Direct match
    if (this.components.has(lower)) {
      return this.components.get(lower)!;
    }

    // Synonym match
    const resolved = this.synonyms.get(lower);
    if (resolved && this.components.has(resolved)) {
      return this.components.get(resolved)!;
    }

    return null;
  }

  /**
   * Fuzzy find a component
   */
  fuzzyFindComponent(name: string): (ComponentNode & { score: number }) | null {
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
  findProp(value: string, componentName?: string): { name: string; value: string } | null {
    const lower = value.toLowerCase();

    // If component specified, check its specific props
    if (componentName) {
      const component = this.components.get(componentName.toLowerCase());
      if (component) {
        // Check variants
        if (component.variants.includes(lower)) {
          return { name: 'variant', value: lower };
        }

        // Check sizes
        const sizeMap: Record<string, string> = {
          'small': 'sm', 'medium': 'md', 'large': 'lg',
          'extra small': 'xs', 'extra large': 'xl'
        };
        const normalizedSize = sizeMap[lower] || lower;
        if (component.sizes.includes(normalizedSize)) {
          return { name: 'size', value: normalizedSize };
        }

        // Check prop options
        for (const prop of component.props) {
          if (prop.options && prop.options.includes(lower)) {
            return { name: prop.name, value: lower };
          }
        }
      }
    }

    // Generic variant/size detection
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning', 'info', 'outline'];
    if (variants.includes(lower)) {
      return { name: 'variant', value: lower };
    }

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const sizeMap: Record<string, string> = {
      'small': 'sm', 'medium': 'md', 'large': 'lg',
      'tiny': 'xs', 'huge': 'xl', 'big': 'lg'
    };
    const normalizedSize = sizeMap[lower] || lower;
    if (sizes.includes(normalizedSize)) {
      return { name: 'size', value: normalizedSize };
    }

    return null;
  }

  /**
   * Get category for a term
   */
  getCategory(term: string): string | null {
    const component = this.findComponent(term);
    return component?.category || null;
  }

  /**
   * Get related props for a term
   */
  getRelatedProps(term: string): string[] {
    const component = this.findComponent(term);
    return component?.props.map(p => p.name) || [];
  }

  /**
   * Get co-occurring terms
   */
  getCoOccurrences(term: string): CoOccurrence[] {
    const component = this.findComponent(term);
    if (!component) return [];

    const coOccurrences: CoOccurrence[] = [];

    // From relationships
    this.relationships
      .filter(r => r.from === component.name || r.to === component.name)
      .forEach(r => {
        const other = r.from === component.name ? r.to : r.from;
        if (other && other !== 'any') {
          coOccurrences.push({
            term: other,
            weight: r.type === 'contains' ? 1 : 0.5
          });
        }
      });

    // From same category
    const sameCategory = this.categories.get(component.category) || [];
    sameCategory
      .filter(c => c.toLowerCase() !== component.name)
      .forEach(c => {
        coOccurrences.push({ term: c, weight: 0.3 });
      });

    return coOccurrences;
  }

  /**
   * Resolve a synonym to its canonical form
   */
  resolveSynonym(term: string): string {
    return this.synonyms.get(term.toLowerCase()) || term.toLowerCase();
  }

  /**
   * Get all synonyms
   */
  getSynonyms(): Record<string, string> {
    return Object.fromEntries(this.synonyms);
  }

  /**
   * Get all terms in the knowledge base
   */
  getAllTerms(): string[] {
    const terms = new Set<string>();

    this.components.forEach((comp) => {
      terms.add(comp.name);
      terms.add(comp.displayName);
      comp.variants.forEach(v => terms.add(v));
      comp.sizes.forEach(s => terms.add(s));
      comp.props.forEach(p => {
        terms.add(p.name);
        if (p.options) p.options.forEach(o => terms.add(o));
      });
    });

    this.synonyms.forEach((_, alias) => terms.add(alias));

    return Array.from(terms);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentNode[] {
    const names = this.categories.get(category) || [];
    return names
      .map(name => this.components.get(name.toLowerCase()))
      .filter((c): c is ComponentNode => c !== undefined);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get layout template
   */
  getLayoutTemplate(type: string): LayoutConfig | null {
    return this.layouts[type] || null;
  }

  /**
   * Get page template
   */
  getPageTemplate(type: string): string[] | null {
    return this.pageTemplates[type] || null;
  }

  /**
   * Get all components
   */
  getAllComponents(): ComponentNode[] {
    return Array.from(this.components.values());
  }

  /**
   * Check if a component is a container
   */
  isContainer(name: string): boolean {
    const component = this.findComponent(name);
    return component?.isContainer || false;
  }

  /**
   * Get what a container can accept
   */
  getAcceptedChildren(containerName: string): string[] {
    const component = this.findComponent(containerName);
    if (!component || !component.isContainer) return [];
    
    if (component.accepts.includes('*')) {
      return Array.from(this.components.keys());
    }
    return component.accepts;
  }

  /**
   * Export schema for training data generation
   */
  toTrainingData(): string[] {
    const data: string[] = [];

    this.components.forEach((comp) => {
      // Basic creation prompts
      data.push(`create a ${comp.name}`);
      data.push(`make ${comp.name}`);
      data.push(`add ${comp.name}`);
      data.push(`i need a ${comp.name}`);
      data.push(`give me a ${comp.name}`);

      // Variant prompts
      comp.variants.forEach(v => {
        data.push(`${v} ${comp.name}`);
        data.push(`create a ${v} ${comp.name}`);
        data.push(`make a ${v} ${comp.name}`);
      });

      // Size prompts
      comp.sizes.forEach(s => {
        data.push(`${s} ${comp.name}`);
        data.push(`create a ${s} ${comp.name}`);
        const sizeWords: Record<string, string> = { 
          'sm': 'small', 'md': 'medium', 'lg': 'large', 
          'xs': 'tiny', 'xl': 'huge' 
        };
        const sizeWord = sizeWords[s];
        if (sizeWord) {
          data.push(`${sizeWord} ${comp.name}`);
        }
      });

      // Combined prompts
      comp.variants.forEach(v => {
        comp.sizes.forEach(s => {
          data.push(`${s} ${v} ${comp.name}`);
          data.push(`create a ${s} ${v} ${comp.name}`);
        });
      });

      // From examples
      comp.examples.forEach(ex => {
        data.push(ex.prompt);
      });
    });

    return data;
  }

  /**
   * Utility to capitalize strings
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default ComponentGraph;