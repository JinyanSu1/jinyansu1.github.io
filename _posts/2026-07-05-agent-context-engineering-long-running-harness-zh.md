---
layout: post
title: Agent 从 Context Engineering 到 Long-running Harness 的演变过程
date: '2026-07-05 17:50:00 -0700'
categories: technical
tags:
- agents
- context-engineering
- harness
- evals
- anthropic
excerpt: 从 LLM + tool use 到 context engineering，再到 long-running agent harness：agent
  能力正在从模型能力，变成模型、harness、context、tools、eval、sandbox 和 state management 一起构成的系统能力。
---

过去几年，大模型进步的主线大多围绕“模型本身”：参数、数据、pretraining、post-training、reasoning。早期我们谈 agent，最常见的定义也很简单：**LLM + tool use**。模型不只是生成文本，还能调用搜索、代码解释器、浏览器、文件系统、API，于是它看起来开始“做事”。

但 agent 把问题改掉了。

只要模型开始调用工具，真正的问题很快就不再只是“会不会调用”。它还要知道什么时候调用、调用哪个工具、把工具返回的结果放在哪里、下一步该看哪些历史、哪些中间结果应该丢掉。于是 agent engineering 的第一层重点逐渐变成 **context engineering**：管理模型每一步 inference 时看到的上下文，让多轮工具使用不被历史、噪声、工具定义和中间结果淹没。

再往后，当 agent 不只是完成几轮工具调用，而是要在一个环境里连续行动几十分钟甚至几个小时，问题又扩大了一圈。能力不再只存在于模型权重里，也不只存在于 prompt 或 context 里。它还存在于模型能保存什么状态、怎样判断自己做对了没有、失败后怎样恢复、跨越多个 context window 后怎样继续同一个目标。

也就是说，LLM 到 agent 的转变，不只是“给模型加工具”。它更像是把一个语言模型放进一个运行时系统里：

```text
model
+ context
+ tools
+ memory / state
+ sandbox
+ eval
+ control loop
= agent system
```

Anthropic 这几篇工程文章最有意思的地方，就在于它们把这条演化线讲得很清楚：agent 最开始像是 **LLM + tools**；随后，稳定的 tool use 逼出了 **context engineering**；再往后，long-running tasks 又逼出了更完整的 **harness**。到了这一步，agent 能力就变成了模型、harness、context、tools、eval、sandbox、state management 一起构成的系统能力。

所以，long-running agent 不是“把聊天机器人开久一点”。它更像一个小型操作系统问题：怎么让一个非确定性的模型，在有限上下文、外部工具和可变环境中，持续推进一个目标，而且越做越接近完成。

这也是最近 AI Engineer 上 Anthropic 那场 *Build Agents That Run for Hours* workshop 背后真正值得写的东西。视频本身讲得很清楚，但我更想沿着它背后的几篇工程文章来写，因为这些 post 里有更完整的技术脉络：

- Anthropic 的 [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Writing effective tools for agents -- with agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)

如果说早期 agent 的重点是“模型能不能自己规划、调用工具、写代码”，那么 long-running agent 这条线索给出的答案更工程化：模型当然要变强，但光有模型不够。你还要给它一个能让它持续工作的外部身体。

这个外部身体，就是 harness。

## 先看两条线：context engineering 和 long-running harness

这几篇文章不用严格按发布时间一篇篇读。更好的读法是把它们分成两条互相咬合的线。

第一条线是 **context engineering**：当 agent 从一次性回答变成多轮行动系统，真正稀缺的东西不再只是 prompt wording，而是每次 inference 时模型到底看见什么。工具定义、文件内容、网页观察、历史消息、测试输出、MCP server 描述、外部文档、进度记录，都会进入或影响 context。问题变成：哪些信息应该提前给模型，哪些应该按需检索，哪些应该写到外部 memory，哪些应该让代码或工具处理，而不是塞进模型上下文。

这条线大概包括几篇文章。*[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)* 给出原则：先用简单、可组合的 agent pattern，不要一开始就堆复杂框架。*[Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)* 说明工具本身就是 agent-computer interface，工具命名、返回值、错误信息和 token efficiency 都会影响模型行为。*[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)* 把问题正式命名为 context engineering。*[Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)* 则进一步说：当 MCP tools 太多、数据太大时，不要让所有工具定义和中间结果流过 context，而要让 agent 写代码按需调用工具、过滤数据、只把高信号结果带回模型。

第二条线是 **long-running agent harness**：如果 context engineering 解决的是“每一步该看什么”，long-running harness 解决的是“很多步之后怎么还知道自己在干什么”。这条线从 2025 年底开始变得特别清楚。*[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)* 发现 compaction 还不够，因为压缩历史不能稳定告诉下一段工作“项目到底做到哪里”。于是第一版 harness 引入 initializer agent 和 coding agent：initializer 负责搭环境、拆 feature、写 progress file、建 init script、初始化 git；coding agent 每个 session 只做一个增量，结束前测试、记录、commit，把现场留干净。

