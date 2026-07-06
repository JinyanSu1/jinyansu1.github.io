---
layout: post
title: "The Evolution of Agents: From Context Engineering to Long-running Harnesses / Agent 从 Context Engineering 到 Long-running Harness 的演变过程"
date: '2026-07-05 17:50:00 -0700'
categories: technical
tags:
- agents
- context-engineering
- harness
- evals
- anthropic
excerpt: 'From LLM + tool use to context engineering, and then to long-running agent harnesses: agent capability is becoming a system property composed of the model, harness, context, tools, evals, sandbox, and state management.'
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

Important Note: Although I try to keep academic/technical blog posts serious, I still cannot help inserting some completely unrelated things while writing. To avoid polluting the context, I will use the `/btw` command to separate them from the technical parts. Readers can skip these "by the way" sections.

Over the past few years, the main thread of progress in large models has mostly revolved around "the model itself": parameters, data, pretraining, post-training, and reasoning. In the early days, when we talked about agents, the most common definition was also very simple: LLM + tool use. Later, this gradually became context engineering: managing the context the model sees at each inference step, so that multi-turn tool use is not drowned by history, noise, tool definitions, and intermediate results. Later still, as tasks evolved into long-horizon tasks, agent capability became a system capability composed of the model, harness, context, tools, evals, sandbox, and state management together: within a finite context, external tools, and a changing environment, the agent must keep pushing toward a goal and get closer to completion over time.

In this blog, we mainly focus on context engineering and long-running harnesses.

Context engineering grew out of prompt engineering. When an agent changes from a single-turn answering system into a multi-turn action system, the input the model sees at inference time changes too. It is no longer a relatively independent external input, namely a prompt, but a context related to the model's continuous interaction with tools and the environment. This context may include tool definitions, file contents, web observations, historical messages, test outputs, MCP server descriptions, external documents, progress records, and so on. Context engineering decides which information should be placed in the prompt up front, which should be retrieved on demand, which should be written into external memory, and which should be handled by code or tools rather than stuffed into the model context. Anthropic systematically explained this concept in *Effective context engineering for AI agents* in September 2025. A concrete context engineering example is: when there are too many MCP tools and too much data, we should not let every tool definition and intermediate result flow through context. Instead, the agent should write code to call tools on demand, filter the data, and bring only high-signal results back to the model. Context engineering also includes compaction, structured note-taking, and even multi-agent patterns, but these mostly serve the question of "how should context be managed?" The long-running agent harness discussed later goes one step further: it does not only manage context, but separates planning, implementation, evaluation, revision, and final acceptance into different processes.

By the end of 2025, as coding agents became able to make longer continuous progress on software engineering tasks, the center of gravity quickly shifted toward long-running agent harnesses: from the initial focus on the model's coding ability to the ability to continue executing a task across multiple context windows / sessions. In November, Anthropic released *Effective harnesses for long-running agents*, which can be viewed as the first version of the long-running harness. The system started to shift from "managing one agent's context" to "managing multiple sessions." This version of the harness introduced a minimal role split between an initializer agent and a coding agent. The initializer's role is to establish an external project state that can be handed off: it breaks the task into a smaller feature list, writes a progress file, creates an init script, initializes a git repo, and marks each feature as pending. Later, each coding agent session only advances one bounded increment, such as implementing one feature or fixing one specific issue. The harness requires it to test, update records, commit, and leave the repo in a clean state before ending. That way, even if the next session starts from a new context, it can reconnect to the task through the progress file, feature list, git log, and test results.

In January 2026, Anthropic published *Demystifying evals for AI agents*. This article systematized agent evals: because agents act in environments, call tools, and modify state over multiple turns, evals cannot only look at the final sentence. They also have to look at the transcript / trajectory and whether the final environment state is actually correct. Roughly speaking, it makes two points. One is task-level: how do we determine that the agent really did the task and did it well, rather than producing something that looks acceptable on the surface but is actually buggy or incomplete? The other is harness-level: we also need to evaluate whether each component of the harness is actually load-bearing, rather than just adding useless stuff.

By March 2026, in *Harness design for long-running application development*, this idea became the second version of the harness: initializer + coding agent was expanded into planner + generator + evaluator. The evaluator uses Playwright MCP to operate the application like a user, test UI, API, and database state, and reject outputs that fail certain criteria. Whether this evaluator should exist depends on whether the task exceeds the current model's reliable solo capability. For example, on Opus 4.5 it was clearly useful; by Opus 4.6, the model itself had become stronger, and some scaffold could be removed or weakened. These adjustments and transitions naturally make us think about a longer-term system design problem (see their April post *Scaling Managed Agents*): a harness is not a fixed structure, but co-evolves with model capability. Earlier Sonnet 4.5 / Opus 4.5 had context anxiety and would under-scope, so they needed more scaffold: context reset, sprint decomposition, evaluator feedback loops. But by Opus 4.6, the model itself was better at long-running agentic tasks, code review, debugging, and long-context retrieval. Some structures that were originally necessary started to become less necessary. For tasks the model can already complete reliably solo, an evaluator may no longer be worth the cost. Of course, for tasks that sit just beyond the model's capability boundary, an evaluator can still bring real lift. Many designs in a harness essentially contain assumptions about "what the current model cannot do well." After the model upgrades, these assumptions may no longer hold. So we should not treat one generation of harness as an architecture that can be used forever. Instead, we should split the system into relatively stable abstractions: use sessions to record what happened, use the harness to manage the agent loop and tool use, use the sandbox to provide a controlled execution environment, and so on. This way, the underlying harness can keep being replaced, but the agent product is not tied to one generation of scaffold.

