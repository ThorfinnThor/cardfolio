import { z } from "zod";

const positiveId = z.number().int().positive();
const nullablePositiveId = positiveId.nullable();

export const cardtraderPropertySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "boolean"]),
  default_value: z.union([z.string(), z.boolean()]).optional(),
  possible_values: z.array(z.union([z.string(), z.boolean()])),
});

export const cardtraderGameSchema = z.object({
  id: positiveId,
  name: z.string().min(1),
  display_name: z.string().min(1),
});

export const cardtraderCategorySchema = z.object({
  id: positiveId,
  name: z.string().min(1),
  game_id: positiveId,
  properties: z.array(cardtraderPropertySchema),
});

export const cardtraderExpansionSchema = z.object({
  id: positiveId,
  game_id: positiveId,
  code: z.string(),
  name: z.string().min(1),
});

export const cardtraderBlueprintSchema = z.object({
  id: positiveId,
  name: z.string().min(1),
  version: z.string().nullable().optional(),
  game_id: positiveId,
  category_id: positiveId,
  expansion_id: nullablePositiveId,
  image_url: z.url().nullable().optional(),
  editable_properties: z.array(cardtraderPropertySchema),
  card_market_ids: z.array(z.union([z.number().int().positive(), z.string().min(1)])).default([]),
  tcg_player_id: z.union([z.number().int().positive(), z.string().min(1)]).nullable().optional(),
  scryfall_id: z.string().nullable().optional(),
});

export const cardtraderMoneySchema = z.object({
  cents: z.number().int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const cardtraderMarketplaceProductSchema = z.object({
  id: positiveId,
  blueprint_id: positiveId,
  name_en: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  price: cardtraderMoneySchema,
  description: z.string(),
  properties_hash: z.record(z.string(), z.unknown()),
  expansion: z.object({ id: positiveId, code: z.string(), name_en: z.string().min(1) }),
  user: z.object({
    id: positiveId,
    username: z.string().min(1),
    can_sell_via_hub: z.boolean(),
    country_code: z.string().min(2),
    user_type: z.string().min(1),
    max_sellable_in24h_quantity: z.number().int().nonnegative().nullable(),
  }),
  graded: z.boolean(),
  on_vacation: z.boolean(),
  bundle_size: z.number().int().positive(),
});

export const cardtraderMarketplaceResponseSchema = z.record(
  z.string().regex(/^\d+$/),
  z.array(cardtraderMarketplaceProductSchema),
);

export const cardtraderWishlistItemSchema = z.object({
  quantity: z.number().int().positive(),
  blueprint_id: positiveId.optional(),
  meta_name: z.string().min(1).optional(),
  expansion_code: z.string().min(1).optional(),
  collector_number: z.string().min(1).optional(),
  language: z.string().min(2).optional(),
  condition: z.string().min(1).optional(),
  foil: z.union([z.string(), z.boolean()]).optional(),
  reverse: z.union([z.string(), z.boolean()]).nullable().optional(),
  first_edition: z.boolean().nullable().optional(),
}).refine((item) => item.blueprint_id != null || item.meta_name != null, {
  message: "A wishlist item requires blueprint_id or meta_name.",
});

export const cardtraderWishlistCreateSchema = z.object({
  deck: z.object({
    name: z.string().trim().min(1),
    public: z.boolean().default(false),
    game_id: positiveId,
    deck_items_attributes: z.array(cardtraderWishlistItemSchema).min(1),
  }),
});

export const cardtraderGamesSchema = z.array(cardtraderGameSchema);
export const cardtraderCategoriesSchema = z.array(cardtraderCategorySchema);
export const cardtraderExpansionsSchema = z.array(cardtraderExpansionSchema);
export const cardtraderBlueprintsSchema = z.array(cardtraderBlueprintSchema);

