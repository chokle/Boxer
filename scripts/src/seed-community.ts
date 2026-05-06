import { db, gyms, fighters, tournaments } from "@workspace/db";

async function seed() {
  console.log("Seeding community data...");

  // ── Gyms ──────────────────────────────────────────────────────────────────
  const insertedGyms = await db.insert(gyms).values([
    {
      name: "Iron Fist Boxing Club",
      city: "Los Angeles",
      state: "CA",
      address: "1420 S Figueroa St",
      phone: "(213) 555-0101",
      coachName: "Marcus 'The Hammer' Johnson",
      foundedYear: 1998,
      activeMembers: 87,
      specialties: "Southpaw training, counter-punching, footwork",
    },
    {
      name: "Champion's Corner Gym",
      city: "Chicago",
      state: "IL",
      address: "3300 W Roosevelt Rd",
      phone: "(312) 555-0188",
      coachName: "Coach Ray Delgado",
      foundedYear: 2005,
      activeMembers: 64,
      specialties: "Body work, pressure fighting, amateur development",
    },
    {
      name: "Knockout Kings Boxing",
      city: "Houston",
      state: "TX",
      address: "7821 Westheimer Rd",
      phone: "(713) 555-0142",
      coachName: "Darnell 'Smooth' Evans",
      foundedYear: 2011,
      activeMembers: 52,
      specialties: "Speed training, combination work, pro preparation",
    },
    {
      name: "The Sweet Science Academy",
      city: "New York",
      state: "NY",
      address: "560 Atlantic Ave, Brooklyn",
      phone: "(718) 555-0177",
      coachName: "Coach Elena Vasquez",
      foundedYear: 1992,
      activeMembers: 110,
      specialties: "Classical technique, defense-first, jab mastery",
    },
    {
      name: "Desert Warriors Boxing",
      city: "Phoenix",
      state: "AZ",
      address: "2250 E McDowell Rd",
      phone: "(602) 555-0133",
      coachName: "Tony 'Scorpion' Reyes",
      foundedYear: 2015,
      activeMembers: 41,
      specialties: "Aggressive pressure, inside fighting, conditioning",
    },
  ]).returning();

  const [ironFist, champions, knockoutKings, sweetScience, desert] = insertedGyms;
  console.log(`Inserted ${insertedGyms.length} gyms`);

  // ── Fighters ─────────────────────────────────────────────────────────────
  await db.insert(fighters).values([
    // Lightweight – Amateur
    { name: "Darius Webb", gymId: ironFist.id, weightClass: "Lightweight", stance: "Orthodox", age: 21, status: "amateur", recordWins: 14, recordLosses: 2, recordDraws: 0, rankAmateur: 1, style: "aggressive", bio: "Fast hands, relentless pressure fighter from South LA." },
    { name: "Carlos Mendez", gymId: champions.id, weightClass: "Lightweight", stance: "Southpaw", age: 19, status: "amateur", recordWins: 11, recordLosses: 3, recordDraws: 1, rankAmateur: 2, style: "counter", bio: "Southpaw counter-puncher with elite timing." },
    { name: "Jake Holloway", gymId: sweetScience.id, weightClass: "Lightweight", stance: "Orthodox", age: 22, status: "amateur", recordWins: 9, recordLosses: 4, recordDraws: 0, rankAmateur: 3, style: "defensive", bio: "Slick boxer with a textbook jab and good ring IQ." },
    { name: "Terrance Hill", gymId: desert.id, weightClass: "Lightweight", stance: "Orthodox", age: 20, status: "amateur", recordWins: 8, recordLosses: 5, recordDraws: 0, rankAmateur: 4, style: "brawler", bio: "High-volume puncher who loves to brawl on the inside." },
    // Lightweight – Pro
    { name: "Marcus 'Swift' Daniels", gymId: knockoutKings.id, weightClass: "Lightweight", stance: "Orthodox", age: 26, status: "pro", recordWins: 18, recordLosses: 3, recordDraws: 1, rankPro: 1, style: "counter", bio: "Regional champion with elite footwork and a dangerous right hand." },
    { name: "Ramon 'El Toro' Gutierrez", gymId: ironFist.id, weightClass: "Lightweight", stance: "Southpaw", age: 28, status: "pro", recordWins: 14, recordLosses: 5, recordDraws: 0, rankPro: 2, style: "aggressive", bio: "Pressure fighter who bends opponents against the ropes." },
    // Welterweight – Amateur
    { name: "Jaylen Cross", gymId: sweetScience.id, weightClass: "Welterweight", stance: "Orthodox", age: 20, status: "amateur", recordWins: 16, recordLosses: 1, recordDraws: 0, rankAmateur: 1, style: "balanced", bio: "Top amateur welterweight with Golden Gloves ambitions." },
    { name: "Diego Fuentes", gymId: champions.id, weightClass: "Welterweight", stance: "Southpaw", age: 23, status: "amateur", recordWins: 12, recordLosses: 4, recordDraws: 2, rankAmateur: 2, style: "counter", bio: "Slick southpaw known for his right jab and lateral movement." },
    { name: "Andre Thompson", gymId: desert.id, weightClass: "Welterweight", stance: "Orthodox", age: 21, status: "amateur", recordWins: 10, recordLosses: 3, recordDraws: 0, rankAmateur: 3, style: "aggressive", bio: "Power puncher who overwhelms opponents with volume and pressure." },
    // Welterweight – Pro
    { name: "Victor 'Stone Hands' Okonkwo", gymId: sweetScience.id, weightClass: "Welterweight", stance: "Orthodox", age: 29, status: "pro", recordWins: 22, recordLosses: 4, recordDraws: 1, rankPro: 1, style: "aggressive", bio: "Veteran puncher with knockout power in both hands." },
    { name: "Kyle 'Ghost' Patterson", gymId: knockoutKings.id, weightClass: "Welterweight", stance: "Orthodox", age: 27, status: "pro", recordWins: 17, recordLosses: 6, recordDraws: 0, rankPro: 2, style: "defensive", bio: "Elusive boxer-mover with championship-level ring generalship." },
    // Middleweight – Amateur
    { name: "Tyree Jackson", gymId: ironFist.id, weightClass: "Middleweight", stance: "Orthodox", age: 22, status: "amateur", recordWins: 18, recordLosses: 2, recordDraws: 0, rankAmateur: 1, style: "balanced", bio: "The most complete amateur middleweight on the West Coast." },
    { name: "Brendan O'Sullivan", gymId: sweetScience.id, weightClass: "Middleweight", stance: "Southpaw", age: 20, status: "amateur", recordWins: 13, recordLosses: 3, recordDraws: 1, rankAmateur: 2, style: "counter", bio: "Irish-American brawler who converted to southpaw at 16." },
    { name: "DeSean Morris", gymId: champions.id, weightClass: "Middleweight", stance: "Orthodox", age: 24, status: "amateur", recordWins: 11, recordLosses: 5, recordDraws: 0, rankAmateur: 3, style: "brawler", bio: "Hard-nosed pressure fighter with exceptional chin." },
    // Middleweight – Pro
    { name: "Rafael 'The Bull' Santos", gymId: desert.id, weightClass: "Middleweight", stance: "Orthodox", age: 30, status: "pro", recordWins: 26, recordLosses: 5, recordDraws: 2, rankPro: 1, style: "aggressive", bio: "Ranked contender with devastating body attack." },
    { name: "Leon 'The Professor' Clark", gymId: sweetScience.id, weightClass: "Middleweight", stance: "Orthodox", age: 31, status: "pro", recordWins: 20, recordLosses: 8, recordDraws: 1, rankPro: 2, style: "defensive", bio: "Technical wizard who outboxes every opponent he faces." },
    // Heavyweight – Amateur
    { name: "Big Earl Washington", gymId: knockoutKings.id, weightClass: "Heavyweight", stance: "Orthodox", age: 23, status: "amateur", recordWins: 12, recordLosses: 1, recordDraws: 0, rankAmateur: 1, style: "brawler", bio: "Explosive puncher who ends most fights before the final bell." },
    { name: "Mikhail Petrov", gymId: ironFist.id, weightClass: "Heavyweight", stance: "Orthodox", age: 25, status: "amateur", recordWins: 9, recordLosses: 4, recordDraws: 0, rankAmateur: 2, style: "balanced", bio: "Former Olympic hopeful with classical European technique." },
    // Heavyweight – Pro
    { name: "Jerome 'The Destroyer' Banks", gymId: champions.id, weightClass: "Heavyweight", stance: "Orthodox", age: 32, status: "pro", recordWins: 28, recordLosses: 3, recordDraws: 0, rankPro: 1, style: "aggressive", bio: "Feared slugger with 24 KOs and punishing body shots." },
  ]);
  console.log("Inserted fighters");

  // ── Tournaments ───────────────────────────────────────────────────────────
  await db.insert(tournaments).values([
    {
      name: "Southwest Regional Golden Gloves",
      city: "Los Angeles",
      state: "CA",
      venue: "Staples Center Arena B",
      startDate: "2026-06-14",
      endDate: "2026-06-16",
      type: "amateur",
      status: "upcoming",
      weightClasses: "Flyweight, Lightweight, Welterweight, Middleweight, Heavyweight",
      entryDeadline: "2026-05-31",
      maxParticipants: 128,
      registeredCount: 74,
      entryFee: 5000,
      description: "Annual Southwest Regional qualifier. Top finishers advance to National Golden Gloves.",
      contactEmail: "swgoldengloves@boxing.org",
    },
    {
      name: "Lone Star Pro-Am Championship",
      city: "Houston",
      state: "TX",
      venue: "NRG Arena",
      startDate: "2026-07-05",
      endDate: "2026-07-06",
      type: "amateur",
      status: "upcoming",
      weightClasses: "Lightweight, Welterweight, Light Middleweight, Middleweight",
      entryDeadline: "2026-06-20",
      maxParticipants: 64,
      registeredCount: 38,
      entryFee: 4000,
      description: "Texas' premier amateur showcase featuring the state's top-ranked fighters.",
      contactEmail: "lonestar@txboxing.com",
    },
    {
      name: "Midwest Open Boxing Championships",
      city: "Chicago",
      state: "IL",
      venue: "Wintrust Arena",
      startDate: "2026-08-22",
      endDate: "2026-08-24",
      type: "amateur",
      status: "upcoming",
      weightClasses: "All weight classes",
      entryDeadline: "2026-08-01",
      maxParticipants: 200,
      registeredCount: 112,
      entryFee: 3500,
      description: "Open to all amateurs. Great opportunity for debut fighters and seasoned competitors alike.",
      contactEmail: "midwest.boxing@ibf.org",
    },
    {
      name: "Desert Storm Pro Fight Night",
      city: "Phoenix",
      state: "AZ",
      venue: "Footprint Center",
      startDate: "2026-09-13",
      type: "pro",
      status: "upcoming",
      weightClasses: "Lightweight, Welterweight, Middleweight, Heavyweight",
      entryDeadline: "2026-08-25",
      maxParticipants: 24,
      registeredCount: 18,
      entryFee: 0,
      description: "Professional fight night featuring regional title bouts. Promoted by Desert Warriors Boxing.",
      contactEmail: "promo@desertstorm.boxing",
      contactPhone: "(602) 555-0199",
    },
    {
      name: "NYC Battle in Brooklyn",
      city: "New York",
      state: "NY",
      venue: "Barclays Center Studio",
      startDate: "2026-05-24",
      endDate: "2026-05-25",
      type: "amateur",
      status: "upcoming",
      weightClasses: "Lightweight, Welterweight, Middleweight",
      entryDeadline: "2026-05-15",
      maxParticipants: 48,
      registeredCount: 45,
      entryFee: 2500,
      description: "One of NYC's most storied amateur tournaments, held annually at Barclays.",
      contactEmail: "battleinbrooklyn@nycboxing.com",
    },
  ]);
  console.log("Inserted tournaments");

  console.log("✓ Community seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
