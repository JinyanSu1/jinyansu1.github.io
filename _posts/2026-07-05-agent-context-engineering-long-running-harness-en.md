---
layout: post
title: 'The Evolution of Agents: From Context Engineering to Long-running Harnesses'
date: '2026-07-05 17:55:00 -0700'
categories: technical
tags:
- agents
- context-engineering
- harness
- evals
- anthropic
excerpt: 'From LLM + tool use to context engineering, and then to long-running agent
  harnesses: agent capability is becoming a system property composed of the model,
  harness, context, tools, evals, sandbox, and state management.'
---

Important note: I try to keep technical blog posts serious, but while writing I inevitably insert things that have almost nothing to do with the main argument. To avoid polluting the technical context, I will mark these sections with `/btw`. Readers can safely skip the "by the way" parts.

Over the past few years, most of the progress in large language models has been framed around the model itself: parameters, data, pretraining, post-training, reasoning. In the early days, when people talked about agents, the most common definition was also simple: **LLM + tool use**. A model was no longer just generating text; it could call search, a code interpreter, a browser, the file system, or APIs. It began to look like it could actually "do things."

But once a model starts using tools, the real problem quickly stops being just whether it can call a tool. It also has to know when to call one, which tool to call, where to put the tool results, which parts of the history to look at next, and which intermediate results should be discarded. This is how agent engineering gradually shifted toward **context engineering**: managing what the model sees at each inference step, so that multi-turn tool use is not drowned by history, noise, tool definitions, and intermediate results.

Later, as agents moved toward long-horizon tasks, agent capability became a system property composed of the model, harness, context, tools, evals, sandbox, and state management. The real challenge became: within a finite context window, with external tools and a changing environment, can the agent keep pushing toward a goal and get closer to completion over time?

In this post, I mainly focus on two parts of that story: **context engineering** and **long-running harnesses**.

Context engineering is the successor to prompt engineering. When an agent changes from a single-turn question-answering system into a multi-turn action system, the input the model sees at inference time also changes. It is no longer just an isolated external input, or prompt. It becomes a context that is continuously shaped by the interaction between the model, tools, and environment.

That context might include tool definitions, file contents, browser observations, message history, test output, MCP server descriptions, external documents, progress notes, and more. Context engineering decides which information should be placed in the prompt up front, which should be retrieved just in time, which should be written to external memory, and which should be handled by code or tools instead of being stuffed into the model context.

Anthropic systematically explained this idea in its September 2025 post, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). A concrete example of context engineering is what Anthropic later discusses in [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp): when there are too many MCP tools and too much data, not every tool definition and intermediate result should flow through the model context. Instead, the agent should write code to call tools on demand, filter the data inside the execution environment, and only bring high-signal results back to the model.

Context engineering also includes techniques like compaction, structured note-taking, and even multi-agent patterns, but in this line of work they mainly serve the question of how to manage context. The long-running agent harnesses discussed later go one step further: they do not only manage context, but also split planning, implementation, evaluation, revision, and final acceptance into separate processes.

By late 2025, as coding agents became able to make longer continuous progress on software engineering tasks, the center of gravity quickly shifted toward long-running agent harnesses. The question moved from whether a model could write code to whether it could continue working across multiple context windows or sessions. In November, Anthropic published [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), which can be read as the first version of its long-running harness.

At this point, the system began shifting from "managing one agent's context" to "managing multiple sessions." This harness introduced a minimal division of roles between an initializer agent and a coding agent. The initializer builds an external project state that future sessions can inherit: it breaks the task into a smaller feature list, writes a progress file, creates an init script, initializes a git repo, and marks each feature as pending. Later coding agents only advance one bounded increment per session, such as implementing one feature or fixing one specific issue. The harness requires each coding agent to test, update notes, commit, and leave the repo in a clean state before the session ends. This way, even if the next session starts in a fresh context, it can reconnect to the task through the progress file, feature list, git log, and test results.

In January 2026, Anthropic published [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). This post systematized agent evals. Because agents act in environments, call tools, and modify state over multiple turns, evals cannot only look at the final answer. They also have to inspect the transcript or trajectory, and they have to verify whether the final environment state is actually correct.

This matters at two levels. At the task level, evals tell us whether the agent really completed the task, rather than producing something that looks acceptable but is buggy or incomplete. At the harness level, evals tell us whether each component of the harness is actually load-bearing, instead of merely adding complexity.

