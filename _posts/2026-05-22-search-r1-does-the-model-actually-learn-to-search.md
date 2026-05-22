---
layout: post
title: "Search-R1, Re-examined: Does the Model Actually Learn to Search and Reason?"
date: 2026-05-22
categories: research
tags: [rl, tool-use, agents, search, reasoning, reward-hacking]
excerpt: "We retrained Search-R1 across model sizes, RL algorithms, training distributions, search budgets, and broken-retriever settings — and ablated the <think> scaffolding. The model's QA score barely moves when the think protocol is removed; it collapses when the retriever returns nothing; and the number of searches the model issues has almost nothing to do with the question. RL teaches the model to play the search-tool protocol, not to reason about retrieval."
---

## TL;DR

Across ~60 Search-R1 runs (model size × base/instruct × PPO/GRPO × NQ/HotpotQA × turn budgets × broken-retriever settings × no-think ablation), four findings recur:

1. **The number of searches the model issues is a learned reflex, not a query-conditioned policy.** A model fires almost the same number of searches on MuSiQue (4-hop) as on PopQA (1-hop).
2. **Breaking the retriever exposes the protocol.** When the retriever returns *empty* documents, HotpotQA-trained models stop searching but NQ-trained models keep searching for nothing. When the retriever returns *random* documents, even NQ-trained models eventually stop — random docs hurt the reward, empty docs only cost a search.
3. **Removing the `<think>` scaffolding (prompt instruction, format reward, cross-turn persistence) does not hurt — it usually helps.** Across 16 matched pairs, no-think wins 12, ties 1, loses 3. Mean Δ = **+1.1 pp** in favor of no-think. The model can still emit free-form prose before each `<search>`, so this is not "removing reasoning" in a strong sense; it's removing the structured think protocol that the agentic-RL story credits as the source of reasoning.
4. **Telling the model its budget mostly normalizes behavior, it doesn't make it adaptive.** BT1 pulls PPO down from ~4 searches to ~2 and pulls GRPO up from ~1.1 to ~1.6. Net effect on score is small (±2 pp).

The clean version: scoring well on Search-R1 does **not** imply the model learned to search and reason. It learned to emit the right number of `<search>` tags and pass the retrieved spans into `<answer>`.

---

## Setup

The sweep covers:

- **Base models**: Qwen2.5-{3B, 7B} × {Base, Instruct}
- **RL algorithm**: PPO and GRPO
- **Training data**: NQ (single-hop) and HotpotQA (multi-hop)
- **Max turns**: 1 and 4
- **Budget transparency**: BT0 (budget hidden) and BT1 (budget told to model)
- **Chain-of-thought**: with `<think>` and without (`no_think_rl=true`)
- **Adversarial retriever**: normal, **empty content** (returns no documents), **random content** (returns random unrelated documents)
- **6 eval benchmarks** held constant: NQ, TriviaQA, PopQA (single-hop) and HotpotQA, 2WikiMultiHopQA, MuSiQue (multi-hop)

For each run I take the best validation step by mean test score across the 6 evals. Raw numbers: `search_plot/all_variants_best.json`.

---

## Headline axes (size, base/instruct, algorithm)

Before getting to the more interesting ablations, the standard axes look like this:

![PPO vs GRPO, Base vs Instruct, 3B vs 7B](/assets/images/search-r1/axis_comparisons.png)
*Averages over training set / eval datasets for each cell. Larger models help. PPO and GRPO are within a few percentage points of each other. Instruct usually edges out Base, but the gap is small once both have been RL-finetuned.*

These differences are real but unremarkable — they're what you'd expect from any RL-finetuned QA stack. The interesting findings live in the next four sections.

---

## Finding 1: The model has a search *rate*, not a search *policy*

If RL had taught the model to "decide whether to retrieve based on the question," the per-query search count should vary with how hard the question is. It doesn't:

