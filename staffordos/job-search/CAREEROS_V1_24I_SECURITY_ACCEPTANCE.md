# Security Acceptance

Raw HTML is retained privately as source evidence. The structural parser removes script/style content from parsed blocks, ignores event attributes, executes no markup, and exposes no raw HTML rendering path. Tests cover script, style, onclick, and malformed content cases.
