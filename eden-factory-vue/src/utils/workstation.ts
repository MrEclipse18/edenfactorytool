import { ref, watch, computed } from 'vue';
import type { WorkstationItem, AppConfig, Recipe } from '../types';
import { getStackSize } from './stackSizes';

export interface BreakdownNode {
  type: string;
  key: string;
  displayName: string | null;
  amount: number;
  can_breakdown: boolean;
  is_expanded: boolean;
  factoryNames: string[];
  ingredients: BreakdownNode[] | null;
}

interface Workstation {
  id: string;
  name: string;
  items: WorkstationItem[];
  expandedItems: string[];
}

const STORAGE_KEY = 'eden_workstation_v3';
const workstations = ref<Workstation[]>([]);
let activeWorkstationId = ref<string | null>(null);

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try {
    const data = JSON.parse(saved);
    workstations.value = data.workstations || [];
    activeWorkstationId.value = data.activeWorkstationId || null;
  } catch (e) {
    console.error('Failed to load workstation:', e);
  }
}

if (workstations.value.length === 0) {
  const id = crypto.randomUUID();
  workstations.value.push({ id, name: 'My Workstation 1', items: [], expandedItems: [] });
  activeWorkstationId.value = id;
}

const activeWorkstation = computed(() =>
  workstations.value.find(w => w.id === activeWorkstationId.value) || null
);

watch([workstations, activeWorkstationId], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    workstations: workstations.value,
    activeWorkstationId: activeWorkstationId.value
  }));
}, { deep: true });

