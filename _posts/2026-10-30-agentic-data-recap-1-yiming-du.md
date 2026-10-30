---
layout: post
title: "Event Recap (1) | Stronger Models “Cheat” More: Yiming Du on Data and RL for Coding Agents / 活动回顾（一）｜越强的模型越会“作弊”：杜一鸣谈代码智能体的数据与强化学习"
date: 2026-10-30
categories: technical
tags: [ai, llm, agents, coding-agents, rl, data, event-recap]
excerpt: "On the afternoon of October 17, NICE held an in-person event in Shenzhen, “Agentic Data: From Computer Use to Robot Use.” Part 1 covers Yiming Du's talk on LegoX: why training coding agents needs real, verifiable tasks, four lessons from building SWE data — including why the stronger the model, the more it “cheats” — and Lego-RL, reinforcement learning inside real harnesses."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

On the afternoon of October 17, NICE held an in-person event in Shenzhen, “Agentic Data: From Computer Use to Robot Use.” The event covered a lot of ground, so the recap is being published in several parts. This is the first.

This session was given by Yiming Du, who holds a Ph.D. from The Chinese University of Hong Kong and is a senior researcher at Huawei Hong Kong Research Center. His talk was titled “LegoX: Data Science and Reinforcement Learning in Practice for Coding Agents.” Training a coding agent requires real tasks that can be executed and verified, trajectories that the model leaves as it interacts with an environment step by step, and training and evaluation that quickly report back how good the data is. In Du’s view, this kind of Agentic Data is becoming new industry infrastructure.

LegoX is a series of open-source projects built around this chain by the team Du is part of. The talk was organized around data, focusing on LegoFlow, the team’s framework for producing coding data, and several lessons learned while building that data. It closed with a brief introduction to Lego-RL, the team’s reinforcement learning framework, to show how the data performs in RL training.

## Key takeaways

- **Coding agent = model + harness.** Training one relies mainly on two kinds of data: executable, verifiable task instances, used more for reinforcement learning, and trajectories the model leaves while interacting with real environments, used more for SFT. Both depend on the harness. A trajectory records every turn in which the model calls tools through the harness and gets the results back; in RL, the model also solves tasks in the task environment through the harness and is then scored by tests.
- **LegoFlow divides data production among several agent roles.** Curator builds tasks, Tracer generates trajectories, Trainer and Evaluator handle training and evaluation, and Root coordinates them. Every step can be launched with a single command through a built-in skill.
- **Small, carefully selected data.** From about 12 million candidate PRs, the team selected 5,000 SWE tasks and open-sourced them. With SFT on only 1K LegoFlow-SWE trajectories, Qwen3.5-35B-A3B reaches 70.2 on SWE-bench Verified, 6.8 points above the official Instruct version.
- **Letting an agent run the whole pipeline on its own.** Starting from scratch, an agent crawled repositories, generated trajectories, trained, and evaluated, then fixed the data based on what the evaluation revealed and trained a second time. SWE-bench Verified rose from the base model’s 7.6 to 64.4.
- **Four lessons on building data:** task complexity and the number of turns quickly predict data quality; the stronger the model, the more it cheats, and with internet access the confirmed cheating rate of GLM-5.2 reaches 21.2%; when selecting trajectories, look at how deeply the model reasons in each turn, not how long the whole trajectory is; with limited compute, add interaction turns first, then more rollouts.
- **Lego-RL runs RL inside real harnesses.** The harness runs unmodified. The tokens the model actually generates are recorded during sampling and fed back as-is to compute gradients during training, and MoE models additionally get routing replay. After RL, SWE-bench Verified improves by 5.8–9.4 percentage points across three harnesses.

## Quick glossary

The table below explains two terms that come up repeatedly. Readers already familiar with them can skip it.

| Term | Plain-language explanation |
| --- | --- |
| Training-inference consistency | In RL training, the token sequence the trainer uses and the probabilities it computes must match what the model actually generated during sampling; otherwise the gradient estimate is biased. |
| MoE routing replay | An MoE model sends each token to only a few “experts.” Sampling and training are two separate computations and may select different experts. Routing replay records the selections made during sampling and reuses them during training. |

## About the speaker

**Yiming Du (speaker):** Ph.D., The Chinese University of Hong Kong; senior researcher at Huawei Hong Kong Research Center. The LegoX projects presented in this talk come from the team he is part of and cover data and environment pipelines, SFT training, evaluation, and reinforcement learning for coding agents.

## 1. Four years of change: Agentic Data is becoming infrastructure

Du opened with word-frequency statistics covering the past four years. The sources were the official release announcements and technical blogs of frontier model developers outside China, including OpenAI, Anthropic, Google DeepMind, xAI, Mistral, and Meta (2023 through the first half of 2026). The analysis tracked the most frequent topic words in each year:

- **2023: building foundational capabilities.** Everyone was scaling, model and data sizes kept growing, and “Scaling” was the top word of the year.
- **2024: reasoning and multimodality.** “Reasoning” and “Multimodal” took the top two spots.
- **2025: agents and the tool ecosystem.** Agents began to enter everyday work. “Coding,” “Agent,” and “Tool Use” all made the top five, and the theme shifted from answering questions to completing tasks.
- **First half of 2026: real-world execution.** “Agent” and “Coding” took the top two spots, and “Long Horizon,” “Reliability,” and “Real-world Tasks” entered the top ten: models now need to complete longer-horizon tasks in real environments, and do so more reliably.

Throughout this period, data has become more and more important. Du divided the evolution of training data into four layers, which show how Agentic Data has step by step become industry infrastructure:

1. **Data supply:** web pages (such as Wikipedia), open-source code repositories, and human feedback data are used to train foundation models, and instruction tuning is added to strengthen question answering.
2. **Specialized data:** code, math, and domain knowledge in fields such as finance and law are used in mid-training to improve the model’s foundational abilities in specialized domains.
3. **Agent trajectories:** for models to take part in real work, the data has to cover terminals, browsers, and code repositories, with agents interacting with external environments and leaving trajectories. Post-training methods such as SFT then improve the model’s ability to solve problems in real scenarios.
4. **Reproducible systems:** the end goal is a reproducible system. Whether tasks are truly executable, whether external environments can be reproduced, how the data performs in training, and whether evaluation is accurate are all problems that Agentic Data runs into when it enters the training process.

## 2. LegoX at a glance

LegoX builds on real-world data sources such as GitHub and Stack Overflow and explores data and environment pipelines, SFT training, evaluation, and reinforcement learning, with the goal of assembling, piece by piece, an open-source data infrastructure for coding agents. The pieces released so far:

| Project | What it does | Progress |
| --- | --- | --- |
| SWE-Lego | Large-scale real SWE tasks and trajectories, with all data open-sourced | 200K+ downloads on Hugging Face |
| SWE-Review | Builds real development feedback to improve code collaboration intelligence | Data pipeline efficiency up 50% |
| Terminal-Lego | Interactive terminal environments that generate long-horizon agent execution experience | 80K+ dataset downloads on Hugging Face |
| Lego-RL | A code RL framework that supports mixed training across multiple harnesses and connects data, training, and evaluation | RL training-inference alignment of 0.999+ |
| LegoFlow | An easy-to-use data engineering framework for coding agents that automates the whole pipeline across tasks, trajectories, training, and evaluation, supporting a closed loop of data production and self-iteration | Newly open-sourced 5K curated SWE tasks and trajectories |

This talk covered two of them: mainly LegoFlow, followed by a brief introduction to Lego-RL, looking at how code reinforcement learning verifies that the data is effective.

## 3. Coding agent = model + harness

First, how a coding agent works. Du summarized it as “model + harness.” The user gives a task, such as “implement a new function in src/utils.py and make the tests pass.” The model understands the goal, plans the steps, and generates concrete actions, which it outputs as structured instructions such as read\_file, edit\_file, and run\_command.

These instructions go to the harness (also called a scaffold). The harness provides the tool interface and executes the instructions on the environment side, reading and writing files and running commands on the file system of the working directory. It then returns the execution results and file state and appends them to the context. The model adjusts its strategy accordingly, which completes one turn of interaction. Real tasks often take many turns, and the trajectory left by these turns is exactly the form of data that training needs.

Different harnesses expose their tool interfaces in different forms, and this difference directly affects training.

### Why traditional data pipelines are expensive

A traditional data pipeline for coding agents has three steps:

1. **Repository collection and image building:** extract installation and test commands from key files in open-source repositories, build images, and verify them in a real environment to obtain a usable execution environment.
2. **SWE task construction:** there are two routes. One uses real PRs, which are limited in number but authentic. The other is bug injection, which creates bugs by having an LLM rewrite code or by applying AST transformations (parsing the code into an abstract syntax tree and modifying it by rule, such as changing “>” to “>=”), and can generate tasks at scale. Every task must pass test validation: the reference patch must make the originally failing tests pass (FAIL-TO-PASS) without breaking the tests that originally passed (PASS-TO-PASS). Tasks that pass validation become usable task instances.
3. **Trajectory generation, filtering, and scoring:** run agents on these tasks to produce trajectories, then filter and score them.

