// ============================================================
// PLUGIN MANAGER - Extensible Plugin System
// ============================================================

import { EventEmitter } from 'eventemitter3';
import {
  Plugin,
  ProcessingContext,
  GeneratorResult
} from '../types';

interface PluginEvents {
  'plugin:registered': { name: string; plugin: Plugin };
  'plugin:unregistered': { name: string };
  'plugin:error': { plugin: string; error: Error };
  'plugin:activated': { name: string };
}

/**
 * PluginManager handles registration, lifecycle, and execution
 * of plugins that can enhance the prompt processing.
 */
export class PluginManager extends EventEmitter<PluginEvents> {
  private plugins: Map<string, Plugin>;
  private activePlugin: string | null;
  private pluginOrder: string[];

  constructor() {
    super();
    this.plugins = new Map();
    this.activePlugin = null;
    this.pluginOrder = [];
  }

  /**
   * Register a new plugin
   */
  async register(name: string, plugin: Plugin): Promise<void> {
    // Initialize plugin
    if (typeof plugin.initialize === 'function') {
      await plugin.initialize();
    }

    this.plugins.set(name, plugin);
    this.pluginOrder.push(name);

    // First plugin becomes active by default
    if (!this.activePlugin) {
      this.activePlugin = name;
    }

    this.emit('plugin:registered', { name, plugin });
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    
    if (plugin) {
      // Cleanup
      if (typeof plugin.destroy === 'function') {
        await plugin.destroy();
      }

      this.plugins.delete(name);
      this.pluginOrder = this.pluginOrder.filter(n => n !== name);

      // If active plugin was removed, switch to another
      if (this.activePlugin === name) {
        this.activePlugin = this.pluginOrder[0] || null;
      }

      this.emit('plugin:unregistered', { name });
    }
  }

  /**
   * Set the active plugin
   */
  setActive(name: string): void {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is not registered`);
    }
    
    this.activePlugin = name;
    this.emit('plugin:activated', { name });
  }

  /**
   * Get the active plugin
   */
  getActive(): Plugin | null {
    if (!this.activePlugin) return null;
    return this.plugins.get(this.activePlugin) || null;
  }

  /**
   * Enhance context using the active plugin
   */
  async enhance(context: ProcessingContext): Promise<ProcessingContext> {
    const plugin = this.getActive();
    if (!plugin) return context;

    try {
      const enhanced = await plugin.enhance(context);
      return enhanced;
    } catch (error) {
      this.emit('plugin:error', { 
        plugin: this.activePlugin!, 
        error: error as Error 
      });
      return context; // Return original on error
    }
  }

  /**
   * Generate using the active plugin
   */
  async generate(context: ProcessingContext): Promise<GeneratorResult | null> {
    const plugin = this.getActive();
    
    if (!plugin || typeof plugin.generate !== 'function') {
      return null;
    }

    try {
      return await plugin.generate(context);
    } catch (error) {
      this.emit('plugin:error', { 
        plugin: this.activePlugin!, 
        error: error as Error 
      });
      return null;
    }
  }

  /**
   * Run enhancement through all plugins in order
   */
  async enhanceWithAll(context: ProcessingContext): Promise<ProcessingContext> {
    let result = context;

    for (const name of this.pluginOrder) {
      const plugin = this.plugins.get(name);
      if (plugin) {
        try {
          result = await plugin.enhance(result);
        } catch (error) {
          this.emit('plugin:error', { plugin: name, error: error as Error });
        }
      }
    }

    return result;
  }

  /**
   * Get list of available plugins
   */
  getAvailablePlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin by name
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugin count
   */
  get count(): number {
    return this.plugins.size;
  }
}

export default PluginManager;
