---
layout: post
title: "英伟达为什么要保卫开放权重，以及它将如何重塑AI算力市场 / Why NVIDIA Is Defending Open-Weight Models—and How They Could Reshape the AI Compute Market"
date: 2026-07-30
categories: personal
tags: [ai, open-weights, inference, nvidia, cloud]
excerpt: "Open weights are not just a model-release choice; they reshape who buys compute, who controls inference demand, and how much bargaining power enterprises have against closed APIs."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

In mid-July, Moonshot released Kimi K3, a 2.8-trillion-parameter open-weight model that beat the flagships from OpenAI and Anthropic on the FrontierSWE coding benchmark. A few days later, Alibaba shipped a new version of Qwen. On July 20, Axios reported that the Trump administration was again pushing for a de facto ban on Chinese open-weight models; the instruments under discussion included Entity List designations, federal procurement restrictions, security advisories, liability rules, and pressure on US companies running Chinese models in production. Four days after that, on July 24, Jensen Huang used the first X post of his life to publish a policy letter titled "Open Weights and American AI Leadership." The ask: Washington should not impose "premature restrictions" on downloadable AI models. The first version carried 25 corporate signatures, including NVIDIA, Microsoft, and Meta. Within a day it doubled to 50 — OpenAI and Google had signed; Amazon and Anthropic had not. By July 30, the official page hosted by Microsoft listed more than 230 signatories, and Amazon had appeared among them. The roster spans chips, servers, clouds, neoclouds, inference platforms, enterprise software, developer tools, and venture capital. Anthropic is the only frontier lab that has stayed away throughout.

## Two ways inference demand can converge

The center of gravity in AI compute demand is shifting from training to inference. At a press Q&A at CES 2026, Huang offered a figure: one out of every four tokens generated today comes from an open model. There are two extreme shapes that inference demand could converge toward:

**(1) Concentrated.** Demand pools into a handful of closed frontier model companies. Enterprises rent intelligence, and tokens flow out of a few API endpoints.

**(2) Diffused.** Demand sinks down to tens of thousands of enterprises, inference platforms, neoclouds, sovereign AI programs, and application companies, each running its own specialized model.

Open weights are the condition that makes diffusion cheap and scalable. So this is a fight over market structure. And market structure determines whether NVIDIA faces five buyers or fifty thousand, and whether enterprises have any alternative to bring to the table when negotiating with closed APIs.

## What NVIDIA wants is a fragmented buyer base

On the surface, NVIDIA should be neutral on model paradigms — whether closed labs dominate or an open ecosystem does, both sides buy GPUs. As long as AI workloads grow, NVIDIA makes money.

