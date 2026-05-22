---
layout: post
title: "Search-R1, Re-examined: Does the Model Actually Learn to Search and Reason?"
date: 2026-05-22
categories: research
tags: [rl, tool-use, agents, search, reasoning, reward-hacking]
excerpt: "We retrained Search-R1 across model sizes, RL algorithms, training distributions, search budgets, and broken-retriever settings — and ablated the <think> scaffolding. The model's QA score barely moves when the think protocol is removed; it collapses when the retriever returns nothing; and the number of searches the model issues has almost nothing to do with the question. RL teaches the model to play the search-tool protocol, not to reason about retrieval."
---

> **Note.** The experiments here were run around August–December 2025. I didn't get time to organize them then, and by now the results are arguably "old" and may not be very useful for the community. I'm writing this up with substantial help from AI writing assistance, so the polish (and possibly some of the reasoning) is lower than I would normally want for a research post — caveat lector.

---

## TL;DR

Across ~60 Search-R1 runs (model size × base/instruct × PPO/GRPO × NQ/HotpotQA × turn budgets × broken-retriever settings × no-think ablation), four findings recur:

1. **Search adaptivity is shallow.** Training on multi-hop data raises the model's overall search count by ~0.2 *uniformly* across both single-hop and multi-hop evals — it's a global thermostat, not a per-question policy. At test time, only larger (7B) or PPO-tuned instruct models adapt to question difficulty; every 3B-base model emits the same number of searches on PopQA as on MuSiQue.
2. **The model only partially grows into its search budget.** PPO runs climb toward the budget (~3 searches) over training and sometimes saturate, but most then collapse. GRPO runs plateau well below the budget. Telling the model its budget (BT1) acts as a regularizer — pulling GRPO up and PPO down toward ~2 — but doesn't make the search count more query-conditioned, and barely changes score.
3. **Stress-testing the retriever exposes that the model optimizes reward, not API cost.** When the retriever returns *random* (actively misleading) documents, the # of searches per query goes to zero within ~150 steps — random docs hurt the answer, so the RL gradient kills the search action. When the retriever returns *empty* (useless but not harmful) documents, the trajectory is the opposite: NQ-3B-Base-PPO **grows** its search count to ~3.2, and NQ-3B-Ins-PPO peaks at **4.5** before collapsing. Empty content carries no negative signal, so PPO explores in the direction of "search more."
4. **Removing the `<think>` scaffolding (prompt instruction, format reward, cross-turn persistence) does not hurt — it usually helps.** Across 16 matched pairs, no-think wins 12, ties 1, loses 3. Mean Δ = **+1.1 pp** in favor of no-think. The model can still emit free-form prose before each `<search>`, so this is not "removing reasoning" in a strong sense; it's removing the structured think protocol that the agentic-RL story credits as the source of reasoning.

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

These differences are real but unremarkable — they're what you'd expect from any RL-finetuned QA stack. The interesting questions live in the four sections that follow.

---

## Section 1: Can the model search adaptively?

Before asking whether the chain-of-thought matters or whether broken retrievers break the protocol, the most basic question to ask of a search-using agent is: **does the model adapt how much it searches to the difficulty of the task?**

Two sub-questions:

- **Q1 (training-distribution adaptation):** Does training on multi-hop data (HotpotQA) teach the model to search more than training on single-hop data (NQ)? Does that effect persist across eval distributions?
- **Q2 (test-time adaptation):** For a *fixed* trained model, does it issue more searches on multi-hop test questions than on single-hop test questions?

### Q1: Training distribution shifts the overall search rate

![Q1: search count by eval dataset, NQ-trained vs HotpotQA-trained](/assets/images/search-r1/adapt_by_trainset.png)
*Each pair of bars: average # search actions on that eval dataset, NQ-trained models (blue) vs HotpotQA-trained models (red). Averaged across model size, base/ins, and PPO/GRPO. Error bars = std across the 8 model variants per training set.*