到了 *[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)*，这个结构继续长大。问题不只是跨 context 接力，而是完整应用开发里的产品质量、自我评价和 QA。于是 harness 从 initializer/coding agent 进化成 planner / generator / evaluator：planner 拆规格，generator 实现，evaluator 像 QA 一样操作应用、测试功能、拒绝不合格结果。

中间还有一条横切的线是 **eval 和抽象化**。*[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)* 说明 agent eval 不能只看最终文本，而要看 trajectory、tool calls、环境状态和 final outcome。没有 eval，你不知道一个 harness 是真的更强，还是只是更复杂、更贵。*[Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)* 则往平台化走：harness 里的很多设计都编码了“当前模型做不好什么”的假设，模型变强后这些假设会过期，所以要把 session、harness、sandbox 抽象出来，让底层实现可以不断换。

所以这条脉络不是简单的时间线，而更像：

```text
context engineering:
  prompt -> tools -> context -> MCP/code execution

long-running harness:
  compaction 不够
  -> initializer + coding agent
  -> planner + generator + evaluator

横切基础设施:
  eval 证明复杂度是否值得
  managed agents 把易过期 harness 抽象成稳定接口
```

本文后面重点放在第二条线，也就是 2025 年底之后的 long-running agent。因为那时问题从“怎么让 agent 做事”变成了“怎么让 agent 连续几个小时做同一件复杂事情，而且越做越接近完成，而不是越做越乱”。

## 1. Agent 为什么不能简单地“一直跑下去”？

直觉上，如果模型已经会写代码、会用工具、会跑测试，那让它工作几个小时似乎只是把循环开久一点：

```text
while not done:
    ask model what to do
    execute tool calls
    feed results back to model
```

但真实情况不是这样。一个能跑 10 分钟的 agent，不会自动变成一个能跑 5 小时的 agent。时间一长，几个问题会开始叠加。

第一个问题是上下文窗口。

长任务一定会超过单个 context window。即使模型支持很长上下文，也不等于它能在几十万 token 里稳定抓住真正重要的状态。Anthropic 在 context engineering 的文章里把 context 描述为一种有限资源：每多塞一点信息，都会占用模型的注意力预算。长上下文不是无限工作内存，而是一个越来越拥挤的工作台。

这带来三种常见现象：

- **amnesia**：新 session 开始时不知道前一个 session 做了什么。
- **context rot**：上下文越长，模型越容易失去重点，早期信息被噪声淹没。
- **context anxiety**：模型感觉自己快到上下文末尾时，会急着收尾，把半成品说成完成品。

第二个问题是规划。

很多复杂任务不是“写一个函数”这种局部动作，而是几十个互相依赖的 feature、bug、设计决策和验证步骤。模型如果直接从一句高层 prompt 开始做，常见失败模式是 one-shot：一上来什么都想做，做到一半上下文耗尽，留下一个半坏不坏的工程。下一轮 agent 接手时，既不知道哪些东西是故意做成这样的，也不知道哪些东西只是上一个 session 没来得及收拾。

第三个问题是自我评价。

这点反而最容易被低估。模型很会生成，但不一定会严厉地判断自己生成的东西。它会看到一个按钮能显示出来，就觉得功能完成了；会看到一个页面大概长得像，就觉得设计不错；会看到测试跑了一部分，就觉得整个系统可用了。

Anthropic 在 long-running application harness 那篇文章里，把这个问题拆得很直接：让同一个 agent 既当生成者又当评审，经常会得到过于宽松的判断。尤其是前端设计、产品完整性、边缘交互这类没有单元测试直接定义的东西，模型很容易说服自己“差不多了”。

所以 long-running agent 的关键，不是把循环开久一点，而是让这个循环具备工程纪律：

```text
分解任务
保存状态
接力交接
验证产出
恢复现场
控制权限
记录轨迹
持续评估
```

这就是 harness 要做的事。

## 2. Harness 不是“提示词”，更像 agent 的操作系统

Anthropic 在 eval 文章里给了一个很有用的区分：agent harness，也叫 scaffold，是让模型能够作为 agent 行动的系统。它负责处理输入、组织工具调用、管理状态、执行循环、把结果返回给模型。换句话说，当我们说“这个 agent 很强”时，实际评价的是 **model + harness** 这个组合，而不是裸模型。

这个区分很重要。

裸模型像一个很聪明但只有短期工作记忆的人。Harness 则像它所在的工作环境：文件系统、任务板、测试脚本、浏览器、shell、git、日志、sandbox、权限系统、checkpoint、handoff note。一个人能不能连续工作几小时，不只取决于脑子，还取决于桌面是否干净、任务是否拆好、文档是否可找、测试是否能跑、出了错能不能回滚。

第一代 long-running harness 的核心设计很朴素：把软件工程师接力工作时会自然做的事情，显式编码进 agent 的运行环境。

