// ============================================================
// INTERACTIVE TEST - Type prompts, see results
// ============================================================

import * as readline from 'readline';
import { PromptEngine } from '../src/index.js';
import schema from './schema.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('\n========================================');
  console.log('   PROMPT ENGINE - Interactive Test');
  console.log('========================================\n');

  console.log('Initializing...');

  const engine = new PromptEngine({ debug: false });
  await engine.initialize(schema);

  console.log(`Ready! Training examples loaded: ${engine.getTrainingCount()}\n`);

  console.log('COMMANDS:');
  console.log('  Type any prompt to generate JSX');
  console.log('  "train" - Enter training mode');
  console.log('  "count" - Show training count');
  console.log('  "exit"  - Quit\n');

  console.log('EXAMPLE PROMPTS:');
  console.log('  create a button');
  console.log('  large primary button');
  console.log('  danger button with icon');
  console.log('  card with title');
  console.log('  two column layout\n');

  const prompt = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  const trainMode = async () => {
    console.log('\n--- TRAINING MODE ---');

    const userPrompt = await prompt('Enter the prompt that was wrong: ');
    if (!userPrompt) return;

    const correction = await prompt('What should it mean? ');
    if (!correction) return;

    const expectedJsx = await prompt('Expected JSX output: ');
    if (!expectedJsx) return;

    await engine.learn(userPrompt, correction, {
      jsx: expectedJsx,
      imports: []
    });

    console.log(`\n✓ Trained! Total examples: ${engine.getTrainingCount()}\n`);
  };

  while (true) {
    const input = await prompt('\n> ');

    if (!input) continue;

    if (input.toLowerCase() === 'exit') {
      console.log('\nGoodbye!\n');
      rl.close();
      break;
    }

    if (input.toLowerCase() === 'train') {
      await trainMode();
      continue;
    }

    if (input.toLowerCase() === 'count') {
      console.log(`\nTraining examples: ${engine.getTrainingCount()}\n`);
      continue;
    }

    try {
      const result = await engine.process(input);

      console.log('\n┌─────────────────────────────────────');
      console.log('│ GENERATED JSX:');
      console.log('├─────────────────────────────────────');

      if (result.jsx) {
        result.jsx.split('\n').forEach(line => {
          console.log('│ ' + line);
        });
      } else {
        console.log('│ (no output)');
      }

      if (result.imports.length > 0) {
        console.log('├─────────────────────────────────────');
        console.log('│ IMPORTS:');
        result.imports.forEach(imp => {
          console.log('│ ' + imp);
        });
      }

      console.log('├─────────────────────────────────────');
      console.log(`│ Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`│ Intent: ${result.debug.intent.type}`);
      console.log('└─────────────────────────────────────');

      if (result.confidence < 0.6) {
        console.log('\n⚠ Low confidence. Type "train" to improve this.');
      }

    } catch (err) {
      console.error('\nError:', err);
    }
  }
}

main().catch(console.error);