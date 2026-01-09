// ============================================================
// OPENAI PLUGIN - OpenAI API Integration
// ============================================================

import {
  Plugin,
  PluginConfig,
  ProcessingContext,
  GeneratorResult,
  UIKitSchema
} from '../types';

interface OpenAIConfig extends PluginConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * OpenAIPlugin integrates with OpenAI's API
 * for enhanced understanding and generation.
 */
export class OpenAIPlugin implements Plugin {
  name = 'openai';
  private config: OpenAIConfig;
  private endpoint = 'https://api.openai.com/v1/chat/completions';
  private systemPrompt: string = '';

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 1024,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    console.log('OpenAIPlugin initialized');
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  /**
   * Set UI kit schema context
   */
  setUIKitContext(schema: UIKitSchema): void {
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
  async enhance(context: ProcessingContext): Promise<ProcessingContext> {
    if (context.intent.confidence > 0.7 && context.coverage > 0.6) {
      return context;
    }

    try {
      const response = await this.chat([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildEnhancePrompt(context) }
      ]);

      return this.mergeResponse(context, response);
    } catch (error) {
      console.error('OpenAI enhancement failed:', error);
      return context;
    }
  }

  /**
   * Generate JSX using OpenAI
   */
  async generate(context: ProcessingContext): Promise<GeneratorResult | null> {
    try {
      const response = await this.chat([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildGeneratePrompt(context) }
      ]);

      return this.parseGeneratorResponse(response);
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      return null;
    }
  }

  /**
   * Make API call to OpenAI
   */
  private async chat(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages,
        response_format: { type: 'json_object' }
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
  private buildEnhancePrompt(context: ProcessingContext): string {
    return `Analyze this UI component request: "${context.raw}"

Current analysis:
- Intent: ${context.intent.type} (confidence: ${context.intent.confidence.toFixed(2)})
- Components: ${context.entities.filter(e => e.type === 'component').map(e => e.value.name).join(', ') || 'none'}

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
  private buildGeneratePrompt(context: ProcessingContext): string {
    const components = context.entities
      .filter(e => e.type === 'component')
      .map(e => e.value.name);

    return `Generate React JSX for: "${context.raw}"

Components to use: ${components.join(', ')}
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
  private mergeResponse(context: ProcessingContext, response: OpenAIResponse): ProcessingContext {
    try {
      const text = response.choices[0]?.message?.content || '';
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
        parsed.components.forEach((comp: { name: string; confidence: number }) => {
          const exists = enhanced.entities.some(
            e => e.type === 'component' && e.value.name === comp.name
          );
          if (!exists) {
            enhanced.entities.push({
              type: 'component',
              value: { name: comp.name },
              confidence: comp.confidence,
              source: 'openai'
            });
          }
        });
      }

      enhanced.enhanced = {
        by: 'openai',
        raw: parsed
      };

      return enhanced;
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return context;
    }
  }

  /**
   * Parse generator response
   */
  private parseGeneratorResponse(response: OpenAIResponse): GeneratorResult {
    try {
      const text = response.choices[0]?.message?.content || '';
      const parsed = JSON.parse(text);

      return {
        jsx: parsed.jsx || '',
        imports: parsed.imports || []
      };
    } catch (error) {
      return {
        jsx: '',
        imports: [],
        error: 'Failed to parse OpenAI response'
      };
    }
  }
}

export default OpenAIPlugin;
