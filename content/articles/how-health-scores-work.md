---
title: "How Health Scores Actually Work"
excerpt: "A transparent look at the algorithm behind our health grades - no black boxes, just science."
category: "Health Science"
emoji: "🔬"
gradient: "from-emerald-100 to-teal-50"
readTime: "6 min read"
date: "2026-04-08"
author: "Kinome"
---

Every recipe on Kinome gets a health score - a number from 0 to 100 with a letter grade attached. We wanted to explain exactly how that score is calculated. Not in vague terms, not with marketing language. Here's the actual system.

## The Basic Idea

The health index (we call it `hidx` internally) is a 0–100 composite score made up of 9 sub-components, each weighted differently. It's calculated per 2000 kcal of a recipe, so portion size doesn't inflate or deflate the result - a tiny drizzle of olive oil doesn't make pasta "unhealthy," and eating a huge bowl of lentils doesn't make them score higher.

The weights reflect how much each factor contributes to the final number:

| Component | Weight |
|---|---|
| Processing level | 17% |
| Fiber | 15% |
| Sugar | 12% |
| Fat profile | 12% |
| Micronutrient index | 11% |
| Salt | 11% |
| Satiety | 11% |
| Protein | 7% |
| Protective compounds | 5% |

## The Components, One by One

### Processing Level (17%)

This is the biggest single factor - and that's intentional. How processed a food is matters enormously for long-term health, and it's something most scoring systems underweight or ignore entirely.

We use the NOVA classification system, which assigns every ingredient a category from 1 (unprocessed or minimally processed) to 4 (ultra-processed). NOVA 1 scores 100. NOVA 4 scores 15. The score for a recipe is calculated as a weighted average across all ingredients - 50% weighted by their mass, 50% weighted by their caloric contribution.

A chicken breast (NOVA 1) behaves very differently from a processed chicken nugget (NOVA 4), even if the protein content looks similar on paper. This component ensures that difference shows up in the score.

### Fiber (15%)

Simple rule: more fiber is always better. The score is `2 × fiber_per_2000kcal`, unbounded up to 200. There's no ceiling - we don't cap fiber because the evidence doesn't give us a reason to.

A recipe with 25g of fiber per 2000 kcal scores 50 here. One with 50g scores 100. One with 60g would score 120 for this component (though the final `hidx` is always clamped to 0–100).

### Sugar (12%, inverted)

The formula is `100 - (10/9) × sugar_per_2000kcal`. At 0g of sugar, you score 100. At 90g, you score 0. Above 90g, it goes negative - which pulls the final score down significantly.

This is about added and intrinsic sugars combined. A recipe built around fruit will still be penalized here - we don't distinguish sugar sources in this component - but it'll recover points through micronutrients, fiber, and protective compounds.

### Fat Profile (12%)

This is not "low fat = good." That model was discredited decades ago, but it still haunts nutrition scores.

