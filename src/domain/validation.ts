import { z } from "zod";

import {
  BINDER_DESCRIPTION_MAX_LENGTH,
  BINDER_NAME_MAX_LENGTH,
  MAX_BINDER_PAGES,
  PAGE_NOTE_MAX_LENGTH,
  PAGE_TITLE_MAX_LENGTH,
} from "./binder-actions";
import type { GiftProject } from "./gift-builder";
import type { Binder, LocalBackupV2 } from "./types";

const uuidSchema = z.string().uuid();
const isoDateSchema = z.iso.datetime();
const cardKeySchema = z.string().min(1).max(300);

const imageUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "assets.tcgdex.net";
  } catch {
    return false;
  }
}, "Only HTTPS image references from assets.tcgdex.net are accepted.");

export const cardSnapshotSchema = z.object({
  key: cardKeySchema,
  ref: z.object({
    provider: z.literal("tcgdex"),
    id: z.string().min(1).max(200),
    language: z.enum(["en", "de"]),
  }),
  name: z.string().min(1).max(300),
  setId: z.string().min(1).max(200),
  setName: z.string().min(1).max(300),
  collectorNumber: z.string().min(1).max(50),
  collectorTotal: z.string().min(1).max(50).optional(),
  availableVariants: z
    .object({
      normal: z.boolean(),
      holo: z.boolean(),
      reverse: z.boolean(),
      firstEdition: z.boolean(),
      shadowless: z.boolean().optional(),
    })
    .optional(),
  imageBaseUrl: imageUrlSchema.optional(),
  imageFallbackBaseUrl: imageUrlSchema.optional(),
  category: z.enum(["pokemon", "trainer", "energy", "other"]).optional(),
  abilities: z.array(z.string().min(1).max(300)).max(10).optional(),
  attacks: z.array(z.string().min(1).max(300)).max(10).optional(),
  englishIdentity: z.object({
    name: z.string().min(1).max(300),
    setName: z.string().min(1).max(300),
    category: z.enum(["pokemon", "trainer", "energy", "other"]).optional(),
    abilities: z.array(z.string().min(1).max(300)).max(10),
    attacks: z.array(z.string().min(1).max(300)).max(10),
  }).optional(),
  physicalStatus: z.enum(["physical", "digital", "unknown"]),
  fetchedAt: isoDateSchema,
});

export const plannedCardSchema = z.object({
  id: uuidSchema,
  cardKey: cardKeySchema,
  variant: z.object({
    finish: z.enum(["normal", "holo", "reverse", "other", "unspecified"]),
    edition: z.enum(["unlimited", "first-edition", "unspecified"]),
    printing: z.enum(["shadowless", "shadowed", "unspecified"]).optional(),
    label: z.string().max(100).optional(),
  }),
  preferences: z.object({
    minimumCondition: z.enum(["near-mint", "excellent", "lightly-played", "played", "any"]),
  }),
  owned: z.boolean(),
  addedAt: isoDateSchema,
});

export const binderSchema = z
  .object({
    id: uuidSchema,
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    name: z.string().min(1).max(BINDER_NAME_MAX_LENGTH),
    description: z.string().max(BINDER_DESCRIPTION_MAX_LENGTH),
    layout: z.object({
      rows: z.number().int().min(1).max(20),
      columns: z.number().int().min(1).max(20),
    }),
    pages: z
      .array(
        z.object({
          id: uuidSchema,
          slots: z.array(plannedCardSchema.nullable()).max(360),
          note: z.string().max(PAGE_NOTE_MAX_LENGTH),
          title: z.string().max(PAGE_TITLE_MAX_LENGTH).optional(),
        }),
      )
      .min(1)
      .max(MAX_BINDER_PAGES),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .superRefine((binder, context) => {
    const expectedSlots = binder.layout.rows * binder.layout.columns;
    const entryIds = new Set<string>();
    for (const [pageIndex, page] of binder.pages.entries()) {
      if (page.slots.length !== expectedSlots) {
        context.addIssue({
          code: "custom",
          message: `Page ${pageIndex + 1} has ${page.slots.length} slots; expected ${expectedSlots}.`,
          path: ["pages", pageIndex, "slots"],
        });
      }
      for (const [slotIndex, entry] of page.slots.entries()) {
        if (!entry) continue;
        if (entryIds.has(entry.id)) {
          context.addIssue({
            code: "custom",
            message: "Planned card IDs must be unique within a binder.",
            path: ["pages", pageIndex, "slots", slotIndex, "id"],
          });
        }
        entryIds.add(entry.id);
      }
    }
  });

export const giftProjectSchema = z.object({
  id: uuidSchema,
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  name: z.string().min(1).max(100),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  preferences: z.object({
    recipientKind: z.enum(["partner", "child", "friend", "other"]),
    recipientName: z.string().min(1).max(100).optional(),
    occasion: z.enum(["birthday", "christmas", "anniversary", "other"]).optional(),
    subjectQuery: z.string().trim().min(1).max(200),
    targetCardCount: z.union([z.literal(9), z.literal(18), z.literal(36)]),
    budgetMinor: z.number().int().positive().max(100_000_000),
    currency: z.enum(["EUR", "USD"]),
    budgetTolerancePercent: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15)]).optional(),
    preferredLanguage: z.enum(["en", "de"]).optional(),
    style: z.enum(["mixed", "vintage", "modern", "curated"]),
  }),
  binderId: uuidSchema.optional(),
  selectedCardKeys: z.array(cardKeySchema).max(36),
  binderOfferId: z.string().min(1).max(200).optional(),
});

