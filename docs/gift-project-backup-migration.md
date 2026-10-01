# Gift Project storage and backup migration

Date: 2026-10-01

Gift Projects are local-only IndexedDB records. Recipient names, occasions and future greeting text are not sent to Cardfolio, TCGdex, a marketplace or analytics. Candidate-detail pricing responses are stored in a separate TTL cache and are deliberately excluded from backups.

## IndexedDB migration

Database version 2 adds `giftProjects` and `giftCandidateCache` object stores. Existing `binders`, `cards` and `settings` stores are left untouched. Opening the new app version performs the additive browser migration automatically.

## Backup migration

Backup version 2 adds the validated `giftProjects` array. Version-1 binder-only backups remain importable: validation migrates them in memory to version 2 with an empty Gift Project list. Exports always use version 2.

`replace-all` replaces binders, cards and Gift Projects together. `import-as-new` creates new IDs for binders and Gift Projects and rewrites a Gift Project's `binderId` to the corresponding imported binder. Candidate caches are never restored because they can expire and be fetched again.

The validation contract rejects duplicate project IDs, invalid preferences and Gift Projects referencing a binder absent from the same backup.
