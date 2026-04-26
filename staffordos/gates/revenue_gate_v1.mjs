
export function revenueGate(surfaceScore) {
  const MIN = 70;
  if (surfaceScore < MIN) {
    console.log(JSON.stringify({ allowed:false, reason:"conversion_surface_not_ready" }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ allowed:true }, null, 2));
}
