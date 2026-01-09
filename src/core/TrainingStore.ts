// ============================================================
// TRAINING STORE - Persistent Training Data Storage
// ============================================================

import * as fs from 'fs';
import { TrainingData, TrainingExample } from '../types';

export class TrainingStore {
  private filePath: string;
  private data: TrainingData;
  private index!: Map<string, TrainingExample>;

  constructor(filePath: string = './training-data.json') {
    this.filePath = filePath;
    this.data = this.load();
    this.buildIndex();
  }

  private load(): TrainingData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (error) {
      console.warn('Could not load training data:', error);
    }

    return {
      examples: [],
      version: '1.0.0',
      lastUpdated: Date.now()
    };
  }

  private buildIndex(): void {
    this.index = new Map();
    for (const example of this.data.examples) {
      const key = example.prompt.toLowerCase().trim();
      this.index.set(key, example);
    }
  }

  save(): void {
    try {
      this.data.lastUpdated = Date.now();
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Could not save training data:', error);
    }
  }

  addExample(example: TrainingExample): void {
    this.data.examples.push(example);
    this.index.set(example.prompt.toLowerCase().trim(), example);
    this.save();
  }

  findMatch(prompt: string): TrainingExample | null {
    return this.index.get(prompt.toLowerCase().trim()) || null;
  }

  getExamples(): TrainingExample[] {
    return this.data.examples;
  }

  getAllData(): TrainingData {
    return this.data;
  }

  clear(): void {
    this.data.examples = [];
    this.index.clear();
    this.save();
  }

  getCount(): number {
    return this.data.examples.length;
  }
}

export default TrainingStore;