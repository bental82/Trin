# Trintellix (Vortioxetine) Research Compendium

> Consolidated research for Prozac → Trintellix transition tracking.
> Last updated: 2026-03-15 (Day 31)

---

## Table of Contents

1. [Patient Context](#patient-context)
2. [Pharmacokinetics (PK)](#pharmacokinetics)
3. [Pharmacodynamics (PD)](#pharmacodynamics)
4. [Vortioxetine & Anxiety](#vortioxetine--anxiety)
5. [Sleep & REM](#sleep--rem)
6. [Sensitivity & Side Effects at Dose Changes](#sensitivity--side-effects)
7. [CYP2D6 Drug Interactions](#cyp2d6-interactions)
8. [Bridge Strategies](#bridge-strategies)
9. [Discontinuation & Tapering](#discontinuation--tapering)
10. [Key Clinical References](#key-references)

---

## Patient Context

- **Switch date:** 2026-02-12 (Day 0)
- **Prior regimen:** Fluoxetine (Prozac) 40mg/day (years), Bupropion (Wellbutrin)
- **Current regimen (Day 31):** Vortioxetine 20mg/day + Bupropion (continuous)
- **Prozac taper:** Started alt-day dosing around Day 22 (bridge phase)
- **CYP2D6 status:** Strong inhibition from Wellbutrin (~2.2x); additional inhibition from residual fluoxetine/norfluoxetine

---

## Pharmacokinetics

### Vortioxetine

| Parameter | Value | Source |
|-----------|-------|--------|
| Half-life (normal) | 66 hours | FDA label |
| Half-life (CYP2D6 PM / strong inhibitor) | ~145 hours | Chen 2013, PMC3775155 |
| SERT EC50 (Hill) | 45 (PET-calibrated) | Stenkrona 2015 |
| Hill coefficient (SERT) | 2.0 | Fitted to PET dose-response |
| SERT occupancy at 10mg | ~50% | PET data |
| SERT occupancy at 10mg + CYP2D6 inhibitor | ~80% | PET data |
| SERT occupancy at 20mg (normal) | ~80% | PET data |
| Steady state | ~14 days (normal), longer with CYP2D6 inhibition | |

### Fluoxetine (Prozac)

| Parameter | Value | Source |
|-----------|-------|--------|
| Half-life (fluoxetine) | 48 hours (1-3 days after single dose; 4-6 days at steady state) | FDA label |
| Half-life (norfluoxetine) | 223 hours (~9.3 days; range 4-16 days) | FDA label |
| Norfluoxetine conversion ratio | 0.8 | Literature |
| SERT EC50 (Hill) | 6 ng/mL (PET-calibrated) | Meyer 2004 |
| SERT Emax | 88% | Meyer 2004 PET ceiling |
| CYP2D6 inhibition | Potent (both fluoxetine and norfluoxetine) | |

### Receptor Pharmacology (Vortioxetine)

| Receptor | Ki (nM) | Action | Efficacy (%) | Emax (%) |
|----------|---------|--------|-------------|----------|
| 5-HT3 | 3.7 | Antagonist | 2.3 | 95 |
| 5-HT1A | 15 | Agonist | 9.4 | 85 |
| 5-HT7 | 19 | Antagonist | 11.9 | 90 |
| 5-HT1B | 33 | Partial Agonist | 20.6 | 80 |
| 5-HT1D | 54 | Antagonist | 33.7 | 75 |
| SERT | 1.6 | Inhibitor | — | 100 |

**Key insight:** Vortioxetine's multimodal profile means it modulates serotonin transmission through 6 distinct mechanisms simultaneously, unlike SSRIs (SERT-only).

---

## Pharmacodynamics

### PD Maturation Timeline (from Day 0 of vortioxetine)

| Mechanism | t50 (days) | Onset lag | Carryover from Prozac | Current % (D31) | Notes |
|-----------|-----------|-----------|----------------------|-----------------|-------|
| **GABA Disinhibition** | 12 | 1d | 0% (Trintellix-unique) | ~80% | Via 5-HT3 antagonism. Explains early cognitive clarity |
| **Autoreceptor Desensitization** | 18 | 2d | 55% | ~60% | Main reason ADs take weeks to work. 5-HT1A in raphe nuclei |
| **Circadian Remodeling** | 16 | 3d | 30% | ~55% | Via 5-HT7 antagonism. Sleep architecture restructuring |
| **BDNF / Neuroplasticity** | 32 | 7d | 65% | ~20% new growth | Hippocampal volume recovery. The deep change |
| **DMN Normalization** | 35 | 10d | 25% | ~15% | Reduces rumination. Builds on BDNF |
| **Glymphatic Restoration** | 45 | 14d | 10% | ~8% | Brain waste clearance. 2025 research: measurable at 8 weeks |

### Carryover Concept

Prozac already matured several shared downstream mechanisms over years of use. Each mechanism retains a "floor" level that doesn't restart from zero when switching to Trintellix. Only Trintellix-specific mechanisms (5-HT3-mediated GABA disinhibition) start fresh.

### PD Dose-Sensitivity

Higher SERT occupancy drives faster downstream maturation. At current combined occupancy (~75-80%), PD acceleration factor is ~1.0-1.15x. Reference: 10mg steady-state SERT ~82%.

---

## Vortioxetine & Anxiety

### Primary GAD (Anxiety Without Depression) — Weak Evidence

- **Multiple RCTs failed** to separate vortioxetine from placebo for GAD at 2.5-10mg
- **Meta-analysis** (Qin 2019): vortioxetine **not superior to placebo** in reducing HAM-A scores in primary GAD
- **Network meta-analysis** (ScienceDirect 2020): All first-line GAD drugs were more effective than placebo **except** vortioxetine and fluoxetine
- Duloxetine & escitalopram showed best efficacy for GAD; vortioxetine showed better acceptability/tolerability

### MDD with Comorbid Anxiety — Stronger Evidence (at 20mg)

- **RECONNECT study:** Vortioxetine 20mg significantly reduced both depression and anxiety in severe MDD + severe GAD. Forced up-titration to 20mg after week 1
- **TRUE study (2024, UAE):** 118 patients with MDD + comorbid GAD. Significant HAM-A reduction over 8 weeks; most moved from moderate/severe to mild anxiety
- **Pooled analysis (2023):** Greatest therapeutic benefits at 20mg/day, including in patients with inadequate prior response

### Dosing Insight

The doses tested in GAD-specific trials (2.5-10mg) were likely **subtherapeutic**. Newer studies consistently show 20mg is needed for robust anxiolytic effects. This aligns with the clinical recommendation to uptitrate.

### Clinical Implication

If anxiety is **part of depression** → 20mg vortioxetine can help. If anxiety is **independent/primary GAD** → evidence does not support vortioxetine as first-line.

### Sources

- [Vortioxetine GAD meta-analysis (NDT)](https://www.tandfonline.com/doi/full/10.2147/NDT.S104050)
- [Network meta-analysis GAD first-line drugs](https://www.sciencedirect.com/science/article/abs/pii/S0022395619307927)
- [RECONNECT study (MDD+GAD, 20mg)](https://journals.sagepub.com/doi/10.1177/02698811221090627)
- [TRUE study 2024 (MDD+GAD)](https://link.springer.com/article/10.1186/s12991-024-00526-w)
- [Vortioxetine in MDD + high anxiety (pooled, 2023)](https://www.sciencedirect.com/science/article/pii/S0165032723000927)

---

## Sleep & REM

### Acute Phase (First Days/Weeks)

- Both vortioxetine and SSRIs **suppress REM** acutely
- Increased REM latency, reduced REM % — common to all serotonergic antidepressants
- May contribute to initial sleep disruption when changing doses

### Chronic Phase (After Weeks)

- **Vortioxetine:** Returns to **normal sleep architecture** including REM. This is unique among antidepressants
- **SSRIs (e.g., paroxetine):** Continue to suppress REM chronically
- **Mechanism:** 5-HT3 antagonism and 5-HT7 antagonism protect REM architecture long-term

### Key Study

Wilson et al. (2015, PMC4579403): Compared vortioxetine vs paroxetine on polysomnography.
- Paroxetine: sustained REM suppression
- Vortioxetine: initial REM changes, then normalization

### Clinical Relevance

When raising vortioxetine dose (e.g., 10→20mg), there may be a **transient acute REM disruption** again before the system re-equilibrates. This is a biphasic pattern:
1. Dose increase → acute serotonin surge → temporary REM suppression
2. Within days-weeks → 5-HT3/5-HT7 antagonism re-stabilizes sleep architecture

### Source

- [Wilson et al. 2015 — Vortioxetine sleep architecture (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4579403/)

---

## Sensitivity & Side Effects at Dose Changes

### Dose Increase (10→20mg) — Expected Effects

When increasing vortioxetine dose, especially with CYP2D6 inhibition:

1. **Nausea** — Most common. 5-HT3 receptor activation in the gut (paradoxically, despite central 5-HT3 antagonism). Usually transient (days). Can mitigate with food
2. **Heightened sensitivity/emotional reactivity** — Serotonin surge before autoreceptor adaptation catches up
3. **Sleep disruption** — Transient REM suppression (see above)
4. **Anxiety increase** — Acute serotonergic activation can temporarily worsen anxiety before PD maturation kicks in
5. **Head pressure/headache** — Common, usually resolves in days

### With CYP2D6 Inhibition (Wellbutrin + Residual Prozac)

- Effective dose is **higher** than nominal: 10mg acts like ~15-20mg
- When moving to 20mg nominal, effective exposure may be 30-40mg equivalent
- Monitor for dose-dependent side effects
- As Prozac/norfluoxetine clears (weeks 4-6), CYP inhibition drops slightly → effective dose drops → may need dose reassessment

### Can Prozac Reduction Cause Sensitivity?

- **After just 1-2 days of alt-day dosing: Very unlikely**
- Norfluoxetine t½ ≈ 9-14 days means significant levels persist for weeks
- Classical discontinuation symptoms from fluoxetine typically appear **4-6 weeks** after stopping (much later than other SSRIs)
- Any sensitivity at the start of alt-days is almost certainly from the **vortioxetine dose increase**, not Prozac withdrawal
- However, subtle SERT occupancy fluctuations on "skip" days are theoretically possible

---

## CYP2D6 Interactions

### Current State

| Inhibitor | Contribution | Duration |
|-----------|-------------|----------|
| Bupropion (Wellbutrin) | ~2.2x (strong, constant) | Permanent (continuous use) |
| Fluoxetine (residual) | ~0.2-0.4x additional | Fading over weeks 3-6 |
| Norfluoxetine (residual) | Maintains CYP inhibition after fluoxetine clears | Fading over weeks 4-8 |

### Impact on Vortioxetine

- CYP2D6 inhibition extends vortioxetine half-life proportionally (~66h → ~145h at 2.2x)
- Increases AUC by the same factor
- **FDA recommendation:** Reduce vortioxetine dose by half in CYP2D6 poor metabolizers (equivalent to strong inhibitor)
- In practice: 10mg + Wellbutrin ≈ 20mg without inhibitor (for SERT occupancy)

### Transition Period (Weeks 3-8)

As Prozac and norfluoxetine clear:
- Total CYP inhibition drops from ~2.6x → ~2.2x (Wellbutrin alone)
- Vortioxetine effective levels drop modestly
- This may create a subtle "second dip" in the model around weeks 4-5

### Source

- Chen et al. 2013 (PMC3775155): Bupropion CYP2D6 inhibition — AUC +128%, Cmax +114%

---

## Bridge Strategies

### Strategies Modeled in the App

| Strategy | Description | Post-Bridge Dip |
|----------|-------------|----------------|
| **Alt 8d** | 7d daily P20 + 8d every-other-day | Steeper dip |
| **Alt 14d** | 7d daily P20 + 14d every-other-day | Gentler dip |
| **Step-down** | 7d daily → 8d alt-day → 6d every-3rd-day | Gradual |
| **T20 fast** | Rapid vortioxetine uptitration: T10→T15→T20 | Preferred (current default) |
| **T15 wk** | Extended T15 week before T20 | Slower transition |

### Key Findings from Analysis Scripts

1. **altDaysSweep.mjs:** Tests durations from 6d to 20d. Longer alt-day periods reduce the post-bridge discontinuation dip but delay the transition
2. **stepdownCompare.mjs:** Step-down strategies provide smoother transitions but are more complex to implement
3. **T20 fast** was selected as default — prioritizes reaching therapeutic vortioxetine dose quickly, which compensates for Prozac withdrawal through higher SERT occupancy

---

## Discontinuation & Tapering

### Fluoxetine Discontinuation Characteristics

- **Lowest discontinuation syndrome risk** among all SSRIs (due to norfluoxetine's ultra-long t½)
- ~50% of people stopping fluoxetine experience some withdrawal symptoms
- Symptoms typically **delayed 4-6 weeks** (vs. days for paroxetine, venlafaxine)
- Natural "self-taper" built in via norfluoxetine decay

### Fluoxetine as Bridge Drug

- Commonly used to bridge other SSRI discontinuations (e.g., paroxetine → fluoxetine → stop)
- Long t½ provides gradual SERT occupancy reduction
- In this case, used as a bridge during vortioxetine uptitration

### Sources

- [Fluoxetine discontinuation overview (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5449237/)
- [Fluoxetine substitution for tapering (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12212968/)

---

## Vortioxetine vs SSRIs — General Comparison

| Dimension | Vortioxetine | SSRIs |
|-----------|-------------|-------|
| SERT binding | Yes | Yes |
| Multimodal receptors | 5 additional targets | No (SERT only) |
| Cognitive benefit | Demonstrated in DSST, TMT-B, RAVLT | Minimal/inconsistent |
| Sexual side effects | Lower incidence | Common |
| Nausea | More common (dose-dependent) | Less common |
| Sleep/REM | Preserves long-term | Chronically suppresses |
| Weight | Neutral | Variable (some cause gain) |
| GAD efficacy | Weak (standalone) | Proven (escitalopram, duloxetine) |
| MDD efficacy | Comparable to SSRIs | Well-established |
| MDD+anxiety (20mg) | Effective | Effective |

### VESPA Study (2025, post-hoc, elderly)

In older adults: no significant difference in response (44.1% vs 53.0%) or remission (25.7% vs 34.7%) between vortioxetine and SSRIs.

### OCD (Emerging, 2025)

In SSRI-resistant OCD (n=64, ≥20mg, 8 weeks): 39.1% response rate. Mean Y-BOCS decreased from 27.1 to 20.7. Significant HAM-D and HAM-A reductions.

---

## Key References

### PK/Receptor Binding

1. **Stenkrona 2015** — PET study: vortioxetine SERT occupancy dose-response curve
2. **Meyer 2004** — PET: fluoxetine SERT occupancy ceiling (88%)
3. **Chen et al. 2013** (PMC3775155) — Bupropion CYP2D6 inhibition quantification

### Clinical Efficacy

4. **Thase 2023** — Pooled analysis: 20mg optimal dose, onset 4 weeks earlier than 10mg
5. **Baldwin 2016** — 20mg: 51.4% vs 46.0% response vs 10mg
6. **RECONNECT study** — MDD + GAD, vortioxetine 20mg efficacy
7. **TRUE study 2024** — MDD + comorbid GAD in clinical practice
8. **VESPA 2025** — Vortioxetine vs SSRIs in elderly MDD

### Sleep

9. **Wilson et al. 2015** (PMC4579403) — Polysomnography: vortioxetine preserves REM long-term

### Anxiety / GAD

10. **Bidzan 2012** — Positive GAD RCT (HAM-A -14.30 vs -10.49 placebo)
11. **Mahableshwarkar 2014** — Negative GAD RCT (2.5 & 10mg failed)
12. **Qin et al. 2019** — Meta-analysis: not superior to placebo for GAD
13. **Network meta-analysis (2020)** — Vortioxetine & fluoxetine only drugs that failed to separate from placebo in GAD

### Discontinuation

14. **Fluoxetine discontinuation review** (PMC5449237)
15. **Fluoxetine substitution for tapering** (PMC12212968)

### OCD (Emerging)

16. **Multicenter retrospective 2025** — Vortioxetine in SSRI-resistant OCD, 39.1% response at ≥20mg

---

## Notes for Future Sessions

- This file should be updated as new research questions arise
- The pkEngine.jsx contains the computational model implementing much of this research
- The scripts/ directory contains comparative analysis tools
- All PK constants are PET-calibrated where possible
- PD carryover values are estimates based on mechanistic reasoning, not direct clinical data