By March 2026, in [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), this idea became the second version of the harness: initializer + coding agent was expanded into planner + generator + evaluator. The evaluator uses Playwright MCP to interact with the application like a user, testing the UI, APIs, and database state, and rejecting outputs that fail the criteria.

Whether the evaluator should exist depends on whether the task exceeds the current model's reliable solo capability. On Opus 4.5, the evaluator was clearly useful. By Opus 4.6, the model itself had become stronger, and some scaffold could be removed or weakened. These adjustments naturally lead to a longer-term system design question, which Anthropic discusses in its April post [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents): a harness is not a fixed structure. It co-evolves with model capability.

Earlier Sonnet 4.5 and Opus 4.5 could show context anxiety and under-scope the product, so they needed more scaffold: context reset, sprint decomposition, evaluator feedback loops. But by Opus 4.6, the model was better at long-running agentic tasks, code review, debugging, and long-context retrieval. Some structures that were once necessary became less necessary. For tasks that the model can already complete reliably on its own, an evaluator may no longer be worth the cost. But for tasks just beyond the model's reliable frontier, an evaluator can still provide real lift.

Many harness designs implicitly encode assumptions about what the current model cannot do well. When the model improves, those assumptions may no longer hold. That means we should not treat any particular generation of harness as the permanent architecture. Instead, the system should be split into relatively stable abstractions: a session records what happened, a harness controls the agent loop and tool use, and a sandbox provides a controlled execution environment. This allows the underlying harness to keep changing without tying the agent product to one generation of scaffold.

## Context Engineering

People used to focus on prompt engineering: how to write the system prompt. But as agents become more multi-turn and long-running, the focus shifts to what the model sees at each inference step.

An agent's context might contain the system prompt, developer instructions, tool definitions, MCP server descriptions, user messages, conversation history, file contents, command output, browser observations, screenshots, errors, progress notes, retrieved documents, evaluator feedback, and more.

These cannot all be blindly stuffed into the context. Even if context windows get larger, we still have to choose selectively, because noise in a long context can distract the model and increase cost and latency.

A good context gives the model the minimum high-signal information it needs to complete the next step. In practice, this often means using just-in-time context. Instead of giving the model every document, tool, and historical detail up front, we keep references: paths, URLs, commit hashes, log files, database table names. The model can load them through tools when needed. This way, the agent's working memory contains indexes and currently relevant snippets, not the entire world.

Common context techniques for long tasks include:

**Compaction:** When the context is almost full, compress the current conversation trace into a summary, then use that summary to start the next context. It is usually still the same task and the same agent loop. Its goal is to preserve conversational continuity: the model should feel that "what I was just doing is still here," except the history has been compressed.

**Structured note-taking:** Let the agent actively write task state into persistent external artifacts, such as `progress.md`, `feature_list.json`, `NOTES.md`, or git commits. This is not necessarily only for the same task. A project-level `NOTES.md` can be read by later sessions, by the planner, generator, or evaluator, or even reused across neighboring tasks.

**Context reset:** Use external artifacts, such as files produced by note-taking, git logs, test results, and task lists, as the starting material for a clean new context or session. It does not preserve the full conversation history. This can clear noise and bad assumptions, letting a fresh agent reorient itself.

**Multi-agent architecture:** Use role separation and context isolation. Different agents receive different contexts, work on different subtasks, and only return high-density results to the main flow.

## Tool Use

Tool use also has several traps. The number of tools cannot grow without bound, or the model will waste attention choosing between them. Tools should not overlap too much, or the model will not know which one to use. Tool descriptions should clearly say when the tool should and should not be used. Returned values should be token-efficient; irrelevant data should not be dumped into context. Error messages should help the model figure out the next repair step. Tool names should be clear enough that the agent can infer their boundaries from the names.

Ideally, tools should not always be exposed directly to the model as raw tool calls. They can instead be mapped into code APIs or a file tree, so that the agent calls them through code. This lets the agent read only the tool definitions it currently needs, filter large data inside the execution environment, and return only summaries or small results to the model. It can use loops, conditionals, and exception handling for complex control flow, and it can write intermediate state to files instead of putting everything in context.