Anthropic 那篇 *Effective harnesses for long-running agents* 里用的是两类 agent：

- **Initializer agent**：第一轮运行时，不急着写功能，而是搭好工作现场。
- **Coding agent**：后续每个 session 只做增量进展，并在结束前留下结构化交接物。

Initializer agent 会做几件事。

第一，创建任务清单。比如用户只说“做一个 claude.ai clone”，initializer 不会让后续 agent 凭感觉开工，而是把它拆成大量可验证 feature，例如新建聊天、输入消息、回车发送、收到回复、切换主题、加载历史会话等。每个 feature 初始状态都标成 failing。

第二，创建进度文件。比如 `claude-progress.txt` 或类似文件，记录每一轮做了什么、哪些还没做、哪些地方有坑。

第三，创建启动脚本。比如 `init.sh`，告诉后续 agent 如何安装依赖、启动服务、跑基本检查。

第四，初始化 git repo。每轮结束时 commit，让后续 agent 可以通过 git log 理解最近的变化，也让系统能回滚、diff、审计。

后续 coding agent 的开工流程也被固定下来。一个典型 session 不是直接开始写代码，而是先做 orientation：

```text
1. 确认当前工作目录
2. 阅读 progress file
3. 阅读 feature list
4. 查看最近 git log
5. 启动服务
6. 跑一个基本 end-to-end smoke test
7. 确认基础功能没坏
8. 选择最高优先级的未完成 feature
9. 实现一个相对独立的增量
10. 自测
11. 更新 feature 状态和 progress file
12. commit
```

这听起来不神秘，但很关键。因为 long-running agent 的难点不是某一步做不出来，而是几百步之后系统还能保持方向感。

一个好的 harness 需要迫使 agent 不断回答三个问题：

- 我现在接手的工程状态是什么？
- 我这轮只应该推进哪一小块？
- 我离开时，怎样让下一轮不用猜？

这和人类团队的交接逻辑几乎一样。

## 3. “干净状态”比“多做一点”更重要

Anthropic 在第一篇 harness 文章里强调了一个工程标准：每个 session 结束时，环境应该处于 clean state。

这里的 clean state 不是“所有功能都完成”，而是：

- 没有明显破坏主流程的 bug。
- 当前代码可以被下一个 agent 理解。
- 已做工作有记录。
- 未完成工作不要伪装成完成。
- 基础测试可以运行。
- 如果新 feature 没做完，也要留下清楚的边界。

这个原则非常像真实软件工程里的“每次提交都应该能合并到 main”。因为 long-running agent 本质上是在用多个短 session 拼一个长任务。如果每个 session 都留下小烂摊子，错误会复利增长。

这也是为什么 harness 不能只奖励“做了多少”，还要奖励“留下的现场质量”。一个 session 结束时，如果 agent 多写了三个功能，但把启动流程弄坏了，下一轮可能要花大量 token 先恢复环境。长期看，这种进展是负收益。

所以长时 agent 的运行目标，不应该是：

```text
每轮尽量多写代码
```

而应该是：

```text
每轮完成一个可验证增量，并把系统留在可继续工作的状态
```

这个差别很小，但决定了 agent 能不能跑过一个 context window 之后还继续变好。

## 4. 从单 agent 到 planner / generator / evaluator

第一代 harness 解决了上下文接力问题，但还有一个大问题：agent 不擅长判断自己。

于是 Anthropic 在 *Harness design for long-running application development* 里进一步引入了多 agent 结构。最终形态大致是三类角色：

- **Planner**：把一句高层 prompt 展开成规格、功能列表、设计方向和实现计划。
- **Generator**：按计划实现功能，写代码、改 UI、接后端、跑测试。
- **Evaluator**：像 QA 一样操作应用、检查结果、指出问题、决定是否通过。

这不是为了显得复杂，而是因为不同角色对应不同失败模式。

Planner 解决 under-scoping。没有 planner 时，generator 往往会把任务理解得太窄。例如“做一个 2D retro game maker”，单 agent 可能做出一个能放点 tile 的页面就觉得完成了。Planner 则会把它展开成 level editor、sprite editor、entity behavior、playable test mode、动画、导出、音效、AI 辅助生成等更完整的产品规格。

Generator 解决执行。它仍然是主要劳动力，但它不再凭空决定整个产品边界，而是在明确 spec 和当前 feature contract 里工作。

更准确地说，generator 也不一定是一个从头跑到尾的单体 agent。它更像一个角色：多个 generator sessions 或 coding agents sequentially 接力执行。每一轮 generator 读 planner spec、当前代码、progress file、上一轮 evaluator feedback，然后完成一个有限增量，写回状态并退出。下一轮 generator 再接着读这些 artifact 继续。这就是为什么 long-running harness 这么依赖 progress file、feature list、git commit 和 test results：连续性不在某一个模型的脑子里，而在外部项目状态里。