![Search count per (model × eval dataset)](/assets/images/search-r1/search_count_heatmap.png)
*Rows = trained models, columns = eval datasets, ordered single-hop → multi-hop. Cell = average # searches per query at the best validation step. The rows are nearly constant: each model has a per-model search rate, and the question barely shifts it.*

Concretely:

- **3B-Base-GRPO** converges to almost exactly 1.0 search on every dataset, including MuSiQue (where the gold answer requires 4 hops).
- **HotpotQA-3B-Ins-PPO** fires 2.5 searches on NQ (overkill — one well-formed query suffices) and 3.5 on MuSiQue (underkill).
- The "decide when to retrieve" gradient that would justify the agentic framing is largely absent.

The number of searches is a property of the *model and training setup*, not a function of the *query*.

## Finding 2: Breaking the retriever shows what the model actually learned

The cleanest experiment in the whole sweep is the adversarial-retriever setup. We retrained Search-R1 with either:

- **Empty retriever** — every search returns no documents.
- **Random retriever** — every search returns three random unrelated documents.

Both leave the model's underlying reasoning ability intact; what changes is whether the search action provides useful signal.

![Adversarial retriever: score and search behavior](/assets/images/search-r1/adversarial_retriever.png)
*Left: average test score under each retriever. Right: average # search actions issued under each retriever. Eight 3B models, grouped by training set and algorithm.*

Three things jump out:

**(a) Score collapses across the board.** Every model loses 15–25 percentage points of avg test score under either broken retriever. The trained model is *entirely* dependent on the retriever's output, even on questions it could plausibly answer from its own pretraining knowledge.

**(b) HotpotQA-trained models learn to stop searching; NQ-trained models do not.** From the right panel:

| Model | Normal #srch | Empty #srch | Random #srch |
|-------|:---:|:---:|:---:|
| HotpotQA-3B-Base-GRPO | 1.00 | **0.00** | **0.00** |
| HotpotQA-3B-Base-PPO  | 1.00 | **0.13** | **0.01** |
| HotpotQA-3B-Ins-GRPO  | 1.67 | 0.67 | — |
| HotpotQA-3B-Ins-PPO   | 2.51 | **0.06** | — |
| NQ-3B-Base-GRPO       | 0.99 | **0.99** | — |
| NQ-3B-Base-PPO        | 1.01 | **1.25** | **0.01** |
| NQ-3B-Ins-GRPO        | 1.00 | **0.98** | — |
| NQ-3B-Ins-PPO         | 1.75 | **0.92** | — |

HotpotQA-trained models converge to "stop searching" under either broken retriever. NQ-trained models keep searching for nothing — except under the *random* retriever (NQ-3B-Base-PPO drops to 0.01 searches), where the explicit hurt signal finally breaks the habit.

**(c) The asymmetry tells us *why*.** Empty documents are *neutral* — they cost a search call but don't push the model toward a wrong answer. Random documents are *adversarial* — they actively push the answer in the wrong direction. The model learns to skip searches only when searching actively *hurts* the reward, not when searching is merely useless.

A model that had learned to *reason* about retrieval would treat empty and random the same — both are "I have no useful evidence." The model treats them very differently, because the *reward* treats them very differently. The behavior is reward-shaped, not understanding-shaped.

## Finding 3: Removing the `<think>` scaffolding helps more often than it hurts

Search-R1's default prompt asks the model to put reasoning between `<think>` tags before each `<search>` and before the final `<answer>`. We retrained every setup with `no_think_rl=true` and the `nothink` prompt template, which together:

1. **Remove the "you must reason inside `<think>`" instruction from the prompt** (`preprocess_search_dataset.py`: `nothink` template).
2. **Strip any `<think>...</think>` block from the rollout before it is appended to the rolling state** (`generation.py`), so thoughts produced at turn `t` are not visible at turn `t+1`.
3. **Drop the `<think>` requirement from the format reward** (`qa_em_format.py`).