The answer is **yes, but as a uniform global shift, not a localized one**:

| Eval | NQ-trained #srch | HotpotQA-trained #srch | Δ |
|------|:---:|:---:|:---:|
| NQ (single-hop) | 1.29 | 1.48 | +0.19 |
| TriviaQA (single-hop) | 1.29 | 1.43 | +0.13 |
| PopQA (single-hop) | 1.34 | 1.55 | +0.21 |
| HotpotQA (multi-hop) | 1.56 | 1.79 | +0.22 |
| 2Wiki (multi-hop) | 1.88 | 2.11 | +0.22 |
| MuSiQue (multi-hop) | 1.86 | 2.15 | +0.30 |

HotpotQA-trained models search ~0.2 more times per query than NQ-trained models — **on every eval, including single-hop ones**. The training distribution doesn't teach the model "MuSiQue is harder, search more on it"; it teaches the model "in general, search a bit more." Both columns also show the same left-to-right gradient (single → multi-hop evals get more searches), so the absolute search count is roughly *additive* across training-distribution effect and test-difficulty effect.

### Q2: Test-time adaptation is real, but only for larger / instruct models

![Q2: per-model single-hop vs multi-hop search count](/assets/images/search-r1/adapt_at_test_time.png)
*One line per trained model, connecting its average # searches on single-hop evals (left point) to multi-hop evals (right point). A steeply rising line = the model adapts at test time; a flat line = the model does the same thing regardless of question type. Color = training distribution.*

Aggregated:

| Group | SH avg | MH avg | MH − SH |
|-------|:---:|:---:|:---:|
| All models | 1.40 | 1.89 | **+0.49** |
| NQ-trained | 1.31 | 1.77 | +0.46 |
| HotpotQA-trained | 1.49 | 2.02 | +0.53 |

But the average hides bimodality. Per-model deltas:

| Model | SH | MH | MH − SH |
|-------|:---:|:---:|:---:|
| nq-3B-Base-GRPO | 0.99 | 0.99 | **0.00** |
| nq-3B-Base-PPO  | 1.01 | 1.02 | **+0.01** |
| nq-3B-Ins-GRPO  | 1.00 | 1.00 | **0.00** |
| hpqa-3B-Base-GRPO | 1.00 | 1.00 | **0.00** |
| hpqa-3B-Base-PPO  | 1.00 | 1.00 | **0.00** |
| nq-3B-Ins-PPO | 1.46 | 2.04 | +0.58 |
| hpqa-3B-Ins-GRPO | 1.37 | 1.97 | +0.60 |
| hpqa-3B-Ins-PPO | 2.24 | 2.78 | +0.54 |
| nq-7B-Base-GRPO | 1.39 | 2.05 | +0.66 |
| hpqa-7B-Base-GRPO | 1.36 | 1.98 | +0.62 |
| hpqa-7B-Base-PPO | 1.41 | 2.19 | +0.78 |
| nq-7B-Ins-GRPO | 1.29 | 2.06 | +0.77 |
| nq-7B-Base-PPO | 1.79 | 2.59 | +0.79 |
| hpqa-7B-Ins-GRPO | 1.46 | 2.32 | +0.86 |
| hpqa-7B-Ins-PPO | 2.03 | 2.87 | +0.84 |
| nq-7B-Ins-PPO | 1.53 | 2.40 | +0.87 |

The pattern: **3B base models and one 3B instruct + GRPO are completely flat** (Δ ≈ 0 — no test-time adaptation). **Every 7B model, and every 3B PPO instruct model, adapts** (Δ between +0.5 and +0.9). Capacity and on-policy advantage estimation both matter.

### What this says about "adaptivity"

Pulling it together:

- **Training distribution acts like a global thermostat.** Training on harder questions raises the model's overall search count by ~0.2 *uniformly* across eval datasets. It does not teach the model "this *type* of question deserves more searches."
- **Some models do show test-time adaptation** — they search more on multi-hop than on single-hop at the same training budget. But this only emerges with 7B scale or with instruction-tuned + PPO. The 3B-base recipes (which are what people often start with) show *no* test-time adaptation at all.
- **The two effects are roughly additive.** A HotpotQA-trained 7B-Ins-PPO uses ~2.0 searches on single-hop and ~2.9 on multi-hop — both higher than its NQ-trained counterpart, and with the same gap.
- **What's missing.** None of these runs produce the strong adaptive behavior the agentic-RL framing would predict: e.g. 1 search on simple NQ questions, 4 on MuSiQue. The largest within-model spread we see is +0.9 searches across the single-hop / multi-hop divide, which is far less than the per-question structural difference between PopQA and MuSiQue.

---

## Section 2: How does the model use its search budget?

With `max_turns=4`, the model has room for up to **3 search actions** before it must answer. Two sub-questions:

- **Q1 (does it grow into the budget?):** As training proceeds, does the model gradually issue more searches per query, eventually saturating the budget — or does it settle into a steady-state search rate well below the budget?
- **Q2 (does telling help?):** If we explicitly write "you have N searches" into the prompt (BT1) instead of hiding it (BT0), does the model use the budget more effectively?

### Q1: Does the model gradually use up its budget?