## Context engineering

People used to focus on prompt engineering, namely how to write the system prompt. But as agents become more multi-turn and longer-running, the focus becomes: at each inference step, what did the model see? For example, an agent's context may contain the system prompt, developer instructions, tool definitions, MCP server descriptions, user messages, conversation history, file contents, command output, browser observations, screenshots, errors, progress notes, retrieved documents, evaluator feedback. These things cannot all be blindly stuffed in. Even if the context window becomes larger, we still need to choose selectively, because noise in a long context distracts the model and increases cost and latency. So a good context is the minimal high-signal context that lets the model complete the next step at the current step. In general, we use just-in-time context: instead of stuffing all documents, tools, and history into the model, we keep references, such as paths, URLs, commit hashes, log files, database table names, and so on. When the model needs them, it loads them through tools. In this way, the agent's working memory keeps indexes and currently relevant fragments, rather than all of the context.

Common context techniques in long tasks include:

**Compaction:** When the context is almost full, compress the current conversation trace into a summary, then use that summary to start the next context. Usually this is still the continuation of the same task and the same agent loop. Its goal is to preserve conversational continuity as much as possible. In other words, the model should feel that "what I was just doing is still here"; only the history has been compressed.

**Structured note-taking:** Let the agent actively write task state into persistent external artifacts, such as `progress.md`, `feature_list.json`, `NOTES.md`, or git commits. It is not necessarily only for the same task. A project-level `NOTES.md` can be read by later sessions, by planner/generator/evaluator, or reused in neighboring tasks.

**Context reset:** Use external artifacts, such as files produced by note-taking, git logs, test results, task lists, and so on, as startup material to open a clean new context/session. It does not preserve the full conversation history, and can clear noise and bad assumptions so that a new agent can reorient itself.

**Multi-agent architecture:** Do role division and context isolation. Different agents receive different context, do different subtasks, and finally pass only high-density results back to the main flow.

## Tool use

There are also some things to watch out for in tool use. For example, the number of tools cannot expand without limit, otherwise the model wastes attention on choosing. Tools should not overlap too much in functionality, otherwise the model does not know which one to use. Tool descriptions should clearly explain when to use them and when not to use them, namely they should make the boundaries clear. Return values should be token-efficient and should not pour irrelevant data into context. Returned error messages should let the model know what to repair next. Names should be clear, so the agent can infer boundaries from the names. Also, tools are preferably not exposed directly to the model as direct tool calls, but mapped into code APIs / a file tree, so the agent can call them through code. This way, the agent can read only the tool definitions it currently needs, filter large data inside the code execution environment, and return only summaries or a small number of results to the model. It can use loops, conditionals, and exception handling to complete complex control flow, or write intermediate state into files instead of stuffing it into context. Tool outputs are deterministic; we should leave deterministic computation to code. Judgment and planning, such as how to call tools, which tools to call, in what order, and how many times, should be left to the model.

## The problem of long-running agents

### 1. Context window

Long tasks will definitely exceed a single context window. Even if the model supports a very long context, context is always a finite resource: every extra piece of information consumes part of the model's attention budget. This brings three common phenomena:

**Amnesia:** A new session does not know what the previous session did.

**Context rot:** The longer the context, the easier it is for the model to lose the point; earlier information gets buried by noise.

**Context anxiety:** When the model feels that it is approaching the end of the context, it rushes to wrap things up and calls a half-finished product complete.

### 2. Planning and hand-off

Many complex tasks contain dozens of mutually dependent features, bugs, design decisions, and validation steps. If the model starts directly from a high-level prompt, it easily tries to do everything at once, then runs out of context halfway through, leaving something that appears to have a lot of work in it but does not actually work. Also, even if some things are useful for the next agent, the next agent does not know which things are useful: is something that looks like a bug intentionally made that way, or is it something the previous session did not have time to clean up?

/btw

I believe many of you, in PhD work or at work, have had the experience of inheriting a collaborator's mess. Although by the late stage of my PhD, around December 2025, agents were developing so fast that I felt a lot of anxiety and insecurity, deeply felt that I could no longer stay in academia, and had completely lost the motivation to keep publishing papers, I also became the kind of person I once disliked: someone who leaves collaborators with a pile of messes.

### 3. Self-evaluation

The model does not necessarily judge what it generated strictly. It may see that a button shows up and think the feature is complete; see that a page roughly looks right and think the design is good; or run part of the tests and think the whole system is usable. In Anthropic's long-running application harness post, they mention that letting the same agent be both generator and reviewer often leads to overly lenient judgments. Especially for front-end design, product completeness, and edge interactions, where there is no unit test directly defining the thing, the model can easily convince itself.

/btw

After all, the world is a giant makeshift operation, and models have learned a lot from us. Also, a lot of the time, people only need to convince themselves.

## Harness

An agent harness, also called a scaffold, is the system that allows a model to act as an agent. It handles inputs, organizes tool calls, manages state, executes loops, and returns results to the model. It includes the file system, task board, test scripts, browser, shell, git, logs, sandbox, permission system, checkpoints, handoff notes, and so on.

The core design of the first generation of long-running harnesses was quite simple. It mainly used two types of agents:

**Initializer agent:** Runs at the very beginning to set up the working framework and environment.

**Coding agent:** Makes incremental progress session by session, and leaves structured handoff artifacts before ending.

