export const CONCEPTS = {
  sert: {
    name: "SERT Occupancy", short: "The Parking Spot", emoji: "🅿️", color: "#f0abfc",
    simple: "Your serotonin transporter (SERT) is like a vacuum that sucks serotonin back up before it can work. The drug parks on the vacuum, blocking it. More parking = more serotonin stays active between neurons.",
    analogy: "Serotonin is water flowing between two gardens. SERT is a drain that sucks it back. Trintellix plugs drains. At 80% occupancy, 80% of drains are plugged — water stays for the flowers.",
    status: "~75% combined (Trintellix + residual Prozac). Well above 50% minimum effective for vortioxetine.",
    time: "Days — near-max within 2 weeks", feeds: ["autorecept", "gaba", "circadian"], cat: "pk",
  },
  receptors: {
    name: "Multimodal Receptors", short: "The Extra Keys", emoji: "🔑", color: "#06b6d4",
    simple: "Unlike Prozac (SERT only), Trintellix hits 5 additional serotonin receptors. Each unlocks a different downstream effect — cognition, sleep, motivation, emotional flexibility.",
    analogy: "Prozac is a single key for one door. Trintellix is a keychain with 6 keys. The SERT key is the main entrance, but the others open side doors to cognition, sleep, and motivation.",
    status: "5-HT3 ~93%, 5-HT1A ~78%, 5-HT7 ~74%. This is why cognitive improvement appeared before mood fully shifted.",
    time: "Days — binding is fast, downstream effects take weeks", feeds: ["autorecept", "gaba", "circadian", "bdnf"], cat: "pk",
  },
  cyp2d6: {
    name: "CYP2D6 Inhibition", short: "The Slow Drain", emoji: "🚰", color: "#a78bfa",
    simple: "CYP2D6 is a liver enzyme that breaks down Trintellix. Both Wellbutrin and Prozac block this enzyme, so the body clears Trintellix slower — each 10mg pill acts like ~15-20mg.",
    analogy: "Trintellix is water filling a bathtub, CYP2D6 is the drain. Wellbutrin partially blocks the drain (always). Prozac was also blocking it. As Prozac clears, the drain opens a bit more.",
    status: "Currently ~2.3× (Wellbutrin + residual Prozac). Will settle to ~2.1× (Wellbutrin only) by mid-March.",
    time: "Weeks 3-6 — transitional as Prozac metabolites clear", feeds: ["sert", "receptors"], cat: "pk",
  },
  autorecept: {
    name: "Autoreceptor Desensitization", short: "The Brake Wearing Off", emoji: "🛑", color: "#22d3ee",
    simple: "When serotonin first floods the system, autoreceptors in the raphe nuclei sense 'too much' and slam the brakes on further release. Over 2-4 weeks, these sensors adapt and stop braking. THIS is the main reason antidepressants take weeks to work.",
    analogy: "You turn heating up. The thermostat detects 'too hot' and blasts AC. After 2-3 weeks, it recalibrates to the new temperature. Only then does the room stay warm.",
    status: "~60% complete. The brake is loosening but not fully off. This is the single most important PD process for mood improvement.",
    time: "2-4 weeks (currently in the middle)", feeds: ["bdnf", "dmn"], cat: "pd",
  },
  gaba: {
    name: "GABAergic Disinhibition", short: "Unmuting the Orchestra", emoji: "🔊", color: "#f97316",
    simple: "GABA is the brain's 'quiet down' chemical. 5-HT3 receptors normally tell GABA neurons to fire, silencing nearby circuits. Trintellix blocks 5-HT3 → GABA stays quiet → glutamate, acetylcholine, and dopamine fire freely.",
    analogy: "An orchestra where GABA is a strict conductor constantly shushing sections. 5-HT3 blockade fires the strict conductor. Glutamate, acetylcholine, dopamine all play freely.",
    status: "~80% mature. Kicked in relatively fast — likely why clear-headedness appeared early.",
    time: "1-3 weeks (mostly there)", feeds: ["bdnf", "dmn"], cat: "pd",
  },
  circadian: {
    name: "Circadian Remodeling", short: "Resetting the Clock", emoji: "🕐", color: "#818cf8",
    simple: "5-HT7 receptors control sleep-wake rhythm and REM architecture. Trintellix's 5-HT7 antagonism gradually restructures sleep stages — deeper slow-wave sleep, normalized REM.",
    analogy: "Depression scrambles the internal clock — like jet lag that never ends. 5-HT7 blockade slowly resets the clockwork itself.",
    status: "~55% complete. Sleep quality should keep improving over 2-3 weeks.",
    time: "2-4 weeks", feeds: ["bdnf", "glymphatic"], cat: "pd",
  },
  bdnf: {
    name: "BDNF / Neuroplasticity", short: "Growing New Wiring", emoji: "🌱", color: "#22c55e",
    simple: "BDNF is fertilizer for neurons. Depression shrinks the hippocampus and weakens connections. Trintellix triggers gene expression that produces BDNF, literally growing new synaptic connections.",
    analogy: "Depression is a drought shrinking the neural garden. SERT blockade + receptor activity are rain returning. BDNF is new roots, shoots, and leaves actually growing.",
    status: "~20% — barely started. This slow, powerful process brings the deepest change.",
    time: "4-8 weeks (the long game)", feeds: ["dmn", "glymphatic"], cat: "pd",
  },
  dmn: {
    name: "DMN Normalization", short: "Quieting the Inner Critic", emoji: "🧠", color: "#fbbf24",
    simple: "The Default Mode Network is the brain circuit active during rumination. In depression it's hyperconnected. Trintellix gradually reduces this, making rumination less sticky.",
    analogy: "The DMN is a group chat that won't stop pinging with negative thoughts. As BDNF and serotonin normalize, someone slowly turns notification volume down.",
    status: "~15% — very early. Builds on BDNF and autoreceptor changes. Real shifts weeks 5-8.",
    time: "5-8 weeks", feeds: ["glymphatic"], cat: "pd",
  },
  glymphatic: {
    name: "Glymphatic Restoration", short: "Taking Out the Trash", emoji: "🚿", color: "#fb7185",
    simple: "The glymphatic system is the brain's waste-disposal — flushing metabolic debris during deep sleep. Depression impairs it. 2025 research showed Trintellix measurably restores it at 8 weeks.",
    analogy: "The brain produces metabolic trash all day. The glymphatic system is a nightly cleaning crew. Depression fired half the crew. Trintellix slowly rehires them.",
    status: "~8% — slowest process. The 8-week+ frontier for the most subtle but profound cognitive improvement.",
    time: "8+ weeks", feeds: [], cat: "pd",
  },
  stress: {
    name: "Transition Stress", short: "The Speed Bump", emoji: "⚡", color: "#ef4444",
    simple: "Not a brain system — temporary destabilization from the Prozac→Trintellix switch. Norfluoxetine (Prozac's long metabolite, t½≈9 days) is still clearing.",
    analogy: "Jumping from one moving train (Prozac) to another (Trintellix). Brief moment between trains. PD maturation is the Trintellix train accelerating to match speed.",
    status: "Currently moderate. Expected peak ~D21-28 (mid-March), then fades.",
    time: "Peaks weeks 3-4, resolves weeks 5-6", feeds: [], cat: "transition",
    subconcepts: ["norfluox", "recbalance", "gabalag", "circDisrupt", "psychAdj"],
  },
  norfluox: {
    name: "Norfluoxetine Withdrawal", short: "The Long Goodbye", emoji: "💊", color: "#f87171",
    simple: "Fluoxetine's long-acting metabolite norfluoxetine (t½ ~14 days) is still clearing from your system. As it leaves, SERT occupancy temporarily drops before Trintellix fully compensates — creating a brief serotonergic dip.",
    analogy: "Your old security guard (Prozac) left, but his assistant (norfluoxetine) stayed on for two extra weeks. As the assistant finally leaves, there's a gap before the new guard (Trintellix) has full coverage.",
    status: "Norfluoxetine is actively clearing. By ~D28-35, levels will be negligible.",
    time: "Resolves weeks 4-5 (t½ ~14 days)", feeds: [], cat: "transition",
  },
  recbalance: {
    name: "Receptor Rebalancing", short: "Changing the Locks", emoji: "🔄", color: "#fb923c",
    simple: "Prozac and Trintellix have very different receptor profiles. Prozac is SERT-only; Trintellix hits 5-HT1A, 5-HT1B, 5-HT3, 5-HT7, and more. During the overlap/gap, the serotonin system is in flux as receptors adjust to new occupancy patterns.",
    analogy: "You're changing all the locks in a building while people are still working inside. Some doors work with old keys, some with new. Brief confusion until all locks are swapped.",
    status: "In progress. Receptor profiles are shifting as Prozac clears and Trintellix occupancy stabilizes.",
    time: "Weeks 2-5", feeds: [], cat: "transition",
  },
  gabalag: {
    name: "GABA Disinhibition Lag", short: "Orchestra Warming Up", emoji: "🎵", color: "#f59e0b",
    simple: "Trintellix's unique ability to block 5-HT3 receptors releases GABA's grip on glutamate, acetylcholine, and dopamine — but this disinhibition takes time to fully ramp up. During the lag, cognitive benefits are building but not yet complete.",
    analogy: "The strict conductor (GABA) has been fired, but the orchestra members haven't realized yet. They're still playing quietly. Over days, they start to play freely.",
    status: "GABA disinhibition is ramping — early cognitive clarity appearing but not yet stable.",
    time: "Weeks 1-3", feeds: ["gaba"], cat: "transition",
  },
  circDisrupt: {
    name: "Circadian Disruption", short: "Jet Lag Phase", emoji: "🌙", color: "#c084fc",
    simple: "Switching SSRIs disrupts sleep architecture. Prozac and Trintellix affect 5-HT receptors differently — particularly 5-HT7, which controls circadian rhythm. During the transition, sleep stages are reshuffling.",
    analogy: "You've been sleeping in one time zone (Prozac-sleep) and suddenly moved to another (Trintellix-sleep). Your body clock needs a few weeks to adjust — expect some turbulence in sleep quality.",
    status: "Sleep may be inconsistent. Deep sleep architecture is gradually restructuring via 5-HT7 antagonism.",
    time: "Weeks 2-4", feeds: ["circadian"], cat: "transition",
  },
  psychAdj: {
    name: "Psychological Adjustment", short: "The Mental Switch", emoji: "🧩", color: "#e879f9",
    simple: "Beyond neurochemistry, switching medications triggers anxiety about the change itself — hypervigilance to every sensation, worry about whether the new drug will work, and nocebo effects where expectations of side effects create perceived symptoms.",
    analogy: "Moving to a new apartment. Even if it's nicer, the first weeks feel unsettled. Every creak sounds alarming. You miss the familiar. This fades as the new place becomes home.",
    status: "Normal and expected. Awareness of this effect itself reduces its power.",
    time: "Weeks 1-4 (fades with evidence of benefit)", feeds: [], cat: "transition",
  },
};

