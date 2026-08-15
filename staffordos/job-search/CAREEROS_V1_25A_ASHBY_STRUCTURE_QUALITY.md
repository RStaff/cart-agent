# Ashby Structure Quality

No live pilot was performed. The documented response schema is structurally suitable for the V1.24H/I contract: HTML and plain text descriptions, locations, workplace type, employment type, dates, URLs, listed state, and optional compensation are specified.

Expected acceptance checks after authorization:

- preserve `descriptionHtml` privately;
- parse headings, lists, and order into existing `sourceStructure`;
- retain `descriptionPlain` as fallback;
- generate deterministic source digest;
- compare section coverage against Greenhouse without changing V2D.

This is an expected capability, not a completed real-payload result.
