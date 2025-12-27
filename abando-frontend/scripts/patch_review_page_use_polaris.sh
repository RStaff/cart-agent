#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
PAGE="app/embedded/review/page.tsx"
LAYOUT="app/layout.tsx"

if [[ ! -f "$PAGE" ]]; then
  echo "❌ Missing $PAGE (run from abando-frontend root)."
  exit 1
fi

ts() { date +%s; }

echo "✅ Repo: $ROOT"
echo "✅ Target: $PAGE"

# 1) Ensure Polaris deps exist
HAS_POLARIS="$(node -p "const p=require('./package.json'); !!((p.dependencies&&p.dependencies['@shopify/polaris'])||(p.devDependencies&&p.devDependencies['@shopify/polaris']))" 2>/dev/null || echo "false")"

if [[ "$HAS_POLARIS" != "true" ]]; then
  echo "📦 Installing Polaris..."
  npm i @shopify/polaris @shopify/polaris-icons
else
  echo "📦 Polaris already installed."
fi

# 2) Ensure Polaris CSS is imported in app/layout.tsx
if [[ -f "$LAYOUT" ]]; then
  if rg -n "@shopify/polaris/.*/styles\\.css" "$LAYOUT" >/dev/null 2>&1; then
    echo "🎨 Polaris CSS already imported in $LAYOUT"
  else
    echo "🎨 Adding Polaris CSS import to $LAYOUT"
    cp "$LAYOUT" "$LAYOUT.bak_$(ts)"

    # If layout already imports globals.css, insert right after it; otherwise add near top.
    if rg -n "globals\\.css" "$LAYOUT" >/dev/null 2>&1; then
      perl -0777 -i -pe 's|(import\s+["'\''][^"'\'']*globals\.css["'\''];\s*)|$1import "@shopify/polaris/build/esm/styles.css";\n|s' "$LAYOUT"
    else
      perl -0777 -i -pe 's|^|import "@shopify/polaris/build/esm/styles.css";\n|s' "$LAYOUT"
    fi
  fi
else
  echo "⚠️ $LAYOUT not found; skipping CSS import. If styles look off, add:"
  echo '   import "@shopify/polaris/build/esm/styles.css";'
fi

# 3) Replace review page with Polaris version
echo "🧾 Backing up $PAGE"
cp "$PAGE" "$PAGE.bak_$(ts)"

echo "✍️ Writing Polaris-styled review page..."
cat > "$PAGE" << 'PAGEEOF'
"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  List,
  Banner,
} from "@shopify/polaris";

export default function EmbeddedReviewPage() {
  return (
    <div style={{ background: "#0b0f1a", minHeight: "100vh" }}>
      <Box padding="400">
        <Page
          title="Abando Dashboard"
          subtitle="Review demo view (example content)"
          primaryAction={{ content: "Safe demo view", disabled: true }}
          titleMetadata={<Badge tone="success">Embedded</Badge>}
        >
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingLg">
                    Turn checkout hesitation into actionable follow-ups — inside Shopify.
                  </Text>

                  <Text as="p" tone="subdued">
                    Abando helps merchants understand why shoppers pause, so you can respond with the right
                    message at the right moment—without manually digging through sessions.
                  </Text>

                  <InlineStack gap="200">
                    <Badge tone="info">Clarity, not noise</Badge>
                    <Badge>Built for embedded admin workflows</Badge>
                  </InlineStack>

                  <Divider />

                  <BlockStack gap="200">
                    <Feature
                      title="Hesitation patterns"
                      desc="Group sessions into clear behavioral buckets (e.g., sizing uncertainty, timing delay, price friction)."
                    />
                    <Feature
                      title="Next-best action suggestions"
                      desc="See which follow-up fits the hesitation type—without rebuilding your entire marketing stack."
                    />
                    <Feature
                      title="Review-first dashboard design"
                      desc="This view is purpose-built for Shopify review and onboarding demos using example content."
                    />
                  </BlockStack>

                  <Text as="p" tone="subdued" variant="bodySm">
                    Note: This page intentionally displays example content only. Live insights appear after installation and real store activity.
                  </Text>
                </BlockStack>
              </Card>

              <Box paddingBlockStart="400">
                <Banner title="For reviewers" tone="info">
                  <List type="bullet">
                    <List.Item>Readable in an embedded context (low clutter, high signal).</List.Item>
                    <List.Item>No unsubstantiated performance claims or customer testimonials are shown.</List.Item>
                    <List.Item>Outcome-oriented language (reduce hesitation) without quoting specific results.</List.Item>
                  </List>
                </Banner>
              </Box>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Kpi title="Checkout sessions identified" desc="Surface moments where a shopper paused long enough to signal uncertainty." />
                <Kpi title="Hesitation categories" desc="Organize behavior into clear reasons—so follow-ups can match intent." />
                <Kpi title="Embedded admin insights" desc="Keep your workflow inside Shopify admin—no tab chaos, no manual exports." />
                <Kpi title="Follow-up readiness" desc="A clean handoff into messaging tools once your flows are enabled." />
              </BlockStack>
            </Layout.Section>
          </Layout>
        </Page>
      </Box>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <BlockStack gap="100">
      <Text as="h3" variant="headingSm">
        {title}
      </Text>
      <Text as="p" tone="subdued">
        {desc}
      </Text>
    </BlockStack>
  );
}

function Kpi({ title, desc }: { title: string; desc: string }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        <Text as="p" tone="subdued">
          {desc}
        </Text>
        <Text as="p" tone="subdued" variant="bodySm">
          Example view • Real activity populates after install
        </Text>
      </BlockStack>
    </Card>
  );
}
PAGEEOF

echo "✅ Done."
echo "Next:"
echo "  npm run dev"
echo "  open http://localhost:3000/embedded/review"