export const CATS = {
  pk:         { l: "PHARMACOKINETICS", s: "Drug in body → occupying targets",          c: "#06b6d4" },
  pd:         { l: "PHARMACODYNAMICS", s: "Brain adapting → downstream changes",        c: "#a78bfa" },
  transition: { l: "TRANSITION",       s: "Temporary destabilization from switch",      c: "#ef4444" },
};

export const TV = {
  sert: 75, receptors: 85, cyp2d6: 78, autorecept: 60, gaba: 80,
  circadian: 55, bdnf: 20, dmn: 15, glymphatic: 8, stress: 65,
  norfluox: 55, recbalance: 45, gabalag: 70, circDisrupt: 40, psychAdj: 50,
};

export const MOODS = [
  { e: "😫", l: "Terrible", v: 1, c: "#ef4444" },
  { e: "😞", l: "Bad",      v: 2, c: "#f97316" },
  { e: "😐", l: "Meh",      v: 3, c: "#eab308" },
  { e: "🙂", l: "Okay",     v: 4, c: "#84cc16" },
  { e: "😊", l: "Good",     v: 5, c: "#22c55e" },
  { e: "🤩", l: "Great",    v: 6, c: "#06b6d4" },
];

export const TAGS = [
  "Clear-headed", "Brain fog", "Motivated", "Flat/Blunted",
  "Anxious", "Calm", "Nausea", "Good sleep", "Poor sleep",
  "Emotional", "Energetic", "Fatigued",
];