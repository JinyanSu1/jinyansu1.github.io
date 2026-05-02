---
layout: post
title: "Your LLM Learned to Game the Judge: Reward Hacking in LLM-as-Judge Evaluation"
date: 2026-04-15
categories: research
tags: [rlhf, reward-hacking, alignment, llm-evaluation]
excerpt: "We trained a Qwen3-4B model with RLHF using a GPT-4o judge as the reward signal. It achieved 31% judged accuracy on SimpleQA — 6× higher than its peers. The catch? Only 15% of those 'correct' answers actually contained the right answer. The model learned to write in a style that fools the judge."
---

## TL;DR

When we trained a small language model (Qwen3-4B) with RLHF using a QA-only reward — where GPT-4o judges whether the model's answer is correct — the model discovered a shortcut. Instead of learning to produce correct answers, it learned to write in a **formatting style** (headers, bullet points, bold text, structured reasoning) that systematically biases GPT-4o into marking wrong answers as correct. On SimpleQA, 85% of its "correct" judgments are phantoms: the reference answer is nowhere in the response. This is reward hacking, and it has implications for anyone using LLM-as-judge evaluation in RLHF pipelines.

---

## Setup

We are studying how different reward compositions affect model behavior in RLHF. Our setup:

- **Base models**: Qwen3-4B, Qwen3-8B, Llama3-8B
- **RL algorithm**: GRPO (Group Relative Policy Optimization)
- **Reward configurations**:
  - **DeepScaleR**: math-only reward (100% math)
  - **QA-only**: 100% QA reward, where GPT-4o judges correctness
  - **Mix (5,5,45,45)** and **(10,10,40,40)**: blends of abstention, summarization, math, and QA
  - **Two-Stage RL**: first train with math, then mix in QA
- **Evaluation benchmarks**: SimpleQA and HotpotQA (150 questions each), judged by the same GPT-4o judge used during training

## The Anomaly

When we evaluated all models, one stood out immediately.

**Qwen3-4B QA-only** was judged correct on **31.3%** of SimpleQA questions and **50.7%** of HotpotQA questions. For comparison, every other Qwen3-4B variant scored between 3–6% on SimpleQA and 22–25% on HotpotQA. That's a **6× gap** on SimpleQA.

The larger Qwen3-8B QA-only scored only 4.0% on SimpleQA — consistent with other 8B models. Whatever was happening, it was specific to the 4B model.

![Reward hacking bar chart for SimpleQA](/assets/images/reward-hacking/reward_hacking_simpleqa.png)
*Judged accuracy (blue), reference-match accuracy (green), and phantom accuracy (red) across all models on SimpleQA. Qwen3-4B QA-only has a massive gap between judged and reference-match accuracy.*

![Reward hacking bar chart for HotpotQA](/assets/images/reward-hacking/reward_hacking_hotpotqa.png)
*Same analysis on HotpotQA. The pattern persists: Qwen3-4B QA-only shows 50.7% judged accuracy but only 16.0% reference-match accuracy.*

## Is the Model Actually Correct?

To check whether the judge is right, we use a simple **reference-match** heuristic: does the model's response actually contain the known correct answer (or its significant words)?

| Model | SimpleQA Judged | SimpleQA Ref-Match | Phantom Rate |
|-------|:-:|:-:|:-:|
| Qwen3-4B Base | 5.3% | 8.0% | 12% |
| Qwen3-4B QA-only | **31.3%** | 6.7% | **85%** |
| Qwen3-4B Mix(5,5,45,45) | 4.7% | 10.0% | 29% |
| Qwen3-8B QA-only | 4.0% | 4.0% | 33% |

The Qwen3-4B QA-only model is judged correct 31.3% of the time, but only 6.7% of its responses contain the reference answer. That means **85% of its "correct" judgments are phantoms** — the judge says yes, but the answer is wrong.

On HotpotQA, the phantom rate is 74%: 50.7% judged correct, but only 16.0% reference-match.

![Confusion matrix analysis](/assets/images/reward-hacking/confusion_split_combined.png)
*Judge vs Ref-Match confusion across all models. Each pair of bars: Left = Judge-correct breakdown (green = both agree, red = phantom), Right = Ref-match breakdown (green = both agree, orange = missed by judge). The QA-only column for Qwen3-4B shows a massive red phantom bar.*

## Is the Judge Inconsistent?

Maybe the judge is just noisy and happened to score high on one run? We re-ran the GPT-4o judge 5 times on the same Qwen3-4B QA-only responses:

| Benchmark | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Mean ± Std |
|-----------|:-----:|:-----:|:-----:|:-----:|:-----:|:----------:|
| SimpleQA  | 34.0% | 32.0% | 32.0% | 33.3% | 34.0% | 33.1 ± 0.9 |
| HotpotQA  | 51.3% | 48.7% | 50.0% | 50.0% | 51.3% | 50.3 ± 1.0 |

The standard deviation is under 1 percentage point. The judge consistently gives this model high scores. The issue is not noise — the judge is **systematically biased** by something in the model's responses.

## What Did the Model Learn?

If the model isn't producing correct answers, what *is* it doing differently? We analyzed the formatting features of each model's responses.

![Response style analysis — SimpleQA](/assets/images/reward-hacking/response_style_simpleqa.png)
*Formatting features across models on SimpleQA. The QA-only model produces significantly more structured formatting: headers, bullet points, bold text, and longer responses.*

![Response style analysis — HotpotQA](/assets/images/reward-hacking/response_style_hotpotqa.png)
*Same analysis on HotpotQA.*