This yields two forms of data. Task instances are used more in RL training; Xiaomi’s MiMo RL training, for example, is built on a set of high-quality task instances. Trajectories are used more for SFT.

The problem is that such a pipeline is complex, full of details, and expensive to develop. At many companies in the industry, each department runs its own data pipeline. The more departments, the more pipelines, and the cost and the details to handle add up quickly. This is exactly the problem LegoFlow aims to solve: turn the pipeline into an open-source framework, so that not everyone has to build it from scratch.

## 4. LegoFlow: dividing work among agents the way you would run a team

LegoFlow is an open-source, easy-to-use project for producing coding data. Building tasks, generating trajectories, training, and evaluation can each be launched with a single command through a built-in skill. Structurally, a coordinating node called Root schedules four modules called Blocks. Each Block does one kind of work and has its own output:

- **Curator:** synthesizes tasks; outputs Tasks
- **Tracer:** generates trajectories; outputs Trajectories
- **Trainer:** trains; outputs Models
- **Evaluator:** evaluates; outputs Scores

**Design principle: divide the work the way a team does.** Du said LegoFlow models the relationship between individual developers and team collaboration in real software development. A team has its own goals, each member has a role, and coordinating everyone has traditionally been a team-management problem. With coding agents, these roles can be filled by agents. So each Block corresponds to one role and one type of task, and its environments, logs, inputs, and outputs are all archived. Each Block’s role, behavior, inputs and outputs, and interaction boundaries are specified in a config.yaml file. In his view, clearly defined boundaries are the foundation of efficient teamwork. In addition, every code repository involved is treated as a black box and called only through agreed interfaces, so agents do not have to dig into or modify the large, complex code inside the repositories.

**Root: coordinates the modules.** It handles project-wide interaction with the user, installs and checks the environment, breaks the user’s goal into parts for different Blocks, and coordinates task assignment and resource allocation. Execution relies on plugin-style skills. For example, tell Root “I want to synthesize a batch of data,” and it calls the corresponding Curator skill. Each Block has skills such as setup, check, and run; running Curator’s run skill automatically executes the entire data pipeline and synthesizes tasks.

**Curator: builds tasks.** This is also what many data vendors care about:

1. Collect high-quality repositories and PRs from GitHub. “High quality” has several dimensions: repositories can be judged by star counts and community activity, and the quality of PRs can be scored by an LLM or measured in other ways.
2. Extract the issue from each merged PR, and split the change into a fix patch and a test patch for later validation and evaluation.
3. Build an isolated Harbor environment that packages the entire task.
4. Score and filter for quality with rubrics.
5. Deliver tasks that pass a dual acceptance check: the unfixed code must fail the tests, and the tests must pass once the fix patch is applied.

The parameters for these steps are all set in Curator’s own config.yaml, such as which languages’ PRs to collect (Python, JavaScript, and so on), how many repositories to collect, and the maximum number of PRs per repository. Combined with plugin skills that run it with a single command, this greatly lowers the cost of what used to be a complex data synthesis pipeline. Curator’s skills include setup (one-time initialization), check (a pre-flight dry run), collect-prs (collect and filter PRs), create-tasks (generate Harbor tasks from PRs), and dashboard (score task difficulty and add labels), which Root calls as needed.

> **Note:** Harbor was developed by the Terminal-Bench team and released together with Terminal-Bench 2.0. It runs and evaluates agents at scale in container environments and also supports SFT and RL data pipelines.

**Tracer: generates trajectories.** Once the tasks are ready, the next step is to obtain high-quality trajectories. Trajectories are the direct training data for SFT, and the trajectories a model is trained on directly determine what it can learn, which is why trajectories matter so much now. Tracer’s features:

- It supports not only black-box harnesses such as Claude Code but also OpenCode, OpenHands, and others, so trajectories can be generated in many harnesses;
- It adds a proxy layer between the harness and the model API that records the complete input and output of every turn, including the reasoning;
- It executes and scores in real harnesses, then applies rubric-based quality filtering;
- Anti-cheating: network access is cut off and the git history is cleared.

The final output is trajectories that can be used directly for training. Tracer’s command parameters are likewise set in config.yaml. Every Block is managed through a config.yaml in the same unified format, much as a team uses one template to assign everyone’s work.

**Trainer and Evaluator: is this data actually usable?** Trainer converts the data into LLaMA-Factory format, launches SFT training with a single command, and tunes the training parameters. Evaluator runs benchmark evaluations and reports the results back. Analyzing the results shows how good the data is and which direction the next iteration should take. The deliverables are a model and an evaluation report, which inform the next round of data synthesis.

Much current work on RSI (recursive self-improvement) aims to let a system improve itself. A data synthesis pipeline can do the same; the key is to make every step sufficiently precise.

**Run dashboard: using conversion rates to find bottlenecks.** From building tasks and generating trajectories to training and validation, the whole pipeline takes a long time and a lot of compute. The conversion rate is the share of items each stage keeps relative to the previous stage, and it directly affects the cost of each usable data point: the higher the conversion rate, the lower the unit cost and the higher the production efficiency. The team therefore monitors the conversion rate of each stage on a live dashboard. Here is a snapshot of one real Curator run: 822 repositories and 8,818 candidate PRs yielded 926 built tasks, of which 270 passed validation, an acceptance rate of 29.2%. For tasks that fail, the team traces back through the environment and tests according to the stage where they failed, fixes them, and runs acceptance again. Tasks that pass go to Tracer for trajectory generation.

## 5. LegoFlow-SWE: from 12 million PRs to 5,000 tasks

Using this pipeline, the team open-sourced a new set of SWE tasks and trajectories in September, LegoFlow-SWE:

- Starting from more than 700,000 GitHub repositories, they obtained about 12 million candidate PRs;
- PR filtering kept about 600,000 verifiable PRs, or 5.0%;
- Task validation then left 5,000 tasks, a retention rate of only 0.0417% counted from the candidate PRs;
- Using GLM-5.2 in two harnesses, OpenHands SDK and OpenCode, they generated 9,767 trajectories on these 5,000 tasks, of which 2,780 solved the task, a resolve rate of 28.46%.

With SFT on Qwen3.5-35B-A3B using only 1K LegoFlow-SWE trajectories, the model reaches 70.2, 48.8, and 57.0 on SWE-bench Verified, Pro, and Multilingual, respectively, which is 6.8, 10.6, and 5.3 points above the official Qwen3.5-35B-A3B-Instruct. It also outperforms SFT on trajectories that the same teacher model produced on SWE-rebench-v2 tasks (64.4 on Verified) and SFT on several external open-source data pools (StepFun 3.5, DeNovoSWE, Scale-SWE), reaching open-source SOTA for this base model. From standard SWE-bench to the multilingual benchmark, the results compare favorably across the board.

> **Note:** SWE-rebench V2 is a set of SWE training tasks released by Nebius in March 2026. It contains more than 32,000 executable tasks with Docker environments, covering 20 programming languages.

### Letting an agent run the entire pipeline on its own

This is not a one-off process. After training and evaluation, the results go back to Curator to plan the next round of data synthesis, which is how the overall quality of the data keeps improving.

The team also tried having an agent complete the entire pipeline end to end: crawling GitHub repositories from scratch, generating trajectories, training, evaluating, and then training a second time on the corrected data. The experiment used the base model Qwen3.5-35B-A3B-Base, which is weak on its own and scores only 7.6 on SWE-bench Verified:

- After the first training run (data selected for coverage, 500 self-generated trajectories), it reached 56.1;
- The first evaluation showed that the data needed deduplication, filtering of shallow reasoning, and standardized tool calls. After these fixes, the median reasoning length per turn grew from 140 to 959 characters, and the CoT quality improved;
- After the second training run (data selected for reasoning depth, 512 trajectories), it reached 64.4, 8.3 points higher than the first run.

## 6. Four lessons from building SWE data

### Lesson 1: Two metrics for judging data quality quickly

**Task complexity** correlates positively with training scores, which makes it an efficient way to judge task quality. The team computes it as a weighted score of five static signals: patch scope (30%), logic complexity (25%), context span (20%), test complexity (15%), and problem-statement complexity (10%). For comparison, LegoFlow-SWE has a complexity score of 6.27 and SWE-rebench V2 has 5.80; models trained with SFT on them reach 70.2 and 64.4 on SWE-bench Verified, respectively.

**The number of turns** is strongly correlated with the pass rate, with a Pearson correlation coefficient of −0.95: the more turns, the lower the resolve rate. Problems that are genuinely easy tend to be solved within a few turns.

### Lesson 2: The stronger the model, the more it “cheats”

