// ============================================================
// PROMPT ENGINE - Main Export
// ============================================================

// Core exports
export { PromptEngine } from './core/Engine';
export { Lexer } from './core/Lexer';
export { SemanticAnalyzer } from './core/SemanticAnalyzer';
export { IntentResolver } from './core/IntentResolver';
export { EntityExtractor } from './core/EntityExtractor';
export { ContextBuilder } from './core/ContextBuilder';

// Knowledge exports
export { ComponentGraph } from './knowledge/ComponentGraph';

// Generator exports
export { JSXGenerator } from './generators/JSXGenerator';

// Plugin exports
export { PluginManager } from './plugins/PluginManager';
export { LocalAIPlugin } from './plugins/LocalAIPlugin';
export { ClaudePlugin } from './plugins/ClaudePlugin';
export { OpenAIPlugin } from './plugins/OpenAIPlugin';

// Type exports
export * from './types';

// React Hook
export { usePromptEngine } from './usePromptEngine';

// Default export
export { PromptEngine as default } from './core/Engine';
