export interface ConfigItem {
  type: string;
  amount: number;
  display_name: string | null;
  chance?: number;
  is_compacted?: boolean;
    meta?: {
  lore?: string[];
  enchants?: Record<string, number>;
};
}

export interface Factory {
  id: string;
  name: string;
  type: string;
  citadelBreakReduction: number | null;
  fuel: ConfigItem | null;
  setupcost: Record<string, ConfigItem>;
  recipes: string[];
}

export interface Recipe {
  id: string;
  name: string;
  type: string;
  production_time: string | null;
  input: Record<string, ConfigItem>;
  output: Record<string, ConfigItem>;
}


export interface AppConfig {
  factories: Record<string, Factory>;
  recipes: Record<string, Recipe>;
}

export interface WorkstationItem {
  id: string;
  type: 'factory' | 'recipe';
  enabled: boolean;
  amount: number; // For recipes: number of runs. For factories: number of instances.
  timestamp: number;
}

export interface WorkstationState {
  items: WorkstationItem[];
  expandedItems: string[]; // List of item types currently broken down
}

