#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { fetchGithubNotifications } from "../../staffordos/integrations/gmail/fetch_github_notifications.mjs";
import { parseGithubEmail } from "../../staffordos/integrations/gmail/parse_github_email.mjs";
import { processGithubReplies } from "../../staffordos/integrations/gmail/process_github_replies.mjs";

export async function runGmailReplySync() {
  const summary = {
    stage: "starting",
    totalIdsFound: 0,
    fetchedIdsCount: 0,
    emailsFetched: 0,
    emailsAccepted: 0,
    emailsRejected: 0,
    emailsChecked: 0,
    repliesDetected: 0,
    leadsUpdated: 0,
    newReplyAlerts: 0,
    error: null,
  };

  try {
    summary.stage = "fetching_notifications";
    const fetchResult = await fetchGithubNotifications();
    summary.totalIdsFound = Number(fetchResult?.totalIdsFound || 0);
    summary.fetchedIdsCount = Number(fetchResult?.fetchedIdsCount || 0);
    summary.emailsFetched = Number(fetchResult?.emailsFetched || 0);
    summary.emailsAccepted = Number(fetchResult?.emailsAccepted || 0);
    summary.emailsRejected = Number(fetchResult?.emailsRejected || 0);

    const emails = Array.isArray(fetchResult?.emails) ? fetchResult.emails : [];
    summary.emailsChecked = emails.length;
    if (emails.length === 0) {
      summary.stage = "no_matching_emails";
      return { summary, alerts: [] };
    }

    summary.stage = "parsing_emails";
    const parsed = emails
      .map((email) => parseGithubEmail(email))
      .filter(Boolean);
    summary.repliesDetected = parsed.length;

    summary.stage = "processing_replies";
    const result = await processGithubReplies(parsed, emails);
    summary.repliesDetected = result.repliesDetected;
    summary.leadsUpdated = result.leadsUpdated;
    summary.newReplyAlerts = result.newReplyAlerts;
    summary.stage = "done";
    return {
      summary,
      alerts: Array.isArray(result.alerts) ? result.alerts : [],
    };
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    return { summary, alerts: [] };
  }
}

async function main() {
  const { summary, alerts } = await runGmailReplySync();

  if (summary.newReplyAlerts > 0) {
    for (const alert of alerts) {
      console.log("[reply-alert] NEW GITHUB REPLY");
      console.log(`leadId: ${alert.leadId}`);
      console.log(`name: ${alert.name}`);
      console.log(`issue: ${alert.issue}`);
      console.log(`replyPreview: ${alert.replyPreview}`);
      console.log(`timestamp: ${alert.timestamp}`);
    }
    console.log(`[reply-alert] total new replies: ${summary.newReplyAlerts}`);
    process.stdout.write("\a");
  }

  console.log(JSON.stringify(summary, null, 2));
  if (summary.error) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[gmail-reply-sync] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
