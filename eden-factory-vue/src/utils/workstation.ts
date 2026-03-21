import { ref, watch, computed } from 'vue';
import type { WorkstationItem, AppConfig, Recipe } from '../types';
import { getStackSize } from './stackSizes';

const STORAGE_KEY = 'eden_workstation_v2';


const items = ref<WorkstationItem[]>([]);
const expandedItems = ref<string[]>([]);


const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try {
    const data = JSON.parse(saved);
    items.value = data.items || [];
    expandedItems.value = data.expandedItems || [];
  } catch (e) {
    console.error('Failed to load workstation:', e);
  }
}


watch([items, expandedItems], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    items: items.value,
    expandedItems: expandedItems.value
  }));
}, { deep: true });

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

export function useWorkstation(config: AppConfig | null) {
  function addItem(id: string, type: 'factory' | 'recipe', amount = 1) {
    const existing = items.value.find(i => i.id === id && i.type === type);
    if (existing) {
      if (type === 'recipe') existing.amount += amount;
      existing.enabled = true;
    } else {
      items.value.push({
        id,
        type,
        enabled: true,
        amount: type === 'factory' ? 1 : amount,
        timestamp: Date.now()
      });
    }
  }

  function removeItem(id: string, type: 'factory' | 'recipe') {
    items.value = items.value.filter(i => !(i.id === id && i.type === type));
  }

  function toggleItem(id: string, type: 'factory' | 'recipe') {
    const item = items.value.find(i => i.id === id && i.type === type);
    if (item) item.enabled = !item.enabled;
  }

  function updateAmount(id: string, type: 'factory' | 'recipe', amount: number) {
    if (type !== 'recipe') return;
    const item = items.value.find(i => i.id === id && i.type === type);
    if (item) item.amount = Math.max(0, amount);
  }

  function toggleExpand(itemKey: string) {
    if (expandedItems.value.includes(itemKey)) {
      expandedItems.value = expandedItems.value.filter(t => t !== itemKey);
    } else {
      expandedItems.value.push(itemKey);
    }
  }

  function isInWorkstation(id: string, type: 'factory' | 'recipe') {
    return items.value.some(i => i.id === id && i.type === type);
  }

  function clearWorkstation() {
    items.value = [];
    expandedItems.value = [];
  }


  const totalBreakdown = computed((): BreakdownNode[] | null => {
    if (!config) return null;

    const directTotals = new Map<string, { type: string; amount: number; display_name: string | null }>();

    for (const item of items.value) {
      if (!item.enabled) continue;

      if (item.type === 'factory') {
        const factory = config.factories[item.id];
        if (factory) {
          for (const cost of Object.values(factory.setupcost)) {
            const baseAmount = cost.is_compacted ? cost.amount * getStackSize(cost.type) : cost.amount;
            addAmount(directTotals, cost.type, baseAmount, cost.display_name);
          }
        }
      } else {
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
      const recipe = findRecipeForItem(type, displayName, config!);
      const canBreakdown = !isTerminal(type, displayName) && !!recipe;
      const isExpanded = expandedItems.value.includes(key);
      
      const factoryNames: string[] = [];
      if (canBreakdown) {
        const producingRecipes = Object.values(config!.recipes).filter(r => {
          const outputs = Object.values(r.output);
          return outputs.some(o => o.type === type && (o.display_name || null) === (displayName || null));
        });
        
        const recipeIds = producingRecipes.map(r => r.id);
        const factories = Object.values(config!.factories).filter(f => 
          f.recipes.some(rid => recipeIds.includes(rid))
        );
        
        factoryNames.push(...Array.from(new Set(factories.map(f => f.name))));
      }

      if (isExpanded && !path.includes(key)) {
        if (recipe) {
          const outputs = Object.values(recipe.output);
          const targetOutput = outputs.find(o => 
            o.type === type && (o.display_name || null) === (displayName || null)
          );
          
          if (targetOutput) {
            const stackSize = targetOutput.is_compacted ? getStackSize(targetOutput.type) : 1;
            const amountPerRun = targetOutput.amount * stackSize * (targetOutput.chance || 1);
            const runsNeeded = Math.ceil(amount / amountPerRun);

            const ingredients = Object.values(recipe.input)
              .filter(input => {
                const inputKey = `${input.type}|${input.display_name || ''}`;
                return !path.includes(inputKey) && inputKey !== key;
              })
              .map(input => {
                const inputBaseAmount = input.amount * (input.is_compacted ? getStackSize(input.type) : 1);
                return buildNode(input.type, inputBaseAmount * runsNeeded, input.display_name, [...path, key]);
              });

            return {
              type, key, displayName, amount, can_breakdown: true, is_expanded: true, ingredients, factoryNames
            };
          }
        }
      }

      return {
        type, key, displayName, amount, can_breakdown: canBreakdown, is_expanded: isExpanded, ingredients: null, factoryNames
      };
    }

    return Array.from(directTotals.values())
      .map(d => buildNode(d.type, d.amount, d.display_name))
      .sort((a, b) => b.amount - a.amount);
  });

  function addAmount(map: Map<string, any>, type: string, amount: number, display_name: string | null) {
    const key = `${type}|${display_name || ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      map.set(key, { type, amount, display_name });
    }
  }
function isTerminal(type: string, displayName: string | null): boolean {
  const t = type.toUpperCase();

  if (t.includes('BUCKET') || t.includes('BOTTLE')) return true;

  if (displayName) {
    const name = displayName.toUpperCase();
    if (name.includes('FOSSIL')) return true;
    if (name.includes('GRAVEL')) return true;
    if (name.includes('BUCKET')) return true;
    if (name.includes('BOTTLE')) return true;
    if (name.includes('COBBLESTONE')) return true;
    if (name.includes('STONE')) return true;
  }


  const baseResources = [
    'INGOT', 'ORE', 'RAW_', 'DIAMOND', 'REDSTONE', 'LAPIS', 'EMERALD', 
    'COAL', 'CHARCOAL', 'QUARTZ', 'AMETHYST', 'NETHERITE', 'DEBRIS',
    'COBBLESTONE', 'STONE'
  ];
  if (baseResources.some(kw => t.includes(kw))) return true;

  if (t === 'GRAVEL' || t.includes('FOSSIL')) return true;


  if (config) {
    const isLoopItem = Object.values(config.recipes).some(r => {
      const hasInput = Object.values(r.input).some(i => i.type === type && (i.display_name || null) === (displayName || null));
      const hasOutput = Object.values(r.output).some(o => o.type === type && (o.display_name || null) === (displayName || null));
      return hasInput && hasOutput;
    });
    if (isLoopItem) return true;
  }

  const plantKeywords = [
      'SAPLING', 'LEAVES', 'SEEDS', 'FLOWER', 'WHEAT', 'CARROT', 'POTATO', 
      'BEETROOT', 'SUGAR_CANE', 'BAMBOO', 'CACTUS', 'MUSHROOM', 'FUNGUS', 
      'WARPED', 'CRIMSON', 'GRASS', 'FERN', 'VINE', 'LILY_PAD', 'BERRY', 
      'BERRIES', 'KELP', 'SEAGRASS', 'PICKLE', 'SPORE', 'ROOTS', 'AZALEA',
      'MOSS', 'DRIPLEAF', 'GLOW_LICHEN', 'VINES', 'PUMPKIN', 'MELON', 'NETHER_WART'
    ];
    if (plantKeywords.some(kw => t.includes(kw))) return true;

    return false;
  }

  return {
    items,
    expandedItems,
    addItem,
    removeItem,
    toggleItem,
    updateAmount,
    toggleExpand,
    isInWorkstation,
    clearWorkstation,
    totalBreakdown
  };
}

function findRecipeForItem(itemType: string, displayName: string | null, config: AppConfig): Recipe | null {
  const productionRecipes = Object.values(config.recipes).filter(r => r.type === 'PRODUCTION');
  
  for (const recipe of productionRecipes) {
    const outputs = Object.values(recipe.output);
    const targetOutput = outputs.find(o => 
      o.type === itemType && (o.display_name || null) === (displayName || null)
    );
    
    if (targetOutput) {
      const inputs = Object.values(recipe.input);
      if (inputs.some(i => i && i.type === itemType && (i.display_name || null) === (displayName || null))) continue;
      if (inputs.length === 1 && inputs[0] && inputs[0].type === itemType && inputs[0].is_compacted && !targetOutput.is_compacted) continue;
      
      return recipe;
    }
  }
  return null;
}
