import sys, re, os
toml = "shopify.app.toml"
app_url = None
with open(toml, "r", encoding="utf-8") as f:
    lines = f.readlines()
for line in lines:
    m = re.match(r'^\s*application_url\s*=\s*"(.*?)"\s*$', line)
    if m:
        app_url = m.group(1).rstrip('/')
        break
if not app_url:
    print("application_url not found in shopify.app.toml", file=sys.stderr)
    sys.exit(1)
filtered = [ln for ln in lines if not re.match(r'^\s*redirect_urls\s*=', ln)]
auth_start = None
for i, ln in enumerate(filtered):
    if re.match(r'^\s*\[auth\]\s*$', ln):
        auth_start = i
        break
if auth_start is None:
    if filtered and not filtered[-1].endswith("\n"):
        filtered.append("\n")
    filtered.append("[auth]\n")
    auth_start = len(filtered) - 1
redir = f'redirect_urls = ["{app_url}/auth/callback","{app_url}/auth/shopify/callback","{app_url}/api/auth/callback"]\n'
out = []
i = 0
while i < len(filtered):
    out.append(filtered[i])
    if i == auth_start:
        j = i + 1
        while j < len(filtered) and re.match(r'^\s*redirect_urls\s*=', filtered[j]):
            j += 1
        out.append(redir)
        i = j
        continue
    i += 1
tmp = toml + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.writelines(out)
os.replace(tmp, toml)
print(f"✅ Fixed [auth].redirect_urls using {app_url}")
