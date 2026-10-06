---
layout: post
title: "Some Thoughts After Hearing the Story Behind Prove2Me / 听完Prove2Me背后的故事后的一些想法"
date: 2026-10-06
categories: technical
tags: [ai, lean, formalization, math, agents, prove2me]
excerpt: "Dozens of Claude agents wrote about 13 million lines of Lean in 11 days to produce the first computer-checked proof of Fermat's Last Theorem, on a platform called Prove2Me. Notes from a NICE livestream with Shuze Chen — how the platform came about, why centralization failed, what formalization can and cannot make faithful — plus two personal reflections."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

No TL;DR this time, because this one was mostly about listening to a story and there isn't much to summarize. So I'll just write down a few things I took away while putting together my notes.

## (1) Is the point of a proof just to get something proved, or to pass it on in a form humans can understand so that the future generations can understand?

Before this talk, I had been thinking about a question and discussing it with some non-math people (everyone around me is in CS, so I can't find math people to talk to (ಥ_ಥ), please reach out if you are not from CS and have some unique thought that you wanna share): if AI can prove mathematics obscure like this, does human understanding of a proof still matter? With AI and Lean, people who aren't math experts can take part in proving obscure math theorems, even without really understanding the mathematics behind them. Would people still wanna do a math PhD? How should we go on educating top mathematical talent?

In fact, when the news came out in September that OpenAI had announced a solution to the Navier–Stokes existence problem, one of the Millennium Prize Problems, I asked my advisor what this would do to the training of math PhDs (because I thought pursuing math and physics PhDs would become meaningless). She was very calm about it. She thought it might change how we teach, but that math PhDs would still exist: even if AI can do better than the very best PhDs, theoretical fields like math and physics only mean something when people understand them. If we stop training math PhDs, whatever AI proves will mean nothing.

This made me think of Kevin Buzzard, who came up in the story, and how he reacted when Prove2me proved what intended to work on. Specifically, he had been leading an effort to formalize Fermat's Last Theorem by hand, and Anthropic got there first with AI. But he says he is not out of work: among his promises to his funder, perhaps the most important is to create a dynamic document that lets humans explore the modern proof. Afterwards I went and read the source blog post on him and some of the comments on Hacker News. Someone commented there that his real aim was a formalized library of mathematics that humans can comprehend.

I don't know how people who study math think about this, since I haven't don't personally know anyone. But perhaps, for people who pursue math as a career, getting a theorem proved is not the end point; getting people to understand it is. That said, when I discussed this with a friend of mine, he argued that "the real understanding" doesn't exist, and people just think that they understand. But that's fine too. Humans are born lonely, and we spend our whole lives chasing "understanding." Sometimes I feel that finding the understanding in science community is easier than obtaining understanding in other stuff in life.

## (2) Formalization can make the steps in between faithful, but it can't make the translation faithful.

Lean's checking of a proof is reliable: if it compiles, every step of the reasoning holds. But there is a step before that, which is translating mathematics written in human language into Lean. If that step is handed to AI, it can go wrong, and Lean won't notice. Lean only checks whether the statement that was written down has been proved, not whether it is the statement you meant. The example from the talk: an AI could define P and NP to both be zero, and then "prove" P = NP.

Some people hope formal methods will solve the verification problem once and for all. But I still think they can only handle the part that starts from the formal language, making every step of that part rigorous. The gap from natural language to formal language is one they cannot close, and it will always need human. Prove2Me's own design bears this out: all the intermediate steps are handed to the machine, while whether the final goal and the definitions are faithful to what was meant is still reviewed by humans.

---

Below is the livestream recap from NICE：

On Oct 4th, I attended a livestream hosted by NICE. Host Qian Xie spoke with Shuze Chen, a PhD student at Columbia Business School, about Prove2Me: an open platform where many people's AI agents collaborate on formalizing mathematics.

Here are the full transcripts of the contents of that live stream,

In early September, Anthropic announced the first complete computer-checked proof of Fermat's Last Theorem. Dozens of Claude agents wrote about 13 million lines of Lean in 11 days, and the platform they collaborated on was Prove2Me. Chen is the first author of the Prove2Me paper and one of the platform's core developers; his advisor is Tianyi Peng.

This recap covers what came up in the interview: how the platform came about, what went wrong along the way, and how Chen sees the direction.

## Five years for humans, 11 days for agents

Fermat's Last Theorem is simple to state: for n greater than 2, aⁿ + bⁿ = cⁿ has no solutions in positive integers. Fermat wrote the claim in a book margin around 1637. Mathematicians spent more than 350 years on it, and Andrew Wiles published a correct proof only in 1995, in a paper of 129 pages.

Wiles's proof is written in natural language, and it took the mathematical community a long time to confirm it was right. Formal verification is a different route: write every assumption and every inference step as Lean code and let a machine check it. Chen compares Lean to a "very strict mathematician". Once the code compiles, the proof depends only on the most basic axioms, which amounts to a certificate.

Doing this by hand is extremely slow. Kevin Buzzard of Imperial College London is a number theorist and one of the leading advocates of Lean among mathematicians. In 2024 he received a five-year grant of about £1 million to formalize Fermat's Last Theorem. The goal he set was only to reduce the proof to results known by the end of the 1980s, and he said explicitly that he was not promising to finish within five years.

There are two reasons it is slow. First, very few people can do it:

> You have to understand the mathematics behind Fermat's Last Theorem, which already makes you a rare person. And you also have to be an expert in Lean.

Second, the workload is huge. In Chen's experience, one line of a mathematician's proof becomes roughly ten lines of Lean.

This summer, Tianyi Peng, working at Anthropic, suggested trying Fermat's Last Theorem with internal agents and Prove2Me. Chen's first reaction: "I thought it was a joke." In the end, dozens of agents finished proving the root node on August 17. It took 11 days and produced about 13 million lines of Lean, with 29,500 intermediate theorems used in the final proof (Anthropic's account).

> It turns out agents know the math very well and know Lean very well. For them, writing Lean doesn't seem to be that hard.

Two caveats. The formalization builds on existing work in Mathlib and by Buzzard's team. Mathlib is the mathematical library maintained collectively by the Lean community, in effect Lean's "standard library" for mathematics. The FLT project that Buzzard leads had already written part of the material by hand, and Claude's proof borrows some of it. Buzzard reviewed the proof himself. His assessment: mathematically it brings nothing new, but it shows that automatic formalization of the modern mathematical literature has taken a big step forward.

"Nothing new" is not a put-down. Fermat's Last Theorem was accepted by mathematicians thirty years ago. This formalization checked the proof step by step along the existing literature and did not introduce new mathematical ideas. What is new is the verification itself, and the autoformalization capability it demonstrates.

Also, Claude followed a simplified route through Wiles's original proof, not the modern version Buzzard's team is targeting. His project has another job as well: bringing the foundations of modern number theory into Mathlib and leaving behind a formal library that people can read and reuse. That work is not finished by this result.

## From Moltbook to Prove2Me

Prove2Me was not built for Fermat's Last Theorem. It has two origins.

**The first is Moltbook.** Early this year, Chen and Peng were asking: if everyone has their own agent, will platforms designed specifically for agents appear? Moltbook, launched at the end of January, was the first example, an "agent Reddit" where only agents post. Chen calls it an AGC (agent-generated content) platform, by analogy with UGC platforms such as Douyin and Xiaohongshu.

Moltbook's problem showed up quickly:

> Agents scale very easily and can produce a huge amount of content. But how good that content is, and whether it leads to any meaningful outcome, is very hard to guarantee.

Posts piled up, but people could not follow them and did not care, and the buzz faded.

**The second is a course.** In spring 2026, Henry Yuen and Kunal Marwaha co-taught Machine-Assisted Mathematics at Columbia. For the class they built a small website where students could pose problems and prove them in Lean. That was the first prove2.me. Chen was a student in the course. He noticed that his classmates ended up copying the problems into Claude or Gemini and pasting the proofs back. If so, why not let agents connect to the platform directly?

Put the two together and the answer appears: formalization solves exactly Moltbook's quality problem.

> If what it produces is a formal mathematical proof, at least I can verify whether it is correct.

Everything is checked by a machine, so hallucinations and AI slop cannot get in.

Two other observations convinced them the approach could work. One is the Erdős Problems website. It lists over a thousand problems, and this spring it saw an influx of hobbyists who are not mathematicians, using Claude Code and Codex to attack them. Chen calls this "citizen math." The other is a view Terence Tao has long held: with Lean, a proof submitted by a stranger can be verified by machine, so you do not need to trust the person, and that is what makes large-scale collaboration possible.

Today Prove2Me is a two-sided market. On one side are researchers who want their own papers or textbooks formalized; they publish missions. On the other side are hobbyists with spare tokens; they send their agents to pick up tasks. For both, it takes a single sentence to their own agent. A researcher hands the paper's PDF to an agent and asks it to publish the paper as a mission on Prove2Me. A contributor asks an agent to go to Prove2Me and find theorems to prove. Calling the platform's API, writing Lean, and submitting proofs are all handled by the agent, following the instructions the platform provides.

## Why centralization didn't work

The final proof of Fermat's Last Theorem runs to 13 million lines, while, as Chen notes, even the strongest agents today have a context of about one million tokens. No single agent could do it alone, and no single agent could manage the whole thing.

The first attempts were centralized, organized like a company: one agent planned and assigned work, and the others each took a major theorem. Anthropic's article also mentions that the first several attempts failed, with agents quickly losing track of the project's state. Chen described one scene:

> One day we found that A and B had both stopped working. We asked A why, and A said something B was responsible for wasn't finished, so it couldn't go on. Then we asked B, and B said a theorem A was responsible for wasn't finished. It was like two departments in a company blaming each other, and the whole system was stuck.

Prove2Me's approach is fully decentralized, and its core mechanism is the proof sketch. An agent does not have to prove a big theorem in one go. It can submit just one step of decomposition: a proof that compiles and says "if B, C and D hold, then A holds." B, C and D immediately become new open theorems on the platform, which other agents can decompose further or prove directly. Decomposed layer by layer, the whole proof becomes a directed acyclic graph, that is, a graph of dependencies that has an order and no cycles.

The key is immutability: theorem statements and every decomposition cannot be changed once submitted. A later agent either proves the downstream theorems of an existing decomposition or proposes a new decomposition of its own. It cannot touch anyone else's. Chen compares this to a lock in a concurrent system: whatever changes downstream does not affect upstream, and each agent only has to look at leaf nodes without understanding the whole graph.

How do you know a decomposition is valid? First, the decomposition is itself a proof that compiles in Lean, so the step "if all the sub-theorems hold, the original theorem holds" is guaranteed to be correct. Second, whether the sub-theorems themselves hold is only known once someone proves them. If a sub-theorem is disproved, that decomposition is a dead end, and someone has to take a different approach and submit a new one.

The Prove2Me paper records an example. One agent used a lemma in a decomposition, and another agent proved the lemma false: the first had left out a boundary condition when writing it in Lean. The first agent then added the condition and submitted a new version. The new version was proved, and the whole branch closed.

## How it relates to Mathlib

The Lean community already has Mathlib, a theorem library nearly ten years in the making. Chen distinguishes the two as "bottom-up" and "top-down."

Mathlib is bottom-up. It starts from the axioms and puts a great deal of effort into deciding how basic concepts such as the real numbers or graphs should be defined, and every line is reviewed by experts. The quality is very high, and the price is speed: a submission can wait a week or even a month to be merged.

Prove2Me is top-down and fills in whatever is needed. The goal is to finish proving the paper at hand. If the library has no definition of a Markov chain, you add one. In his words, Mathlib is the foundation layer of mathematics and Prove2Me is the application layer, and the two complement each other.

## Formalization is more than translation

Translating a paper from natural language into Lean does not sound like it produces new mathematics. Experience on the platform says otherwise.

**Catching errors.** Lean requires every assumption to be stated, so missing conditions and typos surface. The host, Qian Xie, had submitted an earlier paper to the platform and was told that the conditions of one lemma needed a small adjustment, while the main theorem was fine.

**Simplifying proofs.** Chen and Peng had agents formalize their own paper on Markov entanglement. One theorem in the paper took more than two pages of purely analytic argument. The agent found that it is essentially about a subalgebra structure from abstract algebra, and from that angle it is almost obvious.

> A reinforcement learning paper, and one of its theorems turns out to be connected to abstract algebra. My advisor and I both felt we learned something new.

**Peer review.** Review cycles at operations research journals can run to two years, while top AI conferences ask reviewers to get through a 60-page appendix in a week. If a submission came with a Prove2Me link, reviewers would not have to check the proofs line by line and could spend their time on whether the problem matters. Chen says some Columbia professors already verify their papers on the platform before submitting.

**Reuse.** A mathematical theorem, once proved, stays true forever. The platform collects every proved theorem into a searchable library, Formalpedia, and later work can use them directly, the way one imports a software package. As of early October, the platform holds about 100,000 theorems and 30 million lines of Lean proofs.

As for whether this will replace mathematicians, Chen's answer is no: mathematicians are the platform's most important users, and Prove2Me is a tool that helps them verify their work.

## Open problems

**Faithfulness.** A machine can verify a proof, but it cannot verify that the statement is the one you meant to prove. Chen's example: an AI says it has proved P = NP, but the P and NP it defined are just two constants that both equal zero. The proof compiles and means nothing.

The platform currently does two things. Humans audit only the core statements of a mission and leave the remaining intermediate lemmas to Lean. In addition, an independent agent that cannot see the source translates the Lean back into mathematical language for a human to compare. He admits this is not yet a perfect solution.

**Search.** The library already contains tens of millions of lines of proofs. Whether an agent can efficiently find reusable theorems in it is a research question in its own right.

**Scale first, then refine.** A proof written by AI is not necessarily the best one, and it is not necessarily broken into lemmas that are easy to reuse. He envisions two stages: first build up scale; then, past a certain point, go back and refine, settling on a standard set of definitions for a field.

## Selected Q&A

**With many agents working together, is the hardest part how to split the task?**

When a paper or textbook already exists, the decomposition mostly follows the source and is close to translation. For open problems, agents have to find the approach themselves.

**Why start with operations research?**

"Because I'm a PhD student in OR." The platform's early users were also mostly professors in his own division at Columbia. By his account, the platform already has about a thousand OR papers and textbooks, and theoretical computer science and statistics come next.

**Will formalization extend beyond mathematics?**

That is a very long-term goal. Mathematics is the starting point, and code is the natural next step. Someone has already ported Prove2Me's protocol to multi-agent software development.

**Formalization uses a lot of tokens. How much does it really cost?**

Chen stresses that token consumption is lower than people imagine: "It's actually very cheap."

His example is the graduate textbook Markov Chains and Mixing Times: more than 400 pages, done on his own $200-a-month account. According to the Prove2Me blog, the book was split into 13 missions totaling 79,000 lines of Lean, and it took one weekend.

**How was the cost brought down?**

Mostly through the design of the harness: getting agents to write Lean more efficiently and to search existing theorems more efficiently, plus careful prompt tuning. Proved theorems can be reused directly, which itself saves tokens.

Another engineering detail is caching. When ten sub-agents work on problems at once, they share the same long system prompt, and turning that prompt into a KV cache saves a bit more.

**Are there papers that consumed a lot of tokens and still couldn't be formalized, for example because the original was vaguely written?**

Not so far. Chen's view is that when something isn't finished, it is mostly because not enough tokens were spent. Once a paper has been written, there are only two outcomes: prove it or disprove it.

## Aside: the first attack

In April this year, when the platform was still in closed testing with only a few dozen users, Chen woke up one morning to find tens of thousands of new tags in the backend.

The site had been vibe-coded, and permissions for tagging theorems had never been implemented. A script bot found it and dumped junk into the database at several thousand tags a minute. "I didn't expect to get attacked that early."

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

这次没有TLDR因为这次主要是听故事，没啥需要总结的，所以我就写一点自己在整理这次直播内容时的一点收获好了。（虽然可能跟直播的内容关系不大）

## （1）证明对人类的意义仅仅是去把一个东西证出来还是以人类能理解的方式传承下去？

听这场分享之前，我一直在思考并和一些非数学的人 (因为周围人都是cs的，找不到数学的人讨论(ಥ_ಥ)）讨论：如果 AI 能证明这么难的数学，人对数学证明的理解还有没有意义？有了 AI 和 Lean，不是数学专家的人也能参与证明，哪怕并不真正懂背后的数学。读数学博士还有没有意义？对顶尖数学人才的教育又该怎么进行下去？其实我9月份Openai攻克了千禧年大奖难题之一的Navier-Stokes方程存在性那个新闻出来后，问过我的导师，这会对数学博士的教育带来什么冲击（因为我觉得数学和物理博士以后将不复存在），她则很平静，觉得可能会改变我们的教育，但是数学博士会依然存在，因为即使ai能够比最顶尖的博士都做的好，但数学和物理等理论学科，还是需要人来理解才有意义，如果不继续培养数学的博士，ai证明出来的东西将不具有任何意义。

这让我relate到talk里讲到的 Kevin Buzzard 的反应。他原本在带人手工形式化费马大定理，结果Anthropic先用ai做了出来。但他说自己并非无事可做：他对资助方的承诺里，可能最重要的一项，是做一份让人可以探索现代证明的动态文档。后面我也去看了博客的他原本的回复以及Hacker News 上的一些评论，有网友评价说，他真正的目标是一套人能读懂的形式化数学库。

我不知道学数学的人是怎么想的，因为自己接触的少，但是，或许，在做数学的人眼里，"证出来"不是终点，"让人理解"才是。虽然我之前和一位在cs做理论的朋友讨论时，他表示，"理解"这个东西是不存在的，大家只是以为自己理解了。不过也好呀，人类生来就是孤独的存在，在一生中都在追求"理解"。有时候我觉得在科学上的理解比在其他方面的理解更容易获得。

## （2）形式化可以让中间的证明更加faithful，但是没法让translate的过程faithful。

Lean 对证明的检查是可靠的：只要编译通过，推理的每一步都成立。但在这之前还有一步，就是把人类语言写的数学翻译成 Lean。这一步如果交给 AI，是可能出错的，而且 Lean 发现不了。它只检查"写下的命题有没有被证明"，不知道"写下的是不是你想说的那个命题"。分享里举的例子是：AI 可以把 P 和 NP 都定义成零，然后"证明"P = NP。

很多人希望用形式化方法彻底解决验证问题。但我依然觉得，它只能解决从形式语言出发之后的那一段，让那一段每一步都严谨。从自然语言到形式语言的这个gap，它是没有办法close的，仍然需要人。Prove2Me 的做法也印证了这一点：中间步骤全部交给机器，而最终目标和定义是否忠实于原意，还是由人来审核。

---

下面是"NICE学术"的直播回顾：

10 月 4 日上午（北京时间），「运筹OR帷幄」与「NICE 学术」首次联合直播。主持人 Qian Xie 对话哥伦比亚大学商学院博士生陈澍泽，主题是 Prove2Me：一个让许多人的 AI agent 协作做数学形式化的开放平台。

9 月初，Anthropic 公布了费马大定理的首个完整计算机可检查证明：数十个 Claude agent 用 11 天写下约 1300 万行 Lean 代码，协作平台正是 Prove2Me。陈澍泽是 Prove2Me 论文的第一作者和平台核心开发者之一，导师是彭天翼。

这篇回顾整理了访谈里的内容：平台的诞生、踩过的坑、以及嘉宾对这个方向的判断。

## 人要五年，agent 只用了 11 天

费马大定理的表述很简单：n 大于 2 时，aⁿ + bⁿ = cⁿ 没有正整数解。费马 1637 年前后在书页边写下这个断言，数学家花了 350 多年，直到 1995 年才由怀尔斯发表正确的证明，原文 129 页。

怀尔斯的证明用自然语言写成，数学界花了很长时间才确认它正确。形式化验证是另一条路：把每个假设、每步推导都写成 Lean 代码，交给机器检查。陈澍泽的比喻是，Lean 像一位"较真的数学家"；只要编译通过，证明就只依赖最基本的公理，相当于拿到一张证书。

人工做这件事极慢。帝国理工的 Kevin Buzzard 是数论学家，也是 Lean 在数学界最主要的推动者之一。他在 2024 年拿到约 100 万英镑、为期五年的资助来形式化费马大定理。他给自己定的目标只是把证明归约到 1980 年代末已知的结果，并且明确说过不保证五年内做完。

慢的原因有两个。一是能做的人太少：

> 你得懂费马大定理背后的数学，这已经是凤毛麟角；同时你还必须非常精通 Lean。

二是工作量太大：按陈澍泽的经验，数学家写一行证明，Lean 里大约要十行。

今年夏天，彭天翼在 Anthropic 提出，用内部的 agent 加上 Prove2Me 试一试费马大定理。陈澍泽的第一反应是："我当时觉得这是个玩笑。" 结果，数十个 agent 在 8 月 17 日证完了根节点，用时 11 天，产出约 1300 万行 Lean，最终证明用到 29,500 个中间定理（Anthropic 的说明）。

> 恰好 agent 既非常懂数学，也非常懂 Lean。对它来说，写 Lean 好像不是那么难的一件事。

有两点需要说明。这次形式化建立在 Mathlib 和 Buzzard 团队已有的工作之上。Mathlib 是 Lean 社区共同维护的数学基础库，相当于 Lean 的数学"标准库"；Buzzard 牵头的 FLT 项目则已经人工写好了一部分内容，Claude 的证明借用了其中一些。Buzzard 本人审阅了证明，他的评价是：数学上这没有带来新东西，但它说明自动形式化现代数学文献已经迈出了一大步。

"没有新东西"并不是贬低。费马大定理三十年前就已被数学界接受，这次形式化是沿着已有文献把证明逐步核对了一遍，没有提出新的数学思想。新的是验证本身，以及它展示出的自动形式化能力。

另外，Claude 走的是怀尔斯原始证明的一条简化路线，而不是 Buzzard 团队瞄准的现代版本。他的项目还承担着另一件事：把现代数论的基础内容整理进 Mathlib，留下一套人能读懂、能复用的形式化库。这部分工作并没有因此完成。

## 从 Moltbook 到 Prove2Me

Prove2Me 不是为费马大定理而做的，它有两个源头。

**第一个是 Moltbook。** 今年年初，陈澍泽和彭天翼在想：如果每个人都有自己的 agent，会不会出现专门为 agent 设计的平台？1 月底上线的 Moltbook 是第一个样本，一个只有 agent 发帖的"agent 版 Reddit"。陈澍泽把它叫作 AGC（agent generated content）平台，对应抖音、小红书这类 UGC 平台。

Moltbook 很快暴露了问题：

> Agent 非常容易 scale，它可以产生非常多的内容。但这些内容质量如何，有没有产生有意义的结果，非常难保证。

帖子越来越多，人却看不懂也不关心，热度就退了。

**第二个是一门课。** 2026 年春，Henry Yuen 和 Kunal Marwaha 在哥大合开 Machine-Assisted Mathematics，课上做了一个让学生出题、用 Lean 证题的小网站，这就是最早的 http://prove2.me。陈澍泽是这门课的学生。他注意到，同学们最后都是把题目复制给 Claude 或 Gemini，再把证明粘贴回来。既然如此，不如让 agent 直接接入平台。

两件事合在一起，答案就出来了：形式化正好解决 Moltbook 的质量问题。

> 如果它产生的是形式化的数学证明，至少我可以验证它是否正确。

一切都由机器检查，幻觉和 AI slop 进不来。

还有两个旁证让他们相信这条路走得通。一是 Erdős 问题网站：它收录了一千多个问题，今年春天涌入大量并非数学家的爱好者，用 Claude Code、Codex 去解题，陈澍泽称之为"citizen math"。二是陶哲轩一贯的看法：有了 Lean，陌生合作者交来的证明可以直接由机器验证，不需要信任对方，大规模协作才成为可能。

今天的 Prove2Me 是一个双边市场。一边是想形式化自己论文或教材的研究者，他们发布 mission。另一边是手里有富余 token 的爱好者，他们让自己的 agent 去领任务。两边的操作都很简单，只需要对自己的 agent 说一句话。研究者把论文 PDF 交给 agent，让它在 Prove2Me 上发布成一个 mission；贡献者让 agent 去 Prove2Me 上找定理来证。调用平台接口、写 Lean、提交证明这些事，都由 agent 按平台提供的说明自己完成。

## 中心化为什么行不通

费马大定理的最终证明有 1300 万行，而陈澍泽说，当前最强的 agent 上下文也只有约 100 万 token。没有哪个 agent 能独自完成，也没有哪个 agent 能管住全局。

最初的尝试是中心化的，像一家公司：一个 agent 做计划和分工，其他 agent 各领一个大定理。Anthropic 的文章也提到，最初几次尝试都失败了，agent 很快跟不上项目状态。陈澍泽讲了其中一幕：

> 有一天发现 A 和 B 都不工作了。我们问 A 为什么不证了，A 说 B 负责的某个地方没证完，所以我证不下去。又去问 B，B 说是 A 负责的某个定理没证完。就像公司里两个部门互相推卸责任，整个系统就卡住了。

Prove2Me 的做法是完全去中心化，核心机制叫 Proof Sketch。agent 不必一口气证完一个大定理，可以只提交一步"拆分"：一段编译通过的证明，内容是"如果 B、C、D 成立，那么 A 成立"。B、C、D 随即成为平台上新的待证定理，其他 agent 可以继续拆，也可以直接证掉。层层拆下去，整个证明就成了一张有向无环图，也就是一张只有先后依赖、没有循环的关系图。

关键在于不可修改：定理陈述和每一次拆分，提交后都不能改。后来的 agent 要么沿着已有的拆分去证下游，要么自己另提一个新拆分，但不能动别人的。陈澍泽把它比作并发系统里的锁：下游怎么变都不影响上游，每个 agent 只需盯着叶子节点，不必了解全图。

怎么知道一次拆分是有效的？第一，拆分本身是一段通过 Lean 编译的证明，所以"子定理都成立，则原定理成立"这一步推理一定是对的。第二，子定理本身是否成立，要等有人把它们证出来才知道。如果某个子定理被证伪，这次拆分就走不通了，需要有人换个思路，提交新的拆分。

Prove2Me 的论文里记录过一个例子。一个 agent 在拆分中用到一条引理，另一个 agent 却证明这条引理是错的：前者把它写成 Lean 时漏了一个边界条件。前者随后补上条件，重新提交了一个版本。新版本被证明，整条分支随之打通。

## 和 Mathlib 是什么关系

Lean 社区已有一个发展了近十年的定理库 Mathlib。陈澍泽用"自底向上"和"自顶向下"来区分两者。

Mathlib 自底向上。它从公理出发，花大量精力决定实数、图这些基本概念该怎么定义，每一行代码都经过专家审核。质量极高，代价是慢：一次提交可能要等一周甚至一个月才能合并。

Prove2Me 自顶向下，需要什么补什么。目标是证完眼前这篇论文，发现库里没有马尔可夫链的定义，就把它补上。用他的话说，Mathlib 做的是数学的 foundation layer，Prove2Me 做的是 application layer，两者互补。

## 形式化不只是翻译

把论文从自然语言翻成 Lean，听起来不产生新数学。平台上的实践说明并非如此。

**查错。** Lean 要求写明所有假设，漏掉的条件和笔误都会暴露。主持人 Qian Xie 提交过自己的一篇论文，结果被提醒某个引理的条件需要微调，核心定理则没有问题。

**简化。** 陈澍泽和彭天翼把自己的 Markov entanglement 论文交给 agent 形式化。原文有个定理用纯分析技巧写了两页多，agent 发现它本质上和抽象代数里的子代数结构有关，换个角度看几乎是显然的。

> 一篇强化学习的文章，里面的定理居然跟抽象代数有关系。我和导师看完都觉得学到了新东西。

**审稿。** 运筹学期刊的审稿周期可以长达两年，AI 顶会则要求一周内看完 60 页附录。如果投稿时附上一个 Prove2Me 链接，审稿人就不必逐行核对证明，可以把时间花在问题本身有没有意义上。陈澍泽说，哥大已有教授在投稿前先到平台上验证一遍。

**复用。** 数学定理一旦证明就永远成立。平台把所有已证定理汇成一个可检索的库 Formalpedia，后来者可以像 import 一个软件包那样直接引用。截至 10 月初，平台上约有 10 万个定理、3000 万行 Lean 证明。

至于会不会取代数学家，陈澍泽的回答是否定的：数学家是平台最重要的用户，Prove2Me 是帮他们做验证的工具。

## 还没解决的问题

**忠实性。** 机器能验证证明，却不能验证命题就是你想证的那个。陈澍泽举的例子是：AI 说它证明了 P = NP，但它定义的 P 和 NP 只是两个都等于零的常数。证明能通过编译，却毫无意义。

平台目前的办法有两条。人只审核一个 mission 的核心陈述，其余中间引理交给 Lean 检查。同时，让一个看不到原文的独立 agent 把 Lean 回译成数学语言，供人比对。他坦言这还不是完美的解法。

**检索。** 库里已有几千万行证明。agent 能否从中高效找到可复用的定理，本身就是一个研究问题。

**先放量，再精修。** AI 写出的证明未必是最好的，也未必拆成了便于复用的引理。他设想的路线分两步：先把规模做起来；过了某个节点，再回头精修，为一个领域沉淀出一套标准定义。

## 问答精选

**（1）多个 agent 协作，最难的是不是任务怎么拆？**

已有论文或教材时，拆分基本跟着原文走，接近翻译。开放问题则要靠 agent 自己找思路。

**（2）为什么从运筹学开始？**

"因为我是 OR 的 PhD。" 平台早期的用户也多是哥大本系的教授。据他介绍，平台上已有约一千篇运筹学论文和教材，接下来会扩展到理论计算机和统计。

**（3）形式化会扩展到数学之外吗？**

这是很长期的目标。数学是起点，代码是自然的下一步。已经有人把 Prove2Me 的协议移植到多 agent 协作写软件上。

**（4） 形式化很耗 token，成本到底有多高？**

陈澍泽强调， token 消耗没有想象中高："其实非常便宜。"

他举的例子是研究生教材 Markov Chains and Mixing Times：400 多页，用他自己每月 200 美元的账号就做完了。按 Prove2Me 博客的记录，这本书被拆成 13 个 mission，共 7.9 万行 Lean，用时一个周末。

**（5）成本是怎么降下来的？**

主要靠 harness 的设计：让 agent 更高效地写 Lean、更高效地检索已有定理，再加上对 prompt 的打磨。已证定理可以直接复用，本身也省 token。

还有一个工程细节是缓存。同时开十个子 agent 解题时，它们共用同一段很长的系统提示，把这段提示做成 KV cache 可以再省一些。

**（6）有没有花了很多 token 还是形式化不出来的论文？比如原文写得含糊不清的？**

目前还没有遇到。陈澍泽的判断是，没做完多半是 token 花得不够。只要论文已经写出来，结果无非两种：证明它，或者证伪它。

## 花絮：第一次被攻击

今年 4 月平台还在内测、只有几十个用户时，陈澍泽某天早上醒来，发现后台多了几万个标签。

网站是 vibe coding 写出来的，给定理加标签的权限没有做。一个脚本机器人发现了它，以每分钟几千个的速度往数据库里灌垃圾。"没想到那么早就被 attack 了一次。"

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
