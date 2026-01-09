// ============================================================
// CLAUDE PLUGIN - Anthropic Claude API Integration
// ============================================================

import {
  Plugin,
  PluginConfig,
  ProcessingContext,
  GeneratorResult,
  UIKitSchema
} from '../types';

interface ClaudeConfig extends PluginConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * ClaudePlugin integrates with Anthropic's Claude API
 * for enhanced understanding and generation.
 * 
 * Use this when local processing confidence is low.
 */
export class ClaudePlugin implements Plugin {
  name = 'claude';
  private config: ClaudeConfig;
  private endpoint = 'https://api.anthropic.com/v1/messages';
  private uiKitContext: string = '';

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
      ...config
    };
  }

  async initialize(): Promise<void> {
    // Validate API key
    if (!this.config.apiKey) {
      throw new Error('Claude API key is required');
    }
    console.log('ClaudePlugin initialized');
  }

  async destroy(): Promise<void> {
    // Cleanup
  }

  /**
   * Set UI kit schema context for Claude
   */
  setUIKitContext(schema: UIKitSchema): void {
    // Create a summary of the UI kit for Claude
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
  async enhance(context: ProcessingContext): Promise<ProcessingContext> {
    // Only call Claude if local confidence is low
    if (context.intent.confidence > 0.7 && context.coverage > 0.6) {
      return context;
    }

    try {
      const response = await this.askClaude(this.buildEnhancePrompt(context));
      return this.mergeResponse(context, response);
    } catch (error) {
      console.error('Claude enhancement failed:', error);
      return context;
    }
  }

  /**
   * Generate JSX using Claude
   */
  async generate(context: ProcessingContext): Promise<GeneratorResult | null> {
    try {
      const prompt = this.buildGeneratePrompt(context);
      const response = await this.askClaude(prompt);
      return this.parseGeneratorResponse(response);
    } catch (error) {
      console.error('Claude generation failed:', error);
      return null;
    }
  }

  /**
   * Make API call to Claude
   */
  private async askClaude(prompt: string): Promise<ClaudeResponse> {
    const messages: ClaudeMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
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
  private buildEnhancePrompt(context: ProcessingContext): string {
    return `You are helping to understand a UI component creation request.

UI Kit Schema:
${this.uiKitContext}

User Request: "${context.raw}"

Current Understanding:
- Intent: ${context.intent.type} (confidence: ${context.intent.confidence})
- Components found: ${context.entities.filter(e => e.type === 'component').map(e => e.value.name).join(', ') || 'none'}
- Modifiers found: ${context.entities.filter(e => e.type === 'modifier').map(e => e.value.text).join(', ') || 'none'}

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
  private buildGeneratePrompt(context: ProcessingContext): string {
    return `Generate React JSX for this UI component request.

UI Kit Components Available:
${this.uiKitContext}

User Request: "${context.raw}"

Analysis:
- Intent: ${context.intent.type}
- Components: ${context.entities.filter(e => e.type === 'component').map(e => e.value.name).join(', ')}
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
  private mergeResponse(context: ProcessingContext, response: ClaudeResponse): ProcessingContext {
    try {
      const text = response.content[0]?.text || '';
      const parsed = JSON.parse(text);

      const enhanced = { ...context };

      // Update intent if Claude is more confident
      if (parsed.intentConfidence > context.intent.confidence) {
        enhanced.intent = {
          ...enhanced.intent,
          type: parsed.intent,
          confidence: parsed.intentConfidence
        };
      }

      // Add any new components Claude identified
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
              source: 'claude'
            });
          }
        });
      }

      // Add enhanced flag
      enhanced.enhanced = {
        by: 'claude',
        suggestions: parsed.suggestions
      };

      return enhanced;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      return context;
    }
  }

  /**
   * Parse generation response
   */
  private parseGeneratorResponse(response: ClaudeResponse): GeneratorResult {
    try {
      const text = response.content[0]?.text || '';
      const parsed = JSON.parse(text);

      return {
        jsx: parsed.jsx || '',
        imports: parsed.imports || []
      };
    } catch (error) {
      return {
        jsx: '',
        imports: [],
        error: 'Failed to parse Claude response'
      };
    }
  }
}

export default ClaudePlugin;
