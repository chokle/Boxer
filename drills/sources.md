# Boxer AI Drill Library — Sources & Fault Vocabulary

## Fault vocabulary (36 keys)

These are the canonical `targets_faults` keys used in `drills.json`.
The analysis pipeline should emit exactly these keys so drill mapping
is a deterministic lookup.

**Stance:** `square-stance`, `wide-stance`, `weight-forward`,
`weight-back`, `stance-drifts`

**Guard:** `hands-low`, `drops-guard-on-jab`, `drops-guard-on-cross`,
`elbows-out`, `chin-up`, `dropping-hands-under-pressure`,
`hands-drop-when-tired`

**Punch mechanics:** `overreaching-jab`, `arm-punching`,
`no-hip-rotation`, `elbow-flare`, `dropping-rear-hand-on-hook`,
`telegraphing`, `no-snap`, `falling-in`

**Footwork:** `flat-footed`, `crossing-feet`, `lunging-steps`,
`no-pivot`, `backing-straight-up`, `poor-distance-control`

**Head movement:** `no-head-movement`, `predictable-head-movement`,
`excessive-lean-back`

**Defense:** `no-parry`, `static-defense`

**Combinations:** `single-punches-only`, `no-level-changes`,
`no-exit-after-combo`

**Conditioning:** `gassing-late`, `slow-recovery`

## Sources consulted

All coaching cues in `drills.json` are paraphrased in original wording.
These sources informed the technique content:

1. **Boxing Canada — Instruction Beginners Reference Manual**
   https://boxingcanada.org/wp-content/uploads/2025/01/Instruction-Beginners-Reference-Manual-EN.pdf
   Informed: jab mechanics (forearm rotation, rear-hand guard, quick retraction),
   defenses against straight punches (forearm block, parry with chin down),
   attack/defense pairing progressions.

2. **Boxing Canada — Competition Introduction LF Guide**
   https://boxingcanada.org/wp-content/uploads/2025/06/Competition-Introduction-LF-Guide-EN.pdf
   Informed: jab-to-head teaching points (aim point, hip/shoulder pivot,
   knuckle landing, wrist alignment).

3. **Boxing Australia — Level One Coaching Manual**
   http://cdn.revolutionise.com.au/cups/boxing/files/qxpguvjt2cgkasw6.pdf
   Informed: guard principles (protect target area, stay relaxed, fast return),
   common guard errors (hands low/high, elbows out, failing to reset after punching),
   punching fundamentals (rotation first, power from the ground, relaxed arm,
   exhale on impact, wrist alignment), chin position guidance.

4. **ExpertBoxing — The Beginner's Guide to Boxing**
   https://expertboxing.com/the-beginners-guide-to-boxing
   Informed: step-drag footwork (lead foot first in direction of travel, finish
   steps at equal distance), pivot technique (off the front foot, 45–180°),
   keeping feet grounded vs. jumping.

5. **ExpertBoxing — 4 Basic Boxing Footwork Drills**
   https://expertboxing.com/basic-boxing-footwork-drills
   Informed: static-blocking balance test (stance must absorb pressure before
   anything else), 55:45 weight distribution cue, explosive exhale on blocks.

6. **ExpertBoxing — 10 Boxing Footwork Tips**
   https://expertboxing.com/10-boxing-footwork-tips
   Informed: narrower stance for beginners (easier pivots, less energy),
   stepping on the balls of the feet.

7. **ExpertBoxing — Free Boxing Course (PDF)**
   https://www.expertboxing.com/ExpertBoxing-free-boxing-course.pdf
   Informed: blocking fundamentals (recover gloves to head/body), parries vs.
   long straight punches, footwork as defense (stepping out of range),
   uppercut weight-on-lead-leg cue, defense tip progressions.

8. **Tony Jeffries (Olympic bronze medallist) — Boxing Footwork Drills for Beginners**
   https://www.youtube.com/watch?v=tdYRCl-3Ohk
   Informed: footwork/combination integration (step with the jab, 1-2 moving
   forward/back, pivot after combinations, angle changes with the feet).

9. **Miri Boxing — The Only Footwork Moves You Need for Boxing**
   https://www.youtube.com/watch?v=Zhw9WUnXRrg
   Informed: five essential footwork moves (sweep step, roll + small step,
   L-step, lead-foot pivot, pull/step-back counter), small steps over lunges.

10. **BoxRaw — 6 Training Drills for Boxing Defense**
    https://boxraw.com/blogs/blog/6-training-drills-for-boxing-defence
    Informed: floor-to-ceiling bag defense drill (defend the rebound before
    punching again), slip-rope shadowboxing (roll under, hands up on return,
    punch before/after the roll), constant head movement principle.

11. **ExpertFightingTips — Blocking, Parrying, Rolling and Slipping**
    https://expertfightingtips.com/en/blocking-parrying-rolling-and-slipping/
    Informed: defense checklist (compact blocks, minimal parry movement, roll
    vs. hooks/uppercuts not straight punches, slip with head/torso only),
    combining slips with blocks.

12. **Fight Encyclopedia — Boxing Defense: Slips, Rolls, Blocks, and Parries**
    https://fightencyclopedia.com/blog/blog-boxing-defense-slips-rolls-blocks-parries
    Informed: slip vs. parry distinction, beginner-friendly defenses (outside
    jab parry, cross-arm block), shoulder-roll limitations (body type, range),
    step-slip creating angles for counters.

