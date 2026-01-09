// ============================================================
// JSX GENERATOR - Generate React JSX from Context
// ============================================================

import {
  ProcessingContext,
  GeneratorResult,
  ExtractedEntity
} from '../types';
import { ComponentGraph } from '../knowledge/ComponentGraph';
import { ContextBuilder } from '../core/ContextBuilder';

/**
 * JSXGenerator produces React JSX code from the processed context.
 * It handles single components, layouts, and nested structures.
 */
export class JSXGenerator {
  private knowledge: ComponentGraph;
  private contextHelper: ContextBuilder;

  constructor(knowledge: ComponentGraph) {
    this.knowledge = knowledge;
    this.contextHelper = new ContextBuilder();
  }

  /**
   * Generate JSX from processing context
   */
  generate(context: ProcessingContext): GeneratorResult {
    // Validate context
    const validation = this.contextHelper.validate(context);
    if (!validation.valid) {
      return {
        jsx: '',
        imports: [],
        error: `Cannot generate: missing ${validation.missing.join(', ')}`,
        suggestions: this.getSuggestions(context)
      };
    }

    // Determine generation strategy
    if (this.contextHelper.isNested(context)) {
      return this.generateNested(context);
    }

    if (context.intent.type === 'create_layout') {
      return this.generateLayout(context);
    }

    if (context.intent.type === 'create_page') {
      return this.generatePage(context);
    }

    // Default: single component
    return this.generateSingleComponent(context);
  }

  /**
   * Generate a single component
   */
  private generateSingleComponent(context: ProcessingContext): GeneratorResult {
    const primaryComponent = this.contextHelper.getPrimaryComponent(context);
    if (!primaryComponent) {
      return {
        jsx: '',
        imports: [],
        error: 'No component found to generate'
      };
    }

    const componentName = this.capitalize(primaryComponent.value.name);
    const props = this.buildProps(context, primaryComponent);
    const quantity = this.contextHelper.getQuantity(context);

    // Generate JSX
    const propsString = this.propsToString(props);
    const element = propsString
      ? `<${componentName} ${propsString} />`
      : `<${componentName} />`;

    let jsx: string;
    if (quantity > 1) {
      jsx = Array(quantity).fill(element).join('\n');
    } else {
      jsx = element;
    }

    // Generate imports
    const imports = this.generateImports([componentName]);

    return { jsx, imports };
  }

  /**
   * Generate nested/combined components
   */
  private generateNested(context: ProcessingContext): GeneratorResult {
    const { container, children } = this.contextHelper.getNestedStructure(context);

    if (!container && children.length === 0) {
      return {
        jsx: '',
        imports: [],
        error: 'No components found for nested structure'
      };
    }

    const imports: string[] = [];
    let jsx: string;

    if (container) {
      const containerName = this.capitalize(container.value.name);
      imports.push(containerName);

      const containerProps = this.buildProps(context, container);
      const propsString = this.propsToString(containerProps);

      // Generate children
      const childrenJsx = children.map(child => {
        const childName = this.capitalize(child.value.name);
        imports.push(childName);

        const childProps = this.buildPropsForChild(child);
        const childPropsStr = this.propsToString(childProps);

        return childPropsStr
          ? `    <${childName} ${childPropsStr} />`
          : `    <${childName} />`;
      }).join('\n');

      jsx = propsString
        ? `<${containerName} ${propsString}>\n${childrenJsx}\n</${containerName}>`
        : `<${containerName}>\n${childrenJsx}\n</${containerName}>`;
    } else {
      // No container, just wrap in fragment
      const childrenJsx = children.map(child => {
        const childName = this.capitalize(child.value.name);
        imports.push(childName);

        const childProps = this.buildPropsForChild(child);
        const childPropsStr = this.propsToString(childProps);

        return childPropsStr
          ? `  <${childName} ${childPropsStr} />`
          : `  <${childName} />`;
      }).join('\n');

      jsx = `<>\n${childrenJsx}\n</>`;
    }

    return {
      jsx,
      imports: this.generateImports([...new Set(imports)])
    };
  }

