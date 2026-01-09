// ============================================================
// TRAINING STORE - Persistent Training Data Storage
// ============================================================

import * as fs from 'fs';
import { TrainingData, TrainingExample } from '../types';

export class TrainingStore {
  private filePath: string;
  private data: TrainingData;

  constructor(filePath: string = './training-data.json') {
    this.filePath = filePath;
    this.data = this.load();
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
    this.save();
  }

  getExamples(): TrainingExample[] {
    return this.data.examples;
  }

  getAllData(): TrainingData {
    return this.data;
  }

  clear(): void {
    this.data.examples = [];
    this.save();
  }

  getCount(): number {
    return this.data.examples.length;
  }
}

export default TrainingStore;