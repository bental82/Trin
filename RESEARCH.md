# Trintellix (Vortioxetine) Research Compendium

> Consolidated research for Prozac → Trintellix transition tracking.
> Last updated: 2026-03-15 (Day 31)

---

## Table of Contents

1. [Patient Context](#patient-context)
2. [Pharmacokinetics (PK)](#pharmacokinetics)
3. [PET Imaging Studies](#pet-imaging-studies)
4. [Pharmacodynamics (PD)](#pharmacodynamics)
5. [Cognitive Benefits](#cognitive-benefits)
6. [Glymphatic System](#glymphatic-system)
7. [Vortioxetine & Anxiety](#vortioxetine--anxiety)
8. [Sleep & REM](#sleep--rem)
9. [Nausea — Mechanism & Dose-Response](#nausea--mechanism--dose-response)
10. [Sexual Dysfunction](#sexual-dysfunction)
11. [Weight Neutrality](#weight-neutrality)
12. [Sensitivity & Side Effects at Dose Changes](#sensitivity--side-effects)
13. [CYP2D6 Drug Interactions](#cyp2d6-interactions)
14. [Bridge Strategies](#bridge-strategies)
15. [Discontinuation & Tapering](#discontinuation--tapering)
16. [Vortioxetine vs SSRIs — General Comparison](#vortioxetine-vs-ssris--general-comparison)
17. [Key Clinical References](#key-references)

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
| SERT occupancy at 5mg | ~50% | Areberg 2012 + Stenkrona 2013 PET |
| SERT occupancy at 10mg | ~65% | Stenkrona 2013 PET (steady state, raphe) |
| SERT occupancy at 10mg + CYP2D6 PM/inhibitor | ~80% | ~2x exposure ≈ 20mg normal |
| SERT occupancy at 20mg (normal) | >80% | Areberg 2012 PET |
| SERT occupancy at 60mg | ~97% | Stenkrona 2013 PET |
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

**Rank order potency:** 5-HT3 > SERT > 5-HT1B > 5-HT1A = 5-HT7 > 5-HT1D

---

## PET Imaging Studies

### Stenkrona et al. (2013) — Vortioxetine SERT Occupancy

**Citation:** Stenkrona P, Halldin C, Lundberg J. *Eur Neuropsychopharmacol* 2013;23(10):1190-1198. [PMID: 23428337](https://pubmed.ncbi.nlm.nih.gov/23428337/)

- 11 healthy subjects, [11C]MADAM PET, baseline + single dose + 9 days steady state
- Doses: 2.5mg, 10mg, 60mg
- **Apparent affinity (KD):** 16.7 nM (R = 0.95)
- **Oral dose KD:** 8.5mg (R = 0.91)
- **EC50:** 4.2–6.5 ng/mL (consistent with Areberg 2012)
- **5-HT1A:** No significant occupancy at 30mg ([11C]WAY-100635)

### Areberg et al. (2012) — Confirmatory PET

**Citation:** Areberg J et al. *Basic Clin Pharmacol Toxicol* 2012;110(4):401-404.

- [11C]DASB PET; 2.5mg, 5mg, 20mg doses
- Confirmed consistent EC50 values with Stenkrona

### Combined Dose-Occupancy Table (Steady State, Raphe Nuclei)

| Dose | SERT Occupancy | Note |
|------|---------------|------|
| 2.5mg | ~25-30% | Subtherapeutic |
| 5mg | ~50% | Minimum effective (unlike SSRIs which need ~80%) |
| 10mg | ~65% | Standard starting dose |
| 15mg | ~73% | Interpolated |
| 20mg | >80% | All targets at functionally relevant occupancy |
| 60mg | ~97% | Near saturation |

**Key difference from SSRIs:** For SSRIs, 50% SERT occupancy is reached at doses far below the lowest manufactured dose. Vortioxetine's more gradual curve means 50% occupancy occurs near an actual clinical dose (5mg), providing a wider therapeutic window. This supports the multimodal mechanism where direct 5-HT receptor modulation contributes beyond SERT blockade alone. (Lundberg et al. 2021, [PMC8960396](https://pmc.ncbi.nlm.nih.gov/articles/PMC8960396/))

### Meyer et al. (2004) — SSRI SERT Occupancy & the 80% Threshold

**Citation:** Meyer JH et al. *Am J Psychiatry* 2004;161(5):826-835. [PMID: 15121647](https://pubmed.ncbi.nlm.nih.gov/15121647/)

- 77 subjects, [11C]DASB PET, 5 SSRIs at multiple doses
- At minimum therapeutic doses: mean striatal SERT occupancy **76-85%**
- **~80% proposed as minimum threshold** for SSRI/SNRI antidepressant efficacy
- At highest clinical doses: occupancy plateaus in **mid-to-high 80s%** (the "88% ceiling")
- Hyperbolic dose-occupancy: steep at low doses, diminishing returns at high doses

### CYP2D6 and SERT Occupancy

| CYP2D6 Phenotype | Clearance (L/h) | Relative Exposure | Approx SERT at 10mg |
|---|---|---|---|
| Ultra-rapid | 52.9 | ~0.6x | ~45% |
| Normal | 34.1 | 1x | ~65% |
| Intermediate | 26.6 | ~1.3-1.5x | ~73% |
| **Poor metabolizer** | **18.1** | **~2x** | **~80%** |

**Source:** Hvenegaard et al. 2018, [PMC5973995](https://pmc.ncbi.nlm.nih.gov/articles/PMC5973995/)

**Norwegian TDM study** (Solhaug & Molden 2022, [PMID: 35703273](https://pubmed.ncbi.nlm.nih.gov/35703273/)): 640 patients — CYP2D6 PMs had 2.1x higher serum levels and **5.1x more frequent treatment switching**, suggesting clinically meaningful tolerability differences.

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

## Cognitive Benefits

Vortioxetine's unique selling point: **cognitive improvement independent of mood**, demonstrated via path analysis across three pivotal trials.

### The Three Pivotal Trials

#### 1. Katona et al. (2012) — Elderly MDD

- N=453, age 65+, 8 weeks, duloxetine 60mg as active reference
- DSST SES: **0.25** (vortioxetine) vs placebo; duloxetine failed to separate
- **83% of DSST improvement was direct** (independent of mood change)
- RAVLT: SES 0.27 acquisition, 0.24 delayed recall; 71-72% direct
- Duloxetine: only 26% direct on DSST
- [DOI: 10.1093/ijnp/pys072](https://doi.org/10.1093/ijnp/pys072)

#### 2. McIntyre et al. (2014) — FOCUS Trial

- N=602, adults 18-65, recurrent moderate-severe MDD, 8 weeks
- **First large RCT with cognition as primary endpoint**
- Arms: 10mg, 20mg, placebo (1:1:1)
- Composite z-score (DSST+RAVLT) vs placebo: **0.36** (10mg), **0.33** (20mg), both p<0.0001
- DSST: **66% direct** (10mg), **56% direct** (20mg)
- MADRS: -4.7 (10mg), -6.7 (20mg) vs placebo
- [PMC4162519](https://pmc.ncbi.nlm.nih.gov/articles/PMC4162519/)

#### 3. Mahableshwarkar et al. (2015) — CONNECT Trial

- N=~600, adults with MDD + self-reported cognitive dysfunction, 8 weeks
- Vortioxetine 10-20mg, duloxetine 60mg (reference), placebo
- DSST: vortioxetine superior to placebo (p<0.05); **duloxetine failed**
- PDQ (subjective cognition): p=0.001 vs placebo
- UPSA (functional capacity): significant improvement
- **75.7% direct** cognitive effect; duloxetine only 48.7% direct
- [Nature: npp201552](https://www.nature.com/articles/npp201552)

### Path Analysis Summary — % Direct (Mood-Independent) Cognitive Effect

| Study | Measure | Vortioxetine | Duloxetine |
|-------|---------|-------------|-----------|
| Katona 2012 | DSST | **83%** | 26% |
| Katona 2012 | RAVLT acquisition | **71%** | 65% |
| FOCUS (10mg) | DSST | **66%** | N/A |
| FOCUS (20mg) | DSST | **56%** | N/A |
| CONNECT | DSST | **75.7%** | 48.7% |

### DSST Effect Sizes Across Trials

| Dose | SES vs Placebo | Study |
|------|---------------|-------|
| 5mg | 0.25 | Katona |
| 10mg | 0.48 | FOCUS |
| 20mg | 0.36 | FOCUS |
| 10-20mg | 0.25 | CONNECT |

### Meta-Analyses

1. **McIntyre et al. (2016)** — 3-RCT pooled: after MADRS adjustment, vortioxetine DSST SES = **0.24** (p<0.0001). Duloxetine failed after adjustment. [Oxford Academic](https://academic.oup.com/ijnp/article/19/10/pyw055/2487636)
2. **Rosenblat et al. (2015)** — Network meta-analysis of 72 RCTs on DSST: vortioxetine SMD = **0.325** (p=0.009), **superior to escitalopram, nortriptyline, SSRIs, and TCAs**. [PMC5793828](https://pmc.ncbi.nlm.nih.gov/articles/PMC5793828/)
3. **Zhang et al. (2022)** — 20 studies, N=8,547: cognitive SMD = **0.34** (p=0.0003). [Frontiers](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.922648/full)
4. **Huang et al. (2022)** — 6 RCTs, N=1,782: DSST WMD for 10mg = **1.75** (p=0.03). [Oxford Academic](https://academic.oup.com/ijnp/article/25/12/969/6671569)

### Negative/Mixed Findings (For Balance)

- **CADTH Review:** 3 studies found no DSST differences vs SSRI/placebo. [NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK564565/)
- **VESPA (elderly):** SSRIs actually outperformed vortioxetine on cognitive measures
- **Mishra 2025:** Escitalopram showed slight MoCA advantage at 4 weeks (may be too short)
- Effect sizes are small-to-moderate (pooled SMD ~0.34)

### Clinical Significance

The cognitive benefit appears **unique** among current antidepressants — no other AD has consistently shown mood-independent DSST improvement via path analysis. The mechanism is attributed to 5-HT3 antagonism → GABA disinhibition → enhanced glutamate/ACh/dopamine signaling.

---

## Glymphatic System

### Guo et al. (2025) — First Direct Evidence

**Citation:** Guo Z, Tang X, Zhong S et al. *Depression and Anxiety* 2025. [PMC12413946](https://pmc.ncbi.nlm.nih.gov/articles/PMC12413946/) / [DOI: 10.1155/da/1990117](https://onlinelibrary.wiley.com/doi/10.1155/da/1990117)

- 34 unmedicated MDD patients + 41 healthy controls
- DTI + resting-state fMRI at baseline and 8 weeks
- Vortioxetine 20mg/day for 8 weeks
- **DTI-ALPS index** (diffusivity along perivascular space) used as glymphatic measure

**Key Findings:**
- At baseline: MDD patients had **significantly lower DTI-ALPS** than controls (impaired glymphatic)
- After 8 weeks: DTI-ALPS **significantly increased** (FDR-corrected p<0.05)
- Post-treatment: **No significant difference** from healthy controls — glymphatic function normalized
- Increased DTI-ALPS correlated with improved cognition and decreased DMN connectivity

**First study** to demonstrate antidepressant restoration of glymphatic function in human MDD.

### AQP4 — The Molecular Basis

Aquaporin-4 (AQP4) water channels on astrocyte endfeet drive glymphatic flow.

- **Kong et al. (2009):** AQP4 knockout mice showed **abolished** fluoxetine-induced hippocampal neurogenesis. AQP4 is **required** for fluoxetine's antidepressant action. [PMID: 18923397](https://pubmed.ncbi.nlm.nih.gov/18923397/)
- **AQP4 knockout (2019):** Exacerbated corticosterone-induced depression, loss of astrocytes, reduced GDNF. [PMC6493035](https://pmc.ncbi.nlm.nih.gov/articles/PMC6493035/)
- **Comprehensive review (2026):** AQP4 dysfunction contributes to depression via glutamate excitotoxicity, impaired monoaminergic signaling, and neuroinflammation. [DOI: 10.3390/ijms27031233](https://doi.org/10.3390/ijms27031233)

### Mechanistic Pathway (Proposed)

1. Depression → neuroinflammation + depolarized AQP4 → impaired glymphatic flow
2. Metabolic waste accumulates (amyloid-beta42, tau) → cognitive impairment
3. Vortioxetine (multimodal serotonin + 5-HT7 antagonism) → restores deep sleep + reduces neuroinflammation
4. Glymphatic function recovers → waste clearance resumes → cognitive improvement

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

### Key Studies

**Wilson et al. (2015)** — PMC4579403. Randomized, double-blind, 4-way crossover in 24 healthy men. Vortioxetine 20mg, 40mg, paroxetine 20mg, placebo (3 days each).
- Despite equivalent SERT occupancy, vortioxetine affected REM **to a lesser degree** than paroxetine
- The REM suppression–SERT occupancy relationship was **significantly different** between drugs
- [PMC4579403](https://pmc.ncbi.nlm.nih.gov/articles/PMC4579403/)

**Leiser et al. (2015)** — Companion rodent study (PMC4579402). Ondansetron (5-HT3 antagonist) reduced paroxetine's REM effects; 5-HT3 agonist increased vortioxetine's REM effects. **Confirms 5-HT3 antagonism as the protective mechanism.**

**Mlyncekova et al. (2023)** — First polysomnographic study in adolescents (N=30, ages ~15). *Clocks & Sleep*. [PMC10660849](https://pmc.ncbi.nlm.nih.gov/articles/PMC10660849/)
- **No suppression of slow-wave/deep sleep** — delta spectral power preserved across all stages
- REM: dose-dependent suppression (increased latency, decreased %)
- Vortioxetine preserves deep sleep unlike many SSRIs/SNRIs

**Liguori et al. (2019)** — Retrospective in 15 MDD+insomnia patients. [PMC6303197](https://pmc.ncbi.nlm.nih.gov/articles/PMC6303197/)
- Significant PSQI improvement (p<0.01), reduced daytime sleepiness (ESS p<0.01)
- Improved subjective sleep efficiency and continuity

### Clinical Relevance

When raising vortioxetine dose (e.g., 10→20mg), there may be a **transient acute REM disruption** again before the system re-equilibrates. This is a biphasic pattern:
1. Dose increase → acute serotonin surge → temporary REM suppression
2. Within days-weeks → 5-HT3/5-HT7 antagonism re-stabilizes sleep architecture

**Deep sleep is preserved** throughout — only REM is transiently affected.

---

## Nausea — Mechanism & Dose-Response

### The 5-HT3 Paradox

Vortioxetine has potent 5-HT3 antagonism (IC50 ~12nM) — the same mechanism as ondansetron, one of the best antiemetics. Yet nausea is its #1 side effect. Why?

**Explanation (multi-factor):**

1. **Peripheral SERT inhibition overwhelms central 5-HT3 blockade.** >90% of body serotonin is in gut enterochromaffin cells. SERT inhibition floods the GI tract with serotonin at levels that saturate the drug's 5-HT3 antagonism peripherally. Excess serotonin activates vagal 5-HT3 afferents → area postrema → emetic reflex.

2. **5-HT4 activation (unblocked).** Excess gut serotonin activates 5-HT4 receptors (which vortioxetine does NOT block), stimulating peristalsis and GI disturbance.

3. **5-HT1A agonism.** Independently contributes to nausea (buspirone also causes nausea via 5-HT1A).

4. **Multimodal serotonin amplification.** 5-HT1B/1D/7 antagonism disrupts negative feedback → serotonin release exceeds what 5-HT3 blockade can counteract.

5. **Central disinhibition.** 5-HT3 blockade in brain disinhibits further serotonin release → activates non-5-HT3 emetic pathways (D2, NK1, H1) in the CTZ.

The 5-HT3 antagonism likely **partially attenuates** nausea (rates may be lower than expected for this degree of serotonin enhancement), but cannot fully overcome the massive peripheral excess.

### Dose-Response (Pooled 11 RCTs)

| Dose | Nausea Incidence | Notes |
|------|-----------------|-------|
| Placebo | ~7-10% | Background rate |
| 5mg | ~21% | SERT + 5-HT3 primarily occupied |
| 10mg | ~26% | Standard starting dose |
| 15mg | ~32% | Additional receptor occupancy |
| 20mg | ~32% | **Plateau** — 5-HT3 saturation may buffer further increase |

### Temporal Pattern

- **Onset:** 1-2 days typically
- **Peak:** First week
- **Resolution:** Attenuates over time; ~10% residual at treatment end (10-20mg)
- **Mitigation:** Taking with food helps

### Discontinuation Due to Nausea

- Vortioxetine 5-20mg: **4.5-7.8%** withdrawal rate (vs 3.6% placebo)
- Nausea was single most common reason for stopping
- Compare: venlafaxine XR 14.2%, duloxetine 8.8%

Sources: [PMC4794082](https://pmc.ncbi.nlm.nih.gov/articles/PMC4794082/), [PMC4296590](https://pmc.ncbi.nlm.nih.gov/articles/PMC4296590/), [Stahl (Cambridge Core)](https://www.cambridge.org/core/journals/cns-spectrums/article/modes-and-nodes/18D1D144A5207FA01AF8559DEA7F9CF6)

---

## Sexual Dysfunction

### Evidence: Lower Than SSRIs

**Pooled analysis (7 RCTs, ASEX):** Treatment-emergent sexual dysfunction with vortioxetine 5-20mg was **not significantly different from placebo** (1.6-1.8% vs 1.0%). Duloxetine showed significantly higher TESD. [PMID: 26575433](https://pubmed.ncbi.nlm.nih.gov/26575433/)

### Key Head-to-Head: Jacobsen et al. (2015) — Switching Study

- N=447, adults with well-treated MDD + SSRI-induced sexual dysfunction
- Switched from citalopram/paroxetine/sertraline to vortioxetine 10-20mg or escitalopram 10-20mg
- **CSFQ-14 total score:** vortioxetine +8.8 vs escitalopram +6.6 (**p=0.013**)
- Significant improvement across all 3 phases: desire, arousal, orgasm
- Statistical significance from week 4; clinically meaningful from week 2
- Antidepressant efficacy maintained
- [PMID: 26331383](https://pubmed.ncbi.nlm.nih.gov/26331383/)

### Healthy Volunteer Study (vs Paroxetine)

- Vortioxetine 10mg: significantly less sexual dysfunction than paroxetine 20mg
- 20mg trend similar but didn't reach significance (compliance issues)

### Dose Dependency

- **5-10mg:** Placebo-level sexual side effects
- **15-20mg:** Increased but still lower than escitalopram across all phases

### Context

SSRI-induced sexual dysfunction affects >60% of sexually active patients and >80% of healthy volunteers. >35% cite it as reason for treatment discontinuation.

---

## Weight Neutrality

### Short-Term (6-8 weeks, 11 RCTs Pooled)

- Vortioxetine 5-20mg: mean weight change **-0.1 to +0.1 kg** (comparable to placebo +0.1 kg)
- **No dose-dependent effect**
- Clinically significant gain (≥7%): 0-1.2% (vs 0.6% placebo)

### Long-Term (up to 52 weeks, 5 Open-Label Extensions)

- Average weight gain: **0.7-0.8 kg** (~1-2 lbs) over up to 52 weeks
- 11-13% experienced ≥7% weight increase

### Metabolic Profile

- No effect on clinical laboratory parameters, body weight, heart rate, or blood pressure vs placebo
- Classified alongside bupropion, fluoxetine, vilazodone as **weight-neutral**
- Highest risk: mirtazapine, paroxetine, TCAs

Sources: [PMC4794082](https://pmc.ncbi.nlm.nih.gov/articles/PMC4794082/), [PMC10901552](https://pmc.ncbi.nlm.nih.gov/articles/PMC10901552/)

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

### PET Imaging / PK

1. **Stenkrona et al. 2013** — PET [11C]MADAM: vortioxetine SERT dose-response. [PMID: 23428337](https://pubmed.ncbi.nlm.nih.gov/23428337/)
2. **Areberg et al. 2012** — PET [11C]DASB: confirmatory SERT occupancy data
3. **Meyer et al. 2004** — PET: 5 SSRIs, 80% threshold, 88% ceiling. [PMID: 15121647](https://pubmed.ncbi.nlm.nih.gov/15121647/)
4. **Lundberg et al. 2021** — Systematic PET review. [PMC8960396](https://pmc.ncbi.nlm.nih.gov/articles/PMC8960396/)
5. **Chen et al. 2013** (PMC3775155) — Bupropion CYP2D6 inhibition
6. **Hvenegaard et al. 2018** — Vortioxetine clinical pharmacokinetics. [PMC5973995](https://pmc.ncbi.nlm.nih.gov/articles/PMC5973995/)
7. **Solhaug & Molden 2022** — CYP2D6 TDM study, n=640. [PMID: 35703273](https://pubmed.ncbi.nlm.nih.gov/35703273/)

### Cognition

8. **Katona et al. 2012** — Elderly MDD, DSST 83% direct. [DOI: 10.1093/ijnp/pys072](https://doi.org/10.1093/ijnp/pys072)
9. **McIntyre et al. 2014 (FOCUS)** — Primary cognitive endpoint, N=602. [PMC4162519](https://pmc.ncbi.nlm.nih.gov/articles/PMC4162519/)
10. **Mahableshwarkar et al. 2015 (CONNECT)** — Cognitive dysfunction in MDD. [Nature: npp201552](https://www.nature.com/articles/npp201552)
11. **McIntyre et al. 2016** — 3-RCT meta-analysis, DSST SES=0.24 after MADRS adjustment. [Oxford](https://academic.oup.com/ijnp/article/19/10/pyw055/2487636)
12. **Rosenblat et al. 2015** — Network meta-analysis 72 RCTs, superior to SSRIs on DSST. [PMC5793828](https://pmc.ncbi.nlm.nih.gov/articles/PMC5793828/)
13. **Zhang et al. 2022** — Meta-analysis N=8547, cognitive SMD=0.34. [Frontiers](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.922648/full)

### Glymphatic / Sleep

14. **Guo et al. 2025** — First glymphatic restoration in MDD. [PMC12413946](https://pmc.ncbi.nlm.nih.gov/articles/PMC12413946/)
15. **Kong et al. 2009** — AQP4 required for fluoxetine action. [PMID: 18923397](https://pubmed.ncbi.nlm.nih.gov/18923397/)
16. **Wilson et al. 2015** — Polysomnography, REM preservation. [PMC4579403](https://pmc.ncbi.nlm.nih.gov/articles/PMC4579403/)
17. **Leiser et al. 2015** — 5-HT3 mechanism for REM protection (rodent). [PMC4579402](https://pmc.ncbi.nlm.nih.gov/articles/PMC4579402/)
18. **Mlyncekova et al. 2023** — Adolescent PSG, deep sleep preserved. [PMC10660849](https://pmc.ncbi.nlm.nih.gov/articles/PMC10660849/)
19. **Liguori et al. 2019** — Subjective sleep improvement. [PMC6303197](https://pmc.ncbi.nlm.nih.gov/articles/PMC6303197/)

### Clinical Efficacy / Dose

20. **Thase 2023** — Pooled: 20mg optimal, onset 4 weeks earlier
21. **Baldwin 2016** — 20mg: 51.4% vs 46.0% response vs 10mg
22. **RECONNECT** — MDD+GAD, 20mg. [SAGE](https://journals.sagepub.com/doi/10.1177/02698811221090627)
23. **TRUE 2024** — MDD+GAD clinical practice. [Springer](https://link.springer.com/article/10.1186/s12991-024-00526-w)
24. **VESPA 2025** — Vortioxetine vs SSRIs, elderly

### Side Effects / Tolerability

25. **Pooled safety analysis** — 11 RCTs, nausea/weight/discontinuation. [PMC4794082](https://pmc.ncbi.nlm.nih.gov/articles/PMC4794082/)
26. **Jacobsen et al. 2015** — Sexual dysfunction switching study. [PMID: 26331383](https://pubmed.ncbi.nlm.nih.gov/26331383/)
27. **TESD pooled analysis** — Sexual dysfunction vs placebo. [PMID: 26575433](https://pubmed.ncbi.nlm.nih.gov/26575433/)
28. **Stahl** — Modes and nodes: mechanism of action. [Cambridge Core](https://www.cambridge.org/core/journals/cns-spectrums/article/modes-and-nodes/18D1D144A5207FA01AF8559DEA7F9CF6)

### Anxiety / GAD

29. **Bidzan 2012** — Positive GAD RCT
30. **Mahableshwarkar 2014** — Negative GAD RCT
31. **Qin et al. 2019** — Meta-analysis: not superior to placebo for GAD
32. **Network meta-analysis (2020)** — GAD first-line drugs. [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0022395619307927)

### Discontinuation

33. **Fluoxetine discontinuation review** — [PMC5449237](https://pmc.ncbi.nlm.nih.gov/articles/PMC5449237/)
34. **Fluoxetine substitution for tapering** — [PMC12212968](https://pmc.ncbi.nlm.nih.gov/articles/PMC12212968/)

### OCD (Emerging)

35. **Multicenter retrospective 2025** — SSRI-resistant OCD, 39.1% response at ≥20mg

---

## Notes for Future Sessions

- This file should be updated as new research questions arise
- The pkEngine.jsx contains the computational model implementing much of this research
- The scripts/ directory contains comparative analysis tools
- All PK constants are PET-calibrated where possible
- PD carryover values are estimates based on mechanistic reasoning, not direct clinical data
- **PET SERT correction:** The app's pkEngine uses EC50=45 for vortioxetine SERT (Hill n=2), which at 10mg steady-state gives ~50% occupancy. The actual PET data shows ~65% at 10mg. The model's lower value may reflect the specific calibration approach used (combined occupancy with fluoxetine via Bliss independence) rather than standalone vortioxetine occupancy