Evaluator 解决自我评价。它不会只看代码，而是通过 Playwright 或浏览器自动化像用户一样点击应用，检查 UI 功能、API、数据库状态和边缘情况。文章里举的几个 evaluator 找到的问题都很真实：矩形填充工具只在拖拽起点终点生效、实体删除逻辑判断条件错了、FastAPI 路由顺序导致 `/frames/reorder` 被当成 `frame_id` 解析。这些 bug 靠“看起来页面差不多”是抓不出来的。

更有意思的是 sprint contract。

在每个 sprint 开始前，generator 和 evaluator 会先协商“这一块到底怎么算完成”。也就是说，不是 generator 先写完再让 evaluator 挑刺，而是在写代码之前，双方先把验收标准具体化：

```text
Generator: 我准备实现 X、Y、Z。
Evaluator: 这些还不够可测，补充边界条件 A、B。
Generator: 好，我会用这些行为作为 done criteria。
Evaluator: 通过，开始实现。
```

这一步的价值在于，把模糊的用户故事变成可测试 contract。它有点像人类团队里的产品需求澄清 + QA test plan。

这里的“协商”也不是把 generator 的完整上下文复制给 evaluator，再把 evaluator 的完整上下文复制回 generator。更实际的做法是通过文件和 workspace 交换结构化 artifact：generator 写一个 sprint contract proposal，说明本轮要做什么、验收标准是什么、哪些不在 scope；evaluator 读取 planner spec 和 proposal，补充遗漏的边界条件或拒绝过宽的 scope；generator 再修订 contract。真正共享的是 spec、contract、progress、代码、测试结果和 feedback，而不是两边完整的聊天历史。

这里的核心 insight 是：**外部评价不是锦上添花，而是把 agent 从“生成内容”推向“完成工作”的关键结构。**

## 5. Evaluator 也不是天然可靠的

不过，把评价交给另一个 LLM 并不自动解决问题。Anthropic 那篇文章里说得很实在：Claude 一开始也不是好的 QA agent。它会发现真实问题，然后又说服自己这些问题不严重；或者只做浅层测试，不去碰边缘路径。

所以 evaluator 本身也要被调。

这件事很像训练一个 junior QA。你不能只对他说“仔细检查一下”。你要给它明确的 rubric、失败案例、判断标准、必须探索的交互路径、不能轻易放过的 bug 类型。然后你还要读它的 logs，找出它和人类判断不一致的地方，再更新 evaluator prompt。

Anthropic 的 frontend harness 使用了几类评分维度：

- design quality：整体是否有清晰气质，而不是组件堆叠。
- originality：是否有定制设计决策，而不是模板味、默认库味、常见 AI 味。
- craft：排版、间距、色彩、对比度等基本功。
- functionality：用户能不能理解并完成任务。

这个例子很能说明 LLM-as-judge 的正确用法。它不是让模型抽象地回答“好不好”，而是把“好”拆成多个可检查维度。主观评价不是不能自动化，但必须被 operationalize。

同样，在应用开发 harness 里，evaluator 会按 product depth、functionality、visual design、code quality 等维度打分，而且每个维度有硬阈值。只要一个关键维度低于阈值，这轮 sprint 就失败，generator 必须根据具体反馈继续改。

这也解释了为什么 agent eval 会变成一门专门工程。Anthropic 在 *Demystifying evals for AI agents* 里把 eval 拆成 task、trial、grader、transcript、outcome、eval harness 等概念。对于 agent 来说，最终说了什么不够重要，真正重要的是环境最终状态有没有变对。

一个航班预订 agent 说“我已经帮你订好了”没有意义；数据库里是否真的有 reservation 才有意义。一个 coding agent 说“bug fixed”没有意义；测试是否通过、旧行为是否没坏、代码是否可维护才有意义。

这也是做 agent eval 时最容易犯的错：评估 transcript，而没有评估 outcome。

## 6. 多 agent harness 里最容易误解的几个点

第一，planner 不是一个“更会做计划的魔法 agent”。如果只是随便让模型先写一段 plan，那和普通 agent 开始前自言自语没什么区别。Planner 真正有用，是因为它的输出会变成系统状态的一部分：spec、feature list、acceptance criteria、risk list、sprint plan。这些东西会被后续 generator sessions 执行，也会被 evaluator 拿来验收。没有这个闭环，plan 只是建议；有了这个闭环，plan 才是 harness 的控制面。

第二，planner 通常主要解决初始 under-scoping。用户一句话往往太宽，比如“做一个 2D retro game maker”。Planner 的工作是先给出第一版地图：这个产品应该有哪些核心模块、哪些是 must-have、哪些可以以后做、每个 feature 怎么验收。它不一定会在每个 sprint 都重新出现。项目推进之后，真正不断更新地图的人往往是 evaluator。

第三，evaluator 会承担一部分局部 planner 的角色。它看到的不是纸面计划，而是已经跑起来的系统，所以它更适合做 feedback-driven replanning：当前 sprint 的 scope 是否合理，generator 的 done criteria 是否够具体，哪些 bug 是 blocker，下一轮应该先修什么。可以这么区分：

