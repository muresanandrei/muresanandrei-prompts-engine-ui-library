// ============================================================
// TRAINING EXAMPLE - How to Train the Prompt Engine
// ============================================================

import { PromptEngine, ClaudePlugin, OpenAIPlugin } from '../src';
import exampleSchema from './schema';
import { TrainingExample, GeneratorResult } from '../src/types';

/**
 * This file demonstrates how to:
 * 1. Initialize the engine
 * 2. Process prompts
 * 3. Train the engine with corrections
 * 4. Add external AI plugins
 * 5. Export/import training data
 */

// ============================================================
// BASIC USAGE
// ============================================================

async function basicUsage() {
  console.log('=== Basic Usage ===\n');

  // 1. Create and initialize the engine
  const engine = new PromptEngine({
    confidenceThreshold: 0.6,
    usePlugins: true,
    debug: true
  });

  await engine.initialize(exampleSchema);
  console.log('Engine initialized!\n');

  // 2. Process some prompts
  const prompts = [
    'create a primary button',
    'large danger button with icon',
    'card with a title and description',
    'two column layout with cards',
    'login form with email and password'
  ];

  for (const prompt of prompts) {
    console.log(`\nPrompt: "${prompt}"`);
    console.log('-'.repeat(50));

    const result = await engine.process(prompt);

    console.log(`Intent: ${result.debug.intent.type} (${(result.debug.intent.confidence * 100).toFixed(1)}%)`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Processing time: ${result.processingTime}ms`);
    console.log('\nGenerated JSX:');
    console.log(result.jsx || '(no output)');
    
    if (result.imports.length > 0) {
      console.log('\nImports:');
      result.imports.forEach(imp => console.log(imp));
    }

    if (result.error) {
      console.log(`\nError: ${result.error}`);
    }
  }
}

// ============================================================
// TRAINING WITH CORRECTIONS
// ============================================================

async function trainingExample() {
  console.log('\n\n=== Training Example ===\n');

  const engine = new PromptEngine({ debug: false });
  await engine.initialize(exampleSchema);

  // Example 1: The engine might not understand "CTA" initially
  console.log('Before training:');
  let result = await engine.process('make a CTA');
  console.log(`"make a CTA" -> Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`JSX: ${result.jsx}\n`);

  // Train it with a correction
  await engine.learn(
    'make a CTA',                           // Original prompt
    'CTA should map to primary button',     // Correction description
    {                                       // Expected output
      jsx: '<Button variant="primary">Get Started</Button>',
      imports: ["import { Button } from '@/components/ui';"]
    }
  );

  console.log('After training:');
  result = await engine.process('make a CTA');
  console.log(`"make a CTA" -> Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`JSX: ${result.jsx}\n`);

  // Example 2: Training with multiple examples
  const trainingData: Array<{
    prompt: string;
    correction: string;
    expected: GeneratorResult;
  }> = [
    {
      prompt: 'hero section',
      correction: 'Hero is a page section component',
      expected: {
        jsx: '<Hero title="Welcome" subtitle="Get started today" />',
        imports: ["import { Hero } from '@/components/ui';"]
      }
    },
    {
      prompt: 'action button',
      correction: 'Action button is a primary CTA',
      expected: {
        jsx: '<Button variant="primary" size="lg">Take Action</Button>',
        imports: ["import { Button } from '@/components/ui';"]
      }
    },
    {
      prompt: 'warning message',
      correction: 'Warning message is an alert',
      expected: {
        jsx: '<Alert variant="warning">Warning message here</Alert>',
        imports: ["import { Alert } from '@/components/ui';"]
      }
    }
  ];

  console.log('Training with multiple examples...');
  for (const data of trainingData) {
    await engine.learn(data.prompt, data.correction, data.expected);
    console.log(`  Trained: "${data.prompt}"`);
  }

  // Test the trained examples
  console.log('\nTesting trained examples:');
  for (const data of trainingData) {
    const result = await engine.process(data.prompt);
    console.log(`  "${data.prompt}" -> ${result.jsx.substring(0, 50)}...`);
  }
}

// ============================================================
// BATCH TRAINING FROM DATA
// ============================================================

async function batchTraining() {
  console.log('\n\n=== Batch Training ===\n');

  const engine = new PromptEngine();
  await engine.initialize(exampleSchema);

  // Training data could come from a JSON file, database, or user corrections
  const batchTrainingData: TrainingExample[] = [
    {
      prompt: 'submit button',
      intent: 'create_component',
      expectedOutput: {
        jsx: '<Button type="submit" variant="primary">Submit</Button>',
        imports: ["import { Button } from '@/components/ui';"]
      },
      timestamp: Date.now()
    },
    {
      prompt: 'search input',
      intent: 'create_component',
      expectedOutput: {
        jsx: '<Input type="search" placeholder="Search..." icon={<SearchIcon />} />',
        imports: ["import { Input } from '@/components/ui';", "import { SearchIcon } from '@/icons';"]
      },
      timestamp: Date.now()
    },
    {
      prompt: 'user avatar',
      intent: 'create_component',
      expectedOutput: {
        jsx: '<Avatar src="/user.jpg" alt="User" size="md" />',
        imports: ["import { Avatar } from '@/components/ui';"]
      },
      timestamp: Date.now()
    },
    {
      prompt: 'three cards in a row',
      intent: 'create_layout',
      expectedOutput: {
        jsx: `<div style={{"display":"grid","gridTemplateColumns":"repeat(3, 1fr)","gap":"1rem"}}>
    <Card />
    <Card />
    <Card />
</div>`,
        imports: ["import { Card } from '@/components/ui';"]
      },
      timestamp: Date.now()
    },
    {
      prompt: 'modal with form',
      intent: 'combine',
      expectedOutput: {
        jsx: `<Modal open={isOpen} onClose={handleClose}>
    <Form onSubmit={handleSubmit}>
        <Input label="Name" />
        <Input label="Email" type="email" />
        <Button type="submit">Submit</Button>
    </Form>
</Modal>`,
        imports: ["import { Modal, Form, Input, Button } from '@/components/ui';"]
      },
      timestamp: Date.now()
    }
  ];

  // Import all training data at once
  console.log('Importing batch training data...');
  await engine.importTrainingData(batchTrainingData);
  console.log(`Imported ${batchTrainingData.length} training examples\n`);

  // Test the trained prompts
  console.log('Testing batch trained prompts:');
  for (const data of batchTrainingData) {
    const result = await engine.process(data.prompt);
    console.log(`\n"${data.prompt}":`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Output preview: ${result.jsx.substring(0, 60)}...`);
  }

  // Export training data for persistence
  const exportedData = engine.exportTrainingData();
  console.log(`\nExported ${exportedData.length} training examples`);
  console.log('You can save this to a file and reload it later.');
}