const backupPayloadSchema = {
  format: z.literal("cardfolio-backup"),
  exportedAt: isoDateSchema,
  binders: z.array(binderSchema).max(50),
  cards: z.array(cardSnapshotSchema).max(20_000),
};

function validateBackupReferences(
  backup: { binders: z.infer<typeof binderSchema>[]; cards: z.infer<typeof cardSnapshotSchema>[] },
  context: z.RefinementCtx,
): void {
  const cardKeys = new Set(backup.cards.map((card) => card.key));
  const binderIds = new Set<string>();
  let entryCount = 0;
  for (const [binderIndex, binder] of backup.binders.entries()) {
    if (binderIds.has(binder.id)) {
      context.addIssue({ code: "custom", message: "Binder IDs must be unique.", path: ["binders", binderIndex, "id"] });
    }
    binderIds.add(binder.id);
    for (const page of binder.pages) {
      for (const entry of page.slots) {
        if (!entry) continue;
        entryCount += 1;
        if (!cardKeys.has(entry.cardKey)) {
          context.addIssue({
            code: "custom",
            message: `Referenced card snapshot ${entry.cardKey} is missing.`,
            path: ["binders", binderIndex],
          });
        }
      }
    }
  }
  if (entryCount > 20_000) context.addIssue({ code: "custom", message: "Backup contains more than 20,000 entries." });
}

const backupV1Schema = z
  .object({
    ...backupPayloadSchema,
    version: z.literal(1),
  })
  .superRefine(validateBackupReferences);

export const backupSchema = z.object({
  ...backupPayloadSchema,
  version: z.literal(2),
  giftProjects: z.array(giftProjectSchema).max(100),
}).superRefine((backup, context) => {
  validateBackupReferences(backup, context);
  const ids = new Set<string>();
  const binderIds = new Set(backup.binders.map((binder) => binder.id));
  for (const [index, project] of backup.giftProjects.entries()) {
    if (ids.has(project.id)) {
      context.addIssue({ code: "custom", message: "Gift Project IDs must be unique.", path: ["giftProjects", index, "id"] });
    }
    ids.add(project.id);
    if (project.binderId && !binderIds.has(project.binderId)) {
      context.addIssue({ code: "custom", message: "Gift Project references a missing binder.", path: ["giftProjects", index, "binderId"] });
    }
  }
});

export function validateBinder(value: unknown): Binder {
  return binderSchema.parse(value) as Binder;
}

export function validateGiftProject(value: unknown): GiftProject {
  return giftProjectSchema.parse(value) as GiftProject;
}

/** Migrates the previous binder-only backup format without losing data. */
export function validateBackup(value: unknown): LocalBackupV2 {
  const object = value && typeof value === "object" ? value as { version?: unknown } : undefined;
  if (object?.version === 1) {
    const legacy = backupV1Schema.parse(value);
    return backupSchema.parse({ ...legacy, version: 2, giftProjects: [] }) as LocalBackupV2;
  }
  return backupSchema.parse(value) as LocalBackupV2;
}