export function useWorkstation(config: AppConfig | null) {

  function parseProductionTime(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getMatchingOutput(recipe: Recipe, type: string, displayName: string | null) {
  return (
    Object.values(recipe.output).find(
      o => o.type === type && (o.display_name || null) === (displayName || null)
    ) || null
  );
}

function getRunsNeededForNode(node: BreakdownNode): number {
  const recipe = findRecipeForItem(node.type, node.displayName);
  if (!recipe) return 0;

  const output = getMatchingOutput(recipe, node.type, node.displayName);
  if (!output) return 0;

  const stackSize = output.is_compacted ? getStackSize(output.type) : 1;
  const amountPerRun = output.amount * stackSize * (output.chance || 1);

  if (amountPerRun <= 0) return 0;
  return Math.ceil(node.amount / amountPerRun);
}

function getExpandedNodeTime(node: BreakdownNode, path: string[] = []): number {
  if (!node.can_breakdown || !node.is_expanded || !node.ingredients) return 0;
  if (path.includes(node.key)) return 0; // cycle guard

  const recipe = findRecipeForItem(node.type, node.displayName);
  if (!recipe) return 0;

  const runsNeeded = getRunsNeededForNode(node);
  if (runsNeeded <= 0) return 0;

  let total = parseProductionTime(recipe.production_time) * runsNeeded;

  for (const child of node.ingredients) {
    total += getExpandedNodeTime(child, [...path, node.key]);
  }

  return total;
}

const totalFactoryTime = computed(() => {
  if (!config || !activeWorkstation.value) return '0 sec';

  let totalSeconds = 0;

  // 1) Always count the direct workstation recipe time
  for (const item of activeWorkstation.value.items) {
    if (!item.enabled || item.type !== 'recipe') continue;

    const recipe = config.recipes[item.id];
    if (!recipe) continue;

    const runs = Math.max(0, item.amount);
    totalSeconds += parseProductionTime(recipe.production_time) * runs;
  }
  const nodes = totalBreakdown.value || [];
  for (const node of nodes) {
    totalSeconds += getExpandedNodeTime(node);
  }

  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes} min ${seconds} sec`;
});

  function createWorkstation(name = 'New Workstation ') {
    name += workstations.value.length + 1;
    let newName = prompt("Name", name);
    newName = newName?.trim() || name;
    const id = crypto.randomUUID();
    workstations.value.push({ id, name: newName, items: [], expandedItems: [] });
    activeWorkstationId.value = id;
  }

  function deleteWorkstation(id: string) {
    workstations.value = workstations.value.filter(w => w.id !== id);
    if (activeWorkstationId.value === id) activeWorkstationId.value = workstations.value[0]?.id || null;
  }

  function changeNameWorkstation(id: string) {
    const w = workstations.value.find(w => w.id === id);
    if (!w) return;
    const newName = prompt(`Change name "${w.name}" to`, w.name);
    if (newName?.trim()) w.name = newName.trim();
  }

  function switchWorkstation(id: string) { activeWorkstationId.value = id; }

  function addItem(id: string, type: 'factory' | 'recipe', amount = 1, workstationId?: string) {
    const target = workstationId ? workstations.value.find(w => w.id === workstationId) : activeWorkstation.value;
    if (!target) return;

    const existing = target.items.find(i => i.id === id && i.type === type);
    if (existing) {
      if (type === 'recipe') existing.amount += amount;
      existing.enabled = true;
    } else {
      target.items.push({ id, type, enabled: true, amount: type === 'factory' ? 1 : amount, timestamp: Date.now() });
    }
  }

  function removeItem(id: string, type: 'factory' | 'recipe', workstationId?: string): void {
    const target = workstationId
      ? workstations.value.find(w => w.id === workstationId)
      : activeWorkstation.value;

    if (!target) return;

    target.items = target.items.filter(
      i => !(i.id === id && i.type === type)
    );
  }

  function toggleItem(id: string, type: 'factory' | 'recipe') {
    const item = activeWorkstation.value?.items.find(i => i.id === id && i.type === type);
    if (item) item.enabled = !item.enabled;
  }

  function updateAmount(id: string, type: 'factory' | 'recipe', amount: number) {
    if (type !== 'recipe') return;
    const item = activeWorkstation.value?.items.find(i => i.id === id && i.type === type);
    if (item) item.amount = Math.max(0, amount);
  }

  function toggleExpand(itemKey: string) {
    if (!activeWorkstation.value) return;
    const expanded = activeWorkstation.value.expandedItems;
    if (expanded.includes(itemKey)) activeWorkstation.value.expandedItems = expanded.filter(k => k !== itemKey);
    else expanded.push(itemKey);
  }

  function isInWorkstation(id: string, type: 'factory' | 'recipe') {
    return activeWorkstation.value?.items.some(i => i.id === id && i.type === type) || false;
  }

  function clearWorkstation() {
    if (!activeWorkstation.value) return;
    activeWorkstation.value.items = [];
    activeWorkstation.value.expandedItems = [];
  }

  function addAmount(map: Map<string, any>, type: string, amount: number, display_name: string | null) {
    const key = `${type}|${display_name || ''}`;
    const existing = map.get(key);
    if (existing) existing.amount += amount;
    else map.set(key, { type, amount, display_name });
  }

  function isTerminal(type: string): boolean {
    if (!config) return false;
    const t = type.toUpperCase();
    const baseResources = [
      'INGOT','ORE','RAW_','DIAMOND','REDSTONE','LAPIS','EMERALD','COAL','CHARCOAL','QUARTZ','AMETHYST','NETHERITE','DEBRIS',
      'COBBLESTONE','STONE'
    ];
    return baseResources.some(kw => t.includes(kw));
  }

  function findRecipeForItem(itemType: string, displayName: string | null): Recipe | null {
    if (!config) return null;
    const productionRecipes = Object.values(config.recipes).filter(r => r.type === 'PRODUCTION');
    for (const recipe of productionRecipes) {
      const targetOutput = Object.values(recipe.output).find(o => o.type === itemType && (o.display_name || null) === (displayName || null));
      if (targetOutput) {
        const inputs = Object.values(recipe.input);
        if (inputs.some(i => i && i.type === itemType && (i.display_name || null) === (displayName || null))) continue;
        return recipe;
      }
    }
    return null;
  }

  const totalBreakdown = computed((): BreakdownNode[] | null => {
    if (!config || !activeWorkstation.value) return null;

    const directTotals = new Map<string, { type: string; amount: number; display_name: string | null }>();
    for (const item of activeWorkstation.value.items) {
      if (!item.enabled) continue;
      if (item.type === 'factory') {
        const factory = config.factories[item.id];
        if (factory) {
          for (const cost of Object.values(factory.setupcost)) {
            const baseAmount = cost.is_compacted ? cost.amount * getStackSize(cost.type) : cost.amount;
            addAmount(directTotals, cost.type, baseAmount, cost.display_name);
          }
        }
      } else if (item.type === 'recipe') {
        const recipe = config.recipes[item.id];
        if (recipe) {
          const multiplier = Math.max(0, item.amount);
          for (const input of Object.values(recipe.input)) {
            const baseAmount = input.is_compacted ? input.amount * getStackSize(input.type) : input.amount;
            addAmount(directTotals, input.type, baseAmount * multiplier, input.display_name);
          }
        }
      }
    }

    function buildNode(type: string, amount: number, displayName: string | null, path: string[] = []): BreakdownNode {
      const key = `${type}|${displayName || ''}`;
      const recipe = findRecipeForItem(type, displayName);
      const canBreakdown = !isTerminal(type) && !!recipe;
      const isExpanded = activeWorkstation.value!.expandedItems.includes(key);

      const factoryNames: string[] = [];
      if (canBreakdown && recipe) {
        const producingRecipes = Object.values(config!.recipes).filter(r =>
          Object.values(r.output).some(o => o.type === type && (o.display_name || null) === (displayName || null))
        );
        const recipeIds = producingRecipes.map(r => r.id);
        const factories = Object.values(config!.factories).filter(f => f.recipes.some(rid => recipeIds.includes(rid)));
        factoryNames.push(...Array.from(new Set(factories.map(f => f.name))));
      }

      if (isExpanded && !path.includes(key) && recipe) {
        const targetOutput = Object.values(recipe.output).find(o => o.type === type && (o.display_name || null) === (displayName || null));
        if (targetOutput) {
          const stackSize = targetOutput.is_compacted ? getStackSize(targetOutput.type) : 1;
          const amountPerRun = targetOutput.amount * stackSize * (targetOutput.chance || 1);
          const runsNeeded = Math.ceil(amount / amountPerRun);
          const ingredients = Object.values(recipe.input)
            .filter(input => !path.includes(`${input.type}|${input.display_name || ''}`))
            .map(input => {
              const inputBaseAmount = input.amount * (input.is_compacted ? getStackSize(input.type) : 1);
              return buildNode(input.type, inputBaseAmount * runsNeeded, input.display_name, [...path, key]);
            });
          return { type, key, displayName, amount, can_breakdown: true, is_expanded: true, ingredients, factoryNames };
        }
      }

      return { type, key, displayName, amount, can_breakdown: canBreakdown, is_expanded: isExpanded, ingredients: null, factoryNames };
    }

    return Array.from(directTotals.values())
      .map(d => buildNode(d.type, d.amount, d.display_name))
      .sort((a, b) => b.amount - a.amount);
  });

  return {
    workstations,
    activeWorkstation,
    activeWorkstationId,
    createWorkstation,
    deleteWorkstation,
    switchWorkstation,
    changeNameWorkstation,
    addItem,
    removeItem,
    toggleItem,
    updateAmount,
    toggleExpand,
    isInWorkstation,
    clearWorkstation,
    totalBreakdown,
    totalFactoryTime
  };
}