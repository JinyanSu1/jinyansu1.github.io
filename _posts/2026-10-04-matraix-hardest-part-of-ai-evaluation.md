---
layout: post
title: "MatrAIx: The Hardest Part of AI Evaluation / MatrAIx：AI评测中最难的部分"
date: 2026-10-04
categories: technical
tags: [ai, evaluation, agents, persona, simulation, llm, interview]
excerpt: "Behind 8.3 billion simulated users, a startup is targeting the part of AI evaluation that benchmarks never measured. An interview with Xiaomin Li and Yuexing Hao, the two founders of MatrAIx: how the personas get built and turned into agents, what \"91.5%\" actually measures, what happens when the base model changes, and the \"mirror world\" idea behind the name."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

<p><em>(This interview was originally published at <a href="https://www.agihouse.org/blog/matraix-the-hardest-part-of-ai-evaluation" target="_blank" rel="noopener">AGI House Research</a> on September 26, 2026.)</em></p>

Last week at Enterprise Deployment Build Day, we sat down with Xiaomin Li and Yuexing Hao, the two founders of MatrAIx. We talked about why offline benchmarks miss what real users feel, how 8.3 billion personas get built and turned into agents, what "91.5%" actually measures, what happens when the base model changes, why their customers care about time more than cost, and the "mirror world" idea behind the name. Full interview below.

*Behind 8.3 billion simulated users, a startup is targeting the part of AI evaluation that benchmarks never measured.*

## 1. An agent that passed every test and scored 2 out of 5

A coding agent finished its task. Every unit test passed. By any current benchmark, that counts as success. MatrAIx's simulated user gave it 2 out of 5.

The team followed the reasons that "user" wrote down and traced them to specific steps. The agent had spun through many idle rounds. It had wandered outside the code repository and opened the user's private photos before returning to finish the job. Token usage was more than 50 times normal. "The first problem is safety. It went out of scope; it should have been limited to the repo. The second is efficiency."

The two founders described this internal case in our interview. Conventional evaluation checks only whether the result is correct. Problems like these are visible only from the user's side of the conversation.

## 2. Who they are

MatrAIx was started by Xiaomin Li and Yuexing Hao. Xiaomin was previously a senior research scientist at Google DeepMind and Microsoft, working on LLM post-training and coding agents; his recent papers also cover safety reward models. Yuexing finished her PhD at Cornell this January, was a research scientist at Microsoft's applied science lab, and then a postdoc at MIT working on computer-using agents; her earlier work was in medical AI. The two met at MIT and have collaborated for nearly three years.

The project began as an open-source community. The Playground and task library were open-sourced on July 31; the Persona 1M dataset went up on Hugging Face on August 1; the technical report appeared on arXiv on August 4. The paper lists 93 authors. By the team's own count, more than 200 scientists have joined the community, over 40 of them from OpenAI, Anthropic, Google DeepMind, and xAI. The GitHub repository has about 1.9k stars under an MIT license.

In the interview they explained why researchers at large labs joined: "They all had this problem in their own work settings, and they wanted to try whether persona agents could solve it."

The name comes from The Matrix, with the "I" replaced by "AI". Xiaomin called it "an idea I've had since I was a kid." The GitHub README states that "the simulated world is for exploration, stress testing, and hypothesis generation, not a replacement for evidence from real people".

## 3. The problem: the gap between offline scores and online feedback

Xiaomin described a pattern they kept hitting in industry: "The benchmark scores can be great, but once it ships, the feedback from real users is just different."

Take a coding agent. The same question gets asked in very different ways. Some people write extremely detailed prompts; others are lazy and vague. Some pack ten questions into one prompt; others ask one per turn. Students ask for an explanation after every step. Some people drift from code to the news and back again. Offline benchmarks capture none of this.

The paper's introduction puts it more formally. A novice wants explanations, small edits, and frequent confirmation; an expert wants terse responses and more autonomy. These differences shape interaction trajectories, trust in the result, and willingness to continue after a failure. Aggregate scores hide problems that specific user groups run into.