![Training trajectories: avg # search actions over training step](/assets/images/search-r1/budget_growth.png)
*Each panel = (training set × RL algo). Each line = (model size × base/instruct). The horizontal dotted line is the **search budget of 3**. The model "uses up the budget" if its curve rises toward 3 and stays there. A sudden drop to 0 is training collapse (the model degenerates and stops producing valid `<search>` tags).*

Three patterns emerge:

1. **PPO grows into the budget; GRPO doesn't.** Across both training sets, every PPO run rises substantially during training — and the **NQ-7B-Base-PPO** and **NQ-7B-Ins-PPO** runs actually saturate above the budget (~4 searches at peak — possible because a turn can contain more than one `<search>` tag before the model is forced to answer). GRPO runs typically peak well under 2 searches and plateau there. This is the clearest "PPO vs GRPO" effect in the whole sweep: **PPO converts unused budget into more retrieval; GRPO doesn't.**
2. **Capacity gates the budget usage.** 7B models climb higher and faster than 3B models, and the 3B-Base + GRPO recipe (the lowest-resource cell of the sweep) flatlines at 1.0 forever. The smallest models simply never figure out that there is a budget to spend.
3. **Most runs eventually collapse.** Several curves rise toward the budget, peak, then crash to 0 (the model stops producing valid search tags entirely and emits the `!!!!!!!` / `<extracted answer: and>` pathology). The "best validation step" used in earlier sections is exactly the peak of these curves; what the curves show is that the same model, if trained longer, mostly *unlearns* the search behavior. The budget is only briefly fully used.

So the headline answer to Q1: **the model does grow into its budget — but only when (a) algorithm is PPO, (b) model is 7B or instruction-tuned, and (c) training stops at the peak before collapse.** Run the same recipe with 3B-Base + GRPO or just train longer, and the budget goes unused.

### Q2: Does telling the model its budget help?

The BT0 / BT1 axis writes the phrase "you have at most N searches" into the prompt (BT1=on) or omits it (BT0). We only ran BT1 on the format-reward 3B-Instruct runs, so the comparison is restricted to four model variants:

![BT0 vs BT1 trajectories of # searches](/assets/images/search-r1/bt0_vs_bt1_trajectory.png)
*Solid blue: BT0 (budget hidden). Solid orange: BT1 (budget explicitly told to the model). Budget = 3 marked as dotted line.*

The effect is asymmetric:

- **GRPO** runs (left column): BT1 lifts the curve a bit — telling GRPO the budget gets it to use slightly more of it (peak goes from ~1.4–1.5 to ~1.7–1.9). The model is otherwise *under*-using the budget; the prompt nudges it upward.
- **PPO** runs (right column): BT1 pulls the curve down. PPO without budget transparency was saturating at ~4 searches (i.e., using up the entire budget and then some); BT1 caps it around 2. The model is otherwise *over*-using the budget; the prompt regularizes it downward.

The summary (using best-step averages):

![BT0 vs BT1: best-step score and best-step # searches](/assets/images/search-r1/bt0_vs_bt1_summary.png)
*Left: best avg test score under BT0 vs BT1. Right: best-step avg # searches under BT0 vs BT1.*

| Model | BT0 #srch | BT1 #srch | BT0 score | BT1 score |
|-------|:---:|:---:|:---:|:---:|
| HotpotQA-3B-Ins-GRPO | 1.40 | **1.55** | 0.342 | **0.354** |
| HotpotQA-3B-Ins-PPO  | **3.98** | 1.80 | **0.403** | 0.329 |
| NQ-3B-Ins-GRPO       | 1.14 | **1.58** | 0.334 | **0.350** |
| NQ-3B-Ins-PPO        | **3.67** | 2.24 | 0.356 | **0.359** |

So:

- **For GRPO, BT1 helps a little** — the model uses ~0.4 more searches per query and gains 1–2 pp of score.
- **For PPO, BT1 hurts (or barely matters)** — telling the model the budget *suppresses* the saturating-PPO behavior, and on HotpotQA that costs 7 pp of score (the saturated PPO behavior was actually score-positive there).

The takeaway: **the budget message acts as a regularizer, not as an enabler.** Telling the model "you have 3 searches" doesn't make it pick the right number for each query; it shifts its average toward 2 regardless of what it was doing before. If your base behavior is under-using the budget, BT1 pulls you up. If your base behavior is over-using the budget, BT1 pulls you down. Net effect on score: small and inconsistent.

This is what you'd expect from a model that has a single "how often to search" knob rather than a per-query "is one more search worth it" decision. A real budget-aware policy would use *more* searches on multi-hop questions and *fewer* on single-hop, which is exactly what we did not see in Section 1.

---

## Section 3: Does higher-level reasoning emerge under stress-testing?

Sections 1 and 2 looked at "normal" training. What if we use the training environment to *stress-test* whether the model has learned anything beyond imitating the search protocol?

The cleanest stress test is: **break the retriever during training, and watch how the model's search behavior evolves over training steps.** If the model has built any real "reason about when retrieval is useful" skill, it should respond to the broken retriever; if the model is just executing the search-tool protocol because the protocol is rewarded, it should mostly keep searching.

We retrained Search-R1 with two different broken retrievers:

- **Empty retriever** — every search returns no documents. This is the *softer* test: searching is **useless**, but it does not actively hurt the model's reward (the search returns nothing; the model answers from whatever it would have answered without the search). The only "cost" of searching here is the wasted API call — which the reward function does not see.
- **Random retriever** — every search returns three random unrelated documents. This is the *harder* test: searching is **actively harmful**. The injected random passages mislead the answer, so the model's reward goes down compared to never searching at all.

The hypothesis this lets us test is sharp:

> The RL signal does not reward "API efficiency" or "not wasting tool calls" — it only rewards getting the final answer correct. So the model should only learn to stop searching when searching **actively hurts the reward**. It should *not* learn to stop searching when searching is merely useless. In other words: we expect "stop searching" to emerge under the **random** retriever but **not** under the **empty** retriever.

(That hypothesis is essentially: the model won't naturally optimize for the cost of search, because the reward never tells it search is expensive.)

To test this we need training-step trajectories, not just final numbers — a final # of searches near 0 could be either "model learned to stop" or "model collapsed and stopped emitting valid tags." The trajectory tells us which.

### Training trajectories: Base models

![# search actions over training, 3B-Base, normal vs empty vs random](/assets/images/search-r1/adv_trajectories_base.png)
*Each panel = (training set × algorithm). Green = normal retriever. Orange = empty retriever. Red = random retriever. Horizontal dotted line = search budget of 3.*

Reading off the curves:

- **Random retriever (red, where available): the model learns to stop, fast.** In all three random-retriever runs, the curve starts near 1.1 searches and is at zero within ~150 training steps. The RL signal sees the random docs hurting the answer, the gradient pushes search probability down, and the model stops calling the tool. **This is exactly what the hypothesis predicts.**
- **Empty retriever (orange): the picture is mixed, and tells a more interesting story.**
  - On **HotpotQA-trained models** (bottom row), the empty-retriever curve stays close to the normal-retriever curve — both flat around 1.0 for the base/GRPO and base/PPO cells. The model "doesn't learn to stop," but in this case it also wasn't searching very much to begin with.
  - On **NQ-trained models** (top row), the empty-retriever curve goes **up**, not down. NQ-3B-Base-PPO with empty content climbs from ~1.1 to ~3.2 searches per query over training — the model is issuing **more** wasted searches at the end of training than at the start. Empty content gives the model no negative signal, so PPO's exploration pushes it toward "try more searches" rather than "stop searching."

The trajectory shape is the important detail. If you only looked at the best validation step, the NQ-Base-PPO-empty result is ~1.25 searches — looks like "didn't change much." But the trajectory shows the model actively *grew into* the broken retriever, in the direction of *using more of it*, not less.

### Training trajectories: Instruct models

We didn't run the random retriever on Instruct, only empty. The empty trajectories:

![# search actions over training, 3B-Instruct, normal vs empty](/assets/images/search-r1/adv_trajectories_ins.png)
*Instruct variants. Random-retriever runs were not done for these cells; the orange-only curves are empty vs normal.*

Two failure modes appear:

- **NQ-3B-Ins-PPO under empty content** peaks at **4.5 searches** per query during training before collapsing to 0. The model spent ~250 steps escalating its search count under a retriever that never gave it anything, and only stopped when the run collapsed entirely. This is the most striking example in the whole sweep of "PPO + reward-neutral useless tool = model uses the tool more, not less."
- **NQ-3B-Ins-GRPO under empty content** flatlines at ~1.0 until it collapses to 0 at the end. GRPO is less exploratory than PPO under this signal — it doesn't grow the search count, but it also doesn't *reduce* it. The collapse to 0 at the end is the model's outputs degenerating, not the model "learning to stop."

### What the trajectories say about higher-level reasoning

If the model had built a real internal model of "is this tool useful for this query?" — the kind of meta-reasoning a deployed agent needs to be cost-aware in the wild — we'd expect symmetric behavior under empty and random retrievers, since both are equally useless from a "do I have evidence?" point of view.

What we see instead:

- **Under the random retriever, the model robustly stops searching.** The RL gradient is strong (random docs → wrong answer → lower reward → suppress the action), and the policy responds.
- **Under the empty retriever, the model does anything except "stop because searching is useless."** It keeps searching at its baseline rate, or grows the rate further (PPO), or collapses outright. None of these is the response you'd want from an agent that understood "the tool is broken, so I shouldn't pay for it."

The asymmetry is real and it lines up with the hypothesis: the model treats empty and random differently because the *reward* treats them differently. The "decide whether to retrieve" behavior the agentic-RL framing is supposed to teach is, at best, an artifact of reward shape, not an artifact of reasoning.

In a deployed setting, where each search call costs real money and an empty retriever response should be a strong "stop searching" signal, the trained model would happily keep paying for nothing — or, worse, learn to pay for *more* of nothing. To get cost-aware behavior, you have to put cost into the reward.

---

## Section 4: Removing the `<think>` scaffolding helps more often than it hurts

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

---

## Cross-cutting axes

A few standard comparisons for completeness, using only the *normal* turn-4 runs:

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