13. **Kings Boxing Gym — Defensive Tips for Boxing Beginners**
    https://kingsboxinggym.com.au/blog/defensive-tips-for-boxing-beginners?format=amp
    Informed: head movement driven from footwork (not waist-wobbling in place),
    slipping as continuous ring movement, slow-to-fast partner drill progression.

14. **Legends Boxing (Robby Welch, National Head Coach) — Basic Boxing Defense Moves**
    https://www.legendsboxing.com/post/basic-boxing-defense-moves
    Informed: core defensive toolkit order (high guard, slip, parry, footwork,
    bob-and-weave), defense-first coaching philosophy.

15. **Art of Manliness — How to Throw a Hook Punch and Uppercut Punch**
    https://www.artofmanliness.com/health-fitness/fitness/boxing-basics-part-v-punching-hook-uppercut/
    Informed: hook/uppercut power from hips and ground, chin down + opposite
    hand up during hooks, setting up hooks/uppercuts off other punches,
    speed and accuracy over raw power.

16. **BoxingEssential — Boxing Footwork for Beginners**
    https://boxingessential.com/boxing-footwork-for-beginners
    Informed: directional step-drag mechanics (which foot leads which direction),
    micro-movement principle (small 6–8 cm steps keep hips centered and
    defense ready; big lunging steps are a defensive liability).

17. **Boxing News — A Professional Boxing Training Routine**
    https://boxingnewsonline.net/features/a-professional-boxing-training-routine/
    Informed: pro camp structure (round-based training, 3-min rounds / 1-min
    rests, shadowboxing/bag/pads/sparring volumes, hill sprints, core work).

18. **Boxing News — Endurance Training for Boxers**
    https://boxingnewsonline.net/features/keep-fighting-endurance-training-for-boxers/
    Informed: interval-dominant conditioning (short repeat sprints over long
    slow distance), heavy-bag intervals with varied work/rest ratios, caution
    that excessive long-distance running can reduce punching power.

19. **Boxing News — Weekly Training Schedule with Carl Froch**
    https://boxingnewsonline.net/features/weekly-boxing-training-schedule-with-carl-froch/
    Informed: weekly structure mixing technique, sparring, S&C, roadwork, and
    rest days; speed circuits combining footwork ladders and bags.

20. **Ringsport — 24 Punching Combinations**
    https://www.ringsport.com.au/blogs/ringsport-blog/24-punching-combinations-that-work?srsltid=AfmBOorpkLY863U_lHapLwY4Dr-nyjR8FnPnvJYUNJpGAJqeE1lEuYVU
    Informed: foundational combination sequences (1-2, 1-2-1, 1-2-3,
    head-to-body level changes, double-up jab-hook), combination logic
    (straights set up hooks, body shots drop guards).

21. **FightCamp — Punching Bag Workouts for Beginners**
    https://legacy-blog.joinfightcamp.com/blogs/boxing-workouts-drills/boxing-workouts-beginners-punching-heavy-bag
    Informed: beginner bag round structures (jab-cross + body shots, double
    jab + bob-and-weave + hook, straight punches + power body shots),
    round/rest timing with conditioning fillers.

22. **TalkBoxing — Boxing Moves**
    https://www.talkboxing.co.uk/?p=188
    Informed: uppercut mechanics (90° forearm angle, palm up, close-range
    weapon), hook as short surprise punch, jab as the punch worth perfecting.

23. **BoxingRoyale — 5 Common Punching Mistakes**
    https://boxingroyale.com/en/blog/post/5-common-punching-mistakes
    Informed: unguarded chin during straight punches (head lift, torso lean),
    self-check methods for chin exposure.

## Where sources disagreed

1. **Hook elbow angle.** Consensus for the standard lead hook is a tight
   ~90° bend (Art of Manliness, ExpertBoxing-derived material, TalkBoxing).
   Some coaches teach a wider/longer hook for long range. The library uses
   90° as the beginner standard (`hook-geometry-mirror`) and notes the
   long-hook variation exists.

2. **Uppercut palm orientation.** Traditional teaching (TalkBoxing) has the
   palm facing up; several modern coaches teach palm facing inward toward
   the thrower. The library uses palm-up as the beginner standard
   (`dip-uppercut`) since it matches the majority of published beginner
   curricula; the drill notes the variation exists.

3. **How hard to tuck the chin.** Some coaches cue an aggressive tuck;
   Boxing Australia's manual specifically warns against forcing the chin
   down because it creates shoulder tension. The library uses the middle
   ground: chin down, eyes up, jaw relaxed (`chin-ball-shadowbox`,
   `guard-check-freeze`).

4. **Weight distribution in stance.** ExpertBoxing cites roughly 55:45
   front-to-back; most other sources say evenly balanced on the balls of
   the feet. The library teaches balanced and shiftable
   (`stance-hold-mirror`), which accommodates both.

5. **Shoulder roll universality.** Fight Encyclopedia and several coaches
   note the shoulder roll suits specific body types and fails at close
   range and against tight hooks. The library includes it as an
   advanced-only drill with explicit limitations (`shoulder-roll-intro`).

6. **Roadwork volume.** The Boxing News endurance piece argues excessive
   long slow distance work can reduce punching power and favors short
   repeat sprints and bag intervals. The conditioning drills are
   interval-dominant (`bag-sprint-intervals`, `roadwork-fartlek`); the
   one steady run uses fartlek pickups, not plain jogging.
