import type { CheckoutEventRecord } from "@/lib/dashboard/storage/types";
import { saveCheckoutEvents as saveCheckoutEventsToStore } from "@/lib/dashboard/storage/repository";

export async function saveCheckoutEvents(records: CheckoutEventRecord[]) {
  return saveCheckoutEventsToStore(records);
}