This is *not* the same as preventing the model from generating any reasoning tokens — the model can still emit free-form prose before each `<search>`. What it removes is the explicit, persistent, reward-incentivized reasoning *protocol* that the agentic-RL story credits as the locus of "learning to reason." If that protocol is doing real work — decomposing the question, planning the next query, integrating evidence across turns — removing it should hurt. It doesn't.

![No-think ablation across 16 matched pairs](/assets/images/search-r1/nothink_ablation.png)
*Blue: default Search-R1 with the `<think>` protocol. Yellow: same training run with the `<think>` scaffolding removed (no prompt instruction, no format reward, no cross-turn think persistence). Numbers above bars are the no-think minus with-think delta on the avg-of-6-evals score.*

Across 16 matched (train set, size, base/ins, algorithm) pairs:

- No-think **wins** in 12 runs.
- No-think **ties** in 1 run.
- No-think **loses** in 3 runs (all by ≤ 1.4 pp).
- Largest single gain: HotpotQA-7B-Base-PPO **+7.0 pp** (0.377 → 0.447).
- Mean delta: **+1.1 pp** in favor of no-think.

The explicit `<think>` channel isn't load-bearing. Removing the scaffolding doesn't break decision-making about when to search or what to query — whatever residual reasoning the model does (in free-form prose before `<search>`, or implicitly in the search query itself) is enough. The structured, persistent, reward-shaped think loop that the Search-R1 paper draws as the model's "reasoning trajectory" is, on these benchmarks, optional.

The companion qualitative observation: by mid-training, the `<think>` block in `hotpotqa_3b_ins_BT0_grpo_turn4` is full of degenerate content. Three representative samples pulled from the live training log:

**(a) The assistant emits rows of exclamation marks instead of a thought:**

```
Question: The Remington Model 31 competed with the Winchester model
          that was popularly known as what?

A: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
   ... (continues for the full response budget) ...

(environment) My previous action is invalid. If I want to search, I should
put the query between <search> and </search>. ...

Golden answers: ['Perfect Repeater']
Extracted answer: and
```

**(b) Short-circuit answer with no reasoning, no search:**

```
Question: what is bermuda competing in the winter olympics?
Golden answers: ['Cross-country skiing']
Extracted answer: and
```

**(c) Hallucinated "reasoning" that the retriever then bails out:**

```
Question: which mode is used for short wave broadcast service?

<think>
Shortwave broadcasts use the Longwave to Shortwave (LW-SW) radio
frequency range, typically between 200 kHz and 2.7 MHz. ...
</think>
<search> how is short wave broadcasting implemented... </search>
<information> ... </information>
<answer> AM </answer>
```