The initializer agent does several things.

**1. Create a task list.**

For example, if the user only says "build a claude.ai clone," the initializer does not let later agents directly start building. Instead, it breaks the task into many verifiable features, such as creating a new chat, entering a message, pressing Enter to send, receiving a response, switching themes, loading historical conversations, and so on. Each feature's initial status is marked failing.

**2. Create a progress file.**

For example, `claude-progress.txt` or a similar file records what each round did, what remains, and what later agents should pay attention to.

**3. Create a startup script.**

For example, `init.sh` tells later agents how to install dependencies, start the service, and run basic checks.

**4. Initialize a git repo.**

At the end of each round, commit. This way, later agents can understand recent changes through `git log`, and the system can roll back, diff, and audit.

Later coding agents roughly do three parts:

Understand the current engineering state they are receiving (**orient**): confirm the current working directory, read the progress file and feature list, look at the recent git log, and run an end-to-end test to confirm that the basic functionality is not broken.

Select and finish one feature (**select & implement & validate**): choose the highest-priority unfinished feature, implement one relatively independent increment, test it, and evaluate that feature.

Hand off a clean state to the next round, so that the current code can be understood by the next agent: for example, update the feature status and progress file and commit. If a new feature is not finished, leave a clear boundary instead of pretending it is done.

A long-running agent is essentially using multiple short sessions to stitch together one long task. If every session leaves behind a small mess, errors compound with interest. So a harness should not only reward "verifiable increments," but also reward the state of the system it leaves behind. If a session writes three more features but breaks the startup flow, the next round may have to spend a large number of tokens first recovering the environment. In the long run, this kind of progress is actually negative return.

## The three roles of planner / generator / evaluator

The first-generation harness solved the context handoff problem, but there was still one big problem: agents are not good at judging themselves. So Anthropic introduced a multi-agent structure in the second generation. The final form roughly contains three roles:

**Planner:** Expands the user's high-level prompt into a specification, feature list, design direction, and implementation plan.

**Generator:** Implements features according to the plan: writes code, changes UI, connects the backend, and runs tests.

**Evaluator:** Acts like QA, operates the application, checks the result, points out problems, and decides whether it passes.

Different roles correspond to different failure modes.

Planner solves under-scoping. Without a planner, the generator often understands the task too narrowly. For example, for "build a 2D retro game maker," a single agent might build a page where you can place some tiles and think it is done. The planner expands it into more complete product specifications such as a level editor, sprite editor, entity behavior, playable test mode, animations, export, sound effects, AI-assisted generation, and so on.

Generator solves execution. It is still the main labor force, but it no longer decides the entire product boundary from nothing; it works inside a clear spec and current feature contract. Generator also does not have to be a single agent. It is more like a role: multiple generator sessions or coding agents sequentially hand off execution. Each round of generator reads the planner spec, current code, progress file, and previous evaluator feedback, then completes a bounded increment, writes state back, and exits. The next generator then reads these artifacts and continues. So the continuity of a long-running harness is placed in external project state, such as progress files, feature lists, git commits, and test results.

Evaluator solves self-evaluation. It is not just reading code and then giving a score or feedback; it operates the application through Playwright or browser automation like a user, checking UI functionality, APIs, database state, and edge cases. So this moves from previous LLM-as-a-judge to agent-as-a-judge.

At the beginning of each sprint, the generator and evaluator first negotiate "what counts as done for this piece," rather than having the generator finish first and then ask the evaluator to criticize it. Before writing code, both sides communicate and reach consensus. This "negotiation" happens by exchanging structured artifacts through files and the workspace: the generator writes a sprint contract proposal, explaining what this round will do, what the acceptance criteria are, and what is out of scope; the evaluator reads the planner spec and proposal, fills in missing boundary conditions or rejects an overly broad scope; the generator then revises the contract. What they share is the spec, contract, progress, code, test results, and feedback.

In this negotiation process, vague user stories become testable contracts. It is a bit like product requirement clarification + QA test plan in a human team.

However, giving evaluation to another LLM does not automatically solve the problem. Claude was not a good QA agent at first either. It would find real problems, then convince itself that they were not serious; or it would only do shallow tests and not touch edge paths. So the evaluator itself also needs to be tuned. It needs a clear rubric, failure cases, judgment criteria, interaction paths it must explore, and bug types it must not let go too easily. Ideally, we should read its logs, find where it disagrees with human judgment, and update and iterate on the evaluator prompt.

Anthropic's frontend harness used several scoring dimensions:

**Design quality:** Whether the whole thing has a clear character, rather than being a pile of components. Aesthetic quality.

**Originality:** Whether there are custom design decisions, avoiding templates, default libraries, and an "AI feel." Originality.

**Craft:** Typography, spacing, color, contrast, and so on. Usability at the craft level.

**Functionality:** Understanding and completing the task. The more important functionality side of usability.

So when using a judge, we cannot ask abstractly whether this is "good." We need to break "good" into multiple checkable dimensions. Similarly, in the application development harness, the evaluator scores dimensions such as product depth, functionality, visual design, and code quality, and every dimension has a hard threshold. As long as one key dimension is below the hard threshold, this sprint fails, and the generator must continue revising based on concrete feedback.

When evaluating, what we evaluate should not be "the agent says it is done," but the final environment state and outcome. A flight-booking agent saying "I booked it for you" is meaningless; what matters is whether there is actually a reservation in the database. A coding agent saying "bug fixed" is meaningless; what matters is whether the tests pass (outcome), and whether it damaged the original code (state).