```text
planner = before-the-fact global decomposition
evaluator = after-the-fact local replanning
```

第四，evaluator 会修改 planner 留下来的 artifact，但通常不是“修改 planner 这个 agent”。比如 planner 最初写了 `sprite editor`，只要求能 draw 和 save。Evaluator 在真实测试后可能补上新的验收条件：brush size 要工作，透明像素要保留，保存后的 sprite 要出现在 entity palette，reload project 后状态不能丢。这等于 evaluator 在局部重写计划，但它改的是 `feature_list`、`sprint_contract`、`known_issues`、`next_actions` 这些外部文件。

第五，谁判断总任务完成，不能交给 generator 自己。比较稳的结构是三层验收：

```text
sprint evaluator:
  判断这一轮增量是否达成 sprint contract

global / final evaluator:
  判断整个系统是否达成原始用户目标和最新 spec

external grader / human review:
  对最终 outcome 做最后确认
```

Final evaluator 需要读原始 prompt、planner spec、最新 feature list、所有 blocker、当前应用状态和测试结果。它不应该只输出“看起来完成了”，而应该输出结构化结论：哪些 must-have features passing，哪些 blocker resolved，核心用户路径是否通过，是否还有 P0/P1 regression，是否 ready。

所以多 agent harness 的重点不是“多叫几个模型来讨论”。它真正做的是把计划、执行、评价、修订都落到外部 artifact 上，让每一轮 agent 可以用有限上下文接手，又不会完全凭感觉宣布完成。

## 7. Context engineering：长任务的真正战场

如果说 harness 是 agent 的外部身体，那 context engineering 就是它的注意力管理。

Anthropic 在 context engineering 那篇文章里提出一个很重要的转变：过去大家关注 prompt engineering，也就是怎么写系统提示词；但 agent 越来越多轮、越来越长时之后，问题不再只是 prompt 写得好不好，而是每一步 inference 时，模型到底看到了什么。

一个 agent 的 context 里可能有：

- system prompt
- developer instructions
- tool definitions
- MCP server descriptions
- 用户消息
- 历史对话
- 文件内容
- command output
- browser observations
- screenshots
- errors
- progress notes
- retrieved documents
- previous plans
- evaluator feedback

这些东西不可能全部无脑塞进去。上下文窗口变大之后，反而更需要选择。因为长上下文里的噪声会让模型分心，也会增加成本和延迟。

好的 context engineering 不是“给模型更多”，而是：

```text
在当前这一步，给它足够完成下一步的最小高信号上下文。
```

这就是为什么文件系统对 coding agent 特别重要。文件名、目录结构、git log、progress file、test output，本身就是一种外部记忆系统。Agent 不需要把整个 codebase 都放进 context；它可以像人一样用 `rg`、`ls`、`sed`、`git diff` 逐层寻找信息。

这也解释了 just-in-time context 的价值。与其在一开始把所有文档、所有工具、所有历史都塞给模型，不如保留引用：

```text
路径
URL
query
task id
commit hash
log 文件
数据库表名
```

需要的时候再通过工具加载。这样 agent 的工作记忆里保留的是索引和当前相关片段，而不是整个世界。

长任务里常见的 context 技术包括：

- **compaction**：把当前 conversation trace 压缩成一段摘要，然后用这个摘要开启下一段 context。它通常还是同一个任务、同一条 agent loop 的延续。
- **structured note-taking**：让 agent 主动把任务状态写到外部持久化 artifact 里，例如 `progress.md`、`feature_list.json`、`NOTES.md`、git commit。它不依赖当前 conversation trace 是否快满，而是持续建立一个“项目状态层”。
- **context reset**：故意丢掉当前上下文的大部分历史，用少量 handoff artifact 开一个干净的新 context/session。它可以使用 note-taking 产生的文件，也可以使用 git log、测试结果、任务列表等外部状态。
- **multi-agent architecture**：不是时间上的接班，而是角色上的分工。不同 agent 拿不同上下文、做不同子任务，最后只把高密度结果交回主流程。

这几个概念容易混在一起，因为它们都在“把信息交给后面”。但区别不在于有没有 handoff，而在于 handoff 的来源、目标和清洗程度。

**Compaction** 的来源是历史对话本身。它像把一整段聊天记录压缩成会议纪要，然后把会议纪要放进下一个 context window。你问“同一个任务的下一段 context 这也是一个新的 session 吗？”可以这么理解：实现上它常常会开启一个新的 context window，甚至像一个新 session；但语义上它还是同一个 agent run 的连续延伸。它的目标是尽量保留 conversational continuity。也就是说，模型应该感觉“我刚才做的事情还在”，只是历史被压缩了。

**Structured note-taking** 的来源不是历史对话，而是 agent 在工作过程中主动维护的外部状态。比如它写：