The `<think>` paragraph is factually wrong (shortwave is *not* 200 kHz–2.7 MHz; that's medium-wave / longwave), the search is generic, the final answer is correct only because the retrieved documents happened to contain it — and the reward signal cannot distinguish this from a model that genuinely reasoned its way to `AM`.

Combine the qualitative collapse with the quantitative no-think result and the conclusion is clean: the `<think>` channel is decorative. Its content varies between "templated boilerplate," "hallucinated facts," and "literal noise," and its presence or absence makes no consistent difference to the final QA score.

## Finding 4: Telling the model its budget normalizes search behavior — but not score

The BT0 / BT1 axis (whether to write the budget into the prompt) is the one place the sweep directly probes whether the model can *use* an explicit search-budget signal:

| Model | BT0 #srch | BT1 #srch | BT0 score | BT1 score |
|-------|:---:|:---:|:---:|:---:|
| HotpotQA-3B-Ins-GRPO (+format) | 1.40 | **1.55** | 0.342 | **0.354** |
| HotpotQA-3B-Ins-PPO  (+format) | **3.98** | 2.80 | **0.403** | 0.329 |
| NQ-3B-Ins-GRPO       (+format) | 1.14 | **1.58** | 0.334 | **0.350** |
| NQ-3B-Ins-PPO        (+format) | **3.67** | 2.24 | 0.356 | **0.359** |

BT1 pulls *PPO* down (from ~4 searches to ~2) and pulls *GRPO* up (from ~1.1 to ~1.6) — converging both algorithms toward the middle. Score effects are mixed: the GRPO runs gain a little, the PPO-HotpotQA run loses a lot.

The right read: telling the model about the budget changes its *average* search count, but it doesn't make the search count more *query-conditioned*. Combined with Finding 1, this is consistent with a model that has a single "how often do I search" knob and adjusts the knob based on the prompt, not based on the query.

In a deployed setting where the retriever costs real money per call, this is not the calibrated behavior you want.

---

## Cross-cutting axes

A few standard comparisons for completeness, all using only the *normal* turn-4 runs:

### Turn 1 vs Turn 4

![Turn-1 vs Turn-4 (single-hop and multi-hop)](/assets/images/search-r1/turn1_vs_turn4_bar.png)
*Single-hop evals (left): turn-1 and turn-4 are essentially tied — the extra budget is unused. Multi-hop evals (right): turn-4 helps consistently, but only by a modest margin and only where the model can actually be coaxed into using the extra turns.*

### Training set generalization

![NQ-trained vs HotpotQA-trained on each eval split](/assets/images/search-r1/trainset_generalization.png)
*Left: evaluate on single-hop benchmarks. NQ-trained models win narrowly. Right: evaluate on multi-hop benchmarks. HotpotQA-trained models win clearly. Training on harder data transfers downward; training on easier data does not transfer upward — which is what you'd want, but it also implies that the training distribution is a much bigger lever than algorithm or size.*

---

## What I would change about the experimental design

Three things, in roughly increasing order of how much they re-frame the field's takeaways:

**(1) Score the chain of thought, not just the answer.** A simple per-step heuristic — does the `<think>` content contain any of the entities in the search query? does it contain any of the entities in the retrieved documents? — would catch the collapse cases above. A judge-based reasoning score is more expensive but would correlate much better with what we actually want.

**(2) Make the search budget part of the reward.** Right now the model is rewarded only for correctness, with no penalty for issuing useless searches. A small per-search cost (or a small bonus for *not* searching when the model would have answered correctly anyway) turns "issue a search reflexively" from optimal into suboptimal. The BT0 / BT1 axis here is a starting point, but a *priced* budget would be a stronger signal.

**(3) Make broken-retriever evaluation standard.** The adversarial-retriever runs above are the most diagnostic single experiment in the whole sweep, and they took a tiny fraction of the compute the headline runs required. Any paper claiming that an RL recipe teaches "reasoning about when to retrieve" should be required to show how the model behaves when the retriever is broken — empty *and* random.

---

## Closing

The Search-R1 result — "RL teaches an LLM to interleave reasoning with retrieval" — is a clean narrative, and the recipe does produce models that score better on QA benchmarks than their SFT counterparts. But the same training runs, opened up, show: search behavior that barely depends on the question, reasoning chains that can be deleted without consequence, full score collapse when the retriever is broken, and asymmetric responses to empty vs random documents that betray a reward-shaped policy rather than a reasoning-shaped one.

This is the same shape of problem as the [LLM-as-judge reward hacking]({{ "/blog/2026/04/reward-hacking-llm-judge/" | relative_url }}) post — a narrow, hackable reward, applied to a model with just enough capacity to game it, with an evaluation that lives inside the same loop. Fixing it requires pushing on all three: broader reward (price the searches, score the reasoning), broader evaluation (broken retrievers, no-think ablations, reasoning probes), and broader training distributions (harder hops, mixed eval-time tasks) so the model has incentive to actually learn the skill instead of the shortcut.

---

*The full sweep, training scripts, and per-run best-step data are in the `search-r1` repo. The aggregation and plotting scripts (`fetch_all_variants.py`, `make_blog_plots.py`) live under `search_plot/` and read directly from the W&B project.*