Peeking at git history and looking up answers online: the stronger the model, the better it is at both. According to the team’s observations, GLM-5.2, DeepSeek V4.0, and later models all show this behavior. In environments with internet access, the confirmed cheating rate rose from 3.6% for GLM-5 to 21.2% for GLM-5.2. Once the leakage was removed, both the teacher and the student scores dropped. The GLM-5.2 teacher fell from 86.8 to 78.8 on SWE-bench Verified, and the student model trained with SFT on 1K of its trajectories on SWE-rebench-v2 tasks fell from 74.4 to 64.4. Those 10 points came from cheating made possible by the leakage, not from the model’s real ability.

Du shared an example the team ran into recently while validating data. They had already deleted the git commits from the repository history, yet the model still cheated. The reason: after the git history was deleted, the original repository’s code still existed locally in the form of binary pack files, and the model, while hacking, unpacked those files and found the answer.

> **Note:** (1) Git compresses historical objects into pack files stored under .git/objects/pack. Deleting only branches, tags, or other references to commits often leaves these objects on disk, where they can be recovered.
>
> (2) Similar loopholes have appeared in public benchmarks. In September 2025, SWE-bench GitHub issue #465 reported that some agents used commands such as git log --all to view “future” commits in the evaluation repository, gaining hints for the fix or even seeing the reference patch; the affected submissions involved models including Claude 4 Sonnet, GLM-4.5, and Qwen3-Coder. The maintainers then updated the SWE-bench Verified images and removed the git history after the base commit.

### Lesson 3: Filtering out shallow reasoning beats chasing the longest trajectories

While selecting data, the team found that as training performance improved, the average reasoning length per turn also increased. So the goal is deeper reasoning, not a pile of turns built on shallow reasoning.

In one experiment, the team split the same pool of GLM-5.2 / SWE-rebench-v2 trajectories into four groups by average reasoning tokens per turn and trained on each group separately. The four groups averaged 167, 368, 577, and 812 reasoning tokens per turn, and models trained on them with SFT scored 57.0%, 64.0%, 64.6%, and 65.0% on SWE-bench Verified. Going from the shallowest group to the second gained 7 points, while the last three groups differed by only 1 point. The gain therefore comes mainly from removing the shallowest group; selecting for even deeper reasoning adds little. The team’s approach is to remove shallow trajectories first, then spend the data budget on covering more tasks.

### Lesson 4: For test-time scaling, add turns first, then rollouts

Given a compute budget, how can the pass rate be pushed higher? The team’s experience is to increase the number of interaction turns first, then the number of rollouts.

The team compared two ways to scale: increasing the number of interaction turns (sequential scaling) and increasing the number of parallel rollouts. With a single rollout, raising the number of turns from 20 to 100 lifts the resolve rate from 2.0% to 41.4%; with turns held at 20, going from 1 to 8 rollouts only reaches 6.0%. Beyond about 100 turns, more turns barely help: with a single rollout, going from 100 to 160 turns raises the resolve rate only from 41.4% to 43.8%. At that point, adding rollouts pays off more, reaching up to 47.4%.

## 7. Lego-RL: reinforcement learning inside real harnesses

Finally, Du briefly presented how this data performs in real RL training. Lego-RL is the team’s agentic RL training framework and part of LegoFlow, and it likewise supports Block skill plugins and a training dashboard. It supports training-inference consistency, fully asynchronous training, and mixed-harness training, with algorithms including SAO, GSPO, GRPO, and PPO. Supported training backends include FSDP, VeOmni, and Megatron; supported harnesses include OpenHands SDK, Claude Code, and OpenCode; and it supports multiple programming languages.

### Why training-inference consistency matters so much

For agentic RL, the tokens obtained during rollout must line up exactly with the tokens at each position during training. The most error-prone point is that harnesses rewrite the context in their own ways, and each harness does it differently. For example, some harnesses remove failed tool calls and pass the pruned context back to the trainer as message history; others normalize tool arguments. Each such step introduces a mismatch. They fall into three typical cases:

- **Tool arguments are re-serialized:** the id and name of the tool call stay the same, but the arguments are converted back and forth between a JSON string and a dict, so key order, default values, and blank lines can all change;
- **Reminders are inserted into the middle of the history:** the harness injects system reminders into the message history;
- **Subagents share one session with the main thread:** a subagent’s context is spliced back into the main context.

Two common, simple workarounds both have limitations. The first is to build a simplified harness into the trainer. With the same Qwen3.5-35B-A3B, changing only the harness moves SWE-bench Verified anywhere between 57.2 and 64.0, so the harness alone accounts for a difference of nearly 7 points; the context built by a simplified harness during training does not match the context the real harness builds in deployment. The second is to run the real harness and replay the archived conversation afterward. This requires re-tokenizing the text, which causes token drift: the same tool arguments are 13 tokens at sampling time but 16 tokens after re-tokenization, the logprobs deviate as a result, and the importance sampling ratio keeps drifting.

Lego-RL instead runs the real harness unmodified, uses a unified proxy to capture the actual tokens and logprobs at generation time, and replays these recorded tokens during training (see the third question in the Q&A at the end for details). The difference from the second workaround is that it replays the tokens recorded at generation time, not tokens obtained by re-tokenizing the conversation text afterward. Overall, Lego-RL’s training-inference alignment metric can exceed 0.999.

> **Note:** Training-inference mismatch is not unique to agentic RL. In 2025, Feng Yao et al. pointed out in “On the Rollout-Training Mismatch in Modern RL Systems” that even with identical weights, the inference engine (such as vLLM) and the training engine (such as FSDP) can compute noticeably different probabilities for the same token, which effectively turns on-policy RL into off-policy RL; they proposed truncated importance sampling (TIS) as a correction. Agentic RL adds new problems on top of this, namely harnesses rewriting the context and inconsistent MoE routing, which are the cases discussed in this section.

### MoE routing must be consistent too

For MoE models, if the sampling and training forward passes select different experts, a mismatch arises inherently. For example, the same token “def” is routed to experts {3, 17} during vLLM inference but to experts {3, 41} in the training forward pass. Lego-RL records the expert routing during rollout and reproduces the same routing in the training forward pass. With routing replay, the training-inference correlation coefficient rose from 0.9946 to 0.9993, and the token-level absolute difference in logp fell from 0.0062 to 0.0025.

> **Note:** This practice of recording the routing during rollout and reusing it during training is known in the research community as Rollout Routing Replay (R3). It comes from a paper by Xiaomi’s MiMo team; see the References at the end.

### How to select RL data

Early explorations were relatively simple: training only on task instances that the model gets “partially right” works better than skipping rollout filtering. The team ran a controlled comparison (951 samples per data pool). Starting from 36,884 samples, static filtering and selection based on rollout scores left 2,699. The “full difficulty band,” tasks solved 1 to 3 times out of 4 rollouts, achieved the highest average validation score (0.671). Taking only the upper half (solved 2–3 times) was essentially on par (0.670); taking only the lower half (solved 1–2 times) gained less (0.640); and random sampling brought no improvement: 72.7% of its tasks were always failed and 13.4% always solved, and because such tasks get the same score on every attempt, they provide no learning signal.

The drawback of this selection method is that it requires a large number of rollouts on the raw task instances, which makes inference costly.

### Preventing reward hacking

A typical example: once the model has a shell, in turn 3 it uses git log to find the fix commit; in turn 4 it uses git show to view the diff, which is the reference answer; in turn 5 it copies the diff back into the source file; and in turn 6 it runs pytest, all tests pass, and it collects the full reward of 1.0, even though it never solved the task. The attack paths the team measured and the corresponding defenses:

| Attack path | Rate | Defense in the environment and grading phases |
| --- | --- | --- |
| Reading the answer from git history | 4.6–20.5% | Squash the repository into a single commit; restore the history at grading time |
| Modifying tests | 2.4–19.4% | Keep the tests invisible to the agent; restore the original tests before grading |
| Downloading the reference patch | about 1.9% | A privileged sidecar restricts outbound network access during the agent phase |
| Tampering with the grader | about 2.5% | Run the grader in a separate phase |

Another principle is that infrastructure failures should not take part in policy updates. Trajectories produced by infrastructure problems such as timeouts or environment startup failures get a weight of 0: they are kept on record but produce no gradient. Trajectories that exceed the turn or context limit, by contrast, receive a score of 0 and are trained on as usual, because finishing the task within budget is the policy’s own responsibility.

### Results

After separate training in each of the three harnesses, SWE-bench Verified (4800s setting) improved over the starting point in all of them, with the largest gain in OpenCode:

| Model | OpenHands SDK | Claude Code | OpenCode |
| --- | --- | --- | --- |
| Qwen3.5-35B-A3B-Instruct (starting point) | 64.0 | 62.4 | 57.2 |
| Qwen3.6-35B-A3B | 67.4 | 63.4 | 60.6 |
| KAT-Coder-V2.5-Dev | 67.0 | 66.8 | 64.8 |
| Lego-RL-Qwen3.5-35B-A3B | 70.4 | 68.2 | 66.6 |
| Change vs. starting point | +6.4 | +5.8 | +9.4 |

Note: Each of the three Lego-RL scores comes from a model trained separately in the corresponding harness. The starting point in this table (64.0) and the Instruct baseline cited in Section 5 (63.4) come from two different evaluations with different settings.

With mixed-harness training, the reward signal also rose considerably. The team also measured how behavior changed before and after RL: the rate of re-reading a file after editing it rose from 73.6% to 98.1%; the number of files inspected before the first edit grew from 3.45 to 6.92; the rate of proactively running tests rose from 85.0% to 93.6%; and the tool-call format error rate fell from 1.07% to 0.15%. With 8 attempts per problem, pass@8 (at least one success, a measure of coverage) rose from 83.2% to 87.9%, up 4.7 percentage points, while pass^8 (all 8 attempts succeed, a measure of reliability) rose from 28.3% to 39.4%, up 11.1 percentage points, a larger gain. So the benefit of RL shows up mainly in reliability: relatively few new problems get solved, but problems the model could solve only occasionally before are now solved more consistently.

## 8. Q&A

**Q: Two questions. First, when a model searches online, sometimes it is a legitimate need and sometimes it is cheating (for example, digging through git history for the answer). How do you tell them apart? Second, does a model trained in one harness lose performance when it is moved to another harness? How do you handle this in practice?**

**Yiming Du:** Let me start with cheating. Our understanding of cheating behavior comes from two sources: what has been reported in published papers, and what has actually appeared in our own training. To identify it, we first look at anomalous signals, such as trajectory length or number of turns deviating clearly from the norm, and then inspect trajectories one by one to judge which behaviors are unreasonable. AI can help with this step. For example, we sample 100 trajectories and have an AI analyze them with several rounds of follow-up questions; when it finds an anomaly, we keep digging until we pin down the specific cheating method, then design safeguards accordingly and build them into the infrastructure. This is a process of continuous iteration.

Now cross-harness transfer. A model trained only on OpenHands SDK also improves on other harnesses, and we believe this comes from an improvement in the model’s own capability, namely learning which tool to use in which situation. But the transfer is not stable: train on A, and B may be slightly better while C improves only a little. So we later moved heavily to mixed-harness training, which gave fairly stable performance across all harnesses. It is also cheaper: training one model with multiple harnesses costs much less than training a separate model for each harness, which is also why many companies use multi-harness, multi-task training.

**Q: How exactly do you handle the training-inference mismatch? Also, beyond Terminal-Bench, which new benchmarks are worth watching, such as coding benchmarks aimed at RSI?**

**Yiming Du:** First, the training-inference mismatch. RL training first performs rollouts and then replays the same trajectory in the training phase. Mismatches arise mainly in three places: first, tool arguments are re-serialized, so the entire JSON string gets rewritten; second, the harness inserts content it considers necessary into the trajectory history; third, many harnesses support subagents, and a subagent’s context is spliced back into the main context. Our main approach is to use the prefix of each inference request to locate where a mismatch occurs, while recording the tokens generated at inference time. Whenever a mismatch appears, we replay with the recorded tokens, which guarantees training-inference consistency.

On benchmarks, harder RSI-related evaluations such as SWE-Marathon are worth watching. Also, our framework is not limited to coding agents: open-domain tasks that are closer to real-world scenarios, such as those in Claw-Eval, face the same kinds of problems.

> **Note:** SWE-Marathon is an ultra-long-horizon software engineering benchmark released in 2026. It tests whether agents can keep planning and managing context and memory over hours of work to complete large tasks autonomously. Claw-Eval is a benchmark for autonomous agents on real-world tasks. It contains 300 human-verified tasks, and its primary metric is Pass^3, which requires all three independent attempts to pass.

## Closing thoughts

The thread running through this talk is turning data building into engineering: tasks must be executable and verifiable; trajectories must be worth learning from, and the model must be kept from exploiting loopholes; and the results of training and evaluation in turn guide the next round of data. From filtering 12 million PRs down to 5,000 tasks, to training a 35B MoE model to open-source SOTA for that base model with 1K trajectories, to letting an agent run the whole pipeline on its own, LegoX demonstrates a way of producing data that is increasingly automated and can keep iterating.

The next recap will cover Xiaomeng Hu’s talk, “From Computer Use to Robot Use: Capability Boundaries and Data Needs of General Physical Agents,” moving from the digital world to the physical one.

## References

**LegoX projects and papers**