Using an LLM to play the user is not new; benchmarks such as τ-bench already do it. But the reliability of that setup has drawn specific criticism. A CMU study published in March ran 451 real people through the full τ-bench protocol and compared them against 31 LLM simulators. It found simulated users to be excessively cooperative, stylistically uniform, and lacking real frustration or ambiguity. The effect is an "easy mode" that inflates agent success rates above the human baseline.

MatrAIx targets exactly this gap: not one generic "user", but diversity built into the simulation.

## 4. Technical deep dive

### (I): how 8.3 billion profiles are generated

**The schema.** Each persona is described by 1,290 categorical dimensions in five groups.

| Group | Dimensions | Representative attributes |
|---|---|---|
| Background | 238 | Age, region, language, education, family, occupation, industry |
| Psychology | 210 | Personality, values, worldview, motivation, risk tolerance |
| Capability | 331 | Domain expertise, general skills, tools, programming, developer context |
| Behavior & interaction | 124 | Preferences, habits, interaction states, work style, tech adoption |
| Lifestyle | 387 | Interests, media, culture, hobbies, sports, diet, health, fitness |

Each dimension takes a value from a finite set. English proficiency runs from Native to None with CEFR levels in between; risk tolerance runs from risk-averse to risk-seeking.

In our interview they added a design detail the paper does not spell out: demographic dimensions come from public databases, but behavioral dimensions were built "scenario first." The team mapped more than 50 AI-interaction scenarios and then defined interaction attributes for each: whether someone comments their code, their Python proficiency, whether their prompts are verbose, how many questions they ask per turn. The 1,290 dimensions are only the first version; the new one has more.

**The synthetic path.** Sampling each dimension independently produces impossible profiles, such as a 19-year-old retired surgeon. The paper instead builds a directed acyclic graph (DAG) over the 1,290 dimensions. An edge is added only when a data source directly reports the conditional relationship, and personas are sampled one dimension at a time in topological order. Each non-root node's conditional distribution has the form

Here πᵢ is the population-wide prior. rᵢ is a source-informed likelihood-ratio adjustment: if the primary language is English and the region is North America, "Native" gets more weight. mᵢ is a binary compatibility mask that removes contradictions such as "primary language English, English proficiency None." An unusual but possible combination like "primary language English, proficiency Basic" is down-weighted, not removed. The point is to keep rare but real people while ruling out logically impossible ones.

**The human-grounded path.** The other records come from six sources: Wikipedia biographies, Amazon review histories grouped by reviewer, the Stack Overflow Developer Survey, the U.S. General Social Survey (GSS), the PRISM Alignment dataset, and 355 consented responses to MatrAIx's own persona survey. Free text is extracted by an LLM under constraints; dimensions the evidence does not support are left null rather than imputed, and names and contact details are stripped. For example, Shakespeare: his biography, works, and tastes map into the schema, but "he probably never used a coding agent," so that dimension stays empty.

**Quality control.** Human-grounded records are deduplicated with exact hashing plus MinHash; synthetic records are treated as duplicates when all 14 high-information attributes match. The public coreset of roughly one million records contains 599,847 human-grounded records (323,438 from Wikipedia, 113,120 from Stack Overflow, 97,915 from Amazon, 63,532 from GSS) and 400,000 synthetic ones.

In terms of cultural coverage, the profiles span a dozen or so countries, but "the real information sources are probably all American," and the United States is their primary focus, both as a population and as a market.

### (II): from profile to acting agent

The profile is written into the system prompt as text. Xiaomin said it is "just like your skills, a skills.md," a textual description rather than a numeric vector, closer to a filled-in questionnaire than an embedding.

The bottleneck of this approach is the context window. Profiles grow, especially once self-evolution is added, and "at some point the context window can't hold it." Three directions are under exploration:

1. **Routing.** Load only the attributes relevant to the task. Whether someone likes spicy food probably does not affect their coding style, so it can be dropped.
2. **A more compact representation**, with training built for that representation, to balance efficiency against quality.
3. **Steering.** Push the model directly toward a specific persona's behavior.

They also said they have found non-training methods that beat plain prompting, sitting between prompting and full training. They also plan to post-train their own model, similar to what Cursor did: it lets users plug in different vendors' models but also ships its own Composer model. Hosting their own model costs R&D up front but should be cheaper and more flexible in the long term.

At the execution level, a trial is formalized as the tuple ⟨persona, task, agent interface, model, random seed⟩. Trials share no state, so they are parallel by construction. Each trial produces an artifact bundle that a task-owned verifier converts into structured findings. There are four environments.

*A persona record becomes an agent when paired with a model, acts in one of four environments, and its trace is scored by a verifier tied to the task.*

App tasks run in a Docker-based Linux desktop sandbox or on a remote macOS desktop or iOS simulator. Of the 1,010 tasks in the library, 621 are surveys, 371 are chatbot tasks, 12 are web tasks, and 6 are app tasks. The more interactive the environment, the fewer the tasks, and cost is the reason: in the paper, survey, chatbot, and web tasks used about 1,000 personas per model, while the two app tasks used 24 and 20.

### (III): how do you know it acts like a person

This is the central question for the whole approach. The paper splits validation into layers, and each layer answers a different question.

**Layer one: does the agent follow its assignment (persona adherence)?** The team chose ten behavioral attributes and tested each in all four environments, with five personas assigned one pole and five the opposite, for 400 trials judged by an LLM on the recorded trajectory. 366 trials matched the assignment, or 91.5%.

| Environment | Match rate | Strongly consistent attributes (of 10) |
|---|---|---|
| Surveys | 92–96% | 9 |
| AI chatbot | 92–96% | 9 |
| Web | 92–96% | 9 |
| App | 83% | 6 |

This number measures whether the agent obeyed the persona it was given. It does not measure agreement with real human behavior. In our interview, they said persona adherence is, in their view, essentially an instruction-following capability, so a stronger base model helps here: "We're standing on their shoulders."

**Layer two: is the extraction faithful to its source?** Two LLM judges scored 1,000 extracted personas. Six human raters gave a source-matched subset of 100 a mean of 4.135 out of 5. Claude Opus 4.8's scores fell within one point of the human mean 93.8% of the time; GPT 5.5's did so 79.2% of the time.

**Layer three: are findings stable across models?** In a financial research task (OpenBB), each persona carried one of four trust orientations, from hostile to trusting. All three models ordered the four groups identically, with Cramér's V between 0.228 and 0.363.

Agreement with real humans is the layer the paper does not cover head-on. In our interview, they said the team compares personas extracted from real profiles against the corresponding people's actual choices, such as "A or B." Results vary by domain. Software engineering and computer use show small gaps, because "what a person can operate, it can operate too." Finance, health, and political elections "still have quite large gaps." Experiences that need physical sensation, "I really have to drink it to know if I like it," are out of reach for now. The paper's conclusion takes the same position: human studies remain necessary before applying conclusions to real populations or consequential decisions.

A position piece on their site goes one level deeper. Its title: "To Simulate a User, You Should Make Your LLM Dumber." The argument is that a frontier model knows too much, stays too consistent, and fails too rarely to stand in for a real person, so using it as-is cannot show where real users get stuck.

## 5. What happens when the base model changes

During the interview, we asked: the persona is a layer on top of a base model. When the base model changes generation, or its own personality shifts, does the simulation drift with it?

They acknowledged this is exactly the problem they are working on. If the persona is only "a shallow layer," a change in the base changes the results, so they need methods that adapt to different base models and are training their own. They suggest that the model driving the persona is part of the evaluation configuration and should be reported with every result, and that important findings should be re-checked with more than one model before guiding product decisions.

Their blog post gives a worked example. In a case contributed by an Indian AI company, 400 simulated Indian business owners and finance leads evaluated four versions of a chartered accountant's engagement letter. The version with a lower upfront payment and a broader liability cap raised the share requesting only minor changes from 0% to 23%. Liability terms mattered far more (+19.63 percentage points) than the payment schedule (+3.38 points). The same 400 personas were rerun on three different models; the direction of the finding held, while the exact rates differed.

Another study of theirs, MicroVerse, measures identity drift over long runs. Twenty-five agents each carry a locked "soul file" of values and moral limits into a desert grid where water is scarce. The researchers compare that fixed file against the "living journal" each agent keeps rewriting about itself. On the same map, Qwen3-32B settled at an oasis once it found water, while Claude Haiku kept relocating; 11 of 12 Haiku runs ended with no survivors. They warn that, when assigning a ruthless persona, they may be measuring the model's built-in safety habits rather than the persona they thought they deployed.

## 6. Who the customers are and what they buy

**Customer profile.** Current customers are mainly LLM model and digital product companies: large labs building general models, and smaller labs building the best model in one vertical. The target verticals are e-commerce, gaming, and advertising. Inbound interest has come from more than ten countries, including Singapore, Japan, Argentina, Cambodia, Mexico, Switzerland, Sweden, and China. Many overseas teams are still targeting the U.S. market. They have also received requests from small businesses (such as a restaurant owner), one-person companies, and academic researchers.

**What they deliberately avoid.** Government work and political elections are mostly off the table. This is mainly because of the high sensitivity involved, and because outcomes there depend less on persona and can be heavily affected by black swan events, such as a shooting or an earthquake. The same applies to financial market prediction. That sets them apart from competitors such as Aaru, whose specialty is forecasting elections and group behavior.

"The feedback from frontier labs and big tech is that they don't care that much about cost. Saving time is what matters most. They don't want to wait ten days; they want a round in half a day or a few hours, then go change training and the harness." That being said, they also have a cost advantage, as given in their site's cost analysis: 10,000 surveys cost $28,560 or more with humans versus $3.60 to $104 simulated; 1,000 chats cost $8,568 or more versus $3 to $87.

They also brought up three disadvantages of human evaluation compared to their simulation:

1. **Scale is not representative.** A model serves a billion users, but a human evaluation can only recruit fifty to a hundred thousand.
2. **Annotator distribution is skewed.** They have seen cases where 80% of annotators turned out to be in one Southeast Asian country.
3. **Signals are noisy.** A user who stops mid-conversation may have just stepped away and come back later. Humans usually give a thumbs up or down; simulated users write out their reasons every time.

But they position themselves as a complement, not a replacement: "Iterate fast with us first, then run a final round of human eval."

**The deliverable is more than a report.** The multi-turn interaction data can be used for SFT. The team also provides a reward model for RL that "includes not only task completion but each user's own satisfaction."

**The competitive field.** Simile, founded by Joon Sung Park of Stanford's "Smallville" work, announced a $100M Series A in February and closed a $200M Series B at a $2B valuation at the end of July. Aaru's December Series A was led by Redpoint, with part of the equity priced at a $1B valuation. Most of these companies enter through market research. Those companies lean toward qualitative research and in-depth interviews, aiming to predict a specific person or group, while MatrAIx wants "large-scale persona agent deployment." Xiaomin added that model iteration today "doesn't rely on changing the algorithm every two weeks"; it relies on hill climbing, finding where the strongest model still fails. "Their target may really be to predict one person. Ours is to bring in human diversity through simulation and find the model's latent problems."

## 7. Dynamic personas and the mirror world

In the new version, personas are no longer static. Mood and work state change, agents self-evolve, they have memory, and even social relationships, though the network is limited for now: "If everyone had to know ten thousand people, it wouldn't be efficient."

The mechanism is event-driven. The team feeds in real news, such as an earthquake in California, and lets agents in the affected region and group "react the way a person would." Those reactions are written into each agent's memory. Simulated time currently runs at the same speed as real time. This can be accelerated, but then "you lose a lot of real-life big events to project from."

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

P.S. 这篇文章由我在采访Xiaomin Li和Yuexing Hao后的整理的内容的英文版翻译而来（如果是播客的形式，可能会比读这些文字好很多，但当时的采访比较临时，怕即兴播客做不好，于是就以文字的内容呈现了）。其英文版内容将会发表在AGI house的post中，发布后我也会在此附上链接。另外，如果大家希望听到和他们相关的播客，可以在评论区留言，如果感兴趣的人较多的话，我会再作一期关于MatrAIx的视频播客。

*83亿个模拟用户背后，一家创业公司瞄准的是benchmark从未测过的那部分*

## 一、一个通过了所有测试、却只拿到2分的agent

一个coding agent跑完了任务，单元测试全部通过。按现行的任何benchmark，这都算成功。但MatrAIx的模拟用户只给了它2分，满分5分。

团队顺着这位"用户"写下的理由，定位到了具体步骤：agent中途空转了很多轮，跳出了代码仓库，访问了用户的私人照片，之后才回来把任务做完。token消耗是平常的50倍以上。"第一个问题是safety，它已经out of scope了，本来应该limit在repo里；第二个是efficiency。"

这是两位创始人在采访中讲的一个内部案例。传统评测只检查结果对不对，这类问题只有站在用户这一侧才看得见。

## 二、他们是谁

MatrAIx由Xiaomin Li和Yuexing Hao发起。Xiaomin此前在Google DeepMind和微软做senior research scientist，方向是LLM post-training和coding agent，近年的论文也涉及安全reward model。Yuexing今年1月从康奈尔博士毕业，曾在微软应用科学实验室任研究科学家，之后在MIT做博士后，研究computer-using agent，更早的工作在医疗AI方向。两人在MIT相识，合作近三年。

项目最初是一个开源社区。7月31日开源了Playground和任务库，8月1日在Hugging Face发布Persona 1M数据集，8月4日技术报告上线arXiv。论文署名共93位作者。按团队自己的统计，参与社区的科学家超过200人，其中40多位来自OpenAI、Anthropic、Google DeepMind和xAI。GitHub仓库目前约1.9k星，采用MIT许可。

采访中他们解释了大厂研究员愿意参与的原因："因为他们在自己的工作场景里都遇到了这样的问题，想试一下persona agent能不能帮他们解决。"

名字来自《黑客帝国》（The Matrix），把其中的"I"换成了"AI"。Xiaomin说这是他"小时候就有的构想"。GitHub的README写得更克制：这个模拟世界"用于探索、压力测试和提出假设，不能替代来自真人的证据"。

## 三、问题：离线跑分与线上反馈之间的空白

Xiaomin描述了他们在工业界反复遇到的情况："跑分可能很好，但一上线，真实user的反馈就是不一样。"

以coding agent为例。同一个问题，有人问得极其详细，有人问得很懒、很含糊。有人喜欢把十个问题塞进一个prompt，有人一轮只问一个。学生每轮都要追问解释。还有人聊着代码忽然讲起新闻，又绕回来。离线benchmark捕捉不到这些差异。

论文引言里的表述更正式：新手想要解释、小步修改和频繁确认，专家想要简短回答和更大的自主权。这些差异会影响交互轨迹、用户对结果的信任，以及失败后是否愿意继续用。平均分还会掩盖特定人群遇到的问题。

用LLM扮演用户并不是新想法，τ-bench等benchmark早已这样做。但学界对它的可靠性有具体批评。CMU团队今年3月的一项研究让451名真人完整跑了τ-bench流程，并对比了31个LLM模拟器。他们发现模拟用户过度配合，说话风格单一，缺少真实的挫败感和含糊表达，相当于让agent在"简单模式"下考试，成功率被抬高到超过真人基线。

MatrAIx针对的就是这个缺口：不再用一个通用的"用户"，而是把多样性引入模拟。

## 四、技术拆解

### （一）83亿份档案怎么生成

**Schema。** 每个persona由1,290个类别型维度描述，分为五组。

| 组 | 维度数 | 代表性属性 |
|---|---|---|
| 背景 | 238 | 年龄、地区、语言、教育、家庭、职业、行业 |
| 心理 | 210 | 性格、价值观、世界观、动机、风险偏好 |
| 能力 | 331 | 领域专长、通用技能、工具、编程、开发者语境 |
| 行为与交互 | 124 | 偏好、习惯、交互状态、工作方式、技术采纳 |
| 生活方式 | 387 | 兴趣、媒体、文化、爱好、运动、饮食、健康、健身 |

