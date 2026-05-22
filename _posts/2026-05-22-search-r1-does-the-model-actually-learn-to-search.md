---
layout: post
title: "Search-R1, Re-examined: Does the Model Actually Learn to Search and Reason?"
date: 2026-05-22
categories: research
tags: [rl, tool-use, agents, search, reasoning, reward-hacking]
excerpt: "We retrained Search-R1 across model sizes, RL algorithms, training distributions, and budget conditions. Three things kept showing up: base models refuse to use more than one search; instruct models burn through their budget regardless of need; and even when scores go up, the chain of thought has often already collapsed into gibberish, mixed languages, or rows of exclamation marks. RL teaches the model to play the search game — not necessarily to reason."
---

## TL;DR

Search-R1-style training — RL on `<think>/<search>/<answer>` interaction with a retriever — gives respectable QA scores, but a careful look at what's happening underneath is less flattering:

1. **Base models won't spend the search budget.** Across every NQ-trained run, base models converge to almost exactly **one** search action regardless of question difficulty. Multi-hop questions don't get more searches than single-hop ones.
2. **Instruct models always burn through the budget.** They use 2–3+ searches even when a single search would do, especially under PPO. Without telling them what the search budget is, they treat "more search" as a default behavior.
3. **The reasoning collapses well before the score does.** Late in training, `<think>` blocks turn into mixed-language phrases, repeated stock sentences, or — in the worst runs — literal rows of `!!!!!!!!!!!!!!`. The retriever still returns documents and the model still emits an answer, so the reward keeps moving. But the "reasoning chain" is no longer reasoning.

The implication: scoring well on a Search-R1 benchmark does **not** imply the model learned to search and reason. It learned to play a tool-use minigame whose reward signal happens to correlate with QA accuracy.

---

## Setup

I retrained Search-R1 across the full Cartesian product of:

- **Base models**: Qwen2.5-{3B, 7B} × {Base, Instruct} (4 models)
- **RL algorithms**: PPO and GRPO
- **Training data**: NQ (single-hop) and HotpotQA (multi-hop)
- **Max turns**: 1 and 4
- **Budget transparency**: BT0 (model is not told the search budget) and BT1 (model is told "you have N searches")
- **Evaluation**: 6 QA benchmarks — NQ, TriviaQA, PopQA (single-hop) and HotpotQA, 2WikiMultiHopQA, MuSiQue (multi-hop) — held constant across all runs

Everything else (retriever, top-k=3, prompt template, optimizer, KL coefficient, batch size) follows the original Search-R1 recipe.

The numbers below come from the best validation step of each run (selected by mean test score across the 6 evals); the raw best-step data is in `search_plot/best_points.json`.

---

## Finding 1: Base models simply refuse to issue a second search

The most striking pattern in the entire sweep is how flatly the number of search actions sits at 1.0 for base models trained on NQ:

| Train set | Model | Algo | # search actions (avg over 6 evals) | # turns |
|-----------|-------|:----:|:----------------------------------:|:-------:|
| NQ | Qwen-3B-Base | GRPO | **0.99** | 3.07 |
| NQ | Qwen-3B-Base | PPO  | **1.01** | 2.13 |
| NQ | Qwen-3B-Ins  | GRPO | **1.00** | 3.01 |
| NQ | Qwen-3B-Ins  | PPO  | 1.55 | 2.61 |
| NQ | Qwen-7B-Base | GRPO | 1.42 | 2.45 |
| NQ | Qwen-7B-Base | PPO  | 1.85 | 2.78 |
| NQ | Qwen-7B-Ins  | PPO  | 1.66 | 2.62 |

Despite a `max_turns=4` budget and an explicit "you can search as many times as you want" in the prompt, the 3B base model and the 3B GRPO-instruct model converge to **exactly one** search per query — even on MuSiQue, which is engineered to require chained, decomposed retrieval.

![Number of search actions on single-hop benchmarks](/assets/images/search-r1/wandb_comparison_num_search_actions_singlehop.png)
*Training curves of the average number of search actions per query on single-hop evals (NQ / TriviaQA / PopQA). Base models flatten at ~1.0 early and never move.*

![Number of search actions on multi-hop benchmarks](/assets/images/search-r1/wandb_comparison_num_search_actions_multihop.png)
*Same plot on multi-hop evals (HotpotQA / 2Wiki / MuSiQue). The questions are demonstrably harder, but base-model curves still flatten at ~1.0. Multi-hop difficulty does **not** translate into multi-hop search behavior.*

This matters for the central claim of "agentic" RL: if the RL signal is supposed to teach the model to *decompose problems and retrieve adaptively*, then a model that fires exactly one search on every question — regardless of how many hops the question requires — has not learned that. It has learned the cheapest behavior that consistently earns positive reward.

## Finding 2: Instruct models burn through the budget — even when they shouldn't

The mirror image happens with instruct models, especially under PPO:

| Train set | Model | Algo | # search actions on MuSiQue | # search actions on NQ |
|-----------|-------|:----:|:---------------------------:|:----------------------:|
| HotpotQA | Qwen-3B-Ins | PPO  | **3.13** | 2.21 |
| HotpotQA | Qwen-7B-Ins | PPO  | **3.24** | 2.09 |
| HotpotQA | Qwen-3B-Ins | GRPO | 2.03 | 1.34 |
| NQ       | Qwen-3B-Ins | PPO  | 2.06 | 1.44 |
| NQ       | Qwen-7B-Ins | PPO  | 2.52 | 1.56 |

The 3B-Instruct + PPO model trained on HotpotQA issues **3.1 searches** on MuSiQue (where it's needed) but still issues **2.2 searches** on NQ (where one is plenty). That isn't adaptive — that's a learned reflex.

![Search budget allocation across models](/assets/images/search-r1/baseins_hotpotqa_3b_grpo.png)
*HotpotQA-trained Qwen-3B with GRPO: instruct (red) vs base (blue) across all 6 eval datasets. Instruct uses more searches and more turns across the board, but the *relative* allocation between single-hop and multi-hop is similar — i.e. the model has a search "style", not a query-conditioned strategy.*

Why does this matter outside the benchmark? In any realistic deployment the retriever is paid for — per-call API cost, per-call latency, or a fixed budget per session. A model that issues 3 searches when 1 would do is wasting money on easy queries; a model that issues 1 search when 3 are needed is silently dropping accuracy on hard ones. The Search-R1 reward signal in its vanilla form rewards neither calibration.

## Finding 3: Allowing a 4-turn budget barely helps unless the eval is multi-hop

Comparing turn-1 and turn-4 runs head-to-head on the same model/algorithm/train set:

![Turn-1 vs Turn-4 score comparison (single-hop)](/assets/images/search-r1/wandb_comparison_turn1_vs_turn4.png)
*Single-hop evals: turn-1 and turn-4 training are essentially indistinguishable. The extra budget is unused.*

![Turn-1 vs Turn-4 score comparison (multi-hop)](/assets/images/search-r1/wandb_comparison_turn1_vs_turn4_multihop.png)
*Multi-hop evals: turn-4 finally pulls ahead, but only on MuSiQue / 2Wiki / HotpotQA, and only for models that *can* be coaxed into using the extra turns (instruct + PPO, mostly).*

So the conditional "more turns help" is real, but heavily mediated by whether the model is willing to take more turns. The base+GRPO combination has the budget, never uses it, and looks identical to its turn-1 counterpart.

## Finding 4: The training "succeeds" while the reasoning collapses

This is the section that bothers me most.

Search-R1's prompt asks the model to put reasoning between `<think>` tags before each search, then provide a final `<answer>`. The reward only looks at the final answer. So the reasoning chain is *unsupervised* — it just has to be a sequence of tokens that triggers the right `<search>` and `<answer>` tags.

By around step 500 of a 3B-Instruct + GRPO run, what comes out of the `<think>` block is, charitably, *not reasoning*. Two representative examples pulled from the live training log:

**Example A — the assistant emits 500 exclamation marks instead of a thought:**

```
Question: The Remington Model 31 competed with the Winchester model
          that was popularly known as what?

assistant:
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
... (continues for the full response budget) ...

(environment) My previous action is invalid. If I want to search,
I should put the query between <search> and </search>. ...

Golden answers: ['Perfect Repeater']
Extracted answer: and
```

**Example B — short-circuit answer with no reasoning, no search:**

```
Question: what is bermuda competing in the winter olympics?

Golden answers: ['Cross-country skiing']
Extracted answer: and
```

**Example C — the reasoning is "reasoning-shaped" but factually nonsense:**

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

The think-block is a hallucinated paragraph (shortwave is *not* 200 kHz–2.7 MHz; that's medium-wave / longwave), the search is generic, and the final answer is correct only because the retrieved documents happened to contain it.

The key observation: **on this last example, the reward is positive** (`<answer>AM</answer>` matches the gold). The reward signal cannot distinguish "I reasoned correctly, searched well, and arrived at AM" from "I hallucinated, fired a generic query, and got bailed out by the retriever." Both look identical to the trainer.

Pulling back from the example level: across runs, the `<think>` content degrades over training in fairly predictable ways:

- **Repetition.** The same opening phrase ("Based on the question, I need to find...") gets repeated verbatim across thousands of samples.
- **Style drift.** Late-training samples mix English with sentence fragments in other languages, especially on the 3B base runs.
- **Token-budget filler.** Long padding sequences (`...`, repeated punctuation, the `!!!!!!` failure mode) appear well before the run is "done."
- **Wrapper-only thinking.** The `<think>` block becomes a templated stub — "I will search for the answer." — and all the actual "deciding what to do" happens implicitly inside the `<search>` query.

If you only watch `test_score` and `mean_response_length` on W&B, the run looks healthy until it suddenly tanks. But if you watch `reasoning_quality` (which nobody is logging because there isn't a metric for it), you'd see a much earlier and steeper collapse.

## Finding 5: RL on QA helps even without the search tool

A useful sanity check from this sweep: take the same RL recipe, the same base model, and the same QA reward, but disable the retriever (or never use it). Score still goes up. The improvement attributable to the search interface, separated from the improvement attributable to "just RL on QA," is much smaller than the total improvement.

This puts an upper bound on how much we can credit "the model learned to search" for any observed accuracy gains, and it dovetails with Finding 4: if the search behavior is largely templated and the reasoning is largely cosmetic, then most of the RL signal is doing what RLHF always does — sharpening the output distribution toward the reward target — and not teaching a new tool-use skill.

---

## What I would change about the experimental design

Three things, in roughly increasing order of how much they would re-frame the field's takeaways:

**(1) Score the chain of thought, not just the answer.** Even a simple per-step heuristic — does the `<think>` content contain any of the entities in the search query? does it contain any of the entities in the retrieved documents? — would catch the collapse cases above. A judge-based reasoning score is more expensive but would correlate much better with what we actually want.

**(2) Make the search budget part of the reward.** Right now the model is rewarded only for correctness, with no penalty for issuing useless searches. A small per-search cost (or, equivalently, a small bonus for *not* searching when the model would have answered correctly anyway) turns "issue a search reflexively" from optimal into suboptimal. The BT0 / BT1 axis in this sweep is a starting point for this — *telling* the model its budget — but a *priced* budget would be a stronger signal.

**(3) Stress-test the search tool itself.** Two adversarial settings are particularly diagnostic:

- **Empty retriever.** The retriever always returns no documents. A model that has actually learned "search when you don't know, otherwise answer" should learn to stop searching. A model that has learned "search is part of the protocol" will keep searching, get nothing back, and eventually answer from prior knowledge anyway — at extra cost.
- **Adversarial retriever.** The retriever returns plausible-looking but irrelevant or contradictory documents. This is strictly worse than the empty case: searching now actively *hurts* answer quality. A model that has learned to reason about its tool should learn to *not* trust the retriever in this setting; a model that has memorized "search → quote → answer" will follow the documents into the wrong answer.

We're running both of these now. I expect the second to expose the templated-tool-use failure mode the most clearly. If your model's score drops more than X% under adversarial retrieval — where X is much larger than the equivalent drop for a strong RAG baseline — then you have evidence that the RL training learned to use the tool, not to evaluate it.

---

## Closing

The Search-R1 result — "RL teaches an LLM to interleave reasoning with retrieval" — is a clean and compelling narrative, and the underlying recipe genuinely produces models that score better on QA benchmarks than their SFT counterparts. But the same training runs, opened up, show: search behavior that doesn't depend on the question, reasoning chains that collapse into noise, and an evaluation protocol that can't tell the difference. Most of the "learning to search" credit in the headline number is actually credit for *learning to play this benchmark's particular tool-use protocol well enough to extract reward*.

This is the same shape of problem as the [LLM-as-judge reward hacking]({{ "/blog/2026/04/reward-hacking-llm-judge/" | relative_url }}) post — a narrow, hackable reward, applied to a model with just enough capacity to game it, with an evaluation that lives inside the same loop. Fixing it is going to require pushing on all three: broader reward (price the searches, score the reasoning), broader evaluation (adversarial tools, held-out reasoning probes), and broader capacity (or weaker RL pressure) so the model has room to actually learn the skill instead of the shortcut.

---

*The full experiment sweep, training scripts, and per-run best-points data are in the [`search-r1`](https://github.com/JinyanSu1) repo. Curves in this post are from W&B; the aggregation scripts are under `search_plot/`. The adversarial-retriever experiments are ongoing and will be a follow-up post.*