```text
已完成：消息发送、主题切换
未完成：会话搜索、附件上传
注意：sidebar state 存在 race condition
下一步：先修 search API，再做 UI
```

这和 compaction 的差别是：note-taking 不是系统在 context 快满时自动把所有东西压缩一遍，而是 agent 按某种结构持续写“以后真的需要知道的东西”。它也不一定只给同一个任务用。一个项目级 `NOTES.md` 可以被后续 session 读，也可以被 planner、generator、evaluator 读；甚至可以在相邻任务里复用。

**Context reset** 则是一个策略动作：我决定不要带着当前上下文继续了。它通常会拿 structured notes、feature list、git log、test result 这些外部 artifact 作为启动材料，但不会保留完整 conversation history。它和 compaction 的关键差别不是“有没有新 session”，而是“保留多少旧上下文，以及旧上下文以什么形态进入新窗口”。

可以这样看：

```text
compaction:
  旧 conversation -> 摘要 -> 新 context
  目标：延续原来的思路，尽量不断片

context reset:
  外部项目状态 -> 精简启动包 -> 新 context
  目标：清掉噪声和坏假设，让新 agent 重新定向

structured note-taking:
  当前工作 -> 持久化项目状态
  目标：让未来任何需要接手的人有可靠状态源

multi-agent:
  子任务上下文 -> 专门 agent -> 浓缩结果
  目标：分工、隔离噪声、并行探索、独立评价
```

所以，compaction 和 reset 都可能表现为“开一个新的 context/session”，但它们的哲学相反。Compaction 是“尽量别忘”；reset 是“该忘就忘，只保留可验证的项目状态”。Note-taking 则不是一次切换动作，而是让 reset 或下一轮工作有东西可读。Multi-agent 则不是为了解决时间连续性，而是为了解决角色分工和上下文隔离。

这也是 long-running harness 的核心 tradeoff：你想要连续性，但不想要上下文污染；你想要状态保留，但不想把所有状态都塞进模型脑子里。

## 8. 工具不是 API，工具是给非确定性系统用的界面

传统软件里，API 是确定性系统之间的契约。你调用 `getWeather("NYC")`，预期它每次都按固定方式返回纽约天气。

但 agent 使用工具时不是这样。模型可能调用工具，也可能不调用；可能先问澄清问题，也可能先搜索；可能误解参数；可能把一个工具用于原本没设计的场景。所以 Anthropic 在 *Writing effective tools for agents* 里强调：工具不是普通 API，而是 deterministic system 和 non-deterministic agent 之间的契约。

这意味着工具设计要更像“给模型使用的产品设计”。

几个原则很重要：

- 工具数量不能无限膨胀，否则模型会在选择上浪费注意力。
- 工具之间不要有过多功能重叠，否则模型不知道该用哪个。
- 工具描述要清楚说明什么时候用、什么时候不用。
- 返回值要 token-efficient，不要把无关数据全倒进 context。
- 错误信息要可恢复，让模型知道下一步怎么修。
- 命名空间要清晰，让 agent 能从名字推断边界。

这点在 MCP 上尤其明显。MCP 让 agent 可以接入很多外部系统，但如果一个 agent 一开始就加载几百上千个 tool definitions，context 会被工具说明塞满。更糟的是，工具返回的大对象还会反复流过模型上下文。比如从 Google Drive 读一个长会议记录，再写到 Salesforce，如果中间内容每一步都通过模型复制，成本和错误率都会上升。

Anthropic 的 *Code execution with MCP* 提出一种很实用的模式：不要把所有工具都作为直接 tool call 暴露给模型，而是把 MCP servers 映射成代码 API / 文件树，让 agent 用代码调用。

这样 agent 可以：

- 先在文件系统里发现有哪些 server。
- 只读取当前需要的 tool definition。
- 在代码执行环境里过滤大数据。
- 只把摘要或少量结果返回给模型。
- 用循环、条件、异常处理完成复杂控制流。
- 把中间状态写到文件里，而不是塞进 context。

比如处理一个 10000 行 spreadsheet，不应该让 10000 行全部进入模型上下文。更好的方式是让 agent 写代码过滤出 pending orders，只打印前几行和统计结果。模型需要知道的是“筛选结果是什么”，不是每一行原始数据。

这其实又回到同一个原则：把确定性计算留给代码，把判断和规划留给模型。

## 9. Long-running agent 的成本和复杂度不是小事

多 agent harness 听起来很美，但它非常贵。

在 Anthropic 的 long-running application harness 实验里，同一个“做一个 2D retro game maker”的 prompt，solo harness 跑了大约 20 分钟，成本约 9 美元；完整 harness 跑了约 6 小时，成本约 200 美元。质量差距很明显，但成本也差了 20 倍以上。

所以一个成熟的 agent 系统不能只问“多 agent 是否更强”，还要问：

- 这个任务值不值得这么贵的 harness？
- planner 是否真的有增益？
- evaluator 是每个 sprint 都需要，还是只在最后一轮需要？
- context reset 是否必要，还是 compaction 足够？
- 当前模型是否已经能独立处理某些子任务？
- 哪些组件只是历史包袱？