每个维度的取值是一个有限集合。例如英语水平从Native到None，中间按CEFR分级；风险偏好从risk-averse到risk-seeking。

采访中他们补充了论文没有展开的设计顺序：人口学维度来自公开数据库，行为类维度则是"先定场景"。团队梳理了50多个AI交互场景，再为每个场景定义交互属性，比如写代码爱不爱写注释、Python熟练度、提问是否啰嗦、一轮问几个问题。1,290维只是第一版，新版已经更多。

**合成路径。** 如果每个维度独立抽样，会出现"19岁的退休外科医生"这类不合理的组合。论文的做法是把1,290个维度建成一张有向无环图（DAG），只有当某个数据源直接报告了条件关系时才加边，然后按拓扑序逐个维度采样。每个非根节点的条件分布形式是：

πᵢ是全人群先验。rᵢ是基于数据源的似然比调整，例如母语为英语且身在北美时，"Native"的权重上调。mᵢ是取值为0或1的兼容性掩码，用来排除"母语英语但英语水平None"这类矛盾。"母语英语但水平Basic"罕见但并非不可能，所以只被降权而不被排除。这样做的目的是保留少见但真实存在的人，只排除逻辑上不可能的组合。

**真人锚定路径。** 另一部分记录来自六个数据源：Wikipedia传记、按评论者聚合的Amazon评论历史、Stack Overflow开发者调查、美国综合社会调查（GSS）、PRISM Alignment数据集，以及355份自愿填写的MatrAIx问卷。自由文本由LLM做受约束的抽取，证据不支持的维度留空（null）而不补全，姓名和联系方式被剥离。以莎士比亚为例：生平、作品和喜好可以映射进schema，但"他可能没有用过coding agent"，这一维就是缺失的。

**质量控制。** 真人记录用精确哈希加MinHash去重，合成记录在14个高信息量属性上完全相同即视为重复。公开的约100万条核心集里，599,847条来自真人来源（其中Wikipedia 323,438条、Stack Overflow 113,120条、Amazon 97,915条、GSS 63,532条），另有400,000条合成记录。

文化覆盖方面，档案来源国家大约十多个，但"真正的信息来源可能都是美国的"，美国是他们目前最聚焦的人群和市场。

### （二）档案怎么变成会行动的agent

档案以文字形式写进system prompt。Xiaomin说，它"就跟你skills一样，是一个skills.md"，里面是文字描述而不是数字向量，形式上更像一份填好的问卷，而不是embedding。

这个方案的瓶颈是context window。档案会增长，尤其在加入self-evolve之后，"到一定程度context window都容不下"。他们在探索三个方向：

1. **Routing**：按任务只调用相关属性。吃不吃辣大概率不影响coding style，可以直接剔除。
2. **更紧凑的表示**，配合针对这种表示的训练，在效率与质量之间取得平衡。
3. **Steering**：直接把模型引导到特定的persona行为上。

他们还透露，在纯prompt与完整训练之间，已经找到效果优于prompt的非训练方法。同时他们也计划post-train自己的模型，思路类似Cursor：既允许用户接入不同厂商的模型，也有自研的Composer。自己host模型前期要投入研发，但长期看成本更低，自由度更高。

执行层面，一次试验被形式化为五元组⟨persona, 任务, agent接口, 模型, 随机种子⟩。试验之间不共享状态，因此天然可以并行。每次试验产出一个artifact包，由任务自带的verifier转成结构化结论。环境分四类。

*MatrAIx评测流程。一条persona档案与模型、任务配对后成为agent，在四类环境之一中行动，轨迹由任务自带的verifier评分。任务数量来自论文的任务库。*