Tool outputs are deterministic. We should leave deterministic computation to code. The model should handle the judgment and planning: which tools to call, in what order, how many times, and why.

## The Problems of Long-running Agents

### 1. The Context Window

Long tasks will inevitably exceed a single context window. Even if the model supports a very long context, context is still a limited resource. Every additional piece of information consumes some of the model's attention budget.

This creates three common phenomena:

**Amnesia:** A new session does not know what the previous session did.

**Context rot:** The longer the context gets, the easier it becomes for the model to lose focus. Early information gets buried under noise.

**Context anxiety:** When the model senses that it is near the end of the context window, it may rush to wrap things up and present unfinished work as complete.

### 2. Planning and Handoff

Many complex tasks contain dozens of interdependent features, bugs, design decisions, and validation steps. If a model starts directly from a high-level prompt, it can easily try to do everything at once, run out of context halfway through, and leave behind something that looks like a lot of work but does not actually function.

Even when some of its work would be useful to the next agent, the next agent may not know which parts are useful. Is something that looks like a bug actually intentional? Or is it just something the previous session did not have time to clean up?

/btw

I suspect many of us, in grad school or at work, have had the experience of inheriting a collaborator's mess. By the later stage of my PhD, around December 2025, agents had developed so quickly that I felt a lot of anxiety and insecurity. I felt I could no longer stay in academia, and I had completely lost the motivation to keep publishing papers. I also became the kind of person I used to dislike: someone who leaves collaborators with a pile of unresolved mess.

### 3. Self-evaluation

Models do not necessarily judge their own outputs strictly. A model might see that a button renders and decide the feature is complete. It might see a page that roughly looks right and decide the design is good enough. It might run part of the test suite and decide the whole system is usable.

In Anthropic's long-running application harness post, they note that using the same agent as both generator and reviewer often leads to overly lenient judgments. This is especially true for front-end design, product completeness, and edge interactions, where there may not be a clean unit test defining correctness. The model can easily convince itself.

/btw

After all, the world is a giant barely-held-together operation, and models have learned quite a lot from us. Also, many times, people only need to convince themselves.

## Harness

An agent harness, also called a scaffold, is the system that lets a model act as an agent. It handles inputs, organizes tool calls, manages state, executes the loop, and returns results back to the model. It includes the file system, task board, test scripts, browser, shell, git, logs, sandbox, permission system, checkpoints, handoff notes, and so on.

The first generation of long-running harnesses was conceptually simple. It mainly used two kinds of agents:

**Initializer agent:** Runs at the beginning and sets up the working frame and environment.

**Coding agent:** Makes incremental progress session by session, leaving structured handoff artifacts before it exits.

The initializer agent does several things.

First, it creates a task list. For example, if the user only says "build a claude.ai clone," the initializer does not let later agents start coding immediately. It breaks the task into many verifiable features, such as creating a new chat, typing a message, sending on Enter, receiving a response, switching themes, and loading conversation history. Each feature starts as failing.

Second, it creates a progress file. A file such as `claude-progress.txt` records what each round did, what remains, and what later agents should pay attention to.

Third, it creates a startup script. For example, `init.sh` tells later agents how to install dependencies, start the service, and run basic checks.

Fourth, it initializes a git repo. Each session commits at the end, so later agents can understand recent changes through `git log`, and the system can roll back, diff, and audit.

Later coding agents roughly follow three phases.

First, they orient themselves to the current engineering state: confirm the working directory, read the progress file and feature list, inspect the recent git log, and run an end-to-end test to make sure the basic functionality is not broken.

Second, they select, implement, and validate one feature: choose the highest-priority unfinished feature, implement a relatively independent increment, test it, and evaluate it.

Third, they hand off a clean state to the next round. They update the feature status and progress file and commit. If a new feature is not finished, they should leave a clear boundary instead of pretending it is complete.

A long-running agent is essentially stitching a long task together from many short sessions. If each session leaves behind a small mess, errors compound. So the harness should not only reward "verifiable increments," but also reward the state the system is left in. If a session adds three features but breaks the startup flow, the next session may spend a huge number of tokens just recovering the environment. In the long run, that kind of progress is negative progress.

## Planner / Generator / Evaluator

The first-generation harness solved the context handoff problem, but one major problem remained: agents are not good at judging themselves. In Anthropic's second-generation harness, they introduced a more explicit multi-agent structure. The final shape roughly contains three roles:

**Planner:** Expands the user's high-level prompt into specifications, a feature list, design direction, and an implementation plan.

**Generator:** Implements according to the plan: writing code, changing the UI, connecting the backend, and running tests.

**Evaluator:** Acts like QA. It uses the application, checks the result, points out problems, and decides whether the work passes.

Different roles correspond to different failure modes.

The planner solves under-scoping. Without a planner, the generator often interprets the task too narrowly. For example, for "build a 2D retro game maker," a single agent might build a page that can place a few tiles and decide it is done. A planner should expand that into a richer product spec: level editor, sprite editor, entity behavior, playable test mode, animations, export, sound effects, AI-assisted generation, and so on.

The generator solves execution. It is still the main laborer, but it no longer decides the entire product boundary from scratch. It works within a clear spec and current feature contract.

The generator also does not have to be a single agent. It is better understood as a role: multiple generator sessions or coding agents execute sequentially. Each generator reads the planner spec, current code, progress file, and previous evaluator feedback; completes a bounded increment; writes state back; and exits. The next generator reads these artifacts and continues. The continuity of a long-running harness lives in external project state: progress files, feature lists, git commits, and test results.

The evaluator solves self-evaluation. It does not only read code and produce a score or feedback. It uses Playwright or browser automation to click through the application like a user, checking UI behavior, APIs, database state, and edge cases. In this sense, it moves from "LLM as a judge" toward "agent as a judge."

At the beginning of each sprint, the generator and evaluator negotiate what completion means for that piece of work. The generator does not first finish the work and then ask the evaluator to criticize it. Instead, before coding, both sides communicate and reach consensus.

This "negotiation" happens through files and workspace artifacts. The generator writes a sprint contract proposal: what this sprint will do, what the acceptance criteria are, and what is out of scope. The evaluator reads the planner spec and the proposal, adds missing edge cases or rejects an overly broad scope, and then the generator revises the contract. What they share is the spec, contract, progress, code, test results, and feedback.

During this negotiation, a vague user story becomes a testable contract. It is similar to product requirement clarification plus a QA test plan in a human team.

However, giving evaluation to another LLM does not automatically solve the problem. Claude was not a good QA agent at first. It would discover real issues, then convince itself those issues were not serious, or it would only run shallow tests and avoid edge paths. The evaluator itself has to be tuned. It needs a clear rubric, failure cases, judgment criteria, interaction paths it must explore, and bug types it should not easily dismiss. Ideally, we should read its logs, find where it disagrees with human judgment, and iterate on the evaluator prompt.

Anthropic's front-end harness used several scoring dimensions:

**Design quality:** Does the overall product have a clear visual character, instead of feeling like a pile of components?

**Originality:** Does it make custom design decisions rather than relying on templates and default libraries? Does it avoid an obvious AI-generated feel?

**Craft:** Typography, spacing, color, contrast, and related details.

**Functionality:** Can the user understand and complete the task? This is the most important usability dimension.

So when using a judge, we should not ask abstractly whether something is "good." We need to decompose "good" into checkable dimensions. Similarly, in the application development harness, the evaluator scores product depth, functionality, visual design, and code quality, and each dimension has a hard threshold. If any key dimension is below the threshold, the sprint fails and the generator must revise based on concrete feedback.

When evaluating, we should not evaluate "the agent says it is done." We should evaluate the final environment state and outcome. A flight-booking agent saying "I booked it for you" is meaningless; we need to check whether the reservation actually exists in the database. A coding agent saying "bug fixed" is meaningless; what matters is whether the tests pass, and whether the original code state was damaged.

/btw

Many life lessons apply here. For example, when evaluating a person, what they did matters more than what they said. Because of my strangely persistent "therapist trait," this is something I often discuss when talking with girls around me about their relationship problems. It is much easier to analyze other people's dilemmas than to get out of my own. On the one hand, I often become other people's therapist; on the other hand, I need a therapist myself, but it is hard to find one I trust.

After I started writing blogs, I actually became much calmer. Maybe I am my own best therapist. Writing lets me sit down and talk with myself. Before this, I gave almost all my time to other people and allocated almost none to myself. Also, even though I keep worrying about finding a job and about being replaced as a researcher by LLMs in the near future, I still think I am better at therapy than the most state-of-the-art LLMs. Unfortunately, this trait cannot make me a living, and it was never on my career path. Anyway, I digress.