/btw

Many life lessons can apply here. For example, when evaluating a person, what the other person did matters more than what they said. Because of my unique "therapist trait," I often end up talking about related topics when discussing relationship problems with the girls around me. Processing and analyzing other people's dilemmas is much easier than walking out of my own life difficulties. On one side I am being other people's therapist; on the other side I need to find a therapist myself, but it is hard to find one I trust. After I started trying to write blogs, I actually felt much calmer. Maybe I am my own best therapist. Writing lets me quiet down and talk to myself. Before, I gave all my time to other people and almost did not allocate any time to myself. Also, although I have been anxious about finding a job, and about being replaced by LLMs as a researcher in the near future, I still think I am better at therapy than the most state-of-the-art LLMs. Unfortunately, this trait cannot make me a living and was never on my career-planning path. I have wandered too far.

Some points worth noting: the planner usually mainly solves initial under-scoping. For example, a user's one-sentence prompt is often too broad, such as "build a 2D retro game maker," and the planner can make it concrete: what core modules should this product have, which are must-haves, which can be done later, and how each feature should be accepted. After the project moves forward, the evaluator takes on part of the local planner role and does feedback-driven replanning. The evaluator modifies artifacts left by the planner. For example, the planner initially wrote `sprite editor`, only requiring draw and save. After real testing, the evaluator may add new acceptance criteria: brush size must work, transparent pixels must be preserved, saved sprites must appear in the entity palette, and state must not be lost after reloading the project. The planner can implement replanning by modifying external files such as `feature_list`, `sprint_contract`, `known_issues`, and `next_actions`.

So a multi-agent harness puts planning, execution, evaluation, and revision into external artifacts, so each round of agent can take over with limited context.

## More durable design

Every component of a harness implicitly contains assumptions: assumptions about what the model cannot do well by itself. As models become stronger, these assumptions may no longer be valid. For example, if a model has context anxiety, the harness adds context reset. Later, if the model no longer has this problem, reset may turn from a necessary structure into latency and cost. If a model cannot plan, we add a planner. Later, if the model's planning ability improves, the planner may only be valuable on large tasks. If the generator can already reliably complete a task by itself, the evaluator may become unnecessary overhead; but on tasks that sit just beyond the model's capability boundary, the evaluator can again bring a large lift. So a harness is not better just because it is more complex. We should start from the simplest workable system, use evals to identify failure modes, then add corresponding structure for these real failure modes, and as models upgrade, periodically remove components that are no longer load-bearing, rather than building an overcomplicated agent framework from the beginning.

An agent system can be split into several relatively stable abstractions:

**Session:** an append-only log of what happened.

**Harness:** the control layer that calls the model, routes tools, and executes the agent loop.

**Sandbox:** the environment where the agent can run code and modify files.

After decoupling them, the underlying implementation can keep changing while the external interface stays stable. Because the harness of long-running agents will keep evolving, stable abstractions let agent products avoid being tied to one generation of harness.

## Agent Eval

Agent behavior is nondeterministic. Running the same prompt twice may succeed once and fail once. A task passing once does not mean the system is reliable; a task failing once may also mean the grader was wrong, the environment had a problem, or the task itself was ambiguous. Compared with ordinary LLM evals, for agent evals we should not only look at output text, but at the result that a sequence of actions causes in the environment. So we need sandbox, database, browser, file system, mock API, resettable environment, and so on. Different tasks may care about different metrics. For a coding agent, if we allow the agent to try multiple times, `pass@k` (the probability that at least one of k attempts succeeds) is a relatively suitable metric, because as long as one patch is correct, it can enter review. But for customer service, reimbursement, flight booking, and other agents used directly by users, `pass^k` (the probability that all k attempts succeed) is more important, because users expect reliability every time, not "one of ten attempts is right."

There is also the difference between capability eval and regression eval. Capability evals contain some tasks the current system does not do well. Regression evals evaluate "can it still do what it used to know how to do?" This should be close to 100% pass, and is used to prevent regressions after system upgrades, model switches, or prompt changes.

## Agentic Safety (the importance of a good RL environment)

In the non-agentic era, because the model could only answer text, the blast radius of mistakes was small. But now agents can run shell, modify files, access databases, call SaaS APIs, send Slack messages, and open PRs. The cost of mistakes can be much larger. For safety, we cannot rely only on "the model will judge whether a command is dangerous" to protect the system. The safer approach is to restrict what the agent can access, where it can write, what networks it can reach, which tools require approval, which state can persist, and which secrets are never visible. But this requires a good RL environment. Of course, once we mention RL environment, we have to mention reward hacking: we should not put shortcuts we do not want the agent to use into its environment. For example, in a coding eval, future commits should not be placed in `.git/objects`, hidden tests should not be placed inside the container, and secrets that can access production systems, such as API keys, OAuth tokens, cloud provider keys, and SSH keys, should not be directly exposed to the agent. We can instead use controlled tool capabilities, and implement permission checks, parameter constraints, and auditing inside the tool.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

Important Note: 虽然学术性blog我尽量保持严肃，但在写的过程中还是忍不住插一些毫无关系的东西，为了避免污染context，我会用“/btw” command将其和technical的部分分开，读者们可以将这些“by the way"的部分跳过。