应用类任务跑在Docker里的Linux桌面沙箱中，或远程的macOS桌面和iOS模拟器上。任务库的1,010个任务里，问卷类621个，聊天类371个，网页类12个，应用类6个。交互程度越高的环境任务越少，原因是成本：论文里问卷、聊天、网页任务每个模型约用1,000个persona，两个应用任务只用了24个和20个。

### （三）怎么知道它"像人"

这是整个方向最核心的问题。论文把验证拆成几层，每一层回答的问题不同。

**第一层，是否按设定行事（persona adherence）。** 团队选取10个行为属性，每个属性在四类环境中各测一遍，5个persona设为一个极端、5个设为相反极端，共400次试验，由LLM judge评判轨迹。366次符合设定，即91.5%。

| 环境 | 成功率 | 强一致的属性数（共10个） |
|---|---|---|
| 问卷 | 92–96% | 9 |
| AI聊天机器人 | 92–96% | 9 |
| 网页 | 92–96% | 9 |
| 应用 | 83% | 6 |

这个数字衡量的是agent是否遵守了分配给它的设定，并不衡量它与真人行为是否一致。采访中他们也说，persona adherence在他们看来本质上是一种instruction following能力，所以基座模型越强，这一项越好："我们其实是站在他们的肩膀上。"

**第二层，抽取是否忠实于来源。** 两个LLM judge给1,000个抽取出的persona打分。6位人类评审对其中100个打出的均分是4.135/5。Claude Opus 4.8的评分有93.8%落在人类均分的1分以内，GPT 5.5为79.2%。

**第三层，结论是否跨模型稳定。** 在一个金融研究工具（OpenBB）任务里，每个persona被赋予从敌意到信任的四档信任倾向。三个模型给出的四组排序完全一致，Cramér's V在0.228到0.363之间。

真人一致性是论文没有正面覆盖的一层。采访里他们的说法是：团队会拿来自真实档案的persona与对应真人比对最终选择，比如"选A还是选B"。结果因领域而异。软件工程和computer use差距较小，因为"人能操作的它也能操作"。金融、健康、政治选举"gap都还挺大"。需要真实触感的体验，比如"我真的要喝了才知道喜不喜欢"，目前做不了。论文结论也是同样的立场：把结论用于真实人群或重大决策之前，仍然需要真人研究。

他们官网上的一篇立场文章讨论了更深一层的问题，题目是"要模拟用户，你得先把LLM变笨"。文章认为前沿模型知道得太多、太稳定、太少失败，拿它直接扮演用户，就测不出真实用户会卡在哪里。

## 五、基座模型换代怎么办

采访中我们问：persona只是加在基座模型上的一层，基座换代、模型自身性格变化，模拟会不会跟着漂移？

他们承认这正是要解决的问题。如果persona只是"浅层的一个layer"，基座一变结果就会变，所以要做能适配不同base model的方法，也要训练自己的模型。他们建议，驱动persona的模型应该作为评测配置的一部分，每个结果都注明；重要发现在指导产品决策前，应换不止一个模型复核。

他们的技术博客给出了一个实际例子。一家印度AI公司提供的案例里，400个模拟的印度企业主和财务负责人评估四版会计师服务约定书。降低预付款并放宽责任上限的版本，把"只需小改"的比例从0%提高到23%。其中责任条款的影响（+19.63个百分点）远大于付款节奏（+3.38个百分点）。同一批persona换用三个不同模型重跑，结论方向一致，具体比例各不相同。

他们的另一项研究MicroVerse测的是长程模拟中的身份漂移。25个agent各带一份锁定的"灵魂文件"（价值观与道德底线），进入水资源不足的沙漠网格。研究者对比这份固定文件与agent自己持续改写的"生活日志"之间的差距。在同一张地图上，Qwen3-32B找到绿洲后就留下，Claude Haiku找到水后还在不停迁移，12次运行里有11次全员死亡。他们据此提醒：给agent设定冷酷人格时，测到的可能是模型自带的安全习惯，而不是他们以为部署了的那个persona。

## 六、客户是谁，买的是什么

