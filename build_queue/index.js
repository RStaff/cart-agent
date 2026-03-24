import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSlices, persistSlices } from "../slices/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, "queue.json");

const EFFORT_SCORES = {
  small: 30,
  medium: 18,
  large: 8,
};

async function readQueue() {
  const raw = await readFile(QUEUE_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeQueue(items) {
  await writeFile(QUEUE_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");
}

function dependencyPenalty(dependencies) {
  return (Array.isArray(dependencies) ? dependencies.length : 0) * 6;
}

function buildPriorityScore(slice) {
  const shippableScore = slice.shippable ? 25 : -100;
  const effortScore = EFFORT_SCORES[slice.effort_size] ?? 0;
  const strategicScore = Number(slice.strategic_value) || 0;
  const dependencyScore = Math.max(0, 20 - dependencyPenalty(slice.dependencies));
  return shippableScore + effortScore + strategicScore + dependencyScore;
}

function selectionReason(slice, priorityScore) {
  const dependencyCount = Array.isArray(slice.dependencies) ? slice.dependencies.length : 0;
  return [
    `${slice.title} scored ${priorityScore}.`,
    `It is ${slice.effort_size} effort, ${slice.shippable ? "shippable" : "not shippable"}, has strategic value ${slice.strategic_value}, and ${dependencyCount} dependenc${dependencyCount === 1 ? "y" : "ies"}.`,
  ].join(" ");
}

function buildQueueItem(slice, selected) {
  const priorityScore = buildPriorityScore(slice);
  return {
    id: `queue__${slice.id}`,
    slice_id: slice.id,
    priority_score: priorityScore,
    selection_reason: selectionReason(slice, priorityScore),
    selected_at: selected ? new Date().toISOString() : null,
    recommended_next_action: selected
      ? `Build ${slice.title} next.`
      : `Keep ${slice.title} queued behind higher-priority slices.`,
    reasoning_summary: selected
      ? "This is the current best next slice because it is small, shippable, strategically valuable, and lightly dependent."
      : "This slice remains queued until a higher-ranked slice is completed or deprioritized.",
  };
}

function compareQueueItems(a, b) {
  if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
  const aSelected = a.selected_at ? 1 : 0;
  const bSelected = b.selected_at ? 1 : 0;
  if (bSelected !== aSelected) return bSelected - aSelected;
  return a.slice_id.localeCompare(b.slice_id);
}

export async function listBuildQueue() {
  const queue = await readQueue();
  return queue.sort(compareQueueItems);
}

export async function getNextBuildQueueItem() {
  const queue = await listBuildQueue();
  return queue[0] || null;
}

export async function runBuildQueue() {
  const slices = await listSlices();
  const buildable = slices.filter((slice) => slice.shippable && slice.status !== "shipped" && slice.status !== "in_progress");

  const ranked = buildable
    .map((slice) => ({ slice, priority_score: buildPriorityScore(slice) }))
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      return a.slice.id.localeCompare(b.slice.id);
    });

  const selectedSliceId = ranked[0]?.slice.id || null;

  const updatedSlices = slices.map((slice) => {
    if (!buildable.find((candidate) => candidate.id === slice.id)) return slice;
    if (slice.id === selectedSliceId) {
      return { ...slice, status: "selected" };
    }
    if (slice.status === "discovered" || slice.status === "selected") {
      return { ...slice, status: "queued" };
    }
    return slice;
  });

  await persistSlices(updatedSlices);

  const queueItems = ranked.map(({ slice }) =>
    buildQueueItem(updatedSlices.find((updated) => updated.id === slice.id) || slice, slice.id === selectedSliceId),
  );

  await writeQueue(queueItems);

  return {
    queue_count: queueItems.length,
    selected_slice_id: selectedSliceId,
    next_item: queueItems[0] || null,
    queue: queueItems,
    recommended_next_action: queueItems[0]
      ? queueItems[0].recommended_next_action
      : "Generate candidate opportunities and slices before running the build queue again.",
    reasoning_summary: queueItems[0]
      ? queueItems[0].reasoning_summary
      : "No shippable slices are currently available for selection.",
  };
}
