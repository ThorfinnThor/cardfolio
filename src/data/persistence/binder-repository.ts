import type { Binder, CardSnapshot, LocalBackupV1, UUID } from "@/domain/types";

export type ImportMode = "import-as-new" | "replace-all";

export interface BinderRepository {
  list(): Promise<Binder[]>;
  get(id: UUID): Promise<Binder | null>;
  create(binder: Binder, cards: CardSnapshot[]): Promise<void>;
  save(binder: Binder, cards: CardSnapshot[], expectedRevision: number): Promise<Binder>;
  saveOrder(ids: UUID[]): Promise<void>;
  remove(id: UUID, expectedRevision: number): Promise<void>;
  exportBackup(ids?: UUID[]): Promise<LocalBackupV1>;
  importBackup(backup: LocalBackupV1, mode: ImportMode): Promise<void>;
}

export class RevisionConflictError extends Error {
  constructor(message = "The binder changed in another tab.") {
    super(message);
    this.name = "RevisionConflictError";
  }
}