  /**
   * Generate layout component
   */
  private generateLayout(context: ProcessingContext): GeneratorResult {
    const layoutEntity = this.contextHelper.getLayout(context);
    const components = context.entities.filter(e => e.type === 'component');
    const quantity = this.contextHelper.getQuantity(context);

    // Determine layout type
    let layoutType = 'flex';
    let layoutProps: Record<string, any> = {};

    if (layoutEntity) {
      const layoutValue = layoutEntity.value;
      
      if (layoutValue.type === 'grid' || layoutValue.columns) {
        layoutType = 'grid';
        layoutProps = {
          style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${layoutValue.columns || 2}, 1fr)`,
            gap: '1rem'
          }
        };
      } else if (layoutValue.type === 'columns') {
        layoutType = 'grid';
        const cols = parseInt(layoutValue.type) || 2;
        layoutProps = {
          style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '1rem'
          }
        };
      } else if (layoutValue.type === 'rows' || layoutValue.type === 'column') {
        layoutProps = {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }
        };
      } else {
        layoutProps = {
          style: {
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem'
          }
        };
      }
    }

    // Generate children
    const imports: string[] = [];
    let childrenJsx: string;

    if (components.length > 0) {
      childrenJsx = components.map(comp => {
        const name = this.capitalize(comp.value.name);
        imports.push(name);
        return `    <${name} />`;
      }).join('\n');
    } else if (quantity > 1) {
      // Generate placeholder children
      childrenJsx = Array(quantity)
        .fill(null)
        .map((_, i) => `    <div>Item ${i + 1}</div>`)
        .join('\n');
    } else {
      childrenJsx = '    {/* Add children here */}';
    }

    const styleString = JSON.stringify(layoutProps.style);
    const jsx = `<div style={${styleString}}>\n${childrenJsx}\n</div>`;

    return {
      jsx,
      imports: this.generateImports(imports)
    };
  }

  /**
   * Generate page component
   */
  private generatePage(context: ProcessingContext): GeneratorResult {
    const pageType = context.intent.subtype || 'custom';
    const pageTemplate = this.knowledge.getPageTemplate(pageType);

    const imports: string[] = [];
    let sections: string[] = [];

    if (pageTemplate) {
      // Use template
      sections = pageTemplate.map(section => {
        const parsed = this.parseTemplateSection(section);
        imports.push(...parsed.imports);
        return parsed.jsx;
      });
    } else {
      // Generate basic page structure
      sections = [
        '  <header>\n    <h1>Page Title</h1>\n  </header>',
        '  <main>\n    {/* Main content */}\n  </main>',
        '  <footer>\n    {/* Footer */}\n  </footer>'
      ];
    }

    const jsx = `<div className="page ${pageType}-page">\n${sections.join('\n\n')}\n</div>`;

    return {
      jsx,
      imports: this.generateImports([...new Set(imports)])
    };
  }

  /**
   * Build props for a component from context
   */
  private buildProps(context: ProcessingContext, component: ExtractedEntity): Record<string, any> {
    const props: Record<string, any> = {};
    const modifiers = this.contextHelper.getModifiersByType(context);

    // Add variant
    if (modifiers.variant.length > 0) {
      props.variant = modifiers.variant[0].value.text;
    }

    // Add size
    if (modifiers.size.length > 0) {
      props.size = modifiers.size[0].value.text;
    }

    // Add state props
    modifiers.state.forEach(state => {
      props[state.value.text] = true;
    });

    // Add props from entities
    context.entities
      .filter(e => e.type === 'prop')
      .forEach(prop => {
        props[prop.value.name] = prop.value.value;
      });

    // Apply component defaults
    const componentDef = this.knowledge.findComponent(component.value.name);
    if (componentDef?.defaultProps) {
      Object.entries(componentDef.defaultProps).forEach(([key, value]) => {
        if (!(key in props)) {
          // Don't include defaults that match the default
          // props[key] = value;
        }
      });
    }

    return props;
  }

  /**
   * Build props for a child component
   */
  private buildPropsForChild(child: ExtractedEntity): Record<string, any> {
    const props: Record<string, any> = {};

    // Check if child has embedded props
    if (child.value.props) {
      // These might be default props, apply selectively
    }

    return props;
  }

  /**
   * Convert props object to JSX string
   */
  private propsToString(props: Record<string, any>): string {
    const parts: string[] = [];

    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          parts.push(key); // Boolean true: just the prop name
        }
        // Skip false booleans
      } else if (typeof value === 'string') {
        parts.push(`${key}="${value}"`);
      } else if (typeof value === 'number') {
        parts.push(`${key}={${value}}`);
      } else if (typeof value === 'object') {
        parts.push(`${key}={${JSON.stringify(value)}}`);
      }
    });

    return parts.join(' ');
  }

  /**
   * Generate import statements
   */
  private generateImports(componentNames: string[]): string[] {
    if (componentNames.length === 0) return [];

    // Group by assumed source
    const kitComponents = componentNames.filter(name => 
      this.knowledge.findComponent(name.toLowerCase())
    );

    const imports: string[] = [];

    if (kitComponents.length > 0) {
      imports.push(
        `import { ${kitComponents.join(', ')} } from '@/components/ui';`
      );
    }

    return imports;
  }

  /**
   * Parse template section string
   */
  private parseTemplateSection(section: string): { jsx: string; imports: string[] } {
    // Simple parsing: section might be "Hero" or "Card > [Button, Text]"
    const imports: string[] = [];

    if (section.includes('>')) {
      // Nested structure
      const [parent, childrenStr] = section.split('>').map(s => s.trim());
      imports.push(parent);

      const children = childrenStr
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(c => c.trim());

      imports.push(...children);

      const childrenJsx = children.map(c => `      <${c} />`).join('\n');
      return {
        jsx: `  <${parent}>\n${childrenJsx}\n  </${parent}>`,
        imports
      };
    }

    // Simple component
    imports.push(section);
    return {
      jsx: `  <${section} />`,
      imports
    };
  }

  /**
   * Get suggestions when generation fails
   */
  private getSuggestions(context: ProcessingContext): string[] {
    const suggestions: string[] = [];

    if (context.entities.length === 0) {
      suggestions.push('Try specifying a component like "create a button" or "make a card"');
      
      // Get available components
      const available = this.knowledge.getAllComponents().slice(0, 5);
      if (available.length > 0) {
        suggestions.push(`Available components: ${available.map(c => c.name).join(', ')}`);
      }
    }

    if (context.intent.confidence < 0.5) {
      suggestions.push('Try being more specific about what you want to create');
    }

    return suggestions;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default JSXGenerator;