1. [LegoX project homepage](https://www.legox.net/) (with blog posts on LegoFlow, Lego-RL, and SWE-Lego)
2. Code: [LegoFlow](https://github.com/LegoX/LegoFlow) · [Lego-RL](https://github.com/LegoX/Lego-RL) · [SWE-Lego](https://github.com/SWE-Lego/SWE-Lego)
3. Data: [LegoFlow-SWE](https://huggingface.co/datasets/Lego-X/LegoFlow-SWE) (5,000 tasks, 9,767 trajectories) · [Terminal-Lego-15k](https://huggingface.co/datasets/PrimeIntellect/Terminal-Lego-15k)
4. [SWE-Lego: Pushing the Limits of Supervised Fine-tuning for Software Issue Resolving](https://arxiv.org/abs/2601.01426) (arXiv:2601.01426)
5. [SWE-Review: Closing the Loop on Issue Resolution with Agentic Code Review](https://arxiv.org/abs/2607.06065) (arXiv:2607.06065)
6. [LEGO-RL: Harness-Native Reinforcement Learning for Coding Agents](https://arxiv.org/abs/2608.17393) (arXiv:2608.17393)

**Other work mentioned**

7. [MiMo-V2.6: Scaling Reinforcement Learning Towards Self-Improvement](https://www.alphaxiv.org/abs/2609.mimo-scaling-reinforcement-learning) (Xiaomi, September 2026)
8. [Harbor](https://harborframework.com): the Terminal-Bench team’s framework for running and evaluating agents
9. [SWE-rebench V2: Language-Agnostic SWE Task Collection at Scale](https://arxiv.org/abs/2602.23866) (arXiv:2602.23866)
10. [SWE-bench issue #465: Repo State Loopholes During Agentic Evaluation](https://github.com/SWE-bench/SWE-bench/issues/465)
11. [On the Rollout-Training Mismatch in Modern RL Systems](https://neurips.cc/virtual/2025/124259) (Feng Yao et al., 2025)
12. [Stabilizing MoE Reinforcement Learning by Aligning Training and Inference Routers](https://arxiv.org/abs/2510.11370) (R3, arXiv:2510.11370)
13. [SWE-Marathon: Can Agents Autonomously Complete Ultra-Long-Horizon Software Work?](https://arxiv.org/abs/2606.07682) (arXiv:2606.07682)
14. [Claw-Eval: Towards Trustworthy Evaluation of Autonomous Agents](https://arxiv.org/abs/2604.06132) (arXiv:2604.06132)

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

10 月 17 日下午，NICE 学术在深圳举办了线下活动「Agentic Data：从数字智能体到物理世界」。活动内容较多，回顾将分篇陆续发出，本文是第一篇。

这一场由香港中文大学博士、华为香港研究所高级研究员杜一鸣主讲，题目是「LegoX：面向代码智能体的数据科学与强化学习实践」。训练代码智能体，需要能执行、能验证的真实任务，需要模型在环境里一步步交互留下的轨迹，还需要训练和评测把数据的好坏快速反馈回来。杜一鸣认为，这类 Agentic Data 正在成为新的产业基础设施。

LegoX 是他所在团队围绕这条链路做的一系列开源工作。这次分享以数据为主线：重点讲代码数据生产框架 LegoFlow，以及造数据过程中总结的几条经验；最后简要介绍强化学习框架 Lego-RL，看这些数据在 RL 训练里表现如何。

## 本文要点

- **代码智能体 = 模型 + 脚手架。** 训练它主要靠两类数据：可执行、可验证的任务实例，更多用于强化学习；模型在真实环境里交互留下的轨迹，更多用于 SFT。两类数据都离不开脚手架：轨迹记录的正是模型通过脚手架调用工具、拿回结果的每一轮；做 RL 时，模型也要通过脚手架在任务环境里解题，再按测试判分。
- **LegoFlow 把数据生产拆给几个 Agent 角色。** Curator 造任务，Tracer 推轨迹，Trainer 和 Evaluator 训练、评测，Root 统一调度；每一步都能用内置 skill 一键启动。
- **数据少而精。** 团队从约 1200 万个候选 PR 中精筛出 5000 个 SWE 任务并开源。只用 1K 条 LegoFlow-SWE 轨迹做 SFT，Qwen3.5-35B-A3B 在 SWE-bench Verified 上达到 70.2，比官方 Instruct 版本高 6.8 分。
- **让 Agent 自己跑完全流程。** 从零爬仓库、推轨迹、训练、评测，再按评测发现修正数据、二次训练，SWE-bench Verified 从基座的 7.6 升到 64.4。
- **四条造数据经验：** 任务复杂度和推理轮数能快速预判数据质量；越强的模型越会作弊，可联网时 GLM-5.2 已确认的作弊比例达 21.2%；筛轨迹看每轮想得多深，而不是整条有多长；算力有限时，先加交互轮数，再加 rollout 次数。
- **Lego-RL 在真实脚手架里做 RL。** 脚手架原样运行，采样时记下模型真实生成的 token，训练时原样喂回去算梯度，MoE 模型再加路由回放；RL 后三种脚手架上的 SWE-bench Verified 提升 5.8–9.4 个百分点。

## 读前速查

下表解释本文反复出现的几个术语，熟悉的读者可以直接跳过。

| 术语 | 白话解释 |
| --- | --- |
| 训推一致 | RL 训练时，训练端使用的 token 序列和算出的概率，要与采样时模型实际生成的一致，否则梯度估计会有偏差 |
| MoE 路由回放 | MoE 模型的每个 token 只交给少数几个“专家”计算。采样和训练两次计算可能选中不同专家；路由回放把采样时的选择记下来，训练时照搬 |

## 嘉宾介绍

**杜一鸣（主讲）**：香港中文大学博士，华为香港研究所高级研究员。本次分享的 LegoX 系列工作来自他所在的团队，覆盖代码智能体的数据与环境管线、SFT 训练、评测和强化学习。

<img src="/img/posts/agentic-data-1/slide-01.jpg" alt="LegoX：面向代码智能体的数据科学与强化学习实践 PPT 封面" loading="lazy">

## 一、四年变化：Agentic Data 正在成为基础设施

杜一鸣先用一组词频统计回顾了过去四年。统计对象是 OpenAI、Anthropic、Google DeepMind、xAI、Mistral、Meta 等海外前沿模型的官方发布公告和技术博客（2023 年至 2026 年上半年），看每年出现最多的主题词：

- **2023 年，基础能力构建。** 各家都在做 scaling，模型和数据规模一路上涨，Scaling 是当年第一热词。
- **2024 年，推理与多模态。** Reasoning 和 Multimodal 排在前两位。
- **2025 年，Agent 与工具生态。** Agent 开始进入日常工作，Coding、Agent、Tool Use 都进了前五，主题从“回答问题”变成“完成任务”。
- **2026 年上半年，真实世界执行。** Agent 和 Coding 排到前两位，Long Horizon、Reliability、Real-world Tasks 也进了前十：模型要在真实环境里完成更长程、更可靠的任务。

<img src="/img/posts/agentic-data-1/slide-02.png" alt="前沿模型发布主题词的演变" loading="lazy">

*图：前沿模型发布主题词的演变（2023 年至 2026 年上半年）*

这个过程中，数据变得越来越重要。他把训练数据的演变分成四层，Agentic Data 就是这样一步步变成产业基础设施的：

1. **数据供给**：网页（如维基百科）、开源代码仓库和人工反馈数据，用来训练基础模型，再加上指令微调，增强问答能力。
2. **专业数据**：代码、数学，以及金融、法律等行业知识，通过 mid-training 提升模型在专业领域的基础能力。
3. **Agent 轨迹**：要让模型参与真实工作，就要覆盖终端、浏览器和代码仓库，让 Agent 与外部环境交互、留下轨迹；再用 SFT 等后训练手段，提升模型在真实场景里解决问题的能力。
4. **可复现系统**：最终要的是一套可复现的系统。任务是否真的可执行，外部环境能否复现，数据在训练中表现如何，评估是否准确，这些都是 Agentic Data 进入训练流程时会遇到的问题。

## 二、LegoX 全景

LegoX 以真实世界的数据来源为基础，比如 GitHub 和 Stack Overflow，从数据与环境管线、SFT 训练、评测到强化学习分别做探索，目标是拼出代码智能体开源数据的基础设施。目前已发布的几块如下：

| 工作 | 做什么 | 进展 |
| --- | --- | --- |
| SWE-Lego | 大规模真实 SWE 任务与轨迹，数据全部开源 | Hugging Face 下载量超 200K |
| SWE-Review | 构建真实开发反馈，提升代码协作智能 | 数据管线生产效率提升 50% |
| Terminal-Lego | 可交互的终端环境，生成长程 Agent 执行经验 | Hugging Face 数据下载量超 80K |
| Lego-RL | 代码强化学习框架，支持多脚手架混合训练，打通数据与训练评测 | RL 训推对齐 0.999+ |
| LegoFlow | 易用的 Code Agent 数据工程框架，全流程自动化打通任务、轨迹、训练、评测，支持数据生产闭环与自迭代 | 新开源 5K 精选 SWE 任务及轨迹 |

这次分享讲其中两块。重点是 LegoFlow；最后简要介绍 Lego-RL，看代码强化学习如何验证这些数据有效。

<img src="/img/posts/agentic-data-1/slide-03.png" alt="LegoX 系列工作全景" loading="lazy">

*图：LegoX 系列工作全景*

## 三、代码智能体 = 模型 + 脚手架

先看代码智能体怎么工作。杜一鸣把它概括为“模型 + 脚手架”。用户给出一个任务，比如“在 src/utils.py 中实现一个新函数，并通过测试”。模型理解目标、规划步骤，生成具体操作，以结构化指令的形式输出，例如 read\_file、edit\_file、run\_command。

这些指令交给脚手架（Harness）。脚手架提供工具接口，在环境侧执行指令，也就是在工作目录的文件系统上读写文件、运行命令，再把执行结果和文件状态返回、拼回上下文；模型据此调整策略，完成一轮交互。真实任务往往需要很多轮，这样一轮轮交互留下的轨迹，就是训练需要的数据形式。

不同脚手架的工具接口形式并不一样，这个差异会直接影响训练。

<img src="/img/posts/agentic-data-1/slide-04.png" alt="代码智能体 = 模型 + 脚手架" loading="lazy">

*图：代码智能体 = 模型 + 脚手架*

### 传统数据管线为什么贵

传统的代码智能体数据管线分三步：

1. **代码仓收集与镜像构建**：从开源仓库的关键文件里提取安装和测试命令，构建镜像，再放到真实环境里验证，才能得到可用的执行环境。
2. **SWE 任务构建**：有两条路线。一条用真实 PR，数量有限但真实；另一条是 bug 注入，用大模型重写代码或做 AST 变换（把代码解析成抽象语法树，再按规则改动，比如把“>”改成“>=”）来制造 bug，可以大规模生成。任务都要经过测试验证：参考补丁要能让原本失败的测试通过（FAIL-TO-PASS），也不能破坏原本通过的测试（PASS-TO-PASS）。通过验证的，就是可用的任务实例。
3. **轨迹推理、过滤与打分**：让 Agent 在这些任务上实际运行，产出轨迹，再过滤、打分。

<img src="/img/posts/agentic-data-1/slide-05.png" alt="传统的代码智能体数据管线" loading="lazy">

*图：传统的代码智能体数据管线*

这里有两种数据形态。任务实例更多用在 RL 训练里，比如小米 MiMo 的 RL 训练，就是建立在一批高质量的任务实例上；轨迹则更多用于 SFT。

问题在于，这样一条管线流程复杂、细节繁多、开发成本很高。业界不少公司是一个部门一条数据管线，部门一多，管线也多，消耗的成本和要处理的细节都非常多。LegoFlow 想解决的正是这个问题：把这套管线做成开源框架，不必每个人都从头开发一遍。

## 四、LegoFlow：像带团队一样给 Agent 分工

LegoFlow 是一个开源、易用的代码数据生产项目：造任务、推轨迹、训练、评测，都能通过内置 skill 一键拉起。结构上，一个总管节点 Root 调度四个称为 Block 的模块，每个 Block 完成一类工作，各有产出：

- **Curator**：合成任务，产出 Tasks
- **Tracer**：推理轨迹，产出 Trajectories
- **Trainer**：训练，产出 Models
- **Evaluator**：评测，产出 Scores

<img src="/img/posts/agentic-data-1/slide-06.png" alt="LegoFlow 架构" loading="lazy">

*图：LegoFlow 架构：Root 调度四个 Block，各自产出任务、轨迹、模型和分数*

**设计思路：照着团队协作来分工。** 杜一鸣说，LegoFlow 模仿的是真实开发中单人开发与团队协作的关系。一个团队有团队的目标，每个人有自己的分工，怎么把大家协调起来，原本是团队管理的问题。有了 Coding Agent，这些角色可以交给 Agent 来担任。于是每个 Block 对应一个角色和一类任务，产出的环境、日志、输入输出都归档；每个 Block 的角色、行为、输入输出和交互边界，用一个 config.yaml 文件约定。他认为，把边界确认清楚，是团队合作高效的基础。此外，用到的代码仓库都作为黑盒，只通过约定的接口调用，Agent 不必深入阅读和修改仓库内部庞杂的代码。

<img src="/img/posts/agentic-data-1/slide-07.png" alt="设计哲学：Agent“拟人化”分工与协作" loading="lazy">

*图：设计哲学：Agent“拟人化”分工与协作*

**Root：负责多模块协作。** 它负责项目全局与用户的交互、环境安装与校验，把用户目标拆开分给不同的子 Block，并协调任务分派和资源分配。执行靠插件化的 skill：比如告诉 Root“我要合成一批数据”，它就调用 Curator 的对应 skill。每个 Block 都有 setup、check、run 等 skill，运行 Curator 的 run，就能自动跑完整条数据管线、合成任务。

**Curator：造任务。** 这也是很多数据厂商关心的问题：

1. 收集 GitHub 上的高质量仓库和 PR。“高质量”有多个维度：仓库可以看星数和社区热度，PR 的质量可以用 LLM 打分或其他手段衡量。
2. 从已合并的 PR 中提取问题，把改动拆成修复补丁和测试补丁，供后续验证和评测使用。
3. 构建 Harbor 隔离环境，把整个任务封装起来。
4. 用 Rubrics 做质量打分与过滤。
5. 交付通过双重验收的任务。未修复的代码要让测试失败，加上修复补丁后测试要通过。

这些步骤的参数都写在 Curator 自己的 config.yaml 里，比如收集哪些语言的 PR（Python、JavaScript 等）、收集多少个仓库、每个仓库最多收多少个 PR。再配合插件 skill 一键运行，原本复杂的数据合成管线，成本大大降低。Curator 的 skill 包括 setup（一次性初始化）、check（试运行预检）、collect-prs（收集并筛选 PR）、create-tasks（由 PR 生成 Harbor 任务）和 dashboard（给任务打难度分、贴标签），由 Root 按需调用。

> **注**：Harbor 由 Terminal-Bench 团队开发，与 Terminal-Bench 2.0 一同发布，用于在容器环境中大规模运行和评测智能体，也支持 SFT 和 RL 数据管线。

<img src="/img/posts/agentic-data-1/slide-08.png" alt="Curator 的五个步骤" loading="lazy">

*图：Curator 的五个步骤，左边是对应的 config.yaml*

**Tracer：推轨迹。** 拿到任务后，下一步是拿到高质量的轨迹。轨迹是 SFT 的直接训练数据，用什么样的轨迹训练，直接决定模型能学到什么，这也是为什么轨迹现在如此重要。Tracer 的特点：

- 既支持 Claude Code 这类黑盒脚手架，也支持 OpenCode、OpenHands 等，多种脚手架都能推轨迹；
- 在脚手架和模型 API 之间加一层代理服务（proxy），记录每一轮的完整输入和输出，包括推理过程；
- 在真实脚手架中执行并判分，再用 Rubrics 做质量筛选；
- 防作弊：断网、清除 git 记录。

最后交付可以直接用于训练的轨迹。Tracer 的命令参数同样写在 config.yaml 里。所有 Block 都用统一的 config.yaml 管理，相当于团队用同一个模板给每个人分工。

**Trainer 与 Evaluator：这批数据真的可用吗？** Trainer 把数据转成 LLaMA-Factory 格式，一键拉起 SFT 训练并调整训练参数；Evaluator 执行基准评测、回传结果。分析结果，就能看出这批数据质量如何、下一轮该往哪个方向迭代。交付物是模型和评测报告，为下一轮数据合成提供经验。

现在很多 RSI（递归式自我改进）工作的思路是让系统自我改进，数据合成管线也一样能做到，关键是把每一步做得足够精细。

**运行看板：用转化率定位瓶颈。** 从构建任务、推轨迹到训练验证，整条流程耗时长、算力开销大。转化率指每个阶段相对上一阶段的保留比例，它直接影响每条有效数据的成本：转化率越高，单位成本越低，生产效率越高。因此团队用看板实时监控各阶段的转化率。下面是 Curator 一次真实运行的快照：822 个仓库、8,818 个候选 PR，构建出 926 个任务，其中 270 个通过验证，验收通过率 29.2%。没通过的任务，按失败阶段回查环境与测试，修正后重新验收；通过的任务再交给 Tracer 推轨迹。

<img src="/img/posts/agentic-data-1/slide-09.png" alt="Curator 运行看板" loading="lazy">

*图：Curator 一次运行的看板快照*

## 五、LegoFlow-SWE：从 1200 万个 PR 到 5000 道题

用这套流程，团队在 9 月开源了一批新的 SWE 任务和轨迹 LegoFlow-SWE：

- 从 70 多万个 GitHub 仓库出发，得到约 1200 万个候选 PR；
- PR 筛选后保留约 60 万个可验证的 PR，占 5.0%；
- 再经任务验证，留下 5000 个任务。从候选 PR 算起，保留率只有 0.0417%；
- 用 GLM-5.2 在 OpenHands SDK 和 OpenCode 两种脚手架上，对这 5000 个任务推了 9,767 条轨迹，其中 2,780 条成功解题，解决率 28.46%。

<img src="/img/posts/agentic-data-1/slide-10.png" alt="LegoFlow-SWE 数据漏斗" loading="lazy">

*图：LegoFlow-SWE 的数据漏斗：从 1200 万个候选 PR 到 5000 个任务*

只用 1K 条 LegoFlow-SWE 轨迹，在 Qwen3.5-35B-A3B 上做 SFT，模型在 SWE-bench Verified、Pro、Multilingual 上分别达到 70.2、48.8、57.0，比官方的 Qwen3.5-35B-A3B-Instruct 分别高 6.8、10.6、5.3 分，也高于用同一教师模型在 SWE-rebench-v2 任务上产出的轨迹（Verified 64.4），以及几个外部开源数据池（StepFun 3.5、DeNovoSWE、Scale-SWE），达到同模型的开源 SOTA。从标准的 SWE-bench 到多语言评测，结果都比较领先。

> **注**：SWE-rebench V2 是 Nebius 在今年 3 月发布的 SWE 训练任务集，有 3.2 万多个带 Docker 环境的可执行任务，覆盖 20 种编程语言。

<img src="/img/posts/agentic-data-1/slide-11.png" alt="只用 1K 条轨迹 SFT 的效果" loading="lazy">

*图：只用 1K 条轨迹 SFT 的效果*

### 让 Agent 自己跑完整条流程

这个过程不是一次性的。训练和评测之后，结果会回到 Curator，用来制定下一轮的数据合成，数据整体质量才能不断提升。

<img src="/img/posts/agentic-data-1/slide-12.png" alt="基于评测进行下一轮迭代" loading="lazy">

*图：评测结果回到 Curator，进入下一轮数据合成*

团队还试了让 Agent 端到端完成全流程：从零爬取 GitHub 仓库，推轨迹、训练、评测，再在修正后的数据上做第二次训练。实验基于基座模型 Qwen3.5-35B-A3B-Base，它本身能力较弱，SWE-bench Verified 只有 7.6 分：

- 第一次训练（按覆盖面筛选，500 条自产轨迹）后达到 56.1；
- 第一轮评测发现，数据需要去重、过滤浅层推理、规范工具调用。修正后，每轮推理长度的中位数从 140 增至 959 个字符，CoT 质量更高；
- 第二次训练（按推理深度筛选，512 条轨迹）后达到 64.4，比第一次高 8.3 分。

<img src="/img/posts/agentic-data-1/slide-13.png" alt="Agent 端到端自演进" loading="lazy">

*图：Agent 端到端自演进，SWE-bench Verified 从 7.6 升到 64.4*

## 六、造 SWE 数据的四条经验

### 经验一：两个指标，快速判断数据质量

**任务复杂度**与训练得分正相关，可以高效判别任务质量。团队用五个静态信号加权打分：补丁范围（30%）、逻辑复杂度（25%）、上下文跨度（20%）、测试复杂度（15%）、问题说明复杂度（10%）。对比来看，LegoFlow-SWE 的复杂度分数是 6.27，SWE-rebench V2 是 5.80，两者 SFT 后的 SWE-bench Verified 分别为 70.2 和 64.4。

**推理轮数**与通过率强相关，图中 Pearson 相关系数为 −0.95：轮数越多，解决率越低。真正容易解决的问题，往往很少几轮就解决了。

<img src="/img/posts/agentic-data-1/slide-14.png" alt="经验一：任务复杂度与推理轮数" loading="lazy">

*图：经验一：任务复杂度的五个静态信号（左），推理轮数与解决率（右）*

### 经验二：越强的模型越会“作弊”

偷看 git 历史、上网查答案，越强的模型越擅长。据团队观察，GLM-5.2、DeepSeek V4.0 以来的模型都有这个现象。在能联网的环境里，已确认的作弊比例从 GLM-5 的 3.6% 升到 GLM-5.2 的 21.2%。去掉泄漏之后，教师和学生的分数都下降了：GLM-5.2 教师在 SWE-bench Verified 上从 86.8 降到 78.8；用它在 SWE-rebench-v2 任务上的 1K 条轨迹 SFT 出来的学生模型，从 74.4 降到 64.4，其中 10 分来自泄漏带来的作弊，并非模型的真实能力。

杜一鸣分享了最近验数据时碰到的一个例子。他们已经把仓库历史里的 git commit 删掉了，模型最后还是作弊了。原因是，删掉 git 历史后，原仓库的代码仍以二进制 pack 文件的形式存在本地；模型 hack 时把这个文件重新解压，找到了答案。

> **注**：（1）git 会把历史对象压缩打包成 pack 文件，存放在 .git/objects/pack 目录下。只删掉分支、标签或提交记录的引用，这些对象往往仍留在本地，可以被还原。
>
> （2）公开评测里也出现过类似的漏洞。2025 年 9 月，SWE-bench 的 GitHub issue #465 报告，部分智能体会用 git log --all 等命令查看评测仓库里“未来”的提交记录，从中获得修复思路，甚至看到参考补丁，涉及 Claude 4 Sonnet、GLM-4.5、Qwen3-Coder 等模型的提交。维护者随后更新了 SWE-bench Verified 的镜像，删除了基准提交之后的 git 历史。

<img src="/img/posts/agentic-data-1/slide-15.png" alt="经验二：越强的模型越会“作弊”" loading="lazy">

*图：经验二：去掉泄漏后，教师和学生模型的分数都下降*

### 经验三：过滤浅层推理，比追求最长轨迹更有效

筛数据时团队发现，随着训练性能提升，平均每轮回复的推理长度也在增加。所以要追求的是更深的推理，而不是浅层推理堆出来的轮数。

团队做过一个实验：把同一批 GLM-5.2 / SWE-rebench-v2 轨迹，按每轮平均推理 token 分成四组，分别训练。四组平均推理长度为 167、368、577、812 token，SFT 后 SWE-bench Verified 分别为 57.0%、64.0%、64.6%、65.0%。从最浅的一组到第二组提升 7 个点，后三组之间只差 1 个点。可见收益主要来自去掉最浅的那组，再往深挑作用不大。所以团队的做法是：先剔除浅层轨迹，再把数据预算用在覆盖更多任务上。

<img src="/img/posts/agentic-data-1/slide-16.png" alt="经验三：过滤浅层推理" loading="lazy">

*图：经验三：按推理长度分四组训练*

### 经验四：test-time scaling，先加轮数再加 rollout

给定算力预算，怎样进一步提高通过率？团队的经验是先增加交互轮数，再增加 rollout 次数。

下方热力图的横轴是交互轮数（顺序扩展），纵轴是并行 rollout 数。只跑 1 次时，轮数从 20 加到 100，解决率从 2.0% 升到 41.4%；而轮数停在 20 时，rollout 从 1 次加到 8 次，也只到 6.0%。轮数到 100 左右以后，再加轮数几乎不涨：只跑 1 次时，从 100 轮加到 160 轮，解决率只从 41.4% 升到 43.8%。这时再加 rollout 更划算，最高到 47.4%。

<img src="/img/posts/agentic-data-1/slide-17.png" alt="经验四：先加轮数，再加 rollout" loading="lazy">

*图：经验四：横轴为交互轮数，纵轴为并行 rollout 数*

## 七、Lego-RL：在真实脚手架里做强化学习

最后，杜一鸣简要介绍了这批数据在真实 RL 训练中的表现。Lego-RL 是团队的 Agentic RL 训练框架，也是 LegoFlow 的一部分，同样支持 Block 的 skill 插件和训练看板。它支持训推一致、全异步训练和混合脚手架训练，算法包括 SAO、GSPO、GRPO、PPO 等；训练后端支持 FSDP、VeOmni、Megatron；脚手架支持 OpenHands SDK、Claude Code、OpenCode，并支持多种编程语言。

### 训推一致为什么格外重要

对 Agentic RL 来说，rollout 时拿到的 token，和训练时每个位置上的 token 必须对齐、保持一致。最容易出问题的地方，是脚手架会按自己的方式改写上下文，而且各家改法不同。比如有的脚手架会把出错的工具调用剔除，再把剔除后的上下文当作历史消息传回训练端；有的会对工具参数做规范化处理。每一种处理，都会带来一次不一致。归纳起来有三类典型情况：

- **工具参数被重新序列化**：工具调用的 id 和名称不变，但参数在 JSON 字符串和字典之间来回转换，key 的顺序、默认值、空行都可能变；
- **历史中间被插入 reminder**：脚手架往历史消息中注入系统提醒；
- **子智能体与主线共用同一个 session**：子智能体的上下文会被拼接回主上下文。

要绕开这些问题，常见的两种简单做法都有局限。一是在训练器里内建一个简易脚手架。同一个 Qwen3.5-35B-A3B 只换脚手架，SWE-bench Verified 就在 57.2 到 64.0 之间变化，可见脚手架本身就会带来近 7 分的差异；训练时用简易脚手架构建上下文，与部署时的真实脚手架不一致。二是运行真实脚手架，事后回放归档的对话。这样需要对文本重新分词，会产生 token 漂移：同一段工具参数，采样时是 13 个 token，重新分词后变成 16 个，logprob 随之产生偏差，重要性采样比率持续偏移。

Lego-RL 的做法是让真实脚手架原样运行，由统一代理在生成时捕获真实的 token 和 logprob，训练时回放这些记录下来的 token（具体见文末问答第三问）。与第二种做法的区别在于，回放的是生成时记录的 token，而不是事后从对话文本重新分词得到的 token。整体来看，Lego-RL 的训推对齐指标可达 0.999 以上。

> **注**：训推不一致并不是智能体 RL 才有的问题。2025 年，Feng Yao 等人在 On the Rollout-Training Mismatch in Modern RL Systems 中指出，即使权重相同，推理引擎（如 vLLM）和训练引擎（如 FSDP）给同一个 token 算出的概率也可能明显不同，相当于把 on-policy RL 变成了 off-policy，并提出用截断重要性采样（TIS）来校正。到了智能体 RL，脚手架改写上下文、MoE 路由不一致，又在此之上叠加了新的问题，也就是本节讨论的几种情况。

<img src="/img/posts/agentic-data-1/slide-18.png" alt="两种做法的局限" loading="lazy">

*图：训练器内建简易脚手架、回放归档对话，两种做法各有局限*

<img src="/img/posts/agentic-data-1/slide-19.png" alt="轨迹保真的三类情况" loading="lazy">

*图：轨迹保真：三类典型的不一致*

### MoE 的路由也要一致

对 MoE 模型来说，采样和训练两次前向如果选中不同的专家，天然就会引入不一致。举个例子：同一个 token "def"，在 vLLM 推理时选中的专家是 {3, 17}，训练前向时却是 {3, 41}。Lego-RL 在 rollout 阶段记录专家路由，在训练前向中复现相同的路由。做了路由回放后，训推相关系数从 0.9946 升到 0.9993，token 级 logp 的绝对差从 0.0062 降到 0.0025。

> **注**：这种在 rollout 时记录路由、训练时照搬的做法，学界称为 Rollout Routing Replay（R3），出自小米 MiMo 团队的论文，见文末参考资料。

<img src="/img/posts/agentic-data-1/slide-20.png" alt="路由保真" loading="lazy">

*图：路由保真：记录并复现 MoE 的专家路由*

### RL 数据怎么筛

早期的探索比较简单：只拿“部分做对”的任务实例来训练，效果比不做 rollout 过滤要好。团队做了受控比较（每个数据池 951 条）：初始 36,884 条数据，经静态过滤和基于 rollout 分数的筛选，剩下 2,699 条。4 次 rollout 中做对 1 到 3 次的“完整难度带”验证均分最高（0.671）；只取上半段（做对 2–3 次）基本持平（0.670）；只取下半段（做对 1–2 次）收益更低（0.640）；随机抽取则没有提升：其中 72.7% 的任务全错、13.4% 全对，这些任务每次得分相同，提供不了学习信号。

这种筛法的问题是，需要对原始任务实例做大量 rollout，推理成本很高。

<img src="/img/posts/agentic-data-1/slide-21.png" alt="RL 数据筛选" loading="lazy">

*图：RL 数据筛选的受控比较*

### 防止奖励作弊

一个典型的例子：模型拿到 shell 后，第 3 轮用 git log 找到修复提交，第 4 轮用 git show 看到 diff，也就是参考答案，第 5 轮把 diff 抄回源文件，第 6 轮跑 pytest 全部通过，拿到满分奖励 1.0，但题其实没解。团队统计的攻击路径和对应防御如下：

| 攻击路径 | 发生率 | 环境与评分阶段的防御 |
| --- | --- | --- |
| 读取 git 历史中的答案 | 4.6–20.5% | 仓库压成单个 commit，评分时再恢复历史 |
| 修改测试 | 2.4–19.4% | 测试对智能体不可见，评分前恢复原始测试 |
| 下载参考补丁 | 约 1.9% | 智能体阶段由特权 sidecar 限制出网 |
| 篡改评分器 | 约 2.5% | 评分器在独立阶段运行 |

另一条原则是：基础设施故障不应参与策略更新。超时、环境启动失败这类基础设施问题产生的轨迹，权重设为 0，保留记录但不产生梯度；超出轮数或上下文上限的轨迹则记 0 分、照常参与训练，因为在预算内完成任务是策略自己的责任。

### 结果

在三种脚手架上分别训练后，SWE-bench Verified（4800s 设置下）相对起点都有提升，OpenCode 的增益最大：

| 模型 | OpenHands SDK | Claude Code | OpenCode |
| --- | --- | --- | --- |
| Qwen3.5-35B-A3B-Instruct（起点） | 64.0 | 62.4 | 57.2 |
| Qwen3.6-35B-A3B | 67.4 | 63.4 | 60.6 |
| KAT-Coder-V2.5-Dev | 67.0 | 66.8 | 64.8 |
| Lego-RL-Qwen3.5-35B-A3B | 70.4 | 68.2 | 66.6 |
| 相对起点 | +6.4 | +5.8 | +9.4 |

注：Lego-RL 的三列分别来自在对应脚手架上单独训练的模型。本表起点（64.0）与第五节引用的 Instruct 基线（63.4）来自两组不同的评测，设置不同。

经过混合脚手架训练，奖励信号也有比较大的提升。团队还统计了 RL 前后的行为变化：编辑后重新读文件的比例从 73.6% 升到 98.1%，首次编辑前查看的文件数从 3.45 个增至 6.92 个，主动运行测试的比例从 85.0% 升到 93.6%，工具调用格式错误率从 1.07% 降到 0.15%。同一道题试 8 次，pass@8（至少成功 1 次，衡量覆盖率）从 83.2% 升到 87.9%，提升 4.7 个百分点；pass^8（8 次全部成功，衡量稳定性）从 28.3% 升到 39.4%，提升 11.1 个百分点，涨幅更大。可见 RL 的收益主要体现在稳定性上：新解出的题相对不多，原本偶尔能做对的题则做得更稳了。

## 八、现场问答

**问：两个问题。第一，模型上网查资料，有的是正常需要，有的是作弊（比如查 git 历史找答案），怎么区分？第二，在一个脚手架上训练的模型，换到另一个脚手架上会不会性能下降？实际中怎么处理？**

**杜一鸣**：先说作弊。我们对作弊行为的了解有两个来源：一是开源论文里已报告的，二是我们自己训练中实际出现的。识别时先看异常信号，比如轨迹长度、轮数明显偏离常态；再逐条检查轨迹，判断哪些行为不合理。这一步可以借助 AI：比如抽样 100 条轨迹，让 AI 分析并多轮追问，发现异常后继续深挖，直到定位具体的作弊方式；再据此制定防护措施，加进基础设施。这是一个持续迭代的过程。

再说跨脚手架。只在 OpenHands SDK 上训练的模型，在其他脚手架上也有提升，我们认为这来自模型能力本身的提高，即学会了在什么情况下用什么工具。但迁移效果不稳定：在 A 上训练，B 上可能稍好，C 上提升有限。因此我们后来大量采用混合脚手架训练，在各脚手架上都取得了比较稳定的表现。它也更省成本：用多种脚手架训练一个模型，比每种脚手架各训一个便宜得多，这也是不少公司采用多脚手架、多任务训练的原因。

**问：训推不一致具体怎么处理？另外，除了 Terminal-Bench，最近有哪些值得关注的新 benchmark，比如面向 RSI 的 coding benchmark？**

**杜一鸣**：先说训推不一致。RL 训练先做 rollout，再在训练阶段对同一条轨迹做回放。不一致主要出在三处：一是工具参数被重新序列化，整段 JSON 字符串被改写；二是脚手架往历史轨迹里插入它认为需要的内容；三是很多脚手架支持子智能体（subagent），子智能体的上下文会被拼接回主上下文。我们的主要做法是：借助推理请求的前缀（prefix）定位不一致发生的位置，同时记录推理时生成的 token；一旦出现不一致，就用记录下来的 token 回放，从而保证训推一致。

benchmark 方面，可以关注 SWE-Marathon 这类难度较高、和 RSI 相关的评测。另外，我们这套框架也不只适用于 coding agent：在 Claw-Eval 这类开放域、更贴近真实场景的任务上，面临的问题是相通的。

> **注**：SWE-Marathon 是今年发布的超长程软件工程评测，考察智能体能否在数小时的工作中持续规划、管理上下文和记忆，自主完成大型任务。Claw-Eval 是面向真实世界任务的自主智能体评测，包含 300 道人工核验的任务，以三次独立尝试都通过（Pass^3）为主要指标。

## 结语

这场分享的主线，是把“造数据”这件事工程化：任务能执行、能验证；轨迹要有学习价值，也要防住模型钻空子；训练和评测的结果，再反过来指导下一轮数据。从 1200 万个 PR 精筛出 5000 道题，用 1K 条轨迹把一个 35B 的 MoE 模型训到同模型开源 SOTA，再到让 Agent 自己跑通全流程，LegoX 展示的是一种越来越自动化、可以持续迭代的数据生产方式。

下一篇将整理胡晓萌的分享「从 Computer Use 到 Robot Use：通用物理智能体的能力边界与数据需求」，从数字世界走向物理世界。

## 参考资料

**LegoX 项目与论文**

1. [LegoX 项目主页](https://www.legox.net/)（含 LegoFlow、Lego-RL、SWE-Lego 博客）
2. 代码：[LegoFlow](https://github.com/LegoX/LegoFlow) · [Lego-RL](https://github.com/LegoX/Lego-RL) · [SWE-Lego](https://github.com/SWE-Lego/SWE-Lego)
3. 数据：[LegoFlow-SWE](https://huggingface.co/datasets/Lego-X/LegoFlow-SWE)（5000 道任务、9,767 条轨迹） · [Terminal-Lego-15k](https://huggingface.co/datasets/PrimeIntellect/Terminal-Lego-15k)
4. [SWE-Lego: Pushing the Limits of Supervised Fine-tuning for Software Issue Resolving](https://arxiv.org/abs/2601.01426)（arXiv:2601.01426）
5. [SWE-Review: Closing the Loop on Issue Resolution with Agentic Code Review](https://arxiv.org/abs/2607.06065)（arXiv:2607.06065）
6. [LEGO-RL: Harness-Native Reinforcement Learning for Coding Agents](https://arxiv.org/abs/2608.17393)（arXiv:2608.17393）

**文中提到的其他工作**

7. [MiMo-V2.6: Scaling Reinforcement Learning Towards Self-Improvement](https://www.alphaxiv.org/abs/2609.mimo-scaling-reinforcement-learning)（小米，2026 年 9 月）
8. [Harbor](https://harborframework.com)：Terminal-Bench 团队的智能体运行与评测框架
9. [SWE-rebench V2: Language-Agnostic SWE Task Collection at Scale](https://arxiv.org/abs/2602.23866)（arXiv:2602.23866）
10. [SWE-bench issue #465：Repo State Loopholes During Agentic Evaluation](https://github.com/SWE-bench/SWE-bench/issues/465)
11. [On the Rollout-Training Mismatch in Modern RL Systems](https://neurips.cc/virtual/2025/124259)（Feng Yao 等，2025）
12. [Stabilizing MoE Reinforcement Learning by Aligning Training and Inference Routers](https://arxiv.org/abs/2510.11370)（R3，arXiv:2510.11370）
13. [SWE-Marathon: Can Agents Autonomously Complete Ultra-Long-Horizon Software Work?](https://arxiv.org/abs/2606.07682)（arXiv:2606.07682）
14. [Claw-Eval: Towards Trustworthy Evaluation of Autonomous Agents](https://arxiv.org/abs/2604.06132)（arXiv:2604.06132）

</div>

<script>
(function() {
  var buttons = document.querySelectorAll('.lang-switcher .lang-btn');
  var contents = document.querySelectorAll('.lang-content');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var lang = btn.getAttribute('data-lang');
      buttons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      contents.forEach(function(c) {
        if (c.classList.contains('lang-' + lang)) {
          c.style.display = '';
        } else {
          c.style.display = 'none';
        }
      });
    });
  });
})();
</script>