// ============================================================
// USING EXTERNAL AI PLUGINS
// ============================================================

async function pluginExample() {
  console.log('\n\n=== Plugin Example ===\n');

  const engine = new PromptEngine({
    confidenceThreshold: 0.5,
    usePlugins: true
  });

  await engine.initialize(exampleSchema);

  // List available plugins
  console.log('Available plugins:', engine.plugins.getAvailablePlugins());

  // Register Claude plugin (requires API key)
  // Uncomment and add your API key to use
  /*
  const claudePlugin = new ClaudePlugin({
    apiKey: 'your-anthropic-api-key'
  });
  claudePlugin.setUIKitContext(exampleSchema);
  await engine.plugins.register('claude', claudePlugin);
  
  // Set Claude as active for low-confidence prompts
  engine.plugins.setActive('claude');
  */

  // Register OpenAI plugin (requires API key)
  // Uncomment and add your API key to use
  /*
  const openaiPlugin = new OpenAIPlugin({
    apiKey: 'your-openai-api-key',
    model: 'gpt-4'
  });
  openaiPlugin.setUIKitContext(exampleSchema);
  await engine.plugins.register('openai', openaiPlugin);
  */

  console.log('\nTo use external AI plugins:');
  console.log('1. Uncomment the plugin registration code above');
  console.log('2. Add your API key');
  console.log('3. The engine will automatically use the plugin when confidence is low');

  // Example of how plugins enhance low-confidence prompts
  console.log('\nWithout external plugins, ambiguous prompts may have low confidence:');
  const ambiguousPrompts = [
    'make it pop',
    'something modern',
    'a nice looking thing'
  ];

  for (const prompt of ambiguousPrompts) {
    const result = await engine.process(prompt);
    console.log(`"${prompt}" -> Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    if (result.suggestions) {
      console.log(`  Suggestions: ${result.suggestions.join(', ')}`);
    }
  }
}

// ============================================================
// INTERACTIVE TRAINING LOOP
// ============================================================

async function interactiveTraining() {
  console.log('\n\n=== Interactive Training Pattern ===\n');
  console.log('This shows the pattern for building an interactive training UI:\n');

  const engine = new PromptEngine();
  await engine.initialize(exampleSchema);

  // Simulate user interaction
  const userPrompt = 'create a fancy button';
  
  console.log(`User prompt: "${userPrompt}"`);
  
  // Step 1: Generate initial result
  const result = await engine.process(userPrompt);
  console.log(`\nGenerated (confidence: ${(result.confidence * 100).toFixed(1)}%):`);
  console.log(result.jsx);

  // Step 2: If confidence is low or user rejects, collect correction
  if (result.confidence < 0.8) {
    console.log('\n[Low confidence - asking user for feedback]');
    
    // Simulate user providing correction
    const userCorrection = {
      feedback: 'Fancy button should be gradient with animation',
      expectedJsx: '<Button variant="gradient" animated className="fancy-btn">Click Me</Button>'
    };

    console.log(`User correction: "${userCorrection.feedback}"`);
    console.log(`Expected JSX: ${userCorrection.expectedJsx}`);

    // Step 3: Train with correction
    await engine.learn(
      userPrompt,
      userCorrection.feedback,
      {
        jsx: userCorrection.expectedJsx,
        imports: ["import { Button } from '@/components/ui';"]
      }
    );

    console.log('\n[Trained with correction]');

    // Step 4: Verify improvement
    const newResult = await engine.process(userPrompt);
    console.log(`\nNew result (confidence: ${(newResult.confidence * 100).toFixed(1)}%):`);
    console.log(newResult.jsx);
  }

  console.log('\n--- Interactive Training Pattern Summary ---');
  console.log('1. User enters prompt');
  console.log('2. Engine generates component');
  console.log('3. User reviews and optionally corrects');
  console.log('4. Engine learns from correction');
  console.log('5. Future similar prompts are improved');
}

// ============================================================
// CUSTOM INTENT TRAINING
// ============================================================

async function customIntentTraining() {
  console.log('\n\n=== Custom Intent Training ===\n');

  const engine = new PromptEngine();
  await engine.initialize(exampleSchema);

  // You can train specific intents
  const intentExamples = [
    // Create component intents
    { text: 'whip up a button', intent: 'create_component' },
    { text: 'gimme an input', intent: 'create_component' },
    { text: 'i want a card', intent: 'create_component' },
    
    // Layout intents
    { text: 'arrange these side by side', intent: 'create_layout' },
    { text: 'put them in columns', intent: 'create_layout' },
    { text: 'stack everything vertically', intent: 'create_layout' },
    
    // Page intents
    { text: 'build me a homepage', intent: 'create_page' },
    { text: 'i need a settings screen', intent: 'create_page' },
    
    // Combine intents
    { text: 'button with dropdown', intent: 'combine' },
    { text: 'put a form in a modal', intent: 'combine' }
  ];

  console.log('Training custom intents...');
  for (const example of intentExamples) {
    // This adds to the intent classifier's training data
    await engine.learn(
      example.text,
      `Should be ${example.intent}`,
      { jsx: '', imports: [] }  // JSX not needed for intent training
    );
    console.log(`  Trained: "${example.text}" -> ${example.intent}`);
  }

  // Test the custom intents
  console.log('\nTesting custom intents:');
  const testPrompts = [
    'whip up a modal',
    'stack the cards',
    'build me a profile page',
    'button inside a card'
  ];

  for (const prompt of testPrompts) {
    const result = await engine.process(prompt);
    console.log(`  "${prompt}" -> ${result.debug.intent.type} (${(result.debug.intent.confidence * 100).toFixed(1)}%)`);
  }
}

// ============================================================
// RUN ALL EXAMPLES
// ============================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         PROMPT ENGINE TRAINING EXAMPLES                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await basicUsage();
    await trainingExample();
    await batchTraining();
    await pluginExample();
    await interactiveTraining();
    await customIntentTraining();

    console.log('\n\n' + '='.repeat(60));
    console.log('All examples completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
main();

export {
  basicUsage,
  trainingExample,
  batchTraining,
  pluginExample,
  interactiveTraining,
  customIntentTraining
};
