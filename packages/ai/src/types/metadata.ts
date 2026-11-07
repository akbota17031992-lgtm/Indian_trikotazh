export interface ColorItem {
  name_ru: string;
  name_kz: string;
  hex?: string;
}

export type ApparelCategory =
  | 't-shirts'
  | 'long-sleeves'
  | 'robes'
  | 'pajamas'
  | 'thermal-underwear'
  | 'kids-clothing'
  | 'home-textiles';

export type ApparelSeason = 'all-season' | 'summer' | 'winter' | 'demi-season';
export type ApparelGender = 'unisex' | 'men' | 'women' | 'kids' | 'boys' | 'girls' | 'baby';

export interface AiClothingMetadata {
  name_ru: string;
  name_kz: string;
  description_ru: string;
  description_kz: string;
  category: string;
  subcategory: string;
  colors: string[];
  material: string;
  season: ApparelSeason | string;
  gender: ApparelGender | string;
  tags: string[];
  suggestedPriceKzt: number;
}
