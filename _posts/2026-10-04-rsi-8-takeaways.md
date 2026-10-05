---
layout: post
title: "Where AI Self-Improvement (RSI) Stands: 8 Takeaways / AI 自我改进（RSI）走到哪一步了：8 条 take away"
date: 2026-10-04
categories: technical
tags: [ai, rsi, self-improvement, agents, llm, environments, workshop]
excerpt: "On October 3, NICE hosted an online workshop on the mechanisms, evidence and limits of AI self-improvement, with four researchers who work on RSI. The main approaches, the current bottlenecks, how to evaluate it, and what it means for academia and industry — summarized in 8 takeaways."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

On October 3, [NICE](https://nice-intl.github.io/) hosted an online workshop, "Mechanisms, Evidence and Limits of AI Self-Improvement," with four researchers who work on this topic: Chengsong Huang (PhD student, Washington University in St. Louis), Shilong Liu (postdoc at Princeton University, joining Columbia University as an assistant professor in fall 2027), Da Yin (NeoCognition) and Cheng Qian (PhD student, UIUC). They discussed the main approaches to RSI, its current bottlenecks, how to evaluate it, and what it means for academia and industry. I summarized the discussion in the 8 takeaways below.

## 1. RSI improves the whole system, not just the model

When people say "self-improvement" today, what gets improved is a whole agent system. At least three parts of it can be changed.

* **Weights.** Training changes the model itself.
* **Harness.** The tools, memory and execution flow wrapped around the model. Changing it does not require retraining the model.
* **Environment and data.** Huang's view is that whatever algorithm you use to optimize an agent, you need training data that is harder and closer to the downstream task, and for agents that data is the environment. A stronger model can synthesize better environments, and better environments in turn train a stronger model.

The three advance in turns. Qian calls it an "upward spiral": components of the harness get trained into the model's own abilities, and the stronger model then needs a new harness. Liu's research trajectory followed the same order: first let the model build its own tools, then let it explore in environments, and finally train the model on the weakly supervised data that the exploration produced.

If all three can be changed, they should be changed together. Huang argues that co-optimizing them can never do worse than optimizing each one separately; the only cost is that the optimization itself becomes harder.

Yin offered an analogy. In snooker it is hard to say which cue is the best. Results come from a player's long practice with their own cue, and even a top player may not reach the same level with a different one. Models and harnesses work the same way: every company has its own infrastructure and data distribution, so company A's training recipe may not work well on company B's harness.

There is also the question of who does the improving. Qian divides self-improvement into three levels: revising the current answer, accumulating experience across tasks, and getting better at generating and selecting improvements. Their AI for AI work sits mainly at the third level. In the past, people designed a harness or a set of skills to make the executor more capable. Now a builder AI builds the harness, writes the environments and does the debugging for a target AI, and the relationship between the two resembles that of an advisor and a PhD student.

## 2. What RSI can do today, and what it cannot do yet

RSI works this time because models can now run the whole improvement loop on their own, and after each change they can find out quickly and cheaply whether the change was right. Tasks where that is not possible mark its current limits: writing, which people have to judge, and scientific questions that need experiments in the physical world.

Why now? Qian gave three reasons:

1. Foundation models can handle every step of the loop on their own: reading code, proposing changes, running experiments, analyzing feedback and recording what they learned. No person is needed to connect the steps.
2. Harnesses made improvement cheap. Without retraining the model, you can change how a tool is wrapped, the memory policy or the execution flow, and test the change directly on the existing model.
3. There are more executable environments. Reinforcement learning has its gyms, and many new benchmarks are no longer "one input, one output" but sandboxes in which an agent can act freely. In environments like these a system gets more direct feedback.

Liu's view is that a person plus a computer has always been an RSI system. The person's bandwidth is just too narrow, and a person cannot run 24 hours a day, seven days a week. The loop only became fast once LLMs took over some of the person's steps.

Huang pointed to the most important condition: reward has to be cheap. When his team used AI to optimize test-time scaling algorithms, the obstacle was the long wait for each reward. They then precomputed the results and turned the setup into a static simulation. Once reward came back quickly, optimizing the algorithm "became a very simple thing." If the problem is then recast as writing code or text (code as policy), a language model can take it over.

So what can it not do yet? Liu's assessment is that when the environment is verifiable, a model will do well given some time. The hard cases are those where results are difficult or expensive to verify, such as science and engineering problems in the physical world. Huang's example is writing: whether a revision is better still has to be decided by people in an A/B test, each round of feedback takes a long time, and so the loop is slow. In his view, RSI has little trouble with any problem that can be written as code and gives reward easily. The bottleneck is that many real-world settings cannot be modeled that way.

For Liu, the central problem of RSI is how to get good reward from the real world. A connecting layer is still missing between today's AI systems and real problems in work and daily life. He considers this the most important piece and also the hardest, but "once the connection is made, it can develop well on its own."

He added that real-world problems never come with a perfect reward anyway. People also rely on many proxy tasks to filter out wrong answers layer by layer. So there is no need to reach 100% in one step; getting a little better each time is enough.

## 3. The environment is the overlooked knob

An agent learns from the trajectories it produces by interacting with an environment. Yet people have only optimized the agent side, while the environment side is expensive and never changes. This is the starting point of EnvHarness, a paper Huang wrote during an internship at Google.

First, the cost. The 89 environments in Terminal-Bench 2.0 each took an expert 15.9 hours on average, about 1,400 hours in total. The 33 environments in APEX-Agents are heavier: about 485 hours each, about 16,000 hours in total, or $1.6 million at $100 an hour. Training needs thousands or tens of thousands of environments, and people cannot build that many by hand.

Second, the environments do not change. Once built, an environment has one fixed difficulty: a weak model never solves it, a strong model finds it too easy, and neither learns anything. Even if the difficulty is right at the start, the environment stops being useful after a few rounds of training make the model stronger.

EnvHarness does not build new environments. It wraps a harness around an existing one, the same idea as an agent harness wrapped around a frozen model. The task itself and the verifier that decides whether the task is done stay untouched. Only four things are adjusted: the initial state, the actions, the observations and the state transitions. It has three components:

* **Stage** changes the initial state. Take the task "put a clean mug on the table": hide the mug in a drawer first and the task gets harder; put the mug in the agent's hand in advance and it gets easier.
* **Contract** changes the rules. Disable the shortcut action that goes straight to a location, and the agent has to learn to navigate.
* **Chain** links several short tasks into one long task. Finishing one does not end the episode; the agent goes on to the next.

The harness is written by another agent, called EnvRigger. It reads the trajectories the policy produced, finds systematic weaknesses, writes a piece of harness code, and then has the policy run a new batch of trajectories in the modified environment to validate the change. If the task has become unsolvable, or no longer poses any challenge, the change is rejected.

The talk included an example from SWE-bench. The policy kept submitting patches without running the failing test, so EnvRigger wrote a fake pre-commit hook that blocks such submissions. From this the policy learned a skill: run the tests both before and after a change. In this experiment EnvRigger and the policy being trained used the same model, so the gain was not distilled from a stronger model.

## 4. The biggest technical bottleneck is attribution

The middle step of self-improvement is diagnosis: see a failure, find its cause, and propose a change that can be tested. Qian considers this the main bottleneck right now.

The difficulty is that the same surface symptom can have entirely different causes. A failure may come from reasoning, from a tool interface, from missing information or interference from the memory module, or even from a misreading of the training objective, and each calls for a different intervention. Until now this step has relied on human experience.

The weakness of today's models is that they work bottom-up. They look at what went wrong case by case and then patch each case. A person works top-down: first judge where the overall approach is flawed, then verify. Attribution by patching one case at a time overfits easily.

Qian suggested two directions.

* **Diagnosis needs evidence.** Look at intermediate states, at the gap between the expected result and the actual feedback, and at actual resource use, and infer the cause from these. The system cannot be treated as a black box.
* **Attribution needs controlled experiments.** As in an ablation study in a paper, replace or remove one of the model, the tools, the memory or the execution flow, or replay the run, and see how the result changes. Today this work is done mostly by people.

His conclusion: what the system needs to be taught is not a trick for some benchmark but a more abstract way of thinking, namely how to test a hypothesis.

EnvRigger, described above, can be seen as a small-scale implementation of this idea. It looks for systematic weaknesses across many trajectories instead of targeting a single case.

## 5. Gains from self-iteration saturate quickly, and a higher score does not mean more capability

Qian described a pattern from their experiments. They had a model improve its own harness repeatedly and measured the effect after each round. On the held-out set, the score rose for the first few rounds and stopped rising by the fourth or fifth. So more iteration does not mean better results. But the model cannot tell when to stop. In Qian's words, cost control "may simply not be on its mind": when the results stop improving, it keeps adding rounds. Optimization that keeps polishing small details overfits more and more, and in the end the score can even drop.

People work differently. They try an idea on a small portion of the data first and commit large-scale resources only after it proves effective. That small portion should also be as diverse as possible, so that it exposes as many problems as possible. Qian thinks this staged allocation of resources is exactly what systems need to learn.

Huang added that RSI easily overfits to the task at hand. What it finds may be a shortcut, or even a way to hack the task outright. So one has to tell apart an agent that has really become stronger from one that has only become better at this kind of problem.

An audience member asked whether self-improvement that cannot loop forever still counts as RSI. Huang answered that a model has a finite number of parameters, so its ability must have a ceiling, and "hoping that RSI can improve without limit is unrealistic." What matters is how fast a system approaches the ceiling, and whether it can sense how far it is from saturation so that it can stop early.

Qian added that the number of iterations should not be a threshold in the definition. A loop stops when the budget runs out or when marginal gains shrink. What matters is whether the overall direction is upward.

## 6. A train/test split is not enough to evaluate RSI

For a system that finds shortcuts on its own, setting aside a test set does not prevent data leakage or reward hacking. How should it be evaluated, then? Each of the four speakers offered an approach.

**Use one-time evaluations tied to a point in time.** This is Huang's proposal. One kind is prediction: put the old and new versions of a model into a real market at the same time, or have them predict future events. Nobody knows the answers in advance, so nothing can leak. The other kind is human A/B testing. The price is high cost and slow results, which means an RSI algorithm cannot be measured online.

**Or step back and use fully controlled synthetic environments.** The compromise Liu described is to build your own environments and fill them with synthetic data the model has never seen. But he thinks evaluation ultimately has to land in real workflows such as finance, law and medicine, where people have already defined many metrics.

**Environments should be realistic, controllable and dynamic.** These are Qian's three criteria. Controllable means, first of all, reproducible: the larger the environment, the less stable the results when different people test the same model. Because RSI runs for many rounds, controllable also means that the gain from each round can be measured separately. Dynamic means that the environment reveals constraints or user intent step by step, which tests how a model adapts when results differ from what it expected. Realistic and controllable pull against each other, however: real-world signals are messy and hard to turn into a structured environment, while an environment built entirely by hand or by an LLM looks fake.

**Decide first which learning challenge you want to test.** Yin argues that an RSI benchmark cannot be just a subset of an older benchmark. It needs a learning challenge of its own, and efficiency and cost should be part of the metrics. When his team built ApprenticeBench, preventing reward hacking still depended on a lot of people reading agent trajectories. He thinks that detecting this behavior at scale could be a benchmark in itself.

The host, Dawei Li, added an observation: these problems closely resemble the ones met earlier when evaluating the reasoning ability of large models, namely memorization, data leakage and overfitting to one domain. Lessons from that work, such as continuously updated evaluations and synthetic data, can be borrowed here.

## 7. Efficiency is an underrated metric

Yin stressed repeatedly that most RSI research today focuses on frontier capability, but in deployment it turns out that agents do not get more practiced the more they work.

He looks at RSI in the setting of enterprise deployment. A new hire reads the documentation, learns the software, practices hands-on and gets feedback from a manager, and eventually becomes proficient. For AI to enter a company's workflow, it has to go through the same process. ApprenticeBench, recently released by his company NeoCognition, tests exactly this. The job it chose is construction finance accounting, an ordinary white-collar accounting role that does not need a particularly smart model.

People are also unpracticed at first. But after doing the same kind of task dozens or hundreds of times, they always get faster, moving from System 2, which requires thinking, to System 1, which does not. In their evaluation, models showed no such shift at all. As he put it: "It makes no sense that after an agent has done 100 tasks, the time and cost it spends are about the same as before, or even higher than at the start."

He proposed three directions:

* Index and organize learned experience better, so that it can be retrieved quickly when a similar situation comes up.
* Turn the repeated procedures in the work into reusable skills or tools.
* Learn the job with a frontier model first, then compress the workflow knowledge it gained into a smaller, more specialized model.

This is not only an enterprise problem. Yin said that when training one generation of models after another, people likewise want to distill the reusable knowledge from earlier iterations so that later ones need fewer experiments. Questions of efficiency and cost like these happen to be a direction that academia can afford to work on and that is still at the frontier.

## 8. The human role moves up a level

Once AI takes over solving problems that are already well defined, the value of people lies in finding the problem and defining it clearly.

Liu's view is that people have always been moving up one layer of abstraction at a time: from assembly to C++ and Python, and then to neural network frameworks. In the early days everyone still wrote gradient descent by hand. The lower layers still matter, but most people can put their effort where it is closer to applications and creates more value. This is not necessarily a bad change.

Huang has reviewed papers written by a fully automated research system. His impression is that the defining feature of a purely AI-generated paper is that it "uses experiments to prove something that is not necessarily an important question." AI is very good at incremental improvement on well-defined problems, such as pushing a benchmark score a little higher.

Real research is more about discovering a problem and then defining it clearly: what the input is, what the output is, and what the metric is. The rest can be handed to AI. "We have gone from being a PhD student to being a PI, from someone who writes code to a project manager, from someone who solves problems to someone who finds them."

Qian said that human insight should go into the meta level. The question used to be how to be a good PhD student. Now the question is how to be a good advisor: how to give downstream agents a more stable harness, environment and feedback mechanism, so that their self-iteration can keep running reliably.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

10 月 3 日，NICE 举办了一场线上的 workshop「AI 自我改进的机制、证据与边界」邀请了四位这个方向的研究者：**黄呈松**（圣路易斯华盛顿大学博士生）、**刘世隆**（普林斯顿大学博士后，2027 年秋将任哥伦比亚大学助理教授）、**殷达**（NeoCognition）和**钱成**（UIUC 博士生），一起讨论 RSI 的主流路线、当前瓶颈、评测方法，以及它对学术界和工业界的影响。下面是这次讨论总结成的8 条 take away。

## 1. RSI 改的是整个系统，不只是模型

今天说"自我改进"，改的对象已经是一整套 agent 系统，能动的地方至少有三处。

* **权重。** 通过训练改模型本身。
* **Harness。** 包在模型外面的工具、记忆和执行流程，改它不用重训模型。
* **环境和数据。** 黄呈松的看法是，不管用什么算法优化 agent，都需要更难、更贴近下游任务的训练数据，在 agent 场景里这就是环境。模型变强后能合成更好的环境，更好的环境再训出更强的模型。

这三处会交替推进。钱成的说法是"螺旋上升"：harness 里的部件会被训进模型自己的能力，模型变强之后又需要新的 harness。刘世隆的组走过的路线也是这个顺序：先让模型自己造工具，再到环境里探索，最后用探索得到的弱监督数据训模型。

既然都能改，就该一起改。黄呈松认为，协同优化的结果一定不差于单独优化，代价只是优化过程更难。

殷达打了个比方：斯诺克里很难说哪根球杆最好，成绩来自球员和自己那根杆的长期磨合，换一根杆，顶尖球员也可能再打不出原来的成绩。模型和 harness 同理：各家公司的基础设施和数据分布都不一样，A 公司的训练配方搬到 B 公司的 harness 上未必好用。

还有一个问题是谁来改。钱成把自我改进分成三层：修改当前答案，跨任务积累经验，提升"产生和筛选改进方案"的能力。他们做的 AI for AI 主要在第三层。过去是人设计一套 harness 或 skill 去提升执行者的能力；现在让一个 builder AI 给 target AI 搭 harness、写环境、做 debug，两者的关系像导师和博士生。

## 2. 现在RSI哪些能做，哪些还暂时不能做？

RSI 这一轮能做起来，是因为模型已经能自己跑完整个改进循环，而且每改一次，都能又快又便宜地知道改对了没有。做不到这一点的任务，比如要靠人来评判的写作、要到物理世界里做实验的科学问题，就是它现在的能力边界。

为什么现在能做起来？钱成总结了三个原因：

1. 基础模型能独立承担闭环里的每个环节：读代码、提修改意见、跑实验、分析反馈、记录经验，中间不再需要人来衔接。
2. Harness 让"改进"变便宜了。不用重训模型，改一下工具包装、记忆策略或执行流程，就能直接在现有模型上验证。
3. 可执行的环境多了。强化学习里有各种 gym，很多新的 benchmark 也不再只是"一个输入、一个输出"，而是 agent 可以在里面自由执行的沙盒。系统在这样的环境里能拿到更直接的反馈。

刘世隆认为：人加电脑本来就是一个 RSI 系统，只是人的带宽太窄，没法一周七天、一天二十四小时地转。LLM 接手了人的一部分环节，循环才快起来。

黄呈松点出了其中最关键的一条：reward 要便宜。他们用 AI 优化 test-time scaling 算法时，卡住的地方是每拿一次 reward 都要等很久。后来把结果提前跑好、改成静态模拟，reward 能很快拿到，优化算法就"变成了一个非常简单的事情"。再把问题改写成写代码或写文本（code as policy），语言模型就能接手。

那哪些还暂时不能做？刘世隆的判断是，环境可验证时，给模型一些时间它就能做好；难的是不容易验证、或者验证成本很高的场景，比如真实物理世界里的科学和工程问题。黄呈松举的例子是写作：一版改得好不好，目前还得靠人做 A/B test，每轮反馈隔得很久，循环自然慢。在他看来，一个问题只要能写成代码、又容易拿到 reward，RSI 就没什么问题；瓶颈在于很多真实场景没法建模成这样。

刘世隆认为，RSI 最核心的问题，是怎么从真实世界里拿到好的 reward。现在的 AI 系统和真实的生产、生活问题之间，还缺一个把两边接起来的连接层。他觉得这件事最重要，也最难，不过"只要连接上了，它自己就可以发展得很好"。

他还补充，真实世界的问题本来也没有完美的 reward，人们同样是靠大量 proxy 任务一层层筛掉错的答案。所以不必一步做到 100%，每次比之前好一点就够了。

## 3. 环境是被忽视的那个旋钮

Agent 靠它和环境交互出来的轨迹学习，可是大家一直只优化 agent 这一侧，环境那一侧又贵又不会变。这是黄呈松在 Google 实习期间的论文 EnvHarness 的出发点。

先说贵。Terminal-Bench 2.0 的 89 个环境，平均每个要花一位专家 15.9 小时，合计约 1,400 小时。APEX-Agents 的 33 个环境更重，每个约 485 小时，合计约 16,000 小时，按每小时 100 美元算是 160 万美元。训练要的是成千上万个环境，靠人造不出来。

再说不会变。一个环境造好之后只有一个固定难度：对弱模型永远做不对，对强模型又太简单，两头都学不到东西。即使一开始难度合适，模型训几轮变强之后，这个环境也就失效了。

EnvHarness 的做法是不新建环境，给现成的环境套一层 harness，思路和 agent harness 包在冻结的模型外面一样。任务本身和判定任务是否完成的 verifier 都不动，只调初始状态、动作、观测和状态转移这四样。它有三个组件：

* **Stage** 改初始状态。任务是"把洗干净的马克杯放到桌上"：把杯子先藏进抽屉，任务变难；提前替 agent 把杯子拿好，任务变简单。
* **Contract** 改规则。禁掉"直接走到某处"的快捷动作，agent 就必须学会导航。
* **Chain** 把几个短任务串成一个长任务，前一个做完不结束，接着做下一个。

写这层 harness 的是另一个 agent，叫 EnvRigger。它读策略跑出来的轨迹，找出系统性的弱点，写一段 harness 代码，再让策略在改过的环境里重新跑一批轨迹来验证。如果任务变得无解，或者毫无挑战，这次修改就被拒绝。

报告里举了一个 SWE-bench 上的例子。策略总是不跑那个失败的测试就提交补丁，EnvRigger 于是写了一个假的 pre-commit hook，把这类提交拦下来。策略由此学到一条技能：改之前和改之后都跑一遍测试。这个实验里 EnvRigger 和被训练的策略用的是同一个模型，所以提升不是从更强的模型蒸馏来的。

## 4. 最大的技术卡点是归因

自我改进的中间一步是诊断：看到失败，找到原因，再提出一个可以验证的修改。钱成认为这是眼下最主要的卡点。

难处在于，同一种表面现象可能有完全不同的原因。一次失败可能来自推理，来自工具接口，来自信息缺失或记忆模块的干扰，甚至来自对训练目标的理解有偏差，每种都需要不同的干预。过去这一步靠的是人的经验。

模型现在的毛病是自下而上。它会 case by case 地看错在哪，再反过来打补丁。人会先自上而下地判断整体思路哪里有问题，再去验证。逐例打补丁式的归因很容易过拟合。

钱成给了两个方向。

* **诊断要有证据。** 看中间状态，看预期结果和实际反馈之间的差距，看实际的资源消耗，再从这些去推原因，不能把系统当黑盒。
* **归因要做对照实验。** 像论文里做消融实验那样，把模型、工具、记忆、执行流程里的某一样替换掉或去掉，或者 replay 一遍，看结果怎么变。这些事现在主要是人在做。

他的结论是，要教给系统的不是某个 benchmark 上的技巧，而是"怎么做假设检验"这种更抽象的思考方式。

前面提到的 EnvRigger 可以看成这个思路的一个小规模实现。它从多条轨迹里找系统性的弱点，而不是只针对于单个 case。

## 5. 自我迭代的收益饱和得很快，而且分数涨了不等于能力涨了

钱成讲了他们实验里的一个现象。他们让模型反复改进自己的 harness，每改一轮就测一次效果。结果在隐藏集上，分数前几轮在涨，到第四五轮就不再涨了。所以并不是迭代得越多，效果就越好。但是模型判断不了什么时候该停，钱成说，成本控制这件事"可能根本就不在它的脑子里"：效果上不去，它还会继续加轮数。抠细节式的优化越做越过拟合，最后甚至会掉点。

人的做法不一样。先在一小部分数据上试，确认有效再投入大规模资源。这一小部分还要挑得尽量多样，能暴露的问题越多越好。钱成认为，系统要学会的正是这种分阶段的资源分配。

黄呈松补充道，RSI 很容易过拟合到手上的任务，找到的可能是捷径，甚至是直接 hack 了这个任务。所以要分清，agent 是真的变强了，还是只是更会做这一类题。

有观众问：不能无限循环的自我提升，还算不算 RSI？黄呈松回答说，模型的参数量有限，能力一定有上限，"希望 RSI 可以无限提升是个不现实的事情"。值得关心的是多快能接近上限，以及能不能感知离饱和还有多远，好提前停下来。

钱成补充，迭代次数不该成为定义的门槛。预算用完、边际收益递减都会让循环停下，要看的是大方向是不是在往上走。

## 6. 评测 RSI，train/test 切分不够用

一个会自己找捷径的系统，靠"划一个测试集"防不住数据泄露和 reward hacking。那该怎么评测？四位嘉宾各给了一个思路。

**用一次性的、和时间绑定的评测。** 这是黄呈松的主张。一类是预测：把新旧两版模型同时放进真实市场，或者让它们预测未来的事件，答案事先谁都不知道，也就没有泄露。另一类是让人做 A/B test。代价是成本高、出结果慢，没法在线地衡量一个 RSI 算法。

**或者退一步，用完全可控的合成环境。** 刘世隆提到的折中办法是自己构造环境，放进模型从没见过的合成数据。但他认为最终还是要落到金融、法律、医疗这些真实的工作流里，那里有大量人们已经定义好的指标。

**环境要做到真实、可控、动态。** 这是钱成的三个标准。可控首先是可复现：环境越大，同一个模型由不同的人测出来的结果越不稳定。RSI 要迭代很多轮，可控指的是，能分别衡量每一轮迭代带来了多少提升。动态指环境会逐步揭示约束或用户意图，考的是模型发现结果和预想不一样时怎么适应。但是，真实和可控互相矛盾：真实世界的信号是乱的，很难做成结构化的环境；全靠人工或 LLM 构造，又会显得很假。

**先想清楚要考的学习难点是什么。** 殷达认为一个 RSI benchmark 不能只是旧 benchmark 的子集，得有自己要考的 learning challenge，效率和成本也应该算进指标。他们做 ApprenticeBench 时，防 reward hacking 靠的还是大量人力去看 agent 的轨迹。怎么可扩展地发现这类行为，他觉得本身就可以做成一个 benchmark。

主持人李大卫补了一个观察：这些问题和当年评测大模型推理能力时遇到的很像，都是死记硬背、数据泄露、在一个领域上过拟合。实时更新的评测和合成数据等经验，是可以在这里借鉴的。

## 7. 效率是被低估的指标

殷达反复强调， 现在的 RSI 研究大多盯着前沿能力，落地时发现agent 不会越做越熟。

他把 RSI 放进企业部署的场景里看。新人入职要读文档、学软件、上手操练、拿上级的反馈，最后成为熟手。AI 要进入企业的工作流，也得走一遍这个过程。他所在的 NeoCognition 最近发布的 ApprenticeBench 考的就是这件事，选的岗位是 construction finance accounting，一个普通的会计类白领岗位，并不需要多聪明的模型。

人刚上手时也生疏，但同一类事反复做上几十上百回，一定越来越快，从需要想的 System 2 变成不用想的 System 1。在他们的评测里，模型完全没有表现出这种转变。他评论道："你没有道理说这个 agent 做了 100 个 task，它花的时间和 cost 还是跟之前差不多，甚至比一开始还要更高一些。"

他提了三个可做的方向：

* 更好地索引和组织学过的经验，遇到类似情况能快速取回来。
* 把工作里重复的流程沉淀成可以反复使用的 skill 或工具。
* 先用前沿模型把事情学会，再把学到的工作流知识压缩进更小、更专的模型。

这不只是企业的问题。殷达说，从一代模型训到下一代，同样希望把前几轮迭代里可复用的知识总结下来，后面少做些实验。这类效率和成本的问题，恰好是学界做得起、又足够前沿的方向。

## 8. 人的位置上移一层

AI 接手"解决已经定义好的问题"之后，人的价值在于找到问题，并把它定义清楚。

刘世隆认为，人一直在一层层往上抽象：从汇编到 C++、Python，再到神经网络框架，早年大家还要手写梯度下降。底层仍然重要，但大多数人可以把精力放到离应用更近、更能产生价值的地方。这未必是坏的变化。

黄呈松参与过一个全自动科研系统所写论文的审稿。他的感受是，纯 AI 生成的论文最大的特点是"用实验证明了一个不一定是很重要的问题"。AI 很擅长在定义完善的问题上做增量改进，比如把一个 benchmark 的分数再推高一点。

真正的研究更多是发现一个问题，再把它定义清楚：输入是什么，输出是什么，指标是什么。后面的事可以交给 AI。"我们从一个 PhD 变成了一个 PI，从一个写 code 的人变成了 project manager，从解决问题的人变成了一个找问题的人。"

钱成说：人的 insight 应该注入到 meta 层。以前讨论的是怎么做一个好的博士生，现在该想的是怎么做一个好的导师，也就是怎么给下游的 agent 提供更稳的 harness、环境和反馈机制，让它的自我迭代能稳定地跑下去。

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