But NVIDIA cannot be neutral on the *structure* of its buyers. Its customer concentration is rising fast: in FY2026 Q3, four direct customers each accounted for more than 10% of total revenue, adding up to 61%; a year earlier it was three customers at 12% each, totaling 36%. We can only see concentration at the procurement layer, not the names of the end demand. But there is little disagreement in the market about who that procurement ultimately serves: Google, Amazon, Meta, Microsoft, OpenAI. And those same companies are the only ones capable of building an alternative to NVIDIA. Google has TPU, Amazon has Trainium, Meta has MTIA, Microsoft has Maia, and OpenAI is co-developing silicon with Broadcom. The weaknesses of these ASICs — narrow ecosystems, high CUDA migration costs — are not fatal for a hyperscale platform with a fixed internal workload, and those weaknesses are shrinking: both TPU and Trainium are now sold externally. Anthropic, for instance, uses Google TPU, AWS Trainium, and NVIDIA GPUs simultaneously, with the stated rationale of "matching the workload to the most suitable chip" — which is to say, large-scale frontier training can run on non-NVIDIA silicon. (NVIDIA is also one of Anthropic's investors, so the two are not purely adversarial.) Which is why NVIDIA needs a world with a more fragmented buyer base. Tens of thousands of customers who can neither afford nor build their own chips are a far safer foundation than a few giants who are actively building substitutes. The Nemotron family, and the Nemotron alliance announced at GTC 2026 — with roughly $26 billion of company investment over five years — all indicate that NVIDIA is paying out of pocket to manufacture the fuel for a diffused world.

(That said, as NVIDIA's own 10-K risk factors note, open-source AI depends on developer adoption, and if it is deployed on competitors' platforms it could reduce demand for NVIDIA's products. Open weights push demand downward, but which silicon it lands on once it gets there is not NVIDIA's call.)

## Sovereign AI: a new national-scale demand category

Sovereign AI refers to an AI capability stack that a country builds and controls itself: compute located within its borders, models under its own legal jurisdiction, and training data that includes its own languages, public data, and industrial knowledge. Three forces drive it — data localization (healthcare, financial, government, and defense data not flowing to foreign APIs), national security (critical systems cannot depend indefinitely on foreign companies' closed models and terms of service), and language and culture (leading frontier models under-serve a great many non-English languages, dialects, and administrative and legal systems).

By NVIDIA's own disclosure, sovereign AI revenue exceeded $30 billion for full-year FY2026, more than tripling year over year, with the main contributions coming from the UK, France, the Netherlands, Canada, and Singapore; FY2027 Q1 added new AI factory projects in Japan, South Korea, and Germany. The buyers of supercomputers used to be research institutions; the buyers of AI factories are finance ministries, defense ministries, national telecom operators, and sovereign wealth funds. Saudi money is betting on both tracks at once: domestically, PIF-owned HUMAIN is building gigawatt-scale compute and the Arabic model ALLAM, while Aramco Ventures led Together AI's $800 million round in July, investing directly into the American open-weight inference layer. Nearly all of these countries are US allies, and nearly all of what they buy is NVIDIA. So what "sovereign AI" is actually doing at this stage is trading API dependence for chip dependence — and the chips still come from NVIDIA. For NVIDIA, sovereign AI is therefore a demand category that expands the number of buyers while posing no threat at all to its own moat.

For policymakers, a country that can only call foreign closed APIs does not have real sovereign AI; it needs models it can download, inspect, deploy, fine-tune, and maintain over the long term. Kimi, DeepSeek, Qwen, and GLM are mostly released under permissive licenses like MIT, which is exactly what sovereign programs need. If the US restricts its own open models, sovereign AI programs will naturally turn to Chinese ones.

## Inference providers sell model utilization

Fireworks, Baseten, and Together are the most direct beneficiaries in this ecosystem. All three signed the letter. What they sell is the ability to turn a model into a production system: deployment, fine-tuning, adapters, distillation, autoscaling, GPU scheduling, and latency and cost optimization.

Capital markets placed their bets on this layer in a dense three-month stretch:

| Company | Round | Date | Amount | Valuation |
| --- | --- | --- | --- | --- |
| Baseten | Series F | 2026-06-22 | $1.5B | $11B / $13B (two tranches) |
| Together AI | Series C | 2026-07-01 | $800M | $8.3B |
| Fireworks | Series D | 2026-07-16 | $1.505B | $17.5B |

What these companies really are is open-weight inference foundries. Fireworks has disclosed that more than 95% of the tokens it serves come from models specialized on customer data: fine-tunes, adapters, distillations, and models customers trained themselves and brought over to be hosted. In that last case, the inference provider takes no part in training and handles only serving — it is paid for the production system after the model goes live.

(A note: the service economics of adapters differ from traditional fine-tuning. Under the traditional logic, each customer gets its own copy of the model, and deployment costs are extremely high. Under multi-LoRA, one base model stays resident in GPU memory while hundreds of customer adapters are mounted on top of it, hot-swapped at the request level. The same fleet of GPUs serves a large number of customers' "dedicated models," and utilization is very high.)

On cost: Fireworks CEO Lin Qiao says that at equivalent quality, the cost is 5–10x lower than closed models; Decagon, a Together customer, says its costs after migrating fell to between one-fifth and one-seventh of the closed-model alternative.

The capability gap has also narrowed to a point where it can be negotiated with. Stanford's 2026 AI Index puts the open–closed gap at 3.3 percentage points. When capability differs by a few points and price differs by a multiple, a large share of workloads will move to open-weight models — though the hardest ones will not.

**Inference providers are not the SaaS of a new era.** Ordinary SaaS can carry gross margins above 70% because marginal cost is near zero: one more user means a bit more server and bandwidth, not a linear increase in core cost. Inference providers face linear variable costs and cannot amortize fixed overhead through scale. Double the tokens served and the GPU bill roughly doubles too. Sacra estimates Fireworks' gross margin at around 50%, against a company target of 60% — below SaaS's 70%+, because GPU cost lands directly in COGS (cost of goods sold, i.e., the direct cost of delivering the product). Margin improvement therefore has to come from three directions: technical efficiency, moving up into customization, and moving down to lock in compute supply.

Progress on the technical efficiency side is genuinely remarkable. Per SemiAnalysis and NVIDIA, Blackwell delivers roughly 30x the tokens/sec/GPU of Hopper a year earlier on frontier inference workloads, and the cost per million tokens is falling by order-of-magnitude increments annually (EpochAI's figure is about 10x per year). But compute prices are rising at the same time. In April 2026, spot rental for H100s had risen from about $1.70/hour last October to $2.35; the Blackwell spot index went from $2.75 to $4.08/hour in two months. Unit compute prices are rising, but throughput is rising faster, so cost per token continues to fall. This means that even as competition keeps pushing token prices down, inference providers' gross margins need not compress — as long as costs fall faster than prices. That said, Sacra's risk assessment of Fireworks notes that if open-source frameworks like vLLM and SGLang close the performance gap, what remains is GPU resale at 50% margins.

## Circular capital, courtesy of NVIDIA

**NVIDIA sells the cards and also invests in the people buying them.** It is a shareholder in Fireworks, Baseten, and Together; it holds roughly 6% of CoreWeave and added a $2 billion private placement at $87.20 per share in January 2026 — and CoreWeave's single largest expense, by order of magnitude, is buying NVIDIA GPUs. The money NVIDIA puts out comes back as demand for NVIDIA chips. So part of the demand on NVIDIA's income statement is generated by its own capital rather than being fully exogenous market demand.

## The hyperscalers' three-layer business

Hyperscale clouds operate at three layers:

**Layer one: bare GPU rental (IaaS).** The customer rents an instance with eight H100s or B200s and installs the OS, drivers, inference framework, and model themselves, billed by the hour. AWS P5 and the Azure ND series sit here.

**Layer two: managed model deployment (PaaS).** The customer uploads or selects a model, the platform runs it and hands back an endpoint, with autoscaling, monitoring, and operations included. SageMaker and Vertex sit here.

**Layer three: model-as-API (billed per token).** The customer never sees a GPU and pays only for input and output tokens. Bedrock, Azure AI Foundry, the OpenAI API, the Anthropic API, and the Gemini API sit here.

Each layer up generally produces higher revenue and higher margin from the same GPU. But the clouds' positions are complicated.

**Microsoft** is OpenAI's largest partner: tied to OpenAI on one side, developing its own MAI and the open-weight Phi family on another, and simultaneously selling everyone's models on Azure rather than betting on a single one. **Google** has both Gemini and Gemma; it wants to sell closed APIs and also wants Vertex to be the platform where enterprises deploy every kind of model. **Amazon** is the subtler case. It has no genuinely first-tier frontier model of its own, and it shut down its AGI lab on July 22. Bedrock's marquee offering has long been Anthropic. Amazon's cumulative **actual** investment in Anthropic has reached roughly $13 billion, with up to another $20 billion tied to commercial milestones, for a cap of about $33 billion; in return, Anthropic has committed to spend more than $100 billion with AWS over the next decade and gets access to up to 5GW of Trainium capacity. Widespread open weights would erode Bedrock's Anthropic-centered differentiation — but Amazon is also an IaaS provider and an aggregator, which is why, late as it was, it signed in the end.

## Fragmentation is a survival condition for neoclouds

CoreWeave, Lambda, Nebius, and Crusoe — the neoclouds — operate at layer one: buying GPU clusters at scale, typically financed with debt, then renting out compute on long-term contracts. What separates them from the big three clouds is that they have only GPUs and no full cloud product line — no databases, no decades of enterprise customer relationships, no complete set of compliance certifications. So they can only compete on the price, delivery speed, and availability of raw compute. Open weights expand the number of entities that need to run their own GPUs, which is very much to the neoclouds' benefit.

But while fragmentation is a long-term survival condition for neoclouds, it is not the current state of affairs. CoreWeave's FY2025 annual report shows Microsoft alone accounting for roughly **67%** of revenue (62% in FY2024), with no second customer above 10%; in Q1 2026 the top two customers together came to about 65%. Its contracted backlog is heavily concentrated in OpenAI (roughly $22.4 billion in cumulative commitments) and Meta (roughly $35.2 billion). At the same time it carries tens of billions of dollars in debt and 2026 capex guidance of $31–35 billion. In that structure, a single largest customer declining to renew could leave it insolvent.

On top of that, its biggest customers are becoming its competitors. Meta, for example, is standing up a cloud business called Meta Compute to sell the surplus compute from its $115–145 billion of 2026 capex, in forms including model access through Muse Spark and raw GPU cycles. SpaceX's Colossus site was leased in 2026 to Anthropic (roughly $45 billion through mid-2029), Google (roughly $30 billion), and Reflection ($6.3 billion). And OpenAI's Stargate is the build-it-yourself path itself.

Neoclouds hold no model assets and have nothing to win or lose at the model layer. What they can do is find enough buyers to fill capacity they have already bought with debt — an idle GPU is pure loss. Open-weight models expand the number of long-tail buyers (enterprises, sovereign AI programs, AI application companies, vertical model companies, inference platforms, research institutions), which is the most direct route to de-concentrating their customer base.

## Enterprise bargaining power

Enterprises have data concerns, but the overwhelming majority of small and mid-sized companies will not actually buy cards and run models themselves.

The reason is TCO (total cost of ownership). Self-hosting means not just buying GPUs but building and maintaining the infrastructure and employing the engineers to do it. Then there is utilization: an API is a purely variable cost — no calls, no spend — while owned GPUs are a fixed cost billed by the hour. Enterprise traffic is typically high during the day and low at night, so average utilization may be poor. A common industry rule of thumb is that self-hosting only becomes worth discussing once annual API spend reaches the seven-figure range — and that is before accounting for operational risk, hiring difficulty, and opportunity cost.

The most important value of open weights to enterprises comes down to three things:

**(1) Portability.** No lock-in to a single API. If a vendor changes prices, retires a model, or changes its data policy, the enterprise has a migration path.

**(2) Auditability.** Holding the weights yourself means the model will not be swapped out or degraded without your knowledge, and in compliance settings you can reproduce the behavior of one specific version.

**(3) Negotiating leverage.** Even if the enterprise ends up using a closed API anyway, having an open alternative that is good enough for most tasks puts it in a completely different negotiating position. There is no stable relationship between a closed model's marginal inference cost and its list price; list price is set mainly by competitors, substitutes, and willingness to pay. The existence of open-weight models effectively caps what closed models can charge.

For an enterprise, if a single vendor controls the model, the pricing, the access, and the institutional knowledge the company has accumulated, then that vendor increasingly controls the company's business.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

7 月中旬，Moonshot 发布 Kimi K3，一个 2.8 万亿参数的开放权重模型，在 FrontierSWE 编码基准上超过了 OpenAI 和 Anthropic 的旗舰。几天后阿里发布新版 Qwen。7 月 20 日，Axios 报道特朗普政府正在重新推动对中国开放权重模型的事实性封禁，讨论中的工具包括实体清单指定、联邦采购限制、安全公告、责任规则，以及对在生产环境使用中国模型的美国公司施压。四天后，也就是 7 月 24 日，Jensen Huang 用自己人生第一条 X 推文发了一封政策信，标题是《Open Weights and American AI Leadership》，诉求是：华盛顿不要对可下载模型（downloadable AI models）施加"过早的限制"（premature restrictions）。初版 25 家公司联名，包括 NVIDIA、Microsoft、Meta 等。一天之内翻倍到 50 家，OpenAI 和 Google 都签了，但 Amazon 和 Anthropic 没有。到 7 月 30 日，微软托管的官方页面显示签署方超过 230 家，Amazon 已经出现在名单上。名单横跨芯片、服务器、云、neocloud、推理平台、企业软件、开发者工具、VC。Anthropic 是唯一持续缺席的前沿实验室。

## 推理需求的两种收敛形态

AI 的算力需求重心正在从训练转向推理。Huang 在 CES 2026 的记者问答上给过一个数字：今天生成的每四个 token 里，就有一个来自开放模型。推理需求往哪里收敛，有两种极端形态：

**（1）集中式**：需求汇聚到少数闭源前沿模型公司，企业租用智能，token 从几个 API 端点流出。

**（2）扩散式**：需求下沉到几万家企业、推理平台、neocloud、主权 AI 项目和应用公司，每家跑自己特化过的模型。

Open weights 是让扩散变得便宜、可规模化的条件。所以这是一场市场结构之争。而市场结构决定NVIDIA 面对的是五个买家还是五万个，以及企业在闭源 API 面前有没有替代品可以拿来谈判。

## NVIDIA 想要的是一个分散的买方结构

表面上，NVIDIA 对模型范式应该中立——不管闭源实验室主导还是开放生态主导，两边都要买 GPU。只要 AI workload 增长，NVIDIA 都赚钱。

但 NVIDIA 不可能对买方结构中立。它的客户集中度在快速上升：FY2026 Q3，四个直接客户各自超过总收入 10%，合计 61%；一年前是三家各 12%，合计 36%。 我们只能看到采购环节的集中，看不到终端需求方的名单。但这批采购最终服务于谁，市场上没有太多分歧：Google、Amazon、Meta、Microsoft、OpenAI。而这几家，同时是唯一有能力做 NVIDIA 替代品的公司。Google 有 TPU，Amazon 有 Trainium，Meta 有 MTIA，Microsoft 有 Maia，OpenAI 在和 Broadcom 合作自研。这些 ASIC 的短板——生态窄、CUDA 迁移成本高——对一个拥有固定内部 workload 的超级平台来说并不致命，而且短板还在缩小：TPU 和 Trainium 现在都在对外供给。比如，Anthropic 同时使用 Google TPU、AWS Trainium 和 NVIDIA GPU，公开的理由是"把 workload 匹配到最合适的芯片"， 也就是大规模前沿训练是可以跑在非 NVIDIA 硅片上的（当然，NVIDIA 也是 Anthropic 的投资方之一，双方不是纯粹的对立关系。）所以 NVIDIA 需要一个买方更分散的世界。几万个买不起、也做不了自研芯片的客户，比几个正在造替代品的巨头，是安全得多的客户基础。Nemotron 系列以及 GTC 2026 宣布的 Nemotron 联盟，公司称五年投入约 260 亿美元都indicate了它在自费制造扩散式世界的燃料。（当然，就像NVIDIA 自己的 10-K 风险因素里写的，开源 AI 依赖开发者采纳，如果它部署在竞争对手平台上，可能减少对 NVIDIA 产品的需求。开放权重让需求下沉，但下沉之后落在哪块硅上，并不由 NVIDIA 决定。）

## 主权 AI：一个新的国家级需求类别

主权 AI 指一个国家自己建设、自己控制的 AI 能力栈：算力在境内，模型在本国法律管辖下，训练数据包含本国语言、公共数据和产业知识。推动力有三类——数据本地化（医疗、金融、政府、国防数据不流向外国 API）、国家安全（关键系统不能长期依赖外国公司的闭源模型和服务条款）、语言文化（主流前沿模型对英语以外的大量语言、方言、行政与法律体系支持不足）。

按 NVIDIA 披露的口径，FY2026 全年主权 AI 收入超过 300 亿美元，同比增长三倍以上，主要贡献来自英国、法国、荷兰、加拿大和新加坡；FY2027 Q1 又新增日本、韩国、德国的 AI 工厂项目。过去买超算的是科研机构，现在买 AI 工厂的是财政部、国防部、国家电信商和主权基金。沙特的钱在两条路上同时下注：国内由 PIF 旗下的 HUMAIN 建吉瓦级算力和阿拉伯语模型 ALLAM，同时 Aramco Ventures 领投了 Together AI 7 月那轮 8 亿美元融资，直接投进美国的开放权重推理层。上面这批国家几乎全是美国盟友，买的几乎全是 NVIDIA。所以现阶段的"主权 AI"实际在做的，是用芯片依赖换掉 API 依赖，其芯片依然依赖NVIDIA。所以主权 AI对于Nividia是一个既能扩大买方数量、又完全不威胁自身护城河的需求类别。

对政策制定者来说，一个国家如果只能调用外国闭源 API，它就没有真正的主权 AI；它需要能下载、检查、部署、微调、长期维护的模型。Kimi、DeepSeek、Qwen、GLM 大多以 MIT 一类的宽松许可发布，这正是主权项目需要的。如果美国限制自己的开放模型，主权 AI 项目会自然转向中国的模型。

## 推理厂卖模型的利用率

Fireworks、Baseten、Together 是这轮生态里最直接的受益方。三家都签了那封信。它们卖的是"把模型变成生产系统"的能力：部署、微调、adapter、蒸馏、自动扩缩容、GPU 调度、延迟与成本优化。

资本市场在这一层的下注，三个月内密集落地：

| 公司 | 轮次 | 时间 | 金额 | 估值 |
| --- | --- | --- | --- | --- |
| Baseten | Series F | 2026-06-22 | 15 亿美元 | 110 亿 / 130 亿两档 |
| Together AI | Series C | 2026-07-01 | 8 亿美元 | 83 亿美元 |
| Fireworks | Series D | 2026-07-16 | 15.05 亿美元 | 175 亿美元 |

这类公司的本质是 open-weight inference foundry。Fireworks 披露，它服务的 token 里超过 95% 来自在客户数据上特化过的模型：包括微调、adapter、蒸馏，以及客户自己训完拿来托管的模型。在最后一种情况下，推理厂不参与训练，只负责 serving，收的是模型上线后的生产系统的钱。

（注：adapter的服务经济学和传统 fine-tuning 不同。传统逻辑里，每个客户一份模型，部署成本极高。multi-LoRA 逻辑下，一份基础模型常驻显存，同时挂载几百个客户的 adapter，请求级别热切换。同一批 GPU 服务大量客户的"专属模型"，利用率极高。）

从成本的角度，Fireworks CEO Lin Qiao 说同等质量下成本比闭源模型低 5–10 倍；Together 的客户 Decagon 说迁移后成本降到闭源方案的五分之一到七分之一。

能力差距也小到了可以谈判的程度。斯坦福 2026 AI Index 给出的开闭源差距是 3.3 个百分点。当能力差几个百分点而价格差是数倍，大量工作负载会转向开放权重模型（虽然最难的那批不会）**。**

推理厂并不是新时代的 SaaS。 普通 SaaS 毛利可以超过 70%，因为边际成本接近零：多一个用户，多一些服务器和带宽，不会线性增加核心成本。推理厂则是线性可变成本，不能靠规模把固定开销摊薄。服务的 token 翻倍，GPU 账单大体也翻倍。Sacra 估计 Fireworks 毛利约 50%，公司对外目标 60%，低于 SaaS 的 70%+，因为 GPU 成本直接进 COGS(营业成本, i.e.， 交付产品的直接成本)。所以毛利改善主要来自三个方向：技术效率、往上做定制化、往下锁算力供给。一方面，硬件效率的提升速度确实惊人：SemiAnalysis 与 NVIDIA 的口径是，Blackwell 在前沿推理 workload 上的 tokens/sec/GPU 大约是一年前 Hopper 的 30 倍；每百万 token 的成本按年以数量级速度下降（EpochAI 的口径是每年约 10 倍）。但算力价格同时在涨。2026 年 4 月，H100 现货租赁从去年 10 月的约 1.70 美元/小时涨到 2.35 美元；Blackwell 现货指数两个月内从 2.75 涨到 4.08 美元/小时。虽然算力单价在涨，但吞吐涨得更快，所以每 token 的成本仍在下降。这意味着即使竞争持续把 token 售价打下来，只要成本降得比售价更快，推理厂的毛利率就未必被压缩。 当然，Sacra 对 Fireworks 的风险判断里提到：如果 vLLM、SGLang 这类开源框架把性能优势追平，剩下的就是 50% 毛利的 GPU 转售。

## 由 NVIDIA 催生的循环资本

NVIDIA 既卖卡，也投资买卡的人。 它是 Fireworks、Baseten、Together 的股东；持有 CoreWeave 约 6% 股份，并在 2026 年 1 月以 87.20 美元/股追加了 20 亿美元定增，而 CoreWeave 数量级上最大的开支就是买 NVIDIA GPU。所以NVIDIA 出的钱，最终还是变回了对 NVIDIA 芯片的需求。所以 NVIDIA 报表上的一部分需求，是它自己的资本催生出来的，而不是完全外生的市场需求。

## 大型云厂商的三层生意

超大云厂分三层：

**第一层：裸 GPU 出租（IaaS）。** 客户租一台带 8 张 H100 或 B200 的实例，操作系统、驱动、推理框架、模型都自己装，按小时计费。AWS P5、Azure ND 系列在这一层。

**第二层：托管模型部署（PaaS）。** 客户上传或选择一个模型，平台帮你跑起来，给一个 endpoint，自动扩缩容，带监控和运维。SageMaker、Vertex 在这一层。

**第三层：模型即 API（按 token 计费）。** 客户看不到 GPU，只按输入输出 token 付钱。Bedrock、Azure AI Foundry、OpenAI API、Anthropic API、Gemini API 在这一层。

每往上一层，同一块 GPU 产生的收入和毛利通常更高。但云厂商的立场比较复杂。

Microsoft 是 OpenAI 最大合作方：一边和 OpenAI 绑定，一边自研 MAI 与开放权重的 Phi 系列，同时还在 Azure 上卖各家模型，而非押注单一模型。**Google** 有 Gemini 也有 Gemma；既想卖闭源 API，也想让 Vertex 成为企业部署各种模型的平台。**Amazon** 则比较微妙。它没有真正一线的自有前沿模型，并在7月22号关闭了AGI lab。Bedrock 的招牌长期是 Anthropic。Amazon 对 Anthropic 的累计**实际**投资已达约 130 亿美元，另有最高 200 亿与商业里程碑挂钩，上限合计约 330 亿；同时 Anthropic 承诺未来十年向 AWS 投入超过 1000 亿美元，并获得最高 5GW Trainium 产能。open-weight 普及会削弱 Bedrock 围绕 Anthropic 的差异化，但 Amazon 同时是 IaaS 和聚合器，所以虽然签得晚，它最终也签了。

## 分散是Neocloud的生存条件

CoreWeave、Lambda、Nebius、Crusoe 这类 neocloud 做的是上一节说的第一层：大规模采购 GPU 集群，通常靠债务融资，然后以长期合约出租算力。它们和三大云的区别在于只有 GPU，没有完整云产品线——没有数据库、几十年的企业客户关系、全套合规认证。所以只能在裸算力上打价格、交付速度和 GPU 可得性。 open weights扩大了"需要自己跑 GPU 的实体数量"， 所以对neocloud非常有利。

虽然分散是 neocloud 的长期生存条件，却不是当前状态**。** CoreWeave 的 FY2025 年报显示，Microsoft 一家占其收入约 **67%**（FY2024 是 62%），除微软外没有第二个客户超过 10%；2026 年 Q1 前两大客户合计约 65%。合约储备高度集中在 OpenAI（累计承诺约 224 亿美元）和 Meta（累计约 352 亿美元）身上。同时它背着数百亿美元级的债务和 310–350 亿美元的 2026 年 capex 指引。在这种结构下，最大客户不续约可能会让它们资不抵债。

此外，他们最大的客户正在变成自己的竞争对手。比如，Meta 正在筹建名为 Meta Compute 的云业务，把自己 2026 年 1150–1450 亿美元 capex 买来的多余算力对外出售，形式包括 Muse Spark 的模型访问和裸 GPU 周期。**SpaceX的**Colossus 站点在 2026 年租给了 Anthropic（约 450 亿美元至 2029 年中）、Google（约 300 亿美元）、以及 Reflection（63 亿美元）。而OpenAI的Stargate 是自建路线本身。

neocloud 没有模型资产，在模型层没有输赢。它们能做的就是找到足够多的买家，来填满已经用债务买下来的产能， 否则空转的 GPU 是纯亏损。open-weight 模型扩大长尾买家的数量（企业、主权 AI、AI 应用公司、垂直模型公司、推理平台、研究机构），是去客户集中化最直接的一条路。

## 企业客户的议价权

虽然企业有数据上的顾虑，但绝大多数中小企业不会真的自己买卡跑模型。

原因是 TCO（Total Cost of Ownership）。自部署不仅要采购 GPU，还要搭建和维护基础设施，以及养相应的工程师。此外还有利用率的考量：API 是完全可变成本，不调用就不花钱；自有 GPU 是固定成本，按小时计费。企业流量通常白天高、晚上低，平均利用率可能不高。业内常见的经验值是，每年 API 支出到百万美元量级，自建才开始有讨论的意思（这还没算运维风险、招聘难度和机会成本）。

open-weight 对企业最重要的价值在于三点：

**（1）可移植性。** 不被单一 API 锁死。如果供应商改价、退役模型、改变数据政策，企业能有迁移路径。

**（2）可审计性。** 权重固定在自己手上，意味着模型不会在你不知情时被更换或降级；合规场景下能复现某个具体版本的行为。

**（3）议价筹码。** 即使最后还是用闭源 API，手上有一个大部分任务都够用的开放替代，企业的谈判位置完全会很不一样。闭源模型的边际推理成本和标价之间没有稳定关系，标价主要看竞品、替代品和客户愿付能力。open-weight 模型的存在，相当于给闭源模型的价格设了一个上限。

对企业来说，如果一个供应商控制了模型、定价、访问权和企业积累的机构知识，它就在越来越大的程度上控制企业的生意。

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
