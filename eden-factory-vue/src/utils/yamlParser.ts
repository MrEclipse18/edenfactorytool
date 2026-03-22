import yaml from 'js-yaml';
import type { AppConfig, ConfigItem, Factory, Recipe } from '../types';

function parseItemStack(obj: any): ConfigItem {
  let type = 'UNKNOWN';
  let amount = 1;
  let display_name: string | null = null;
  let chance: number | undefined = undefined;
  let is_compacted = false;
  let meta: { lore?: string[]; enchants?: Record<string, number> } | undefined;

  if (typeof obj === 'string') {
    type = obj;
  } else if (obj && typeof obj === 'object') {
    if (obj.chance !== undefined) {
      chance = obj.chance;
      const otherKey = Object.keys(obj).find(k => k !== 'chance');
      if (otherKey && typeof obj[otherKey] === 'object') {
        const inner = parseItemStack(obj[otherKey]);
        return { ...inner, chance };
      }
    }

    const keys = Object.keys(obj);
    if (!obj.type && keys.length === 1 && keys[0] !== undefined) {
      const key = keys[0];
      if (typeof obj[key] === 'object') return parseItemStack(obj[key]);
    }

    type = obj.type || 'UNKNOWN';
    amount = obj.amount ?? 1;

    if (obj.meta) {
      meta = {};

      if (obj.meta['display-name']) display_name = obj.meta['display-name'];

      if (obj.meta.lore) {
        const loreArray = Array.isArray(obj.meta.lore) ? obj.meta.lore : [obj.meta.lore];
        meta.lore = loreArray;
        if (loreArray.some((line: string) => line.toLowerCase().includes('compacted'))) {
          is_compacted = true;
        }
      }

      if (obj.meta.enchants && typeof obj.meta.enchants === 'object') {
        meta.enchants = obj.meta.enchants;
      }
    }
  }

  const result: ConfigItem = { type, amount, display_name, ...(chance !== undefined ? { chance } : {}) };
  if (is_compacted) result.is_compacted = true;
  if (meta) result.meta = meta;

  return result;
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
        citadelBreakReduction: f.citadelBreakReduction ?? null,
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