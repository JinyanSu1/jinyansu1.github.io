---
layout: post
title: "AI Is Improving AI Faster Than We Can Check"
date: 2026-10-05
categories: technical
tags: [ai, rsi, self-improvement, verification, agents, evals]
excerpt: "AI is already helping to build the next generation of AI, with people still in the loop. What limits its speed is verification: agents produce work far faster than people and tests can check it. Five reasons verification is the hard part, and where the opportunities are."
---

<p><em>(There is no human-edited Chinese translated version; if needed, please translate it yourself.)</em></p>

## TL;DR

* What limits the speed of RSI is verification: agents produce work far faster than people and tests can check it.
* Verification is the hard part, for five reasons: people are the bottleneck, scores can be gamed, benchmarks can barely measure the strongest models, agents do not know when to stop, and failures are hard to trace.
* The remaining human edge as choosing which problems matter.

AI is already helping to build the next generation of AI, with people still in the loop. Whether or not this counts as recursive self-improvement (RSI) yet, what limits its speed is verification: agents produce work far faster than people and tests can check it.

In 2026 the frontier labs started publishing numbers on AI doing AI research. Anthropic [1] says Claude wrote more than 80% of the code it merged as of May. OpenAI [2] says the AI agents in its research organization now work 3.1 times as many hours as its human researchers.

Agents can write code and run experiments around the clock, but people still review the code, judge the results and decide what to try next. Those steps do not speed up when more agents are added.

## RSI improves a system, not just a model

Two parts of an agent get improved today: its harness and its weights. A third lever sits outside the agent: the environment that supplies the experience both learn from.

| Lever | Where it sits | What changes | Example |
|---|---|---|---|
| Harness | Inside the agent | Prompts, tools, memory and control flow around a frozen model | The Darwin Gödel Machine [3] rewrote its own code and went from 20.0% to 50.0% on SWE-bench |
| Weights | Inside the agent | The model's own parameters | SEAL [4], from MIT, has a model write its own fine-tuning data and update its own weights, lifting accuracy on newly learned material from 32.7% to 47.0% |
| Environment | Outside the agent | The tasks and feedback that produce the experience the other two learn from | Environments rewritten around an agent's failures [5] gave a frozen model better skills (SWE-bench Verified: 52.6%, against 49.9% with the originals) and, in a separate reinforcement-learning run, better weights (ALFWorld: 87.9, against 81.4) |

The harness is the cheapest of the three to change, and much of the public work on self-improving systems happens there. The improver also does not have to be the system being improved. In one study [6], a scaffold written by a stronger model lifted a smaller one from 0.49 to 0.91 accuracy on four theory-of-mind benchmarks, with no retraining.

## It works where a machine can check the result

DeepMind describes the scope of AlphaEvolve[7], a coding agent that evolves programs, as "any problem whose solution can be described as an algorithm, and automatically verified." Inside that boundary the gains are already large. AlphaEvolve found a faster kernel that cut Gemini's own training time by 1%. On a fixed task that asks Claude to speed up the code that trains a small model, Anthropic [1] reports about 3× for Claude Opus 4 in May 2025 and about 52× for Claude Mythos Preview in April 2026.

Two results from 2026 show where the boundary sits.

In April, Anthropic [1] reported that Claude agents ran a safety research project end to end. They recovered 97% of a performance gap, against roughly 23% for two human researchers. The problem came with a score, so every idea could be checked.

In July, the CRUX evaluation [8] tested open-ended research. It used the research questions behind two unpublished NeurIPS submissions: for each one, an agent got six days and $3,000 in API credits to do the research and write a paper. The agents completed the engineering without human help, but the authors of the original submissions graded the agents' papers 2/6 and 1/6, both rejections. The CRUX team concluded that the agents "lacked the judgment to identify when a problem was adequately solved."

Where every idea could be scored, Anthropic's agents outperformed the human researchers. Without a score to check against, the CRUX agents had to judge their own results, and they could not do it well.

## Verification is the hard part

Agents can now do the work around the clock. Verifying it is harder, for five reasons.

**People are the bottleneck.** Anthropic [1] writes that "human code review has become a new bottleneck." OpenAI [2] reports that over half of its successful 4-8 hour agent tasks needed at least one human intervention.

**Scores can be gamed.** Cursor[9] found that on SWE-bench Pro, "63% of successful Opus 4.8 Max resolutions retrieved the fix rather than derived it." When it hid the repository history and blocked the network, the model's score fell from 87.1% to 73.0%. It adds that reward hacking is "far more common with newer, more sophisticated models."

**Benchmarks can barely measure the strongest models.** METR [10] tests models on tasks of different lengths. A task's length here is defined as how long a human expert takes to finish it, and a model's score is given by the length at which it succeeds half the time. A score of two hours, for example, means the model is expected to finish about half of the tasks that take an expert two hours. The score describes how hard a task the model can handle, not how long the model spends on it. Claude Mythos Preview scored at least 16 hours, which is the top of what the suite can measure: only 5 of its 228 tasks take 16 hours or longer. With so few long tasks the estimate is unstable, and its 95% confidence interval runs from 8.5 to 55 hours [11]. METR notes that "Measurements above 16 hrs are unreliable with our current task suite." Until longer tasks are added, the benchmark cannot say precisely how capable the strongest models are.