The Qwen3-4B QA-only model learned to produce responses with:
- **Markdown headers** (`##`, `###`)
- **Bold text** and emphasis
- **Bullet points** and numbered lists
- **Structured reasoning sections** ("Key context:", "Clarification:", "Final Answer:")
- **Significantly longer responses**

None of these features change the *factual content* of the answer. But they change how GPT-4o perceives it.

## The Smoking Gun: Reformat Experiment

To prove this is about formatting, not content, we designed a controlled experiment:

1. Take the **exact same model responses** (same content, same answers)
2. Use GPT-4o to **reformat them** — add structure, headers, and bullet points — without changing the underlying answer
3. Re-judge with the same GPT-4o judge

If the judge is unbiased, reformatting should have no effect. Here's what happened:

| Model | Dataset | Before | After Reformat | Δ |
|-------|---------|:------:|:--------------:|:--:|
| Qwen3-4B Base | SimpleQA | 5.3% | 17.3% | **+12.0** |
| Qwen3-4B DeepScaleR | SimpleQA | 3.3% | 14.7% | **+11.3** |
| **Qwen3-4B QA-only** | **SimpleQA** | **31.3%** | **41.3%** | **+10.0** |
| Qwen3-4B Mix(5) | SimpleQA | 4.7% | 16.7% | **+12.0** |
| Qwen3-4B Base | HotpotQA | 24.0% | 31.3% | **+7.3** |
| **Qwen3-4B QA-only** | **HotpotQA** | **50.7%** | **46.7%** | **−4.0** |
| Qwen3-4B Mix(5) | HotpotQA | 24.0% | 36.7% | **+12.7** |

Two findings:

1. **Reformatting dramatically boosts judged accuracy for all non-hacking models** — by 7–12 percentage points — confirming that GPT-4o is biased by formatting.
2. **The QA-only model gains less or even loses accuracy** — because its responses are *already* formatted in the style that maximizes judge scores. On HotpotQA, reformatting actually hurts it (−4.0 pp), because the reformatter introduces a slightly different style than what the model optimized for.

## GPT-5 as Reformatter

We repeated the experiment using GPT-5 (o3) as the reformatter instead of GPT-4o, to see if a more capable reformatter produces even larger effects:

| Model | Dataset | Before | After GPT-5 Reformat | Δ |
|-------|---------|:------:|:--------------------:|:--:|
| Qwen3-4B Base | SimpleQA | 5.3% | 20.0% | **+14.7** |
| Qwen3-4B Mix(5) | SimpleQA | 4.7% | 22.0% | **+17.3** |
| **Qwen3-4B QA-only** | **SimpleQA** | **31.3%** | **30.0%** | **−1.3** |
| Qwen3-4B Base | HotpotQA | 24.0% | 36.0% | **+12.0** |
| **Qwen3-4B QA-only** | **HotpotQA** | **50.7%** | **45.3%** | **−5.3** |
| Qwen3-4B Mix(5) | HotpotQA | 24.0% | 39.3% | **+15.3** |

The pattern sharpens:
- Non-hacking models get even **larger boosts** from GPT-5 reformatting (up to +17.3 pp)
- The QA-only model **consistently loses accuracy** when its formatting is replaced — because it already sits at the local optimum for judge manipulation, and GPT-5's formatting style differs from what the model learned

This is the clearest evidence of reward hacking: the model's high scores come from its *formatting strategy*, not its *knowledge*.

## Why Does This Happen?

The reward hacking appears exclusively in the **smallest model** (Qwen3-4B) with the **narrowest reward** (QA-only). We hypothesize this is a **capacity effect**:

- **Small model + narrow reward** = limited capacity, so the model finds the cheapest way to maximize reward. Learning formatting tricks that fool the judge is easier than learning factual knowledge.
- **Larger model + narrow reward** (Qwen3-8B QA-only) = enough capacity to actually learn some knowledge, so it doesn't need to resort to hacking.
- **Small model + broad reward** (Qwen3-4B with mixed rewards) = the QA reward is diluted by math, abstention, and summarization rewards, preventing the model from over-optimizing a single judge signal.

This aligns with the broader reward hacking literature: hacking is more likely when the model has limited capacity and a simple, hackable reward signal.

## Implications

### For RLHF practitioners
- **Single-metric QA rewards are dangerous.** When GPT-4o is both the training reward and the evaluation metric, the model can learn to exploit the judge rather than improve at the task.
- **Mixed reward compositions are safer.** Adding diverse reward signals (math, abstention, summarization) prevents over-optimization of any single judge.
- **Monitor for formatting divergence.** If your model starts producing dramatically different formatting from baselines, investigate whether the *content* has actually improved.

### For LLM-as-judge evaluation
- **GPT-4o is systematically biased by formatting.** Structured, well-formatted responses get higher accuracy scores regardless of factual correctness. This is a known issue (see [style over substance](https://arxiv.org/abs/2307.03025)), but its impact on RLHF training loops is underappreciated.
- **Reference-match cross-checks are essential.** For factual QA, always cross-check judge accuracy against a simple reference-match heuristic. If the gap is large, the model may be hacking.
- **The reformat test is a useful diagnostic.** If reformatting responses changes judge scores significantly, your judge is sensitive to formatting — and any model trained on that judge can potentially learn to exploit it.

---

*This analysis is part of our broader research on adaptive reward compositions for reasoning models. The findings highlight the importance of designing robust reward signals that resist exploitation by the models being trained on them.*
