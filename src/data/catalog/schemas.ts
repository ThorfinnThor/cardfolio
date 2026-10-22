import { z } from "zod";

const imageBaseUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "assets.tcgdex.net";
});

export const tcgdexSearchItemSchema = z.object({
  id: z.string().min(1),
  localId: z.string().min(1),
  name: z.string().min(1),
  image: imageBaseUrl.nullish(),
});

export const tcgdexSearchResponseSchema = z.array(tcgdexSearchItemSchema);

export const tcgdexCardSchema = z.object({
  id: z.string().min(1),
  localId: z.string().min(1),
  name: z.string().min(1),
  image: imageBaseUrl.nullish(),
  category: z.string().nullish(),
  level: z.string().nullish(),
  suffix: z.string().nullish(),
  // Some cards list an ability or attack without a name; that must not make the whole card unreadable.
  abilities: z.array(z.object({ name: z.string().nullish() })).nullish(),
  attacks: z.array(z.object({ name: z.string().nullish() })).nullish(),
  pricing: z.unknown().optional(),
  /** Per-variant details; only the stamp and the Cardmarket block of a 1st-edition variant are read. */
  variants_detailed: z.array(z.object({ stamp: z.array(z.string()).nullish(), pricing: z.unknown().optional() }).passthrough()).nullish(),
  variants: z
    .object({
      firstEdition: z.boolean(),
      holo: z.boolean(),
      normal: z.boolean(),
      reverse: z.boolean(),
      wPromo: z.boolean().optional(),
    })
    .nullish(),
  set: z.object({
    cardCount: z
      .object({
        official: z.number().int().nonnegative(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
    id: z.string().min(1),
    name: z.string().min(1),
  }),
});

export const tcgdexSetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  releaseDate: z.string().nullish(),
  serie: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .optional(),
});
