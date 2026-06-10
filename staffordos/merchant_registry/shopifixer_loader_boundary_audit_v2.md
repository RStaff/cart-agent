# ShopiFixer Loader Boundary Audit v2

Verdict: SAFE_TO_COMMIT

`loadShopifixerCommandCenter.ts` is now a UI adapter over precomputed registry data.

## What remains in the loader

The loader still does three adapter-level things:

- normalizes merchant identifiers for lookup
- selects the precomputed active record from registry metadata
- maps the selected record into the existing ShopiFixer UI shape

It also provides a presentation fallback and provenance wrapper.

## What moved upstream

These now live in the merchant lifecycle registry builder and registry output:

- active record selection
- lifecycle lane status
- current stage
- next required action
- readiness score

## Remaining derived logic in the loader

The remaining derived logic is limited to read-model transformation:

- `normalizeKey`
- `selectPrecomputedRecord`
- `buildCommandCenterFromRecord`
- `fallbackCommandCenter`
- `registry_source / source_files / field_sources`

None of these are business logic or lifecycle logic.

## Conclusion

The loader boundary is now acceptable:

- business logic: upstream
- lifecycle logic: upstream
- UI shaping: loader

The loader is now a presentation adapter over the merchant lifecycle registry.
