import { Router } from "express";
import { db } from "@workspace/db";
import { gyms, fighters, tournaments } from "@workspace/db";
import { eq, and, or, ne, sql } from "drizzle-orm";

const router = Router();

// ─── GYMS ────────────────────────────────────────────────────────────────────

router.get("/community/gyms", async (req, res) => {
  try {
    const rows = await db.select().from(gyms).orderBy(gyms.name).limit(100);
    res.json({ gyms: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch gyms");
    res.status(500).json({ error: "Failed to fetch gyms" });
  }
});

// Publishing is intentionally unavailable through the public mobile API.
// Curated entries are maintained through the operator's authenticated database tools.
router.post("/community/gyms", (_req, res) => {
  res.setHeader("Allow", "GET");
  res.status(405).json({ error: "Community publication is restricted to the publisher" });
});

// ─── FIGHTERS ────────────────────────────────────────────────────────────────

router.get("/community/fighters", async (req, res) => {
  try {
    const { weight_class, status, gym_id } = req.query as Record<string, string | undefined>;

    const rows = await db
      .select({
        id: fighters.id,
        name: fighters.name,
        gymId: fighters.gymId,
        gymName: gyms.name,
        weightClass: fighters.weightClass,
        stance: fighters.stance,
        age: fighters.age,
        status: fighters.status,
        recordWins: fighters.recordWins,
        recordLosses: fighters.recordLosses,
        recordDraws: fighters.recordDraws,
        rankAmateur: fighters.rankAmateur,
        rankPro: fighters.rankPro,
        style: fighters.style,
        bio: fighters.bio,
      })
      .from(fighters)
      .leftJoin(gyms, eq(fighters.gymId, gyms.id))
      .where(
        and(
          weight_class ? eq(fighters.weightClass, weight_class) : undefined,
          status ? eq(fighters.status, status) : undefined,
          gym_id ? eq(fighters.gymId, parseInt(gym_id)) : undefined,
        )
      )
      .orderBy(
        sql`CASE WHEN ${fighters.status} = 'pro' THEN ${fighters.rankPro} ELSE ${fighters.rankAmateur} END NULLS LAST`
      ).limit(100);

    res.json({ fighters: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch fighters");
    res.status(500).json({ error: "Failed to fetch fighters" });
  }
});

// Publishing is intentionally unavailable through the public mobile API.
// Curated entries are maintained through the operator's authenticated database tools.
router.post("/community/fighters", (_req, res) => {
  res.setHeader("Allow", "GET");
  res.status(405).json({ error: "Community publication is restricted to the publisher" });
});

// ─── OPPONENT MATCHING ───────────────────────────────────────────────────────

router.get("/community/fighters/:id/opponents", async (req, res) => {
  try {
    const fighterId = parseInt(req.params.id);
    if (!/^\d+$/.test(String(req.params.id)) || !Number.isSafeInteger(fighterId) || fighterId < 1 || fighterId > 2147483647) {
      res.status(400).json({ error: "Invalid fighter ID" });
      return;
    }

    const [fighter] = await db.select().from(fighters).where(eq(fighters.id, fighterId));
    if (!fighter) {
      res.status(404).json({ error: "Fighter not found" });
      return;
    }

    const winRate = fighter.recordWins + fighter.recordLosses + fighter.recordDraws > 0
      ? fighter.recordWins / (fighter.recordWins + fighter.recordLosses + fighter.recordDraws)
      : 0.5;

    const opponents = await db
      .select({
        id: fighters.id,
        name: fighters.name,
        gymName: gyms.name,
        weightClass: fighters.weightClass,
        stance: fighters.stance,
        age: fighters.age,
        status: fighters.status,
        recordWins: fighters.recordWins,
        recordLosses: fighters.recordLosses,
        recordDraws: fighters.recordDraws,
        rankAmateur: fighters.rankAmateur,
        rankPro: fighters.rankPro,
        style: fighters.style,
      })
      .from(fighters)
      .leftJoin(gyms, eq(fighters.gymId, gyms.id))
      .where(
        and(
          ne(fighters.id, fighterId),
          eq(fighters.weightClass, fighter.weightClass),
          eq(fighters.status, fighter.status),
        )
      )
      .orderBy(
        sql`ABS(
          (${fighters.recordWins}::float / NULLIF(${fighters.recordWins}::float + ${fighters.recordLosses}::float + ${fighters.recordDraws}::float, 0))
          - ${winRate}
        ) NULLS LAST`
      )
      .limit(10);

    res.json({ fighter, opponents });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch opponents");
    res.status(500).json({ error: "Failed to fetch opponents" });
  }
});

// ─── TOURNAMENTS ─────────────────────────────────────────────────────────────

router.get("/community/tournaments", async (req, res) => {
  try {
    const { status, type } = req.query as Record<string, string | undefined>;

    const rows = await db
      .select()
      .from(tournaments)
      .where(
        and(
          status ? eq(tournaments.status, status) : undefined,
          type ? eq(tournaments.type, type) : undefined,
        )
      )
      .orderBy(tournaments.startDate).limit(100);

    res.json({ tournaments: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch tournaments");
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// Publishing is intentionally unavailable through the public mobile API.
// Curated entries are maintained through the operator's authenticated database tools.
router.post("/community/tournaments", (_req, res) => {
  res.setHeader("Allow", "GET");
  res.status(405).json({ error: "Community publication is restricted to the publisher" });
});

export default router;
