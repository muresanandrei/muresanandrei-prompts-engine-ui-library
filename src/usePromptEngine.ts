// ============================================================
// USE PROMPT ENGINE - React Hook
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptEngine } from './core/Engine';
import {
  UIKitSchema,
  EngineResult,
  GeneratorResult,
  Plugin,
  UsePromptEngineReturn,
  EngineConfig
} from './types';

/**
 * React hook for using the PromptEngine in components
 * 
 * @example
 * ```tsx
 * import { usePromptEngine } from 'prompt-engine';
 * import mySchema from './my-ui-kit-schema';
 * 
 * function App() {
 *   const { ready, generate, learn } = usePromptEngine(mySchema);
 *   const [result, setResult] = useState(null);
 * 
 *   const handleGenerate = async () => {
 *     const output = await generate("create a primary button");
 *     setResult(output);
 *   };
 * 
 *   if (!ready) return <div>Loading...</div>;
 * 
 *   return (
 *     <div>
 *       <button onClick={handleGenerate}>Generate</button>
 *       {result && <pre>{result.jsx}</pre>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePromptEngine(
  schema: UIKitSchema,
  config?: EngineConfig
): UsePromptEngineReturn {
  const [engine, setEngine] = useState<PromptEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize engine
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const eng = new PromptEngine(config);
        await eng.initialize(schema);
        
        if (mounted) {
          setEngine(eng);
          setReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [schema, config]);

  // Generate method
  const generate = useCallback(async (prompt: string): Promise<EngineResult> => {
    if (!engine) {
      throw new Error('Engine not initialized');
    }
    return engine.process(prompt);
  }, [engine]);

  // Learn method
  const learn = useCallback(async (
    prompt: string,
    correction: string,
    expected: GeneratorResult
  ): Promise<void> => {
    if (!engine) return;
    return engine.learn(prompt, correction, expected);
  }, [engine]);

  // Register plugin method
  const registerPlugin = useCallback(async (
    name: string,
    plugin: Plugin
  ): Promise<void> => {
    if (!engine) return;
    return engine.plugins.register(name, plugin);
  }, [engine]);

  // Set active plugin method
  const setActivePlugin = useCallback((name: string): void => {
    if (!engine) return;
    engine.plugins.setActive(name);
  }, [engine]);

  return {
    ready,
    error,
    generate,
    learn,
    registerPlugin,
    setActivePlugin
  };
}

/**
 * Hook for accessing just the generation functionality
 * Simpler alternative when you don't need learning or plugins
 */
export function usePromptGenerator(schema: UIKitSchema) {
  const { ready, error, generate } = usePromptEngine(schema);
  
  const [result, setResult] = useState<EngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<Error | null>(null);

  const generateComponent = useCallback(async (prompt: string) => {
    if (!ready) return null;

    setLoading(true);
    setGenerateError(null);

    try {
      const output = await generate(prompt);
      setResult(output);
      return output;
    } catch (err) {
      setGenerateError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [ready, generate]);

  const reset = useCallback(() => {
    setResult(null);
    setGenerateError(null);
  }, []);

  return {
    ready,
    loading,
    result,
    error: error || generateError,
    generate: generateComponent,
    reset
  };
}

export default usePromptEngine;