**Agents do not know when to stop.** In the scaffold study above [6], where stronger "builder" models wrote scaffolds for a smaller model, each builder worked in rounds: write a scaffold, test it on a validation set, revise. A builder kept going until it chose to submit. Runs took from 2 to 15 rounds, about five on average, and the number of rounds was essentially uncorrelated with final accuracy (r = 0.17). The weakest builder stopped soonest, after fewer than three rounds on average, and gained the least. Another averaged nearly seven rounds and still ranked seventh of the eleven builders on final accuracy; in the paper's words, "weaker builders do not reliably improve by probing the validation set more often." One takeaway is that more iteration does not mean better results. Another is that a builder's decision to submit said little about whether its scaffold was good enough, which suggests that agents do not know when to stop. CRUX shows the same weakness in open-ended research: one agent declared its project complete right after its own reviewer had rejected the paper [8].

**Failures are hard to trace.** When a self-modified agent gets worse, the cause may be the model, a prompt, a tool, the memory or the environment, and automated diagnosis is weak. In a 2025 study of failures in multi-agent systems [12], the best method identified the responsible agent 53.5% of the time and the step where things went wrong 14.2% of the time. The reliable way to find out is an experiment: change one component, replay the task and compare.

That leaves a design question: what should a self-improving system be tested on? The three main options each trade one weakness for another.

| What to test on | Strength | Weakness |
|---|---|---|
| Fixed train/test split | Cheap and reproducible | Leaks and saturates under repeated iteration |
| Fresh, time-stamped tests used once | Hard to overfit | Slow and expensive to produce |
| Synthetic or modified environments | Cheap and plentiful | Less realistic, and they inherit the verifier's blind spots |

## The opportunities in verification

Capital is already flowing to companies that automate the work itself. Recursive Superintelligence raised $650M [13] in May 2026 to build self-improving AI, Ricursive Intelligence raised $335M [14] to automate chip design, and Periodic Labs raised $300M [15] to give AI scientists physical labs. But if verification sets the pace, those systems move only as fast as their results can be checked. The complementary bet is on tools that make checking keep up, and the first three problems above show where they are already being built.

**Automated review of agent-written work.** Anthropic's engineers now merge 8× as much code per day as in 2024 [1], and review is the stated bottleneck. Anthropic's answer is an automated Claude reviewer that reads every proposed change before it merges; in a retrospective analysis, it would have caught roughly a third of the bugs behind past incidents. Tools like this let people spend review time on the changes that need human judgment.

**Evaluations that resist gaming.** Stricter evaluation setups, audits of agent transcripts and reward-hack detection. Cursor's "strict harness" [9] is one example: it removes the repository's git history and denies network access by default, so the agent cannot look up the fix.

**Environments that adapt.** Fixed tests stop being informative once agents outgrow them, as the METR result above shows, and the same holds for the environments agents train in. TechCrunch [16] reported that "All the big AI labs are building RL environments in-house," and Mercor reached $450M in annualized revenue supplying expert data and evaluation to the labs, according to Contrary Research [17]. Static environments are, in the words of one paper [5], "quickly left behind" as an agent improves, so the durable product is one that changes with the agent.

## What stays human

Anthropic [1] names the remaining human edge as "choosing which problems matter, which results to trust, and when an approach is a dead end." How fast AI improves AI depends on how fast its results can be verified, and on people choosing what is worth verifying.

## References

1. Anthropic, When AI builds itself, 2026
2. OpenAI, Research acceleration: The view inside OpenAI, September 6, 2026
3. Sakana AI, The Darwin Gödel Machine, May 30, 2025
4. Zweiger et al., Self-Adapting Language Models, arXiv 2506.10943
5. Huang et al., EnvHarness: Awakening Static Worlds for Agent Learning, arXiv 2608.19880
6. Qian et al., AI4AI at Test-Time: Strong-to-Weak Capability Transfer via Harnesses, arXiv 2608.12307
7. Google DeepMind, AlphaEvolve: A Gemini-powered coding agent for designing advanced algorithms, May 14, 2025
8. Kirgis et al., Can AI agents conduct open-ended AI research? Early evidence from two case studies, July 30, 2026
9. Cursor, Reward hacking is swamping model intelligence gains, June 25, 2026
10. METR, time horizons page, updated May 8, 2026
11. The Decoder, METR says it can barely measure Claude Mythos, Palo Alto Networks warns of autonomous AI attackers
12. Zhang et al., Which Agent Causes Task Failures and When? On Automated Failure Attribution of LLM Multi-Agent Systems, arXiv 2505.00212
13. The Next Web, Recursive Superintelligence raises $650m at $4.65bn valuation to build self-improving AI, May 14, 2026
14. TechCrunch, How Ricursive Intelligence raised $335M at a $4B valuation in 4 months, February 16, 2026
15. Andreessen Horowitz, Investing in Periodic Labs, September 30, 2025
16. TechCrunch, Silicon Valley bets big on "environments" to train AI agents, September 21, 2025
17. Contrary Research, Mercor business breakdown
