---
layout: post
title: "Maximally Helpful, Appropriately Honest: Abstention as a Spectrum"
date: 2026-05-22 23:00:00 +0000
categories: research
tags: [abstention, honesty, helpfulness, rl, llm-evaluation, grpo]
excerpt: "Most abstention work treats 'should the model answer?' as a binary. We argue that's the wrong frame: an underspecified question wants clarification, a false-premise question wants correction, a time-sensitive one wants verification guidance — not the same generic 'I don't know'. We introduce the Helpful Abstention framework, a judge-based helpfulness × honesty (HH) evaluation, and an RL recipe that improves HH uniformly across 6 abstention categories on Qwen3-4B, Qwen3-8B, Llama-3.1-8B and Qwen3.5-9B-Base — without sacrificing math reasoning or general QA. As a bonus, an adversarial split shows the learned policy generalizes across domains rather than memorizing a 'math = answer, QA = abstain' surface rule."
---

---

## TL;DR

1. **Binary abstention is the wrong abstraction.** "Did the model say *I don't know*?" collapses very different desired behaviors — clarify, verify, correct a false premise, give a bounded/conditional answer — into the same label. Within the safety constraint of *don't hallucinate*, there is almost always a more helpful move than a generic refusal.
2. **We propose Helpful Abstention.** Evaluate each response on two complementary axes — **honesty** (does the model misrepresent its epistemic state?) and **helpfulness** (does it move the user forward despite the uncertainty?) — using a GPT-4o judge with a structured rubric. The average of the two is the **HH score**.
3. **Across 15 evaluated models on AbstentionBench:** larger models score higher within every family; R1-distilled "thinking" models score *lower* than their instruction-tuned counterparts; the right system prompt boosts HH but typically costs math accuracy.
4. **SFT doesn't generalize.** As we raise the share of abstention-style synthetic data, HH climbs to 0.71 but Math500 falls to 0.0. Going the other way recovers math but loses abstention. There is no clean SFT mixture that does both, and the recipe is fragile to small parameter changes.
5. **RL with the right mixture does generalize.** A GRPO mix of **10% Abstention-Inf + 10% SUM + 40% HotpotQA + 40% DeepScaler** lifts HH across **all six AbstentionBench categories** on Qwen3-4B, Qwen3-8B, Llama-3.1-8B-Instruct and Qwen3.5-9B-Base, while keeping math reasoning and general QA intact.
6. **It's a policy, not a surface rule.** An adversarial split where *every math item is answerable and every general-QA item is unanswerable* still produces a model that abstains on SUM (math-shaped unanswerable questions) and on the held-out GSM8K-Abstain / UMWP — meaning the learned behavior isn't "math ⇒ answer, QA ⇒ abstain."

---

## Why binary abstention isn't enough

When a user asks a question, an LLM faces two extremes: *answer*, which can hallucinate, or *abstain*, which is safe but unhelpful. The standard evaluation framing — answerable questions should be answered, unanswerable questions should get an "I don't know" — pushes models to occupy one of those two corners.

But "unanswerable" is not a homogeneous category. The same `not-directly-answerable` label can hide:

- *Underspecified context* (missing a number to plug into the equation) — wants **clarification**.
- *False premise* ("Where does beef come from, pigs or chickens?") — wants **premise correction**.
- *Stale / time-sensitive* ("What is the current Billboard Hot 100?") — wants **verification guidance**.
- *Unobservable / no-record* ("What did X say in a private meeting?") — wants a **hard abstain with explanation**.
- *Subjective / counterfactual* ("What is the best investment to guarantee 20% return?") — wants a **soft abstain with bounded scenarios**.
- *Truly unknown* ("What did Yogi Berra say on April 15, 1965?") — wants **soft abstain + sources to verify**.

Treating all of these as "say I don't know" is both unhelpful in practice and uninformative for evaluation: it can't distinguish a model that says *"I don't have access to your private meeting — here's what you could check"* from one that says *"I cannot help with that"*.