Anthropic 在后续文章里反复强调一个原则：harness 的每个组件都编码了一个假设，假设模型自己做不好某件事。随着模型变强，这些假设会过期。

比如某个模型有 context anxiety，于是 harness 加了 context reset。后来模型不再有这个问题，reset 可能就从必要结构变成了延迟和成本。某个模型不会规划，于是加入 planner。后来模型规划能力增强，planner 可能只在大任务上有价值。某个任务靠 generator 自己已经能稳定完成，evaluator 就可能是多余开销；但在刚好超过模型能力边界的任务上，evaluator 又会带来巨大提升。

这说明 harness 不是越复杂越好。更准确的做法是：

```text
从最简单可工作的系统开始；
用 eval 找出失败模式；
只为真实失败模式增加结构；
随着模型升级，定期移除不再 load-bearing 的组件。
```

这点和 *Building effective agents* 的基本建议一致：先用简单、可组合的模式，不要一上来搭一个过度复杂的 agent framework。

## 10. Eval 是 agent 系统的仪表盘，也是需求文档

Long-running agent 如果没有 eval，基本就是盲飞。

因为 agent 的行为是非确定性的。同一个 prompt 跑两次，可能一次成功一次失败。一个任务 pass，不代表系统可靠；一个任务 fail，也可能是 grader 写错、环境坏了、任务本身有歧义。

Anthropic 的 eval 文章里有几个概念很值得保留：

- **task**：一个有输入和成功标准的测试问题。
- **trial**：对同一个 task 的一次尝试。
- **grader**：评分逻辑，可以是代码、模型、人类或混合。
- **transcript / trajectory**：一次 trial 的完整记录。
- **outcome**：环境最终状态。
- **evaluation harness**：批量运行任务、记录轨迹、评分、聚合结果的基础设施。

Agent eval 和普通 LLM eval 的差别在于，它不只是看输出文本，而是看一串行动对环境造成的结果。这也是为什么它天然需要 sandbox、数据库、浏览器、文件系统、mock API、可重置环境。

还有两个指标很重要：

- **pass@k**：k 次尝试里至少成功一次的概率。
- **pass^k**：k 次尝试全部成功的概率。

这两个指标会讲两个完全不同的故事。对 coding agent 来说，如果你允许 agent 多试几次，pass@k 很有意义，因为只要有一次 patch 对了就可以进入 review。但对客服、报销、订票这种用户直接使用的 agent，pass^k 更关键，因为用户期待每次都可靠，而不是十次里总有一次对。

Capability eval 和 regression eval 也要区分。

Capability eval 问的是：“这个 agent 现在能不能爬上更高的能力坡？”它应该包含一些当前做得不好的任务，否则没有学习信号。

Regression eval 问的是：“它以前会的东西现在还会不会？”它应该接近 100% pass，用来防止系统升级、模型切换、prompt 修改之后倒退。

这套 eval 不只是测试，更是产品需求文档。一个好的 eval suite 会迫使团队说清楚：

- 什么叫任务完成？
- 哪些边缘情况必须处理？
- 哪些路径可以接受，哪些是作弊？
- 成功看 outcome 还是 transcript？
- 速度、成本、可靠性怎样取舍？

没有 eval 的 agent 团队，最后往往只能靠感觉和用户反馈迭代。那在早期 demo 阶段可以，但一旦系统变复杂，修一个问题就可能制造三个回归。

## 11. Sandbox 和权限：能力越强，外部边界越重要

Long-running agent 的另一个底层问题是安全。

一个只能回答文本的模型，犯错的 blast radius 很小。一个能跑 shell、改文件、访问数据库、调用 SaaS API、发 Slack、开 PR 的 agent，犯错成本完全不同。

所以 harness 不能只管“让它完成任务”，还要管“它最多能造成多大损害”。

Anthropic 在 Managed Agents 那篇文章里把 agent 系统拆成几个相对稳定的抽象：

- **session**：发生过什么的 append-only log。
- **harness**：调用模型、路由工具、执行 agent loop 的控制层。
- **sandbox**：agent 能运行代码和改文件的环境。

这个拆法很像操作系统抽象。模型是 brain，sandbox 是 hands，session 是历史记录，harness 是协调层。把它们解耦之后，底层实现可以不断变化，但外部接口保持稳定。

这很重要，因为 long-running agent 的 harness 会持续演化。今天需要 context reset，明天可能不需要；今天需要某种 evaluator，明天可能换成别的；今天工具直接暴露，明天改成 code execution。稳定抽象能让 agent 产品不被某一代 harness 绑死。

安全上也是类似逻辑。你不能只靠“模型会判断危险命令”来保护系统。更稳的做法是限制 agent 能访问什么、能写哪里、能联网到哪、哪些工具需要审批、哪些状态可持久化、哪些 secret 永远不可见。