过去几年，大模型进步的主线大多围绕“模型本身”：参数、数据、pretraining、post-training、reasoning。早期我们谈 agent，最常见的定义也很简单：LLM + tool use， 再后面，逐渐变成 context engineering：管理模型每一步 inference 时看到的上下文，让多轮工具使用不被历史、噪声、工具定义和中间结果淹没。在后面， 演变为long horizon的task，agent 能力就变成了模型、harness、context、tools、eval、sandbox、state management 一起构成的系统能力: 在有限上下文、外部工具和可变环境中，持续推进一个目标，而且越做越接近完成。

在这篇blog中，我们主要focus 在Context engineering 和 long-running harness的部分。

Context engineering 的前身是 prompt engineering。当 agent 从单轮回答变成多轮行动系统时，模型在 inference 时看到的 input，也从相对独立的外部输入，也就是 prompt，变成了和模型、工具、环境持续交互有关的 context。这个 context 可能包括工具定义、文件内容、网页观察、历史消息、测试输出、MCP server 描述、外部文档、进度记录等。  Context engineering 要决定哪些信息应该提前放进 prompt，哪些应该按需检索，哪些应该写到外部 memory，哪些应该交给代码或工具处理，而不是塞进模型上下文。Anthropic 在 2025 年 9 月的 Effective context engineering for AI agents里系统化地阐释了这个概念。一个具体的 context engineering example是：当 MCP tools 太多、数据太大时，不应该让所有工具定义和中间结果都流过 context，而应该让 agent 写代码按需调用工具、过滤数据，只把高信号结果带回模型。  context engineering里面也包含 compaction、structured note-taking，甚至 multi-agent 之类的，但它们主要服务于“上下文怎么管理”。而后面讲到的 long-running agent harness 的重点更进一步，不只是管理 context，而是会把计划、实现、评价、修订和最终验收等拆开成各个流程。

到 2025 年底，随着 coding agent 已经能在软件工程任务上连续推进更久，问题的重心很快转向了 long-running agent harness：从最开始关注的模型的代码能力，变成了跨越多个 context window / session 时依然能够继续执行任务的能力。11 月，Anthropic 发布了 Effective harnesses for long-running agents，这可以看作第一版 long-running harness：系统开始从“管理一个 agent 的上下文”shift到“管理多个 session ”。这版 harness 引入了 initializer agent 和 coding agent这样的最小角色分工。Initializer 的作用是建立一个可接力的外部项目状态：它会把任务拆成更小的 feature list，写 progress file，创建 init script，初始化 git repo，并把每个 feature 标成待完成状态。后续 coding agent 每个 session 只推进一个有限增量，比如实现某个 feature 或修复某个明确问题。Harness 会要求它在结束前测试、更新记录、commit，并尽量把 repo 留在 clean state。这样即使下一个 session 是一个新的 context，也能通过 progress file、feature list、git log 和测试结果重新接上任务。

2026 年 1 月，Anthropic 发了 Demystifying evals for AI agents。这篇文章把 agent eval 系统化：因为agent会在环境中多轮行动、调用工具、修改状态，所以 eval 不能只看最后一句回答，还要看 transcript / trajectory，以及最终环境状态是否真的正确。大概说了两个point：一是 task-level 的：怎么确定agent真的把task给做出来并且做好了，而不是只做出一个表面看起来可以、但实际有 bug 或不完整的结果；另一层是 harness-level 的，说明我们也需要评估 harness 的每个 component 是否真的 load-bearing，而不是只是加了一些没用的东西。

到 2026 年 3 月的 Harness design for long-running application development，这个思路变成了第二版 harness：initializer + coding agent 被扩展成 planner + generator + evaluator。Evaluator 会用 Playwright MCP 像用户一样操作应用，测试 UI、API 和数据库状态，并根据一些标准拒绝不合格结果。这个evaluator是否应该存在取决于任务是否超出当前模型 solo 完成的可靠边界， 比如，Opus 4.5 上它明显有用；到 Opus 4.6，模型本身变得更强，一些 scaffold 就可以被移除或弱化。这些调整和转变会很自然的让我们思考更长期的系统设计问题 （可以看他们四月份的post Scaling Managed Agents ）：harness 不是固定结构，而是和模型能力共同演化的。早期 Sonnet 4.5 / Opus 4.5 会 context anxiety，会 under-scope， 就需要更多 scaffold：context reset、sprint decomposition、evaluator feedback loop。但到了 Opus 4.6，模型本身更擅长长时间 agentic tasks、代码审查、debugging 和长上下文检索。一些原本必要的结构开始变得没那么必要，比如，对于模型已经能稳定 solo 完成的任务，evaluator 可能不再值得成本。当然，对于刚好处在模型能力边界之外的任务，evaluator 仍然能带来 real lift。harness 里的很多设计，本质上都包含了一些“当前模型做不好什么”的假设。模型升级以后，这些假设可能就不再成立，所以不能把某一代 harness 当成一个一直可以用的构架。而应该把整个系统拆成相对稳定的抽象，用session 来记录发生了什么，用harness 负责 agent loop 以及工具的使用，sandbox 提供可控执行环境等。这样底层 harness 可以不断替换，但 agent 产品不会和某一代的scaffold 绑死。

## Context engineering

