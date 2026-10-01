import type { Binder, CardSnapshot, LocalBackup, LocalBackupV2, UUID } from "@/domain/types";

export type ImportMode = "import-as-new" | "replace-all";

export interface BinderRepository {
  list(): Promise<Binder[]>;
  get(id: UUID): Promise<Binder | null>;
  create(binder: Binder, cards: CardSnapshot[]): Promise<void>;
  save(binder: Binder, cards: CardSnapshot[], expectedRevision: number): Promise<Binder>;
  saveOrder(ids: UUID[]): Promise<void>;
  remove(id: UUID, expectedRevision: number): Promise<void>;
  exportBackup(ids?: UUID[]): Promise<LocalBackupV2>;
  importBackup(backup: LocalBackup, mode: ImportMode): Promise<void>;
}

export class RevisionConflictError extends Error {
  constructor(message = "The binder changed in another tab.") {
    super(message);
    this.name = "RevisionConflictError";
  }
}