这和 RL environment 里的 reward hacking 问题其实同源：**不要把你不希望 agent 使用的捷径放进它的环境里。**

如果 coding eval 的 future commit 在 `.git/objects` 里，模型迟早会找到；如果 hidden tests 在容器里，模型迟早可能读到；如果生产数据库凭证在环境变量里，模型迟早可能误用。Long-running agent 越能干，环境边界就越要认真。

## 12. 一个最小可行的 long-running agent 架构

如果今天要从这些 post 里提炼一个可落地的架构，我会从下面这个版本开始，而不是直接上最复杂的多 agent 系统。

目录结构大概是：

```text
workspace/
  AGENT.md
  init.sh
  progress.md
  feature_list.json
  evals/
    smoke_test.md
    acceptance_tests.md
  logs/
  artifacts/
  src/
  tests/
```

`AGENT.md` 写清楚工作原则：

```text
- 每轮先读 progress.md 和 feature_list.json
- 每轮开始必须跑 init.sh 和 smoke test
- 每轮只选择一个最高优先级 feature
- 完成后必须跑对应测试
- 只有通过验收才把 feature 标成 passing
- 结束前更新 progress.md
- 保持 repo 在可继续工作的 clean state
```

`feature_list.json` 不只是 todo list，而是带验收标准的任务表：

```json
[
  {
    "id": "chat-send-message",
    "priority": 1,
    "status": "failing",
    "user_story": "User can type a message and press Enter to send it.",
    "acceptance": [
      "Input field accepts text",
      "Enter submits message",
      "Message appears in conversation",
      "Empty message is not submitted"
    ],
    "test_method": "browser_e2e"
  }
]
```

每个 session 的 loop 可以是：

```text
orient:
  read progress.md
  read feature_list.json
  inspect git log
  run init.sh
  run smoke test

select:
  choose one failing high-priority feature
  restate acceptance criteria

implement:
  edit code
  run targeted tests
  use browser automation when UI matters

verify:
  test the feature from user perspective
  check regressions
  mark feature passing only if evidence exists

handoff:
  update progress.md
  record tests run and known issues
  commit
```

如果任务开始变大，再加 planner。Planner 的输出不是一篇长计划，而是结构化 spec、feature list、risk list、eval plan。

如果质量开始不稳定，再加 evaluator。Evaluator 的任务不是泛泛地“看看好不好”，而是：

```text
- 根据 acceptance criteria 操作系统
- 记录具体失败步骤
- 区分 blocker / minor issue / subjective preference
- 给出可复现 evidence
- 不允许没有证据就 approve
```

如果工具太多，再加 tool search / progressive disclosure。不要把所有工具定义都放进 context。

如果数据太大，再让 agent 写代码处理数据，只把结果摘要返回模型。

如果运行时间太长，再引入 context reset、checkpoint、external memory、session log。

如果权限变危险，再把 sandbox、network、secret、filesystem boundary 提前设计好。

关键不是一次性搭出终极系统，而是让 harness 随着失败模式增长。

## 13. 这件事为什么重要？

我觉得这组文章真正透露出来的趋势是：AI agent 的进步正在从“模型演示”进入“系统工程”。

过去我们容易用一个问题衡量 agent：

```text
模型够不够聪明？
```

但 long-running agent 迫使我们问一组更像工程的问题：

```text
它如何知道自己做到哪里了？
它如何跨 context window 保持状态？
它如何判断自己没做好？
它如何从失败中恢复？
它如何使用工具而不淹没上下文？
它如何证明任务真的完成？
它如何避免破坏环境？
它如何在模型升级后减少脚手架？
```

这些问题的答案，很多都不在模型权重里，而在模型周围。

这也是为什么我觉得 harness 会成为一个越来越重要的概念。它不是简单的 wrapper，也不是 prompt template，而是 agent 能力被稳定释放出来的基础设施。

模型越强，harness 不是越不重要，而是角色会变化。早期 harness 像拐杖，替模型补规划、补记忆、补检查。后来模型变强，某些拐杖可以拿掉，但新的问题会出现：更大的权限、更长的任务、更复杂的工具、更高的可靠性要求、更严的安全边界。

所以更准确的说法不是“未来模型会替代 harness”，而是：

**模型能力和 harness 设计会共同演化。**

当 agent 只能跑 10 分钟时，我们关心 prompt 和工具调用。当 agent 能跑几个小时时，我们开始关心任务分解、状态持久化、交接、eval、sandbox、成本。当 agent 将来能跑几天甚至更久时，它看起来会越来越像一个分布式系统：有进程、有日志、有权限、有检查点、有监控、有回滚、有测试、有调度。

这可能也是 long-running agent 最值得关注的地方。它不是把聊天机器人拉长，而是在把 LLM 放进一套真正的软件执行环境里。

到了这一步，agent engineering 就不再是“怎么问模型一句话”，而是“怎么设计一个世界，让模型在里面持续、可靠、可审计地工作”。
