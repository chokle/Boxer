import { db, gyms, fighters, tournaments } from "@workspace/db";

async function clear() {
  await db.delete(tournaments);
  await db.delete(fighters);
  await db.delete(gyms);
  console.log("Cleared all community data");
  process.exit(0);
}

clear().catch((err) => {
  console.error("Clear failed:", err);
  process.exit(1);
});