A few caveats are worth emphasizing. The planner mainly solves initial under-scoping. A user prompt is often too broad, such as "build a 2D retro game maker." The planner makes it concrete: what core modules the product needs, which features are must-haves, which can wait, and how each feature should be accepted.

As the project progresses, the evaluator often takes over part of the local planner role by doing feedback-driven replanning. The evaluator can modify the artifacts left by the planner. For example, the planner may initially define a sprite editor as only needing draw and save. After real testing, the evaluator might add new acceptance criteria: brush size must work, transparent pixels must be preserved, saved sprites must appear in the entity palette, and reloading the project must preserve state. This replanning can be implemented by changing external files such as `feature_list`, `sprint_contract`, `known_issues`, and `next_actions`.

In other words, a multi-agent harness puts planning, execution, evaluation, and revision into external artifacts, so that each round of agents can take over with limited context.

## More Durable Design

Every component of a harness implicitly contains an assumption that the model cannot do something well by itself. As the model improves, those assumptions may stop being valid. For example, if a model has context anxiety, the harness may add context reset. Later, if the model no longer has this problem, reset may become unnecessary latency and cost. If a model cannot plan, we add a planner. Later, if the model's planning ability improves, the planner may only be useful for large tasks. If a task can already be reliably completed by the generator alone, the evaluator may become redundant overhead. But if the task is just beyond the model's capability boundary, the evaluator can still bring a large improvement.

So a harness is not better just because it is more complex. We should start from the simplest workable system, use evals to find failure modes, add structure only for real failure modes, and periodically remove components that are no longer load-bearing as models improve. We should not begin by building an overly complex agent framework.

An agent system can be decomposed into several relatively stable abstractions:

**Session:** An append-only log of what happened.

**Harness:** The control layer that calls the model, routes tools, and executes the agent loop.

**Sandbox:** The environment where the agent can run code and modify files.

By decoupling them, the underlying implementation can keep changing while the external interface remains stable. Long-running agent harnesses will continue to evolve, and stable abstractions prevent an agent product from being tied to one generation of scaffold.

## Agent Eval

Agent behavior is nondeterministic. Running the same prompt twice may produce one success and one failure. A task passing once does not mean the system is reliable. A task failing once may mean the grader is wrong, the environment is broken, or the task itself is ambiguous.

Compared with ordinary LLM evals, agent evals should not only inspect output text. They should inspect the effects that a sequence of actions has on the environment. This is why agent evals need sandboxes, databases, browsers, file systems, mock APIs, resettable environments, and so on.

Different tasks also care about different metrics. For a coding agent, if we allow the agent to try multiple times, `pass@k` is a reasonable metric: the probability that at least one of k attempts succeeds. If one patch is correct, it can enter review. But for customer service, expense reimbursement, or flight booking agents that users interact with directly, `pass^k` is more important: the probability that all k attempts succeed. Users expect reliability every time, not that one out of ten attempts is correct.

There is also a difference between capability evals and regression evals. Capability evals should include tasks the current system does not yet do well. Regression evals ask, "Can it still do what it used to do?" These should be close to 100% pass, to prevent regressions after a system upgrade, model switch, or prompt change.

## Agentic Safety and the Importance of Good RL Environments

In the non-agentic era, a model could only produce text, so the blast radius of a mistake was relatively small. Now agents can run shell commands, modify files, access databases, call SaaS APIs, send Slack messages, and open pull requests. The cost of mistakes is much higher.

For safety, we cannot rely only on "the model will know this command is dangerous." A safer approach is to restrict what the agent can access, where it can write, which networks it can reach, which tools require approval, which state can persist, and which secrets should never be visible.

This requires a well-designed RL environment. And when we talk about RL environments, we inevitably have to talk about reward hacking: we should not put shortcuts into the environment if we do not want agents to use them. For example, in a coding eval, future commits should not be left in `.git/objects`, and hidden tests should not be placed inside the container. More generally, any secret that can access production systems, such as API keys, OAuth tokens, cloud provider keys, or SSH keys, should not be directly exposed to the agent. Instead, we can use controlled tool capabilities, with permission checks, parameter constraints, and auditing inside the tool.