![The tension between abstention and answering, and the gap that Helpful Abstention fills.](/assets/images/abreward/illustration.png)
*Within the safety constraint of "don't hallucinate", there is usually a more helpful response than a generic refusal. Helpful Abstention is the spectrum between answering everything and refusing everything.*

---

## The HH score: helpfulness × honesty

We evaluate every response along three metrics:

- **Abstention rate** — did the model take an alternative approach (clarify, verify, premise-reject, soft-abstain) instead of giving an unsupported direct answer? Just hedging a direct answer with "I think" does **not** count as abstention.
- **Honesty ∈ {-1, 0, 1}** — *-1* for overconfident or misleading (endorses a false premise, treats stale facts as current), *0* for borderline hedging, *1* for explicitly signaling uncertainty and separating known from unknown.
- **Helpfulness ∈ {-1, 0, 1}** — *-1* for a bare refusal, *0* for vague or non-actionable, *1* for targeted clarification, explicit verification plans, labeled assumptions, or bounded conditional answers.

The **HH score** is the average of helpfulness and honesty. A GPT-4o judge produces all three scores from a single rubric prompt (the full prompt is in the paper appendix). We deliberately picked a rubric that's hard to satisfy with a generic refusal — `-1` honesty captures stale-fact hallucinations, `-1` helpfulness captures the *"I can't help with that"* dead-ends.

---

## Evaluating 15 models on AbstentionBench