过去大家关注 prompt engineering，也就是怎么写系统提示词；但 agent 越来越多轮、越来越长之后，问题focus变成了，每一步 inference 时，模型看到了什么。比如，一个 agent 的 context 里可能有system prompt， developer instructions， tool definitions， MCP server descriptions， 用户消息， 历史对话， 文件内容， command output， browser observations， screenshots， errors， progress notes， retrieved documents， evaluator feedback， 这些东西不能全部无脑塞进去。即使上下文窗口变大， 也需要选择性的放。因为长上下文里的噪声会让模型分心，也会增加成本和延迟。所以，一个好的 context是在当前这一步，让模型足够完成下一步的最小高信号上下文。一般我们会使用just-in-time context，不把所有文档、工具、历史都塞给模型，而是保留引用， 比如路径， URL，commit hash，log 文件，数据库表名等，模型需要的时候再通过工具加载。这样 agent 的工作记忆里保留的是索引和当前相关片段，而不是所有的context。

长任务里常见的 context 技术包括：

compaction：（在 context 快满时）把当前 conversation trace 压缩成一段摘要，然后用这个摘要开启下一段 context。它通常还是同一个任务、同一条 agent loop 的延续。它的目标是尽量保留 conversational continuity。也就是说，模型应该感觉“我刚才做的事情还在”，只是历史被压缩了。

structured note-taking：让 agent 主动把任务状态写到外部持久化 artifact 里，例如 progress.md、feature_list.json、NOTES.md、git commit。（它也不一定只给同一个任务用。一个项目级 NOTES.md 可以被后续 session 读，也可以被 planner、generator、evaluator 读；或者在相邻任务里复用。）

context reset：用外部 artifact  （比如， note-taking 产生的文件， git log、测试结果、任务列表等）作为启动材料开一个干净的新 context/session。它不会保留完整 conversation history， 可以清掉噪声和坏假设，让新 agent 重新定向。

multi-agent architecture：做角色分工和上下文隔离，不同 agent 拿不同上下文、做不同子任务，最后只把高密度结果交回主流程。

## 工具调用

工具调用上也有一些需要注意的点， 比如工具数量不能无限膨胀，否则模型会在选择上浪费注意力。工具之间不要有过多功能重叠，否则模型不知道该用哪个。工具描述要清楚说明什么时候用、什么时候不用（就是要讲清楚边界）。返回值要 token-efficient，不要把无关数据全倒进 context。返回的错误信息要让模型知道下一步怎么修。命名要清晰，让 agent 能从名字推断边界。而且工具最好不要作为直接 tool call 暴露给模型，而应该映射成代码 API / 文件树，让 agent 用代码调用。这样 agent 可以只读取当前需要的 tool definition， 然后在代码执行环境里过滤大的数据， 只把摘要或少量结果返回给模型。用循环、条件、异常处理完成复杂控制流，或者把中间状态写到文件里，而不是塞进 context。工具返回的东西是确定性的，我们应该把确定性计算留给代码，如何调用工具，调用哪些，以什么顺训调用，调用多少次这样的把判断和规划则应该留给模型。

## long running agent 的问题

### （1）上下文窗口

长任务一定会超过单个 context window。即使模型支持很长上下文，context 始终是有限资源：每多塞一点信息，都会占用模型的注意力预算。这带来三种常见现象：

amnesia：新 session 开始时不知道前一个 session 做了什么。

context rot：上下文越长，模型越容易失去重点，早期信息会被噪声淹没。

context anxiety：模型感觉自己快到上下文末尾时，会急着收尾，把半成品说成完成品。

### （2）规划和hand-off

很多复杂任务会包含几十个互相依赖的 feature、bug、设计决策和验证步骤。模型如果直接从一句high level prompt 开始做，很容易一上来什么都想做，然后做到一半上下文耗尽，留下一个看似做了很多，但实际完全不work的东西。并且，即使一些东西对下一个agent有用的，下一轮agent也不知道哪些是有用的：一些看似bug的东西，是故意做成这样的，还是上一个 session 没来得及收拾？

/btw

相信各位在读博或者工作中，都有接手合作者留下的烂摊子的经历，虽然到了读博的后期，大约是25年12月开始，agent发展太过飞速，让我有了很多的anxiety和insecurity，深感自己没有办法在学术界继续待下去了， 也完全没有继续发paper的动力，我也成了自己曾经所讨厌的，给合作者们留下一堆烂摊子的人

### （3）自我评价

模型不一定会严厉地判断自己生成的东西。它可能看到一个按钮能显示出来，就觉得这个功能完成了；会看到一个页面大概长得像，就觉得设计的很好了，或者测试跑了一部分，就觉得整个系统可用了。Anthropic 在 long-running application harness 那篇文章里提到，让同一个 agent 既当生成者又当评审，经常会得到过于宽松的判断。尤其是前端设计、产品完整性、边缘交互这类没有单元测试直接定义的东西，模型很容易说服自己。

/btw

毕竟世界是个巨大的草台班子，模型还是从咱们这里学到了很多东西的。以及很多时候，人只需要说服自己就够了。

## Harness

agent harness，也叫 scaffold，是让模型能够作为 agent 行动的系统。它负责处理输入、组织工具调用、管理状态、执行循环、把结果返回给模型。包括文件系统、任务板、测试脚本、浏览器、shell、git、日志、sandbox、权限系统、checkpoint、handoff note等。

第一代 long-running harness的核心设计很朴素， 主要用了两类 agent：

Initializer agent：最开始的时候运行一下，搭好工作的框架和环境。

Coding agent：session by session的做增量进展，并在结束前留下结构化交接物。

Initializer agent 会做几件事。

### （1）创建任务清单。

比如用户只说“做一个 claude.ai clone”，initializer 不会让后续 agent 直接开始做，而是把这个任务拆成大量可验证 feature，例如新建聊天、输入消息、回车发送、收到回复、切换主题、加载历史会话等。每个 feature 初始状态都标成 failing。

