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
  abilities: z.array(z.object({ name: z.string().min(1) })).nullish(),
  attacks: z.array(z.object({ name: z.string().min(1) })).nullish(),
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
  serie: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .optional(),
});
