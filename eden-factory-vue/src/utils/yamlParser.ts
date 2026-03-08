import yaml from 'js-yaml';
import type { AppConfig, ConfigItem, Factory, Recipe } from '../types';

function parseItemStack(obj: any): ConfigItem {
  let type = 'UNKNOWN';
  let amount = 1;
  let display_name: string | null = null;
  let chance: number | undefined = undefined;

  if (typeof obj === 'string') {
    type = obj;
  } else if (obj && typeof obj === 'object') {
    // Handle chance wrappers: { chance: 0.5, some_key: { type: ... } }
    if (obj.chance !== undefined) {
      chance = obj.chance;
      // The actual item is usually the other key in this object
      const otherKey = Object.keys(obj).find(k => k !== 'chance');
      if (otherKey && typeof obj[otherKey] === 'object') {
        const inner = parseItemStack(obj[otherKey]);
        return { ...inner, chance };
      }
    }

    // If it's a map where values are item stacks (common in this config)
    // and we don't have a 'type' directly on this object, but it has one child which is an object
    const keys = Object.keys(obj);
    if (!obj.type && keys.length === 1 && keys[0] !== undefined) {
      const key = keys[0];
      if (typeof obj[key] === 'object') {
        return parseItemStack(obj[key]);
      }
    }

    type = obj.type || 'UNKNOWN';
    amount = obj.amount || 1;
    if (obj.meta && obj.meta['display-name']) {
      display_name = obj.meta['display-name'];
    }
  }

  return { type, amount, display_name, ...(chance !== undefined ? { chance } : {}) };
}

export function parseConfig(yamlText: string): AppConfig {
  const data = yaml.load(yamlText) as any;
  const factories: Record<string, Factory> = {};
  const recipes: Record<string, Recipe> = {};

  if (data.factories) {
    for (const [id, f] of Object.entries(data.factories) as [string, any][]) {
      const setupcost: Record<string, ConfigItem> = {};
      if (f.setupcost) {
        for (const [name, item] of Object.entries(f.setupcost)) {
          setupcost[name] = parseItemStack(item);
        }
      }

      factories[id] = {
        id,
        name: f.name || id,
        type: f.type || 'FCC',
        citadelBreakReduction: f.citadelBreakReduction || null,
        fuel: f.fuel ? parseItemStack(f.fuel) : null,
        setupcost,
        recipes: f.recipes || [],
      };
    }
  }

  if (data.recipes) {
    for (const [id, r] of Object.entries(data.recipes) as [string, any][]) {
      const input: Record<string, ConfigItem> = {};
      if (r.input) {
        for (const [name, item] of Object.entries(r.input)) {
          input[name] = parseItemStack(item);
        }
      }

      const output: Record<string, ConfigItem> = {};
      const outputData = r.output || r.outputs;
      if (outputData) {
        for (const [name, item] of Object.entries(outputData)) {
          if (name === 'display') continue;
          output[name] = parseItemStack(item);
        }
      }

      recipes[id] = {
        id,
        name: r.name || id,
        type: r.type || 'PRODUCTION',
        production_time: r.production_time || null,
        input,
        output,
      };
    }
  }

  return { factories, recipes };
}
