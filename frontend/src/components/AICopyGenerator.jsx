import React from "react";

/**
 * @typedef {Object} LineItem
 * @property {string} title
 * @property {number|string} quantity
 * @property {number|string} [unitPrice]
 *
 * @typedef {Object} AIResult
 * @property {string} [subject]
 * @property {string} [body]
 * @property {number|string} [totalComputed]
 * @property {LineItem[]} [itemsNormalized]
 */

/**
 * @param {{ result?: AIResult }} props
 */
export default function AICopyGenerator({ result }) {
  const fmt = React.useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  const total = Number(result?.totalComputed ?? 0);

  const items = Array.isArray(result?.itemsNormalized)
    ? result.itemsNormalized.map((it) => ({
        title: it?.title ?? "",
        quantity: Number(it?.quantity ?? 0),
        unitPrice:
          it?.unitPrice !== undefined && it?.unitPrice !== null
            ? Number(it.unitPrice)
            : 0,
      }))
    : [];

  const hasItems = items.length > 0;

  return (
    <div className="border rounded-lg p-4 grid gap-3">
      {result?.subject && (
        <div className="font-semibold">Subject: {result.subject}</div>
      )}

      {result?.body && (
        <pre className="whitespace-pre-wrap text-sm leading-6">{result.body}</pre>
      )}

      <div className="text-sm">
        <div>
          <span className="font-medium">Computed Total:</span>{" "}
          {fmt.format(total)}
        </div>

        {hasItems ? (
          <>
            <div className="font-medium mt-2">Line Items</div>
            <div className="border rounded-md p-3 text-sm">
              <div className="font-medium mb-2">Parsed Items</div>
              <ul className="list-disc pl-5">
                {items.map((it, i) => {
                  const hasPrice =
                    Number.isFinite(it.unitPrice) && it.unitPrice > 0;
                  return (
                    <li key={i}>
                      {it.title || "Untitled"} — qty{" "}
                      {Number.isFinite(it.quantity) ? it.quantity : 0}
                      {hasPrice ? ` @ ${fmt.format(Number(it.unitPrice))}` : ""}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2">
                Computed total: <b>{fmt.format(total)}</b>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-2 text-neutral-500">
            <span className="font-medium">Line Items</span>
            <div className="mt-1">No items parsed.</div>
          </div>
        )}
      </div>
    </div>
  );
}
