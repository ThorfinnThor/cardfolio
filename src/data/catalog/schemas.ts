import { z } from "zod";

const imageBaseUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "assets.tcgdex.net";
});

export const tcgdexSearchItemSchema = z.object({
  id: z.string().min(1),
  localId: z.string().min(1),
  name: z.string().min(1),
  image: imageBaseUrl.optional(),
});

export const tcgdexSearchResponseSchema = z.array(tcgdexSearchItemSchema);

export const tcgdexCardSchema = z.object({
  id: z.string().min(1),
  localId: z.string().min(1),
  name: z.string().min(1),
  image: imageBaseUrl.optional(),
  category: z.string().optional(),
  set: z.object({
    cardCount: z
      .object({
        official: z.number().int().nonnegative(),
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