### （2）创建进度文件。

比如 claude-progress.txt 或类似文件，记录每一轮做了什么、哪些还没做、哪些地方需要注意。

### （3） 创建启动脚本。

比如 init.sh，告诉后续 agent 如何安装依赖、启动服务、跑基本检查。

### （4）初始化 git repo。

每轮结束时 commit，这样，后续 agent 通过 git log 理解最近的变化，系统能回滚、diff、审计。

后续 coding agent 大概分为三部分做：

搞清楚目前自己接受的工程状态（orient）：确认当前工作目录， 读 progress file和 feature list， 查看最近 git log； 跑一个 end-to-end 的 test来确认基础功能没坏；

选择并完成一个feature （select & implement& validate)：选择最高优先级的未完成 feature来实现一个相对独立的增量， 自己测试并evaluate这个feature，

hand off一个clean state给下一轮， 使得当前代码可以被下一个 agent 理解：比如，更新 feature 状态和 progress file并 commit。如果新 feature 没做完，也要留下清楚的边界， 而不是假装自己完成了。

long-running agent 本质上是在用多个短 session 拼一个长任务。如果每个 session 都留下小烂摊子，错误会复利增长。所以 harness 不能只奖励“可验证增量”，还要奖励“留下的系统的状态”。一个 session 结束时，如果 agent 多写了三个功能，但把启动流程弄坏了，下一轮可能要花大量 token 先恢复环境。长期看，这种进展其实是负收益。

## planner / generator / evaluator的三类角色

第一代 harness 解决了上下文接力问题，但还有一个大问题：agent 不擅长判断自己。于是 Anthropic 在第二代里进一步引入了多 agent 结构。最终形态大致是三类角色：

Planner：把user的high level prompt 展开成规格、功能列表、设计方向和实现计划。

Generator：按计划实现功能，写代码、改 UI、接后端、跑测试。

Evaluator：像 QA 一样操作应用、检查结果、指出问题、决定是否通过。

不同角色对应不同失败模式。

Planner 解决的是 under-scoping。没有 planner 时，generator 往往会把任务理解得太窄。例如“做一个 2D retro game maker”，单 agent 可能做出一个能放点 tile 的页面就觉得完成了。Planner 则会把它展开成 level editor、sprite editor、entity behavior、playable test mode、动画、导出、音效、AI 辅助生成等更完整的产品规格。

Generator 解决的是执行。它仍然是主要劳动力，但它不再凭空决定整个产品边界，而是在明确 spec 和当前 feature contract 里工作。Generator 也不一定是单个 agent。它更像一个角色：多个 generator sessions 或 coding agents sequentially 接力执行。每一轮 generator 读 planner spec、当前代码、progress file、上一轮 evaluator feedback，然后完成一个有限增量，写回状态并退出。下一轮 generator 再接着读这些 artifact 继续。所以 long-running harness 的连续性连续性是放在外部项目状态， 比如 progress file、feature list、git commit 和 test results里。

Evaluator 解决自我评价。它是只是读代码，然后打分或者给出feedback，而是通过 Playwright 或浏览器自动化像用户一样点击应用，检查 UI 功能、API、数据库状态和边缘情况。（所以从之前的llm as a judge变成了agent as a judge).

在每个 sprint 开始前，generator 和 evaluator 会先协商“这一块到底怎么算完成”, 而不是 generator 先写完再让 evaluator 来critic，而是在写代码之前，双方线communicate，达成consensus。这个“协商”是通过文件和 workspace 交换结构化 artifact做的：generator 写一个 sprint contract proposal，说明本轮要做什么、验收标准是什么、哪些不在 scope；evaluator 读取 planner spec 和 proposal，补充遗漏的边界条件或拒绝过宽的 scope；generator 再修订 contract。他们共享的是 spec、contract、progress、代码、测试结果和 feedback。

在这个协商的过程中，把模糊的用户故事变成可测试 contract。有点像人类团队里的产品需求澄清 + QA test plan。

不过，把评价交给另一个 LLM 并不自动解决问题。Claude 一开始也不是好的 QA agent。它会发现真实问题，然后又说服自己这些问题不严重；或者只做浅层测试，不去碰边缘路径。所以 evaluator 本身也要被调， 需要给它明确的 rubric、失败案例、判断标准、必须探索的交互路径、不能轻易放过的 bug 类型。最好是读一读它的 logs，找出它和人类判断不一致的地方，更新和迭代 evaluator prompt。

Anthropic 的 frontend harness 使用了几类评分维度：

design quality：整体是否有清晰气质，而不是组件堆叠。（美学上）

originality：是否有定制设计决策，套模版和默认库， 避免“ai 感” （原创性上）

craft：排版、间距、色彩、对比度等。（可用性）

functionality：理解并完成任务。（更加重要一点的functionality上的可用性）

所以我们在使用judge时，不能抽象的问judge这个“好不好”，而是需要把“好”拆成多个可检查维度。同样，在应用开发 harness 里，evaluator 会按 product depth、functionality、visual design、code quality 等维度打分，而且每个维度有hard threshold。只要一个关键维度低于hard threshold，这轮 sprint 就失败，generator 必须根据具体反馈继续改。

在evaluate的时候，evaluate的不是”agent说自己完成了“，而应该evaluate环境最终状态以及outcome。一个航班预订 agent 说“我已经帮你订好了”没有意义，而要看数据库里是否真的有 reservation 。一个 coding agent 说“bug fixed”没有意义， 重要的是测试是否通过（outcome), 以及是否把原本的代码弄坏了(state).