Instead, we evaluate the fatty acid composition of the fats in a recipe:
- **Saturated fat percentage** (35% of this component's weight)
- **Omega-3 percentage** (35%)
- **MUFA (monounsaturated) percentage** (20%)
- **Omega-6 percentage** (10%)

There's also a relevance weighting: if a recipe is very low in fat overall, the fat profile component drifts toward a neutral score of 50 rather than artificially penalizing it. A salad dressed with lemon rather than olive oil shouldn't lose points for having an "unbalanced" fat profile when fat is barely present.

### Micronutrient Index (11%)

We track 13 micronutrients and compare them to RDA values per 2000 kcal. Each nutrient has a multiplier reflecting how commonly deficient it is and how important it is for general health:

- **Vitamin D** - 1.5x (widespread deficiency, hard to get from food)
- **Iron** - 1.5x
- **Potassium** - 1.3x
- **Vitamin E** - 1.3x
- **Calcium** - 1.2x
- **Magnesium** - 1.2x
- **Zinc** - 1.0x
- **Iodine** - 1.0x
- **Selenium** - 0.5x
- **Copper** - 0.3x
- **Manganese** - 0.2x
- **Vitamin A** - 1.0x
- **Vitamin C** - 1.0x

A recipe hitting 100% RDA for all 13 scores perfectly on this component. Most recipes don't, but a diverse, whole-food recipe will naturally accumulate a strong micronutrient score.

### Salt (11%, inverted)

We don't score sodium in isolation. We score the **sodium-to-potassium ratio**.

This avoids what we call the "mineral paradox": a food like canned tomatoes might get flagged as high-sodium, while simultaneously being an excellent source of potassium - which actively counteracts sodium's cardiovascular effects. Penalizing it purely on sodium content produces a misleading result.

The scoring: a Na/K ratio of 0.5 scores 100. A ratio of 2.0 scores 50. A ratio of 3.5 or above scores 0. Foods that are high in sodium but also rich in potassium (like many vegetables) are treated fairly.

### Satiety (11%)

This one is a machine learning model, not a formula.

Satiety - how full a food makes you feel - is predicted from a combination of protein content, fat content, dietary fiber, water content, and a glycemic index proxy. We trained the model on meal satisfaction data because the relationship between macros and fullness is nonlinear and doesn't reduce cleanly to "more protein = more filling."

A high-water, high-fiber vegetable soup can be more satiating per calorie than a protein shake. The model captures that.

### Protein (7%)

Two things matter here: quantity and quality. The quantity is protein per 2000 kcal. The quality is determined by the amino acid profile - specifically, how complete the protein is relative to DIAAS (Digestible Indispensable Amino Acid Score) criteria.

A recipe with 50g of protein from a mix of rice and beans will score lower than one with 50g from chicken or eggs, because the amino acid profile is less complete. This isn't a judgment on plant-based diets - it's an incentive to combine protein sources intelligently.

### Protective Compounds (5%)

Polyphenols, carotenoids, and glucosinolates. We track them. They get rewarded. But they carry the lowest weight (5%) because the evidence for specific dose-response relationships is still developing, and we don't want to over-reward recipes that score well on antioxidants while being mediocre everywhere else.

The breakdown: polyphenols are 50% of this component, carotenoids 30%, glucosinolates 20%.

## The Grade Scale

Once the weighted `hidx` is calculated, it maps to a letter grade:

| Score | Grade |
|---|---|
| ≥ 96 | S+ |
| ≥ 92 | S |
| ≥ 88 | S- |
| ≥ 83 | A+ |
| ≥ 73 | A |
| ≥ 68 | A- |
| ≥ 64 | B+ |
| ≥ 60 | B |
| ≥ 56 | B- |
| ≥ 50 | C+ |
| ≥ 44 | C |
| ≥ 38 | C- |
| ≥ 30 | D+ |
| ≥ 20 | D |
| ≥ 15 | D- |
| ≥ 12 | E+ |
| ≥ 9 | E |
| ≥ 4 | E- |
| < 4 | F |

An S+ is genuinely rare. A B is a solid, nutritious recipe. A C means the recipe has real trade-offs worth knowing about.

## What This System Doesn't Do

It doesn't tell you what to eat. A D-grade recipe eaten once a week in a diet full of whole foods is fine. An A-grade recipe eaten exclusively would still be a limited diet. The score is information, not prescription.

It also doesn't account for individual health conditions, intolerances, or goals. Someone managing blood pressure needs to look at the Na/K ratio component specifically. Someone building muscle should weight the protein component more heavily. The overall score is a general-population heuristic.

## Why Transparency Matters

Black-box nutrition scores are common. They let companies optimize for marketing. By publishing exactly how we weight and calculate each component - including the formulas - we make it possible for you to disagree with our choices, understand why a recipe scored the way it did, and use the information intelligently.

If you think fiber should matter more than processing level, you can hold that view and filter recipes accordingly. The score is a starting point, not the final word.