**客户画像。** 目前的客户主要是LLM模型和数字产品厂商：有做通用模型的大厂，也有专攻垂直领域模型的实验室。主攻方向是电商、游戏和广告。询问来自十多个国家，包括新加坡、日本、阿根廷、柬埔寨、墨西哥、瑞士、瑞典和中国。不少海外团队的目标市场其实还是美国。小商家（比如餐馆老板）、一人公司和学术研究者也在询问。

**有意不做的领域。** 政府合作和政治选举他们基本不碰。主要原因是敏感度高，而且这类结果不太取决于persona，很容易被黑天鹅事件左右，比如一次枪击或一场地震。金融市场预测同理。这一点与Aaru等竞品形成区别，后者的特长正是预测选举和群体行为。

"frontier lab和big tech给我们的反馈是，钱他们不是那么在乎，save的时间反而是最重要的。他们不想等十天，想半天甚至几个小时就出一轮，然后立刻去改training、改harness。"话虽如此，他们在成本上也有优势。官网的成本分析给出了金额：1万份问卷，真人方案的成本在28,560美元以上，模拟方案在3.60到104美元之间；1,000段对话，真人方案8,568美元以上，模拟方案3到87美元。

他们还提到了真人评测相比模拟的三个劣势：

1. **规模不具代表性。** 模型面向十亿用户，真人评测只能找到五万到十万人。
2. **标注者分布偏。** 他们见过最后发现八成标注者集中在东南亚某一个国家的情况。
3. **信号噪声大。** 用户中断对话，可能只是临时离开，过后又回来了。真人通常只给一个赞或踩，模拟用户则每次都能写出理由。

但他们把自己定位为补充而非替代："可以先在我们这边快速迭代，再做一轮最后的human eval。"

**交付物不止评测报告。** 模拟产生的多轮交互数据可以用于SFT。团队还提供RL用的reward model，其中"不只包含task completion，也包含每个用户自己的user satisfaction"。

**赛道背景。** 斯坦福"Smallville"作者Joon Sung Park创办的Simile，今年2月宣布1亿美元A轮，7月底又以20亿美元估值完成2亿美元B轮。Aaru去年12月的A轮由Redpoint领投，部分股权按10亿美元估值成交。这些公司大多从市场调研切入，更偏定性研究和深度访谈，目标是预测某个人或某个群体，而MatrAIx要做的是"large scale的persona agent deployment"。Xiaomin补充说，模型迭代现在"不依赖每两周改一套算法"，靠的是hill climbing，也就是找到最强的模型仍会失败的地方。"他们的target可能真的要去预测一个人；我们的target是通过simulation带来人的多样性，找到模型潜在的问题。"

## 七、Dynamic persona与镜像世界

新版本里，persona不再是静态的。情绪和工作状态会变，agent会self-evolve，有记忆，甚至有社交关系，不过关系网暂时受限："每个人都要认识上万人的话，就不太efficient了。"

具体做法是以大事件驱动。团队把现实中的新闻输入进去，比如加州地震，让特定地区、特定群体的agent"像人一样去做出反应"，反应写入各自的memory。目前模拟世界与现实时间流速一致。可以加速，但加速之后"就失去了很多现实生活中的big events去做projection"。

## 参考来源

- MatrAIx: Simulating the World with 8.3 Billion Persona Agents (arXiv 2608.04205) · HTML全文
- Simulating the World with 8.3 Billion Personas（MatrAIx官网技术报告解读）
- MatrAIx In The Wild: Technical Blog
- To Simulate a User, You Should Make Your LLM Dumber
- Measuring Persona Drift in Long-Horizon Agent Simulations
- MatrAIx Research 索引（含成本分析）
- GitHub: MatrAIx-Persona-8B
- Hugging Face Papers 页面
- Mind the Sim2Real Gap in User Simulation for Agentic Tasks (arXiv 2603.11245)
- TechCrunch: Simile raises 200M at 2B valuation
- Aaru Series A 报道（Yahoo Finance / TechCrunch）
- FishDog: Aaru AI Review 2026
- X Trending: MatrAIx（含Community Note）

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