/btw

好多生活的哲理都可以apply到这里，比如，评估一个人的时候，对方做了什么比说了什么更重要。因为自己身上独特的“therapist trait”， 这在我和周围女孩们谈论她们的情感问题时倒是常常聊到相关的话题。处理和分析别人的dilemma比走出自己的人生困境容易多了，一方便在给别人做心理医生，一方面需要找心理医生，但很难找到能让我信服的therapist。开始尝试写blog后，我倒觉得自己平静了很多，可能我才是自己最好的therapist吧， 写作让我能够静下来和自己对话，以前则是把所有的时间都给了别人， 几乎没有allocate给自己的时间。另外，虽然我一直焦虑着找工作的事，以及在不久的将来，自己作为researcher会被LLM取代这件事，我觉得自己在therapy方面还是比最state of the art LLM做的好的， 可惜这个trait没法让我make a living，也从来不在我的职业规划的路径里。 扯远了～

一些需要注意的点是： planner 通常主要解决初始 under-scoping。比如，用户一句话往往太宽泛，比如“做一个 2D retro game maker”， 而planner可以将其具体化：这个产品应该有哪些核心模块、哪些是 must-have、哪些可以以后做、每个 feature 怎么验收。项目推进之后，evaluator 会承担一部分局部 planner 的角色， 来做 feedback-driven replanning。evaluator 会修改 planner 留下来的 artifact。比如 planner 最初写了 sprite editor，只要求能 draw 和 save。Evaluator 在真实测试后可能补上新的验收条件：brush size 要工作，透明像素要保留，保存后的 sprite 要出现在 entity palette，reload project 后状态不能丢。planner可以通过改 feature_list、sprint_contract、known_issues、next_actions 这些外部文件来实现replanning。

所以多 agent harness 会把计划、执行、评价、修订都落到外部 artifact 上，让每一轮 agent 可以用有限上下文接手。

## 更持久性的设计

harness 的每个组件都隐含了一些假设，假设模型自己做不好某件事。随着模型变强，这些假设可能会不再valid。比如某个模型有 context anxiety，于是 harness 加了 context reset。后来模型不再有这个问题，reset 可能就从必要结构变成了延迟和成本。某个模型不会规划，于是加入 planner。后来模型规划能力增强，planner 可能只在大任务上有价值。某个任务靠 generator 自己已经能稳定完成，evaluator 就可能是多余开销；但在刚好超过模型能力边界的任务上，evaluator 又会带来巨大提升。所以 harness 不是越复杂越好。而应该从最简单workable的系统开始，用 eval 找出失败模式， 然后为这些真实失败模式增加相应的结构，随着模型升级，定期移除不再 load-bearing 的组件， 而不是一开始就搭一个过度复杂的 agent framework。

agent 系统可以拆成几个相对稳定的抽象：

session：发生过什么的 append-only log。

harness：调用模型、路由工具、执行 agent loop 的控制层。

sandbox：agent 能运行代码和改文件的环境。

把它们解耦之后，底层实现可以不断变化，同时保持外部接口的稳定。因为 long-running agent 的 harness 会持续演化。稳定抽象能让 agent 产品不必被某一代 harness 绑死。

## Agent Eval

agent 的行为是非确定性的。同一个 prompt 跑两次，可能一次成功一次失败。一个任务 pass，不代表系统可靠；一个任务 fail，也可能是 grader 写错了、环境有问题，或者任务本身有歧义。和普通 LLM eval 相比，对于agent eval，我们不应该不只是看输出文本，而是要看一串行动对环境造成的结果。所以需要 sandbox、数据库、浏览器、文件系统、mock API、可重置环境等。不同的task关注的metric可能也不一样，对 coding agent 来说，如果我们允许 agent 多试几次，pass@k （k 次尝试里至少成功一次的概率）是一个比较合适的metric，因为只要有一次 patch 对了就可以进入 review。但对客服、报销、订票这种用户直接使用的 agent，pass^k （k 次尝试全部成功的概率）会更关键，因为用户期待每次都可靠，而不是十次里总有一次对。

另外，还有Capability eval 和 regression eval的区别。做Capability eval 时包含一些当前做得不好的任务，Regression eval 则是在evaluate“它以前会的东西现在还会不会？”这个应该接近 100% pass，用来防止系统升级、模型切换、prompt 修改之后倒退。

## Agentic Safety（一个好的RL environment的重要性）

在non-agentic时代，因为模型只能回答文本，其犯错的 blast radius 很小。但现在agent能跑 shell、改文件、访问数据库、调用 SaaS API、发 Slack、开 PR，其犯错成本会大很多。对于safety，我们不能只靠“模型会判断危险命令”来保护系统。更safe的做法是限制 agent 能访问什么、能写哪里、能联网到哪、哪些工具需要审批、哪些状态可持久化、哪些 secret 永远不可见。但这需要很好的RL environment，  当然，说到RL environment，咱就不得不提到reward hacking: 我们不应该把我们不希望 agent 使用的捷径放进它的环境里。比如，如果 coding eval 的 future commit 不应该放在 .git/objects 里， hidden tests 不应该放在容器里， 对于能访问生产系统的 secret，比如 API key、OAuth token、云厂商密钥、SSH key，都不应该直接暴露给 agent（可以用受控 tool capability， 然后在tool内部做好权限的检查，参数限制以及审计）。

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
