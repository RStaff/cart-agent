import re, sys
ok = True
with open("shopify.app.toml","r",encoding="utf-8") as f:
    s = f.read()
auths = re.findall(r'^\s*\[auth\]\s*$', s, flags=re.M)
if len(auths) != 1:
    print(f"❌ Expected exactly 1 [auth] table, found {len(auths)}")
    ok = False
ru = re.findall(r'^\s*redirect_urls\s*=', s, flags=re.M)
if len(ru) != 1:
    print(f"❌ Expected exactly 1 redirect_urls line, found {len(ru)}")
    ok = False
m = re.search(r'^\s*application_url\s*=\s*"(.*?)"\s*$', s, flags=re.M)
if not m:
    print("❌ application_url not found")
    ok = False
else:
    app = m.group(1).rstrip('/')
    want = f'redirect_urls = ["{app}/auth/callback","{app}/auth/shopify/callback","{app}/api/auth/callback"]'
    if want not in s:
        print("❌ redirect_urls does not match application_url")
        ok = False
if ok:
    print("✅ verify_auth: looks good")
sys.exit(0 if ok else 1)
