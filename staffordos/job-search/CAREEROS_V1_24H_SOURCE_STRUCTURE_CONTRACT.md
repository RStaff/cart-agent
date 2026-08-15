# V1.24H Source Structure Contract

The normalized source record now preserves existing plain-text fields plus private rawSourceContent, rawSourceContentType, and sourceStructure. The structure projection contains ordered blocks, raw headings, normalized sections, block text, child list items, parser version, and deterministic block IDs. Existing consumers continue to receive company, title, location, source identity, URL, employment metadata, freshness, and plain-text description.