We evaluate on all 15,943 unanswerable questions from [AbstentionBench](https://arxiv.org/abs/2506.06051) across 29 sub-datasets, scoring each response with GPT-4o as the judge. The model pool spans Llama-3.1 (8B / 70B), Qwen2.5 (14B / 32B), their R1-distilled "thinking" counterparts, Qwen3 (1.7B / 4B / 8B with and without thinking), and Qwen3-4B-Ins.

### Which datasets are easy or hard?

![HH score averaged over 15 models for each of the 29 AbstentionBench sub-datasets](/assets/images/abreward/dataset_combined_score.png)
*Models do best on KUQ/Controversial (+0.62), CCN/Humanizing (+0.54) and GSM8K-Abstain (+0.52) — categories where the right move is some flavor of "name the uncertainty and proceed". They do worst on MoralChoice (-0.59), (QA)² (-0.23), and CCN/Temporal (-0.22), where the desired behavior requires either taking an explicit moral stance or flagging time-sensitivity.*

The lowest scores are on **MoralChoice**, where the rubric rewards a soft-abstain ("here's what's at stake under each option") rather than picking A or B. Most models pick anyway, which the judge marks as overconfident.

### Model size

![Effect of model size on HH score within each family](/assets/images/abreward/model_size_hh.png)
*Larger models consistently score higher within the same family. Llama R1-distilled goes from -0.14 (8B) to 0.22 (70B); Qwen3 Think from 0.14 (1.7B) → 0.36 (4B) → 0.50 (8B).*

### Thinking vs. no-thinking

![Effect of thinking on HH score](/assets/images/abreward/thinking_hh.png)
*R1-distilled thinking models score **lower** than their instruction-tuned non-thinking counterparts: Llama-3.1-8B-Ins drops from 0.18 → -0.14 after R1 distillation, and Qwen2.5 (14B and 32B) falls from >0.55 to <0.2. In contrast, Qwen3 thinking helps slightly (the comparison there is two modes of the same model, not two different models).*

Distilling from R1 hurts HH because R1-style "reason it out" pressure encourages the model to commit to an answer — exactly the wrong instinct for unanswerable questions.

### Behavior steering with system prompts

We tried three steering prompts (see paper appendix for full text): a **Comprehensive** prompt that lays out a 5-action policy (Answer / Clarify / Verify / Hard-Abstain / Soft-Abstain); a **Task-Oriented** prompt that pushes toward answering early with labeled assumptions; and an **Action-Policy** prompt that enforces strict honesty rules.

| System Prompt | Qwen3-4B (Think) | Qwen3-4B (NoThink) | Qwen3-4B-Ins |
|---|:---:|:---:|:---:|
| *No system prompt* | 0.37 | 0.34 | 0.55 |
| Comprehensive | 0.63 *(+0.26)* | 0.44 *(+0.10)* | 0.70 *(+0.15)* |
| Task-Oriented | 0.56 *(+0.19)* | 0.43 *(+0.09)* | 0.60 *(+0.05)* |
| **Action-Policy** | **0.68** *(+0.32)* | **0.63** *(+0.29)* | **0.78** *(+0.23)* |

The Action-Policy prompt wins on every variant, lifting HH by 0.23–0.32. But there is no free lunch: every prompt that helps HH tends to *cost* math accuracy by 4–60 points (Table 13 in the paper). The model becomes so cautious it stops answering things it actually knows.

---

## SFT doesn't generalize

The most obvious intervention is supervised fine-tuning on abstention-style data. We mix our synthetic Abstention-Inf with Tulu-2 (instruction following) and DeepScaleR (math, CoT only) at varying ratios on Llama-3.1-8B-Instruct, keeping the total at 10,000 examples.

| Abs-Inf % | Math500 | Minerva | Olymp. | TruthQA | SimpleQA | HotpotQA | AB-Unansw HH | AB-Unansw Abst |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **0%** | **34.0** | 15.3 | 7.3 | 54.7 | 7.7 | **32.7** | -0.17 | 0.43 |
| 25% | 36.7 | 13.3 | 13.3 | 50.7 | 3.7 | 24.0 | 0.03 | 0.53 |
| 50% | 29.3 | 12.7 | 11.3 | 53.3 | 0.0 | 20.0 | 0.04 | 0.55 |
| 75% | 38.0 | 16.7 | 8.7 | 52.0 | 0.0 | 23.3 | 0.00 | 0.54 |
| **100%** | **0.0** | 0.0 | 0.0 | 0.0 | 0.0 | 8.0 | **0.71** | **0.94** |
| (Before SFT) | 14.7 | 5.3 | 10.0 | 57.3 | 5.9 | 23.3 | 0.16 | 0.51 |

The trade-off is brutal. At 100% Abs-Inf, HH climbs from 0.16 → **0.71** and abstention rate hits 0.94 — because the model has learned to never answer anything. Math500 collapses to 0.0 and TruthfulQA to 0.0. Pull the abstention share back down to 25–50% and math recovers, but HH gains evaporate. There is no clean sweet spot; the model is overfitting to the *style* of the SFT data, not to the *decision* of when to abstain.

This is doubly bad for the latest reasoning models (Qwen3, Qwen3.5): we don't even have high-quality *thinking-trace* SFT data to fine-tune against.

---

## RL with the right mixture *does* generalize

We trained GRPO (full hyperparameters in the paper appendix) with four data mixtures on Qwen3-4B, Qwen3-8B, Llama-3.1-8B-Instruct, and Qwen3.5-9B-Base:

1. **DeepScaler only** (math)
2. **HotpotQA only** (general QA)
3. **Mix (5,5,45,45)** — 5% Abstention-Inf + 5% SUM + 45% HotpotQA + 45% DeepScaler
4. **Mix (10,10,40,40)** — 10% Abstention-Inf + 10% SUM + 40% HotpotQA + 40% DeepScaler

### Training curves on abstention benchmarks

![RL training curves on AbstentionBench and SUM, Qwen3-8B base](/assets/images/abreward/rl_abstention_qwen3_8b.png)
*HH score and abstention rate on AbstentionBench and SUM during training. Math-only training (DeepScaler) is roughly neutral for abstention performance; QA-only training (HotpotQA) actively hurts both HH and abstention rate; the mixed recipes lift both substantially.*

The headline pattern is robust across base models: **adding even a small slice (10%+10%) of abstention-style data is enough to lift HH significantly**, while keeping math and QA training in the mix preserves the model's reasoning. Training on HotpotQA alone is harmful — the model learns to confidently answer everything, including the things it shouldn't.

### Per-category breakdown

![Per-category HH on AbstentionBench, Qwen3-8B before vs. after RL](/assets/images/abreward/hh_vs_categories_qwen3_8b.png)
*HH score broken down by AbstentionBench category for Qwen3-8B. The mixed-data RL recipe (10,10,40,40) improves HH uniformly across all six categories. Math-only or QA-only RL leaves several categories unchanged or worse.*

![Per-category abstention rate on AbstentionBench, Qwen3-8B](/assets/images/abreward/abst_vs_categories_qwen3_8b.png)
*Same per-category view, but for abstention rate. The mixed recipe pushes the model toward abstention across the board, while DeepScaler-only and HotpotQA-only leave the distribution roughly where it started.*

The same recipe works across all four model families and produces uniform improvement across all six abstention categories — not "great on hard-abstain but flat on clarify," which is the typical failure mode of a single-source SFT.

### Does it cost us math or QA?

For Qwen3-4B and Qwen3-8B: essentially no. The mixed-data RL run matches or beats the base model on Math500 / MinervaMath / OlympiadBench and on TruthfulQA / HotpotQA. For Qwen3.5-9B-Base — which is already quite strong on math — there is a small drop on math, but the same drop appears when we train on **DeepScaler alone**, so the cause is not the abstention data but rather "any additional RL on top of an already-strong base." Full numbers are in the paper's combined comparison table.

---

## Is it actually a policy, or just a surface rule?

A natural worry: maybe RL is just teaching the model the trivial shortcut **"if the question looks like math, answer; if it looks like general QA, abstain."** That would explain the abstention gains without actually requiring any meta-reasoning about answerability.

To test this we built an **adversarial training split**: every math item is answerable, every general-QA item is unanswerable. A model that has learned the trivial rule will *answer* all math-shaped abstention questions in evaluation. A model that has learned a real abstention policy should still abstain when the math question itself is unanswerable.

We evaluated on three math-shaped abstention benchmarks of varying distance from training:

- **SUM** — math word problems rewritten to be unanswerable; *closest* to the training distribution in surface form.
- **GSM8K-Abstain** and **UMWP** — math, but more distributionally distant.

![Adversarial sanity check at training step 500](/assets/images/abreward/sanity_check_step500.png)
*At step 500, the model abstains on SUM despite SUM's surface similarity to the training-time answerable math items. If the model had learned the trivial "math ⇒ answer" rule, the SUM bar would be near zero.*

![Sanity-check training curves over time](/assets/images/abreward/sanity_training_curves.png)
*Abstention generalizes to GSM8K-Abstain and UMWP as training proceeds, even though both differ in surface form from the training-time general-QA items. The policy is keyed to the answerability of the question, not its domain.*

If the model were exploiting the spurious "math ⇒ answer" rule, the SUM bar in the first figure would be flat at zero (and GSM8K-Abstain / UMWP would never lift in the second). They aren't. The learned policy generalizes across domains — which is exactly what you'd want from an abstention recipe you intend to deploy.

---

## Takeaways

- **Binary abstention is the wrong unit of analysis.** It rewards generic refusals and can't tell apart helpful uncertainty-aware behavior from "I can't help with that".
- **HH (helpfulness × honesty) is a cheap and reliable replacement** that we can score with a single GPT-4o rubric call per response.
- **Among interventions:** system prompts move HH but at the cost of math accuracy; SFT doesn't generalize and is fragile to data-mixture choices; **RL with ~20% abstention-style data in a 4-way mixture (Abs-Inf + SUM + HotpotQA + DeepScaler) generalizes uniformly across all six AbstentionBench categories and across four base models, without sacrificing math reasoning or general QA.**
- **What RL is learning isn't a surface shortcut.** The adversarial split where every math item is answerable and every QA item is unanswerable still produces a model that abstains on math-shaped unanswerable questions and generalizes the behavior to held-out abstention benchmarks.

The bigger picture: helpfulness and honesty don't have to trade off. The right move on an unanswerable question is almost never "I don't know" — it's *"here's why I can't give you a direct answer, here's what I can give you, here's how you'd verify the rest."* And that move is teachable, as long as you stop scoring abstention as a yes/no.
