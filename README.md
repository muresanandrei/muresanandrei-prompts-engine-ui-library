*********************

STILL IN WORKS
************************

# Prompt Engine

A custom, trainable natural language processing engine that converts text prompts into React components. Built specifically for UI kits without requiring external AI APIs.

## Features

- 🧠 **Custom NLP Pipeline** - Lexer, semantic analyzer, intent resolver, entity extractor
- 🎯 **Trainable** - Learn from corrections to improve over time
- 🔌 **Plugin System** - Extensible with Claude, OpenAI, or custom plugins
- 📊 **Confidence Scoring** - Know when the engine is uncertain
- 🎨 **UI Kit Agnostic** - Define your own component schema
- ⚡ **No External Dependencies** - Works offline by default

## Installation

```bash
npm install
```

# TO TEST RUN 

npx tsx examples/test.ts you will following options:

```
COMMANDS:
  Type any prompt to generate JSX
  "train" - Enter training mode
  "count" - Show training count
  "exit"  - Quit

EXAMPLE PROMPTS:
  create a button
  large primary button
  danger button with icon
  card with title
  two column layout
```

## Quick Start

```typescript
import { PromptEngine } from './src';
import mySchema from './examples/schema';

// Initialize
const engine = new PromptEngine();
await engine.initialize(mySchema);

// Generate components
const result = await engine.process('create a large primary button');
console.log(result.jsx);
// Output: <Button variant="primary" size="lg" />
```

## How It Works

```
User Prompt
    ↓
┌─────────────────────────────────────────┐
│              LEXER                       │
│  Tokenization, phrase extraction         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         SEMANTIC ANALYZER               │
│  Grammar analysis, semantic roles        │
│  Domain mapping, relationships           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│          INTENT RESOLVER                │
│  Classify: create, modify, combine, etc  │
│  Trainable Naive Bayes classifier        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         ENTITY EXTRACTOR                │
│  Components, modifiers, quantities       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│          JSX GENERATOR                  │
│  Generate React code from context        │
└─────────────────────────────────────────┘
    ↓
Generated JSX + Imports
```

## Training

```typescript
// Learn from corrections
await engine.learn(
  'make a CTA',                    // Original prompt
  'CTA means call-to-action button', // Description
  {                                 // Expected output
    jsx: '<Button variant="primary">Get Started</Button>',
    imports: ["import { Button } from '@/components/ui';"]
  }
);
```

See `examples/training.ts` for comprehensive training examples.

## Schema Definition

Define your UI kit components:

```typescript
const schema: UIKitSchema = {
  name: 'MyUIKit',
  version: '1.0.0',
  components: {
    button: {
      displayName: 'Button',
      category: 'input',
      aliases: ['btn', 'cta'],
      variants: ['primary', 'secondary', 'danger'],
      sizes: ['sm', 'md', 'lg'],
      props: {
        variant: { type: 'enum', options: ['primary', 'secondary'] },
        disabled: { type: 'boolean' }
      }
    }
    // ... more components
  }
};
```

## Plugins

Add external AI for complex prompts:

```typescript
import { ClaudePlugin } from './src';

const claude = new ClaudePlugin({ apiKey: 'your-key' });
await engine.plugins.register('claude', claude);
engine.plugins.setActive('claude');
```

## Project Structure

```
prompt-engine/
├── src/
│   ├── core/           # Processing pipeline
│   │   ├── Engine.ts
│   │   ├── Lexer.ts
│   │   ├── SemanticAnalyzer.ts
│   │   ├── IntentResolver.ts
│   │   ├── EntityExtractor.ts
│   │   └── ContextBuilder.ts
│   ├── knowledge/      # UI kit knowledge base
│   │   └── ComponentGraph.ts
│   ├── generators/     # Code generation
│   │   └── JSXGenerator.ts
│   ├── plugins/        # Plugin system
│   │   ├── PluginManager.ts
│   │   ├── LocalAIPlugin.ts
│   │   ├── ClaudePlugin.ts
│   │   └── OpenAIPlugin.ts
│   ├── types/          # TypeScript definitions
│   └── index.ts
├── examples/
│   ├── schema.ts       # Example UI kit schema
│   └── training.ts     # Training examples
└── docs/
    └── documentation.pdf
```

## License

MIT
