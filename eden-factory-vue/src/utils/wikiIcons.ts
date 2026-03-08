export const WIKI_BASE = 'https://minecraft.wiki/images/Invicon_';

export const WIKI_OVR: Record<string, string | null> = {
  PORKCHOP:'Raw_Porkchop',BEEF:'Raw_Beef',CHICKEN:'Raw_Chicken',MUTTON:'Raw_Mutton',
  COD:'Raw_Cod',SALMON:'Raw_Salmon',RABBIT:'Raw_Rabbit',
  ENDER_EYE:'Eye_of_Ender',LAPIS_LAZULI:'Lapis_Lazuli',SLIME_BALL:'Slimeball',
  CLAY_BALL:'Clay_Ball',COCOA_BEANS:'Cocoa_Beans',BONE_MEAL:'Bone_Meal',
  NETHER_WART:'Nether_Wart',SPIDER_EYE:'Spider_Eye',
  FERMENTED_SPIDER_EYE:'Fermented_Spider_Eye',
  MAGMA_CREAM:'Magma_Cream',BLAZE_ROD:'Blaze_Rod',BLAZE_POWDER:'Blaze_Powder',
  GLASS_BOTTLE:'Glass_Bottle',INK_SAC:'Ink_Sac',SUGAR_CANE:'Sugar_Cane',
  SWEET_BERRIES:'Sweet_Berries',GLOW_BERRIES:'Glow_Berries',NAME_TAG:'Name_Tag',
  SOUL_SAND:'Soul_Sand',SOUL_SOIL:'Soul_Soil',LAVA_BUCKET:'Lava_Bucket',
  WATER_BUCKET:'Water_Bucket',MILK_BUCKET:'Milk_Bucket',
  ANCIENT_DEBRIS:'Ancient_Debris',NETHERITE_INGOT:'Netherite_Ingot',
  AMETHYST_SHARD:'Amethyst_Shard',RAW_IRON:'Raw_Iron',RAW_GOLD:'Raw_Gold',
  RAW_COPPER:'Raw_Copper',COPPER_INGOT:'Copper_Ingot',
  RESIN_CLUMP:'Resin_Clump',RESIN_BRICK:'Resin_Brick',
  NETHER_GOLD_ORE:'Nether_Gold_Ore',NETHER_QUARTZ_ORE:'Nether_Quartz_Ore',
  PRISMARINE_SHARD:'Prismarine_Shard',PRISMARINE_CRYSTALS:'Prismarine_Crystals',
  COBBLED_DEEPSLATE:'Cobbled_Deepslate',CRYING_OBSIDIAN:'Crying_Obsidian',
  GLOW_INK_SAC:'Glow_Ink_Sac',WITHER_ROSE:'Wither_Rose',
  MUSIC_DISC_11:'Music_Disc_11',MUSIC_DISC_13:'Music_Disc_13',
  MUSIC_DISC_5:'Music_Disc_5',MUSIC_DISC_BLOCKS:'Music_Disc_Blocks',
  MUSIC_DISC_CAT:'Music_Disc_Cat',MUSIC_DISC_CHIRP:'Music_Disc_Chirp',
  MUSIC_DISC_FAR:'Music_Disc_Far',MUSIC_DISC_MALL:'Music_Disc_Mall',
  MUSIC_DISC_MELLOHI:'Music_Disc_Mellohi',MUSIC_DISC_OTHERSIDE:'Music_Disc_Otherside',
  MUSIC_DISC_PIGSTEP:'Music_Disc_Pigstep',MUSIC_DISC_RELIC:'Music_Disc_Relic',
  MUSIC_DISC_STAL:'Music_Disc_Stal',MUSIC_DISC_STRAD:'Music_Disc_Strad',
  MUSIC_DISC_WAIT:'Music_Disc_Wait',MUSIC_DISC_WARD:'Music_Disc_Ward',
  MUSIC_DISC_CREATOR:'Music_Disc_Creator',MUSIC_DISC_PRECIPICE:'Music_Disc_Precipice',
  IRON_BLOCK:'Block_of_Iron',GOLD_BLOCK:'Block_of_Gold',
  COAL_BLOCK:'Block_of_Coal',REDSTONE_BLOCK:'Block_of_Redstone',
  EMERALD_BLOCK:'Block_of_Emerald',DIAMOND_BLOCK:'Block_of_Diamond',
  LAPIS_BLOCK:'Block_of_Lapis_Lazuli',QUARTZ_BLOCK:'Block_of_Quartz',
  COPPER_BLOCK:'Block_of_Copper',RAW_IRON_BLOCK:'Block_of_Raw_Iron',
  RAW_GOLD_BLOCK:'Block_of_Raw_Gold',RAW_COPPER_BLOCK:'Block_of_Raw_Copper',
  NETHERITE_BLOCK:'Block_of_Netherite',AMETHYST_BLOCK:'Block_of_Amethyst',
  WAXED_COPPER_BLOCK:'Waxed_Block_of_Copper',
  WAXED_EXPOSED_COPPER:'Waxed_Exposed_Copper',
  WAXED_WEATHERED_COPPER:'Waxed_Weathered_Copper',
  WAXED_OXIDIZED_COPPER:'Waxed_Oxidized_Copper',
  NETHER_BRICKS:'Nether_Bricks',BRICKS:'Bricks',
  DEEPSLATE_DIAMOND_ORE:'Deepslate_Diamond_Ore',
  DEEPSLATE_LAPIS_ORE:'Deepslate_Lapis_Ore',
  DEEPSLATE_REDSTONE_ORE:'Deepslate_Redstone_Ore',
  MOSSY_COBBLESTONE:'Mossy_Cobblestone',
  CHISELED_BOOKSHELF:'Chiseled_Bookshelf',
  POLISHED_BLACKSTONE_BRICKS:'Polished_Blackstone_Bricks',
  CRACKED_POLISHED_BLACKSTONE_BRICKS:'Cracked_Polished_Blackstone_Bricks',
  CRACKED_STONE_BRICKS:'Cracked_Stone_Bricks',
  CRACKED_DEEPSLATE_BRICKS:'Cracked_Deepslate_Bricks',
  CRACKED_DEEPSLATE_TILES:'Cracked_Deepslate_Tiles',
  SMOOTH_STONE:'Smooth_Stone',SMOOTH_BASALT:'Smooth_Basalt',
  SMOOTH_QUARTZ:'Smooth_Quartz',SMOOTH_SANDSTONE:'Smooth_Sandstone',
  SMOOTH_RED_SANDSTONE:'Smooth_Red_Sandstone',
  MUSIC_DISC_CREATOR_MUSIC_BOX:'Music_Disc_Creator_Music_Box',
  DRIED_GHAST:'Dried_Ghast',
  CLOCK:'Clock',COMPASS:'Compass',NETHER_STAR:'Nether_Star',
  EXPERIENCE_BOTTLE:'Bottle_o%27_Enchanting',
  UNKNOWN:null,
};

export const WIKI_GIF = new Set(['CLOCK','COMPASS','NETHER_STAR','EXPERIENCE_BOTTLE']);

export const FB: Record<string, string> = {
  IRON_INGOT:'🪨',GOLD_INGOT:'✨',DIAMOND:'💎',EMERALD:'💚',COAL:'⬛',
  CHARCOAL:'🖤',NETHERITE_INGOT:'🔥',COPPER_INGOT:'🟠',EXPERIENCE_BOTTLE:'💚',
  ENDER_EYE:'🟢',NETHER_STAR:'⭐',BLAZE_ROD:'🔥',OBSIDIAN:'🟣',
  NETHERRACK:'🔴',STONE:'🧱',IRON_PICKAXE:'⛏',CHEST:'📦',OAK_LOG:'🪵',WHEAT:'🌾'
};

export function getWikiUrl(type: string): string | null {
  if (WIKI_OVR[type] === null) return null;
  const n = WIKI_OVR[type] || type.split('_').map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('_');
  const ext = WIKI_GIF.has(type) ? '.gif' : '.png';
  return WIKI_BASE + n + ext;
}
