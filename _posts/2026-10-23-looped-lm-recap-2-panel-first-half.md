---
layout: post
title: "Event Recap, Part 2 | Looped LM Panel, First Half: Bottlenecks, Fair Comparisons and Fixed Points / 活动回顾（二）｜Looped LM 圆桌（上）：瓶颈在哪、怎么比才公平、要不要学不动点"
date: 2026-10-23
categories: technical
tags: [ai, llm, architecture, looped-lm, fixed-points, event-recap]
excerpt: "Part 2 of the recap of NICE's event \"Looped Language Model: Rethinking Model Depth and Parameters,\" covering the first half of the panel: where the bottlenecks in LLM architecture are, what looping actually costs, what makes a fair comparison, and whether looped models should learn fixed points."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

This is the second part of the recap of NICE’s event “Looped Language Model: Rethinking Model Depth and Parameters,” covering the first half of the panel discussion. The panel was hosted by Wenyue Hua, with Chunyuan Deng and Benhao Huang as panelists.

The first half started from a general question, “Where are the bottlenecks in LLM architecture?”, and gradually narrowed down to looping itself: What does it cost? Do its gains really come from the architecture, or just from spending more compute? And a more technical question: Should looped models learn fixed points?

## Key takeaways

- **FLOPs are relatively cheap; memory and bandwidth are more expensive and grow more slowly.** Benhao prefers architectures that “add only FLOPs, not memory” (improving performance by adding compute without adding memory footprint such as parameters and KV cache), and the ideal latent CoT is exactly that. Chunyuan thinks the Transformer has no particularly big bottleneck and is more optimistic about architectures for settings where training data is repeated. Benhao added that the data wall (the total amount of high-quality training data is limited and will eventually fail to keep up with the growth of models and compute) may matter more than architecture.
- **Looping is not a free lunch.** Without KV sharing or compression, a looped LM offers little beyond some inductive bias; almost everything else is a cost: more KV cache, and performance that cannot catch up with a standard Transformer of the same logical depth without weight sharing. Many papers compare only against models with the same number of parameters, not against this “upper bound.”
- **MoE may make up for having fewer parameters.** Parameters determine how much knowledge a model can store. Benhao observed that in looped MoE models, different loops do activate different experts, and adding MoE narrows the gap to the upper bound.
- **Fair comparisons look at entire scaling curves.** Looping spends extra compute. When comparing with a model that does not loop (the baseline), Chunyuan argues that one should not change the baseline’s architecture just to equalize FLOPs, for example by changing the size of the feed-forward layers (FFN) or the dimension of the attention heads (head dim). A more sensible approach is to train a set of models from small to large (a scaling ladder) and compare the entire curve of “loss versus compute.” Benhao added that the baseline should be tuned to its best, and its width-to-depth ratio should not be changed arbitrarily just to match compute; spending more compute in training without adding cost at inference is, in his view, acceptable.
- **Whether to learn fixed points depends on the goal.** “Learning fixed points” means training the model so that its hidden state essentially stops changing after a certain number of loops, and looping a few more times does not make it worse. Benhao argues that if you only want the best performance at a fixed number of loops (say, 4), there is no need to learn fixed points. If you do want to, the common method is depth sampling: during training, a number of loops is drawn at random for each batch, the model loops that many times and the loss is computed at the last step. The benefit is stability: every depth may be drawn and have a loss computed on it, so the model learns not to let the loss rise when it takes a few more steps. The cost is that supervision is spread across depths, so less supervision falls on the number of loops actually used at inference, which may lower performance.
- **Path independence is key.** Path independence means that no matter which initial state the model starts from and how many steps it iterates, it ends up at the same fixed point. Benhao believes that Huginn (a looped language model that loops only its middle layers, introduced in Section 4) learns fairly good fixed points mainly thanks to two training techniques, each corresponding to one half of path independence: random depth sampling makes the result independent of the number of iteration steps, and truncated backpropagation (computing gradients only through the last few loops during training, while earlier loops run only the forward pass) makes the result independent of the starting point. At the same time, suitable normalization and input injection can better guide how fixed points form.

## Glossary

The table below explains several terms that recur in this article. Readers familiar with them can skip it.

| Term | Plain-language explanation |
| --- | --- |
| Loop / Looped LM | Running the same set of layers (or the whole model) several times with the same parameters each time |
| Logical depth | The number of layers a token actually passes through: the number of looped layers × the number of loops, plus the layers that are not looped |
| Upper bound / lower bound | Two reference points for evaluating a looped model: the lower bound is a model with the same number of parameters that does not loop; the upper bound is a standard Transformer of the same logical depth in which no layer shares parameters |
| KV cache | The keys and values that standard attention caches for every past token during generation; looping n times usually means storing n copies |
| FLOPs | Floating-point operations, commonly used to measure a model’s compute; “adding FLOPs” means making the model compute more |
| Memory wall | The trend of hardware compute growing much faster than memory bandwidth, which leaves many models bottlenecked on “moving data” rather than on “computing” |
| Data wall | The total amount of high-quality data available for pretraining (mainly public human-written text) is limited, while model scale and compute keep growing quickly, so data will sooner or later fall behind and become the bottleneck to further scaling |
| MoE | Mixture of experts: each layer has many expert subnetworks, and a router picks only a few of them to compute for each token, so the parameter count grows greatly while compute stays the same |
| Scaling ladder | Training a series of models from small to large with the same recipe, fitting the curve of “loss versus compute,” and then comparing different architectures’ entire curves |
| Ouro / Huginn | Two representative looped language models: Ouro loops the whole model, while Huginn loops only its middle part |
| Prelude / core / coda | Huginn’s three-part structure: the first part encodes the input into the latent space, the middle part loops repeatedly, and the last part decodes the hidden state into the output |
| Input injection | Re-injecting the encoding of the original input into the hidden state in every loop, so the model does not “forget” the input after many loops |
| Fixed point / attractor | A state that barely changes when iterated once more. An attractor is a fixed point that nearby states are drawn into as they keep iterating |
| Depth sampling | During training, a number of loops is drawn at random for each batch, and the loss is computed at that depth |
| DEQ | Deep Equilibrium Models: solve directly for the network’s fixed point and compute gradients with implicit differentiation, equivalent to an “infinitely deep” weight-sharing network |
| Truncated backpropagation | Backpropagating gradients only through the last few iterations, with earlier steps running only the forward pass; a common practice in training RNNs that saves GPU memory |
| CKA | A metric of how similar two sets of neural network representations are |
| Jacobian and contraction | The Jacobian describes how small changes in the input affect the output; when all its eigenvalues have absolute value less than 1, the iteration contracts near the fixed point and converges to it |

## Panelists

**Chunyuan Deng:** PhD student at Rice University, advised by Prof. Hanjie Chen. His research focuses on the design and optimization of LLM pretraining architectures, as well as the interpretability of language models. His representative work is LT2: Linear-Time Looped Transformers \[1\]; his talk at the event is covered in part one of this series.

**Benhao Huang:** Master’s student at CMU, advised by Prof. Zico Kolter. He works mainly on looped LMs and fixed points, with the aim of improving the reasoning ability and efficiency of foundation models. His representative work includes Equilibrium Reasoners \[2\] and the blog series Towards Looped Models Done Right \[3\].

**Wenyue Hua (host):** Member of Technical Staff at Microsoft AI (MAI). PhD from Rutgers University, advised by Prof. Yongfeng Zhang, followed by a postdoc at UCSB. Research focuses on LLM reasoning and LLM-based agents, with many papers at top NLP and machine learning venues, including ACL, EMNLP, ICLR, NeurIPS and TACL. Serves as an Area Chair for ACL.

## 1. Bottlenecks in LLM architecture: compute, memory and data

What are the main bottlenecks of today’s large models? Have they driven most current architecture design? And what are the main solutions to them?

### Benhao: FLOPs will always be cheaper

Benhao thinks that GPU memory, bandwidth and FLOPs are certainly all problems. Architecture design usually takes alignment with hardware into account, and a well-known trend line tells us that as hardware develops, memory and bandwidth grow more slowly and are bound to be more expensive, while FLOPs will always be cheaper.

> **Note:** This trend is often called the “memory wall.” According to statistics compiled by Gholami et al. \[4\], over the past 20 years the peak compute of server hardware grew by about 3.0× every two years, while DRAM bandwidth grew by only about 1.6× and interconnect bandwidth by about 1.4× every two years; over 20 years, that adds up to roughly 60,000×, 100× and 30×, respectively.

So Benhao generally prefers architectures that get better results by scaling up FLOPs alone, without enlarging memory. This of course has a cost, namely latency: the more FLOPs, the slower it naturally gets. “FLOPs are cheap” is about cost, while “slow” here refers to the time it takes to generate each token. Take looping as an example: the next loop for a given token has to wait until the previous one finishes, so the extra computation can only run sequentially, and the more loops there are, the longer each token takes to generate. But this is still acceptable for now, especially assuming that frontier labs have nearly unlimited FLOPs.

What he likes about one of his own recent papers is precisely that it explores whether there is a way to get better performance purely by adding FLOPs, without increasing memory overhead. He sees this as perhaps the ultimate form of latent CoT (reasoning in the latent space without writing out the intermediate steps as text):

> You don’t externalize your thought tokens, you don’t have extra KV cache, and you don’t have any extra parameters. You just have more FLOPs: you think more in your head, spend more energy, and then come up with a better method, a better idea.

### Chunyuan: the Transformer has no particularly big bottleneck

Chunyuan said he does not think the Transformer has any particularly big bottleneck; in architecture design, we can always do better: be more efficient, use less memory, compute more efficiently.

One direction he finds fairly promising: many labs have recently been studying architectures for the data-repetition setting. Data is becoming scarcer, and training on repeated data has become common. So what kind of architecture can provide regularization and avoid overfitting when trained on repeated data? And what kind of optimization method should go with it?

> **Note:** A frequently cited result on data repetition comes from Muennighoff et al. \[5\]: with a fixed compute budget, training on the same data for up to about 4 epochs yields almost the same loss as using fresh data; but with more repetitions, the returns from additional compute eventually decay to zero.

### Benhao: the data wall matters more

Benhao added that the data-efficiency and data-repetition questions Chunyuan raised are very interesting. The data wall is also a bottleneck, but he thinks it matters more than architecture: “Data always comes first.” If data is a first-class citizen, then finding architectures that can adapt as data becomes scarcer would be a very valuable direction.

## 2. The cost of looping: KV cache, the performance upper bound and MoE

Looping does not reduce the memory taken up by KVs. It adds FLOPs under a parameter constraint, but the demands on memory and bandwidth also seem to go up. How should we think about this?

### Apart from a bit of inductive bias, it’s almost all cost

Benhao’s answer was quite blunt: following the usual practice so far, without any KV sharing or compression techniques, a looped LM may offer a bit of inductive bias (a preference for certain kinds of solutions that comes from the architecture itself), and everything else is basically a cost: it has more KV cache, and its performance cannot catch up with a vanilla Transformer of the same logical depth.

He also pointed out that most papers do not compare against the upper bound and usually report only the lower bound: they compare only with a model that has the same number of parameters and does not loop, not with a standard Transformer of the same logical depth without weight sharing. “I haven’t seen one that really beats that upper bound, and I think it may simply be impossible to beat.” Chunyuan added: “It can’t beat it.” Benhao went on to say that some might argue it could win at a large enough scale, but in his view this resembles the debate over whether diffusion language models can beat autoregressive models, and his judgment is that it cannot.

Chunyuan agreed, and admitted that his own work also did not compare against models of the same depth. He had tried it himself, and the looped model really did fall short, especially in pretraining; if there is no extrapolation and it still falls short, that is a real problem. One argument he could think of: if extremely sparse, very large MoE models appear in the future, say with 1000T parameters that cannot fit in GPU memory, weight sharing might help. “Other than that… it gets a bit tricky.”

### Can MoE make up for having fewer parameters?

The host then turned to MoE: since Chunyuan said architecture has no particular bottleneck, why has MoE become mainstream? As she understands it, MoE adds parameters without adding FLOPs to the same extent, while still keeping fairly good results. Is this choice mainly driven by latency?

Benhao’s take is that a major problem for looped LMs is still parameters, and parameters determine how much knowledge a model can store. MoE is a good way to alleviate this: different activations lead the router to choose different experts and thus draw on different knowledge. In looped MoE models, different loops do activate different experts, which amounts to retrieving different knowledge at each step.

Conversely, without MoE, the hidden states of different loops are quite similar, which hurts performance. In his earlier blog \[3\], he found that without MoE the gap between a looped model and the upper bound is fairly large; once both the looped model and the standard Transformer use MoE, the gap becomes smaller.

> **Note:** According to the first part of the blog, the comparison is with a 112-layer model that has the same logical depth and the same active compute as the looped model but does not share weights across layers. Switching from dense to MoE narrows the looped model’s average gap to it from 4.96 points to 1.71 points, while the looped model has 75% fewer resident parameters. The blog also found that forcing later loops to reuse the experts selected by the first loop lowered accuracy on all six test tasks.

## 3. Gains from architecture or from compute: what makes a fair comparison

Do the gains of looping really come from the architecture, or just from spending more compute? What is a fair way to test this?

### Chunyuan: one approach is definitely wrong

Chunyuan began by saying that comparing looped models is “really tricky.” First of all, one approach is definitely wrong: since looping adds FLOPs, people change the vanilla Transformer’s FFN, head dim or other parts of its architecture so that its FLOPs match those of the looped model. Changing a lot of the original architecture just to reach equal FLOPs “definitely doesn’t work.”

He thinks the most standard way to compare is with a scaling ladder in pretraining. For example, train a set of standard Transformers from small to large in the usual way, with the third rung being, say, a 300M model. Looping adds FLOPs, so every point of the looped version shifts to the right along the horizontal axis (compute). “Isn’t that the whole point of a scaling ladder?” A scaling ladder is meant to fit a power law and compare two curves anyway, so there is no need to worry about whether each rung lines up exactly with the baseline.

As for comparing wall-clock time (actual running time), he thinks it is just too hard for academia: the various GPU setups are hard to compare with real 10,000-GPU clusters.

### Benhao: tune the baseline well, and look at training and inference separately

Benhao added two points:

- **Always tune the baseline to its best, and never compare against a weak baseline.** He gave the example that some recent work widens or narrows the model’s dimension in order to match FLOPs. But there is a relatively optimal range for the balance between width and depth, which cannot be adjusted arbitrarily; going outside that range makes the comparison unfair.
- **Training and inference costs can be considered separately.** If paying some extra cost in training (usually compute) buys a performance gain with no extra cost at decoding time, he considers that acceptable. In his view, a major difference between academia and industry is that academia is very preoccupied with fair settings, while industry cares more about what gains a model brings when it is actually served.

The host remarked that this means many points are needed to compare two curves properly, which is expensive. Benhao said: “That’s the brutal part of pretraining.” It is genuinely hard for academia: even with a ladder, getting the hyperparameters right (including the width and depth just mentioned) is very difficult. As a result, many papers do claim some benefits, but benefits that hold up are rare.

### Follow-up: what does “no extra cost at decoding time” mean?

The host followed up: when Benhao said earlier “no extra cost at decoding time,” did he mean that inference speed is unaffected? Could this be achieved with pipelined looping (staggering different loops of different tokens so that they compute in parallel, like a pipeline) and with how the KV cache is handled?

Benhao replied that he mainly had in mind approaches like the Full-Bandwidth Transformer \[6\]: add a side path to the model that costs some extra compute in training but adds almost no overhead at decoding time. In his view, this is a more typical example than pipelining; the pipelined approach also makes sense, but it has some subtleties, which he would come back to later (see Section 8 of part three of this series).

> **Editor’s note:** The side path in the Full-Bandwidth Transformer takes the top-layer hidden state at the previous position, fuses it with the next token’s embedding through a gate, and uses the result as the input at the next position. Training requires a few extra forward passes, but by the paper’s estimate, the added compute per token at decoding time is under 1% (about 2.3% slower when measured in vLLM). See part three of this series for details.

## 4. Two representative architectures: Ouro and Huginn

Before moving on to fixed points, the host asked the two panelists to give some background on two architectures, Ouro and Huginn.

### Chunyuan: the core difference is whole-model looping versus middle looping

Chunyuan summed it up: Ouro \[7\] is a whole-model loop: it loops the entire model and uses early exit, so it can stop early; Huginn \[8\] is a middle loop: it loops a middle part of the model and uses a latent state and input injection. In his view, the main difference between the two is whole-model looping versus middle looping; the other components (such as input injection) can be borrowed by either.

> **Note:** The table below summarizes details reported in the two models’ papers.

|  | Ouro \[7\] | Huginn \[8\] |
| --- | --- | --- |
| How it loops | The whole model loops | Only the recurrent core in the middle loops, with a prelude before it and a coda after it |
| Scale | 1.4B (24 layers) and 2.6B (48 layers) | 3.5B; the prelude, core and coda have 2, 4 and 2 layers, respectively |
| Training data | About 7.7T tokens | About 800B tokens |
| Number of loops in training | Fixed at 4 | Randomly sampled for each micro-batch, with a mean of 32 and a long-tailed distribution |
| Training details | A language-modeling loss at every step, plus a learned early-exit distribution | Gradients are backpropagated only through the last 8 iterations; in each loop, the input embedding is concatenated with the current state and mapped through a linear layer |
| Inference | After each loop, an exit gate gives the probability of “stopping here”; looping stops once the cumulative exit probability reaches a set threshold, so easier tokens can use fewer loops | The number of loops can be chosen freely; the paper reports results up to 64 |

### Benhao’s three additions

**First, input injection helps somewhat with middle looping.** For a middle-looping architecture like Huginn, input injection does help to some extent, especially with somewhat more loops; without it, a Huginn-style architecture tends to lose to Ouro at the same logical depth.

**Second, Ouro “grows” a middle loop inside itself.** If you match the two models’ logical depth, unroll the looped parts and compare similarity metrics such as CKA \[9\] for the hidden states at the same layer, you find that Ouro has learned on its own a structure very similar to middle looping: it has layers that correspond to a prelude and a coda. The prelude and coda can be understood as encoding and decoding, with step-by-step refinement of the hidden representation in between.

He also mentioned that similar phenomena may exist in other looped models, so this is not necessarily a new finding; but Huginn’s approach of looping in the middle may happen to fit this inductive bias. He further mentioned that some papers argue that RL mainly changes a small part in the middle of the model, which he guesses may be responsible for abilities such as reasoning.

> **Note:** One example is a July 2026 preprint \[10\]: it found that the gains from RL are highly concentrated in a few layers, that training a single layer alone can often come close to the effect of full-parameter RL, and that the layers contributing most are concentrated in the middle of the network.

**Third, Huginn’s random depth sampling is very important.** It is crucial both for shaping fixed points and for adjusting compute at inference. Benhao thinks the term “test-time scaling” is somewhat ambiguous: in his view, what it really means is extrapolation, for example having seen only 16 loops in training and wanting to loop 64 times at inference. “Unfortunately, I don’t think that’s very likely,” especially for language models. What random depth sampling really supports is elastic compute: loop at most 16 times in training, and at inference you can freely choose how many times to loop, as long as it does not exceed 16.

## 5. Whether to learn fixed points: the pros and cons of depth sampling

With the architectures laid out, the host put the question to Benhao. He gave his conclusion first: **if you only want the best performance at a fixed number of loops (say, 4 or 5), using the model as an ordinary Transformer and ignoring other costs such as memory, then you should not try to learn fixed points**, and performance will be better that way.

### The common approach: depth sampling

If you do want to learn fixed points, you need some additional algorithms, the best known of which is depth sampling: during training, sample a depth for each batch (or even each micro-batch), run that many steps forward, and then apply the loss at that step.

One of Benhao’s core points is that supervision itself is a resource. Suppose the target budget is 5 loops. Depth sampling puts part of the supervision on steps 1 to 4, or at deeper steps, so step 5 gets correspondingly less supervision, and the model’s performance at 5 steps drops.

The benefit it brings is stability: it requires that the loss not rise with each additional step. This does not necessarily improve performance, but it makes the model more stable. There may be some math behind this: from the perspective of the Jacobian and its eigenvalues, for the iteration to contract, the eigenvalues need to be less than 1, which can be proven. But the most intuitive way to see it is this: if every depth has a loss and the loss is not allowed to go up, then the simplest shortcut the model can learn is to stay put in a stable state, which is what we call a fixed point, or attractor.

### A counterintuitive experimental result

But his own experiments found that even when the target budget is 5, the mean of the depth distribution is also set to 5, the long tail extends all the way to 64, and the model is unrolled to 64 steps at test time, it does not necessarily beat a control model trained at a fixed depth of 5 without learning fixed points.

His conclusion: this may be a problem with the algorithms for learning fixed points, not with fixed points themselves. Depth sampling is just one way to learn fixed points. DEQ (Deep Equilibrium Models) \[11\], for example, makes training and inference fully consistent: in the forward pass during training, it iterates with a fixed-point solver until convergence reaches a certain threshold; in the backward pass, it uses the implicit gradient, which in the ideal case corresponds exactly to the mathematical solution of backpropagation. In this case, it may be possible to reach very good performance without necessarily running into the problem above; the difficulty is that it is very hard to train: DEQ is notoriously unstable and needs tricks such as warm-up. Depth sampling is a compromise.

> **Note:** DEQ was proposed in 2019 by Shaojie Bai, Zico Kolter and Vladlen Koltun. It can be seen as an infinitely deep weight-sharing network: instead of computing layer by layer, the forward pass uses a root-finding algorithm (Broyden’s method in the original paper) to solve directly for the fixed point satisfying z\* = f(z\*, x); the backward pass computes gradients with the implicit function theorem at the fixed point, without storing intermediate steps.

## 6. Are fixed points ideal solutions or degenerate states?

The host asked: is a learned fixed point the solution we want, or might it be a degenerate state?

### Fixed points and performance are decoupled

Benhao said that the argument of one of his earlier papers \[2\] is that fixed points themselves are actually decoupled from model performance. A model may well have many fixed points (or attractors), and what training does is align these attractors with the correct task objective as much as possible; that is, we want the hidden state corresponding to an attractor to decode into exactly the correct tokens, the correct answer. So fixed points are not necessarily degenerate.

> **Note:** The paper is Equilibrium Reasoners. It argues that reasoning generalizes because the model learns “task-conditioned attractors”: the stable fixed points of the latent dynamics correspond exactly to valid solutions. On tasks such as Sudoku and mazes, the paper scales test-time compute by increasing the number of iteration steps and using multiple random restarts; it reports that when unrolled to a depth equivalent to 40,000 layers, accuracy on Sudoku-Extreme rises from 2.6% for a feed-forward model to over 99%.

If degeneration really does occur, it may be because the model had not yet reached the attractor when supervision was applied, so the supervision was placed on the path before the attractor. In that case, after a few more iterations, the model may indeed converge, but to a bad point.

### Why Ouro gets worse with more iterations

He thinks this may also be why Ouro’s performance drops markedly when it runs more iterations than in training. The host asked: does Ouro’s design simply never reach a fixed point? Benhao’s view is that Ouro may not do enough to “push” supervision onto the fixed point, but having a loss at every loop helps to some extent, and iterating further is unlikely to diverge. The problem is that it loops only 4 times in training and has no depth sampling, so nothing encourages the model to stay near its step-4 state after looping more than 4 times; it may therefore keep moving until it reaches a degenerate place. By comparison, Huginn should be fine as long as it stays within 64 steps, with only a slight decline beyond 64.

> **Note:** Ouro loops a fixed 4 times in training (it initially tried 8, but switched to 4 because of loss spikes and gradient oscillations), with a language-modeling loss at every step. The paper reports that increasing the number of loops to 5–8 leads to a “moderate degradation” in the base models’ performance: at 8 loops, MMLU drops from 67.45 to 64.49 for the 1.4B model and from 74.60 to 72.24 for the 2.6B model; the reasoning versions drop more on hard problems, for example AIME25 for the 2.6B reasoning model falls from 50.30 to 24.33. As for Huginn, performance keeps improving up to about 64 steps and stops improving after that, but usually does not get worse either.

### Decoupled, but also coupled

The host summarized that it sounds as if there is no necessary connection between fixed points and performance. Benhao agreed with this way of thinking, but pointed out some subtleties: some methods couple the two. Take depth sampling: on the one hand, it places supervision at very large depths, which amounts to aligning the fixed point with the task objective; on the other hand, it can also shape fixed points itself, as a technique for achieving “path independence,” which the next section covers in detail. “So it solves two problems at once.” The two are coupled and not so cleanly separated, but thinking about them separately like this is helpful.

> **Note:** Fixed points have a very practical use as well. In the second part of their blog series \[13\], Benhao’s team reports that keeping only each token’s KVs from its last loop during decoding (terminal KV sharing) can shrink the KV cache of a 1.6B model to one third. A model trained at a fixed depth loses a lot of accuracy when doing this (GSM8K drops from 50.6 to 21.2), while a model trained with a learned depth prior (the distribution of loop depths in training is no longer set by hand but learned from predictive performance, with an entropy term that keeps the distribution wide enough) is essentially unaffected.

## 7. How architecture and algorithms affect convergence: path independence

The host then asked: how do architecture design and algorithm design affect convergence, including what kind of point the model ultimately converges to? Benhao listed three kinds of approaches:

- **Residual scaling:** architecturally, an important factor is scaling the residual connections; some papers multiply the residual by a scaling coefficient so that later layers contribute less \[14\].
- **Input injection:** well-designed input injection can aid convergence, but injection by itself does not guarantee it; its bigger role is to make the point the model converges to depend on the original input context. If you iterate to infinity without continually injecting the context, you get a degenerate attractor that has nothing to do with the prompt and is therefore meaningless. This is how the DEQ line of work understands the value of input injection.
- **Jacobian regularization on the loss side:** this is no longer architecture design but an algorithm: imposing some constraints on the Jacobian \[12\] can directly promote convergence. He mentioned that the recently popular Fixed-Point Reasoners \[14\] also uses a similar technique.

> **Note:** Fixed-Point Reasoners does not use Jacobian regularization directly. Instead, it keeps the state bounded with pre-norm plus a shared, learnable residual scaling coefficient (also applied to the input re-injected in each loop), and promotes convergence with a contraction condition encouraged through initialization and with damped updates; at inference, it stops looping once the fixed-point residual is small enough. Its goal (making the iteration contract) is the same as that of Jacobian regularization, but its specific means are closer to the first category above.

### In Huginn’s case: depth sampling and truncated backpropagation

The host followed up: does Huginn converge to a relatively good fixed point because it has input injection and uses normalization, plus depth sampling?

Benhao thinks that, at least in the Huginn paper, normalization and input injection are not the most important factors. Two things matter more: one is depth sampling, and the other is truncated backpropagation, which has not come up yet. Truncated backpropagation means not backpropagating gradients all the way: for example, once the number of loops exceeds a certain number of steps, you always backpropagate through only a fixed number of final steps, so memory does not keep growing with the number of steps. This is a very common practice in training RNNs, and it also helps shape fixed points.

People may think of both from the perspective of efficiency, and both are indeed economical. Depth sampling does not bet a lot of resources on very large depths, which makes sense because not every token needs such deep computation. The same goes for truncated backpropagation: if the memory and activations for backpropagation grow linearly with the number of forward steps, training can easily blow up. But beyond efficiency, both also help shape fixed points.

### Path independence

Benhao said this can be understood from the perspective of path independence. A well-known paper in the DEQ line of work \[15\] argues that for attractors to perform well enough, or in its words to generalize well enough, path independence must be ensured. Path independence means that no matter which point you start from and how many steps you take, you end up at the same fixed point or attractor.

> **Note:** The paper found that whether an equilibrium model can solve harder problems by increasing the number of iterations at test time is highly correlated with how path-independent the system is.

In his view, the two techniques correspond exactly to the two halves of path independence:

- **Depth sampling makes the result independent of the number of steps.** The number of steps taken in training is random, so the model has to learn to reach the same state for any number of steps.
- **Truncated backpropagation makes the result independent of the starting point.** The states of the early steps contribute no gradient, so the model “doesn’t know where it came from, but knows where it is heading in the end.”

So he concluded that, for Huginn, these two are the more important factors in shaping fixed points; suitable normalization and input injection are also important design choices for preventing divergence.

## Closing and what’s next

The first half of the discussion follows a clear thread: the costs of looping are real, namely more KV cache and performance that struggles to reach the upper bound set by a standard Transformer of the same logical depth without weight sharing; its benefits have to be validated with complete scaling curves and well-tuned baselines. “Whether to learn fixed points” is essentially a trade-off between the best performance at a fixed depth and stability over more iterations. Benhao also offered a very useful perspective: depth sampling and truncated backpropagation make the result independent of the number of steps and of the starting point, respectively.

The next part covers the second half of the panel: whether looping along depth is the same thing as CoT, whether expressiveness proofs still mean anything, how loops can be combined with MoE, and extrapolation, ACT and parallel decoding.

## References

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026.

&#91;2\] [Equilibrium Reasoners: Learning Attractors Enables Scalable Reasoning](https://arxiv.org/abs/2605.21488). arXiv:2605.21488, 2026.

&#91;3\] [Towards Looped Models Done Right](https://ifm-research.notion.site/Towards-Looped-Models-Done-Right-3ade511912ec8128987dfeb7a5580043). Blog series, 2026.

&#91;4\] [AI and Memory Wall](https://arxiv.org/abs/2403.14123). IEEE Micro; arXiv:2403.14123, 2024.

&#91;5\] [Scaling Data-Constrained Language Models](https://arxiv.org/abs/2305.16264). NeurIPS 2023, arXiv:2305.16264.

&#91;6\] [Full-bandwidth transformer](https://arxiv.org/abs/2608.08888). arXiv:2608.08888, 2026.

&#91;7\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;8\] [Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach](https://arxiv.org/abs/2502.05171) (Huginn). NeurIPS 2025, arXiv:2502.05171.

&#91;9\] [Similarity of Neural Network Representations Revisited](https://arxiv.org/abs/1905.00414) (CKA). ICML 2019, arXiv:1905.00414.

&#91;10\] [Is One Layer Enough? Training A Single Transformer Layer Can Match Full-Parameter RL Training](https://arxiv.org/abs/2607.01232). arXiv:2607.01232, 2026.

&#91;11\] [Deep Equilibrium Models](https://arxiv.org/abs/1909.01377) (DEQ). NeurIPS 2019, arXiv:1909.01377.

&#91;12\] [Stabilizing Equilibrium Models by Jacobian Regularization](https://arxiv.org/abs/2106.14342). ICML 2021, arXiv:2106.14342.

&#91;13\] [Towards Looped Models Done Right, Part II: Rethinking at Fixed Points](https://arxiv.org/abs/2610.06833). arXiv:2610.06833, 2026.

&#91;14\] [Fixed-Point Reasoners: Stable and Adaptive Deep Looped Transformers](https://arxiv.org/abs/2606.18206). arXiv:2606.18206, 2026.

&#91;15\] [Path Independent Equilibrium Models Can Better Exploit Test-Time Computation](https://arxiv.org/abs/2211.09961). NeurIPS 2022, arXiv:2211.09961.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

本文是 NICE 举办的「Looped Language Model：重新思考模型的深度与参数」活动回顾的第二篇，整理圆桌讨论的上半场。圆桌由华文越主持，邓淳远和黄奔皓两位嘉宾参与讨论。

上半场从“大模型架构的瓶颈在哪里”这个一般性问题出发，逐步收窄到 loop 本身：它的代价是什么？收益到底来自架构，还是只是多花了算力？以及一个更技术性的问题：looped 模型要不要学成不动点？

## 本文要点

- **FLOPs 相对更便宜，内存和带宽更贵、增长更慢**。奔皓偏好“只加 FLOPs、不加内存”的架构（靠增加计算量来提升性能，同时不增加参数和 KV cache 这类内存占用），理想的 latent CoT 就是如此；淳远认为 Transformer 没有特别大的瓶颈，更看好数据重复训练场景下的架构。奔皓还补充，数据墙（data wall，即高质量训练数据总量有限，终将跟不上模型和算力的增长）可能比架构更关键。
- **Loop 不是免费午餐**。不做 KV 共享或压缩时，looped LM 除了一点归纳偏置，其余几乎都是代价：KV cache 更多，性能也追不上同等逻辑深度、不共享权重的标准 Transformer。许多论文只和同参数量的模型比，不和这个“上限”比。
- **MoE 或许能补上参数少的短板**。参数决定了模型能存多少知识；奔皓观察到，在 looped MoE 模型里，不同 loop 激活的 expert 确实不同，加上 MoE 后与上限的差距会缩小。
- **公平比较要比整条 scaling 曲线**。Loop 会多花计算量，和不 loop 的模型（baseline）比较时，淳远认为不能为了让两边 FLOPs 相等，就去改 baseline 的结构，比如改前馈层（FFN）的大小或注意力头的维度（head dim）；更合理的是训练一组由小到大的模型（scaling ladder），比较“loss 随计算量变化”的整条曲线。奔皓补充：baseline 要调到最好，宽深比也不能为凑计算量而随意改；训练时多花计算、推理时不增加代价的做法，他认为可以接受。
- **要不要学不动点，取决于目标**。“学不动点”指训练模型，让隐状态在 loop 到一定次数后基本不再变化，多 loop 几次也不会变差。奔皓认为，如果只想在固定的 loop 次数（比如 4 次）下性能最好，就不必学。如果要学，常用的方法是 depth sampling：训练时每个 batch 随机抽一个 loop 次数，按这个次数 loop，并在最后一步计算 loss。好处是稳定：每个深度都可能被抽到并计算 loss，模型因此学会多走几步也不让 loss 上升；代价是监督被分散到各个深度，推理时实际使用的那个 loop 次数上得到的监督变少，性能可能因此下降。
- **路径无关性是关键**。路径无关性是指，无论从哪个初始状态出发、迭代多少步，模型最终都到达同一个不动点。奔皓认为，Huginn（一个只循环中间几层的 looped 语言模型，第四节有介绍）能学到较好的不动点，主要靠两种训练手段，它们各自对应路径无关性的一半：随机深度采样（depth sampling）让结果与迭代步数无关，截断反向传播（训练时只用最后若干次循环来计算梯度；前面的循环只做前向计算）让结果与起点无关。同时，合适的 normalization 和 input injection 能够更好地引导不动点的形成。

## 读前速查

下表解释本文反复出现的几个术语，熟悉的读者可以直接跳过。

| 术语 | 白话解释 |
| --- | --- |
| Loop / Looped LM | 把同一组层（或整个模型）重复执行多次，每次用同一套参数 |
| 逻辑深度（logical depth） | 一个 token 实际经过的层数，等于被循环的层数 × loop 次数，再加上不参与循环的层 |
| 上限 / 下限 | 评价 looped 模型的两个参照：下限是同参数量、不 loop 的模型；上限是同等逻辑深度、每层参数都不共享的标准 Transformer |
| KV cache | 标准注意力在生成时为每个历史 token 缓存的 key 和 value；loop 几次，通常就要多存几份 |
| FLOPs | 浮点运算次数（floating-point operations），常用来衡量模型的计算量；“加 FLOPs”就是让模型多算 |
| 内存墙（memory wall） | 硬件算力增长远快于内存带宽增长的趋势，很多模型因此卡在“搬数据”而不是“算”上 |
| 数据墙（data wall） | 可用于预训练的高质量数据（主要是人类撰写的公开文本）总量有限，而模型规模和算力仍在快速增长，数据迟早跟不上，成为继续扩大规模的瓶颈 |
| MoE | 混合专家模型：每层有许多专家（expert）子网络，路由器（router）为每个 token 只挑少数几个来算，计算量不变而参数大增 |
| Scaling ladder | 用同一套配方训练一系列由小到大的模型，拟合“loss 随计算量变化”的曲线，再比较不同架构的整条曲线 |
| Ouro / Huginn | 两个代表性的 looped 语言模型：Ouro 整模型 loop，Huginn 只 loop 中间部分 |
| Prelude / core / coda | Huginn 的三段结构：前段把输入编码进隐空间，中段反复循环，后段把隐状态解码成输出 |
| Input injection | 每一轮循环都把原始输入的编码重新注入隐状态，避免多轮之后“忘了”输入 |
| 不动点 / attractor | 再迭代一次也几乎不变的状态。Attractor（吸引子）指周围的状态迭代下去都会被吸过来的不动点 |
| Depth sampling | 训练时每个 batch 随机抽一个 loop 次数，在该深度上计算 loss |
| DEQ | Deep Equilibrium Models：直接求解网络的不动点，再用隐式微分求梯度，相当于“无限深”的权重共享网络 |
| 截断反向传播 | 只对最后若干步迭代反传梯度，前面的步只做前向；训练 RNN 的常见做法，可节省显存 |
| CKA | 一种衡量两组神经网络表示有多相似的指标 |
| Jacobian 与收缩 | Jacobian 描述输入的微小变化如何影响输出；它的特征值绝对值都小于 1 时，迭代在不动点附近会收缩并收敛 |

## 参与嘉宾

**邓淳远**：Rice University 博士生，导师为 Hanjie Chen 教授。研究聚焦 LLM 预训练架构设计与优化，也关注语言模型的可解释性。代表工作为 LT2: Linear-Time Looped Transformers \[1\]，他在活动中的主题分享见本系列第一篇。

**黄奔皓**：CMU 硕士生，导师为 Zico Kolter 教授。主要研究 looped LM 与不动点（fixed point），致力于提升基础模型的推理能力与效率。代表工作包括 Equilibrium Reasoners \[2\] 和博客系列 Towards Looped Models Done Right \[3\]。

**华文越（主持）**：微软 MAI 研究员（Member of Technical Staff）。博士毕业于 Rutgers University，导师为张永锋教授，之后在 UCSB 从事博士后研究。主要研究方向为 LLM reasoning 与 LLM-based agent，在 ACL、EMNLP、ICLR、NeurIPS、TACL 等 NLP 与机器学习领域的顶级会议和期刊发表多篇论文，并担任 ACL Area Chair。

## 一、大模型架构的瓶颈在哪里：算力、内存与数据

目前大模型最主要的几个瓶颈是什么？它们是否推动了当下大多数的架构设计？对应的主要解法又是什么？

### 奔皓：FLOPs 永远更便宜

奔皓认为，显存、带宽、FLOPs 肯定都是问题。设计架构时一般会考虑与硬件对齐，而有一条很著名的趋势线告诉我们：随着硬件发展，内存和带宽的增长会更慢，一定更贵；FLOPs 则永远更便宜。

> **注**：这条趋势常被称为“内存墙”（memory wall）。据 Gholami 等人的统计 \[4\]，过去 20 年服务器硬件的峰值算力大约每两年增长 3.0 倍，DRAM 带宽每两年只增长约 1.6 倍，互连带宽约 1.4 倍；20 年累计下来分别约为 60000 倍、100 倍和 30 倍。

所以奔皓一般偏好这样的架构：不扩大内存，只靠扩大 FLOPs 就能得到更好的结果。当然这也有代价，就是延迟：FLOPs 越多，自然越慢。“FLOPs 便宜”说的是成本，这里的“慢”说的是生成每个 token 所需的时间：以 loop 为例，同一个 token 的下一轮必须等上一轮算完，多出来的计算只能按顺序进行，loop 次数越多，每个 token 的生成时间就越长。但在当下这还可以接受，尤其假设前沿实验室的 FLOPs 几乎是无限的。

他在自己最近的一篇论文里喜欢的一点，也正是探索有没有办法在不增加内存开销的情况下，纯粹靠增加 FLOPs 得到更好的性能。他觉得这可能是 latent CoT（在隐空间里推理、不把中间步骤写成文字）的一种非常终极的体现：

> 你不会外显你的 thought token，不会有额外的 KV cache，也不会有任何额外的参数。你就是有更多的 FLOPs，在脑子里想得更多、花更多的能量，然后想出一个更好的方法、更好的 idea。

### 淳远：Transformer 没有特别大的瓶颈

淳远说，他觉得 Transformer 并没有什么特别大的瓶颈；在架构设计上，我们永远可以做得更好：更高效、用更少的内存、计算更高效。

他觉得比较 promising 的一个方向是：最近很多实验室在研究数据重复（data repeat）场景下的架构。数据越来越少，重复训练变得很常见。那么什么样的架构在重复训练时能提供正则化、不会过拟合？又该配合什么样的优化方法？

> **注**：关于数据重复，一个常被引用的结论来自 Muennighoff 等人 \[5\]：在计算预算固定时，把同一批数据重复训练最多约 4 个 epoch，loss 与使用全新数据相比几乎没有差别；但重复次数再多，继续增加计算带来的收益最终会降到零。

### 奔皓：数据墙更重要

奔皓补充说，淳远讲的 data efficiency、数据重复问题很有意思。数据墙（data wall）也是一个瓶颈，但他觉得它比架构更重要：“data 永远是第一位的。”如果数据是第一等公民，那么在数据变少时，有没有什么架构可以适应这种情况，会是非常有价值的方向。

## 二、Loop 的代价：KV cache、性能上限，以及 MoE

用 loop 这样的方法，KV 占用的内存并不会更少。它在参数受限的情况下增加了 FLOPs，但内存和带宽的需求似乎也更高了。这一点怎么看？

### 除了一点归纳偏置，其余几乎都是代价

奔皓的回答相当直白：如果按照之前的一般做法，没有任何 KV sharing 或压缩技术，那么 looped LM 除了可能有一点归纳偏置（inductive bias，即架构本身带来的、对某类解法的偏好），其他基本都是代价：它的 KV cache 更多，性能又追不上同等逻辑深度的 vanilla Transformer。

他还指出，大部分论文不会和上限比较，一般只放出下限：即只和同参数量、不 loop 的模型比，而不和同等逻辑深度、不共享权重的标准 Transformer 比。“我没有看到一个真正能超过那个上限的，我觉得可能也根本就没法超过。”淳远补充道：“它超不过。”奔皓补充，也许有人会说规模足够大时可能超得过，但在他看来，这和“扩散语言模型能否超过自回归模型”的讨论类似，他的判断是超不过。

淳远也认同，并坦言自己的工作同样没有和同等深度的模型比。他自己试过，确实比不过，尤其在预训练阶段；如果又没有外推、又比不过，事情就很麻烦。他能想到的一个论据是：假如未来出现特别稀疏的超大 MoE，比如 1000T 参数，卡的显存放不下，weight sharing 或许能帮上忙。“除此之外……就有点棘手。”

### MoE 能不能补上参数的短板？

主持人接着问到 MoE：既然淳远说架构没有特别的瓶颈，那 MoE 为什么会成为主流？在她的理解里，MoE 是在增加参数的同时，没有同等地增加 FLOPs，还能维持比较好的效果；这样的选择主要是出于延迟考虑吗？

奔皓的理解是：looped LM 的一大问题还是参数，而参数决定了模型能存多少知识。MoE 是缓解这一点的好办法：不同的激活会让 router 选择不同的 expert，从而取到不同的知识。在 looped 的 MoE 模型里，不同 loop 激活的 expert 确实不一样，相当于每一步都在检索不同的知识。

反过来，没有 MoE 时，不同 loop 的 hidden state 相似度挺高，这会让性能下降。他在之前的博客 \[3\] 里发现：不加 MoE 时，looped 模型与上限的差距还挺大；looped 模型和标准 Transformer 都加上 MoE 之后，差距会小一些。

> **注**：据该博客第一部分，对比对象是一个与 looped 模型逻辑深度和激活计算量都相同、但不跨层共享权重的 112 层模型。从 dense 换成 MoE 后，looped 模型与它的平均差距从 4.96 分缩小到 1.71 分，而 looped 模型的常驻参数少 75%。博客还发现，强制后面的 loop 复用第一个 loop 选中的 expert，六项测试任务的准确率全部下降。

## 三、收益来自架构还是算力：怎样比较才公平

loop 的收益到底来自架构，还是只是多花了算力？怎样验证才公平？

### 淳远：有一种做法一定是错的

淳远先说，loop 的比较“太有说法了”。首先有一种做法一定是错的：loop 增加了 FLOPs，为了和等 FLOPs 的模型比，就去改 vanilla Transformer 的 FFN、head dim 或其他结构。为了凑 equal FLOPs 而改掉原架构的很多东西，“肯定不行”。

他认为最标准的比法是在预训练中比 scaling ladder。比如按常规做法训练一组从小到大的标准 Transformer，第三档假设是一个 300M 的模型。Loop 会增加 FLOPs，所以 looped 版本的每个点在横轴（计算量）上的位置都会右移。“这不就是 scaling ladder 的意义吗？”scaling ladder 本来就是要拟合 power law、比较两条曲线，所以不必纠结每一档能不能和 baseline 严格对齐。

至于比 wall-clock（实际运行时间），他认为学界做起来实在太难：各种 GPU 设置很难和真正的万卡集群相比。

### 奔皓：调好 baseline，分开看训练与推理

奔皓补充了两点：

- **永远把 baseline 调到最好，不要和差的 baseline 比**。他举例说，最近有些工作为了凑 FLOPs，会把模型的 dimension 调宽或调窄。但宽度和深度之间有一个相对最优的范围，不能随便乱调，超出这个范围就不公平了。
- **训练和推理的代价可以分开看**。如果训练时多付出一些代价（一般是计算量），换来解码时没有额外代价的性能提升，他是认可的。在他看来，学界和业界的一大区别是：学界非常纠结公平的设定，而业界更在乎模型在真正 serving 时能带来什么收益。

主持人感叹，这样一来就得比很多个点，才能合理地比较两条曲线，是件很贵的事。奔皓说：“Pre-training 的残酷就在这个地方。”学界做起来真的挺麻烦：即使做了 ladder，要把超参（包括刚才说的宽度和深度）调明白也非常不容易。所以很多论文确实 claim 了一些 benefit，但立得住的 benefits 是很难得的。

### 追问：“解码时没有额外代价”指什么？

主持人追问：奔皓前面说的“解码时没有额外代价”，是指推理速度不受影响吗？这是否可以借助 pipeline 式的 loop 方法（把不同 token 的不同轮循环错开，像流水线一样并行计算），以及对 KV cache 的处理来做到？

奔皓回答，他指的主要是 Full-Bandwidth Transformer \[6\] 这一类做法：给模型加一条支路，训练时多花一些计算，解码时几乎不增加开销。在他看来，这是比 pipeline 更典型的例子；pipeline 式的做法也说得通，但其中有些微妙之处，留到后面再谈（见本系列第三篇第八节）。

> **编者注**：Full-Bandwidth Transformer 的这条支路，是把上一个位置最顶层的隐状态，经门控与下一个 token 的 embedding 融合后，作为下一个位置的输入。训练时要多跑几遍前向，但按论文估算，解码时每个 token 增加的计算量不到 1%（在 vLLM 中实测约慢 2.3%）。详见本系列第三篇。

## 四、两个代表架构：Ouro 与 Huginn

进入不动点的话题之前，主持人请两位先铺垫一下 Ouro 和 Huginn 这两个架构。

### 淳远：核心区别是整模型 loop 与中间 loop

淳远概括说：Ouro \[7\] 是整模型 loop（whole-model loop），配合 early exit，可以提前退出；Huginn \[8\] 是中间部分 loop（middle loop），配合 latent state 和 input injection。在他看来，二者的主要区别就在整模型 loop 和中间 loop，其他组件（比如 input injection）都可以互相借用。

> **注**：下表整理了两个模型论文中的公开细节。

|  | Ouro \[7\] | Huginn \[8\] |
| --- | --- | --- |
| 循环方式 | 整个模型循环 | 只循环中间的 recurrent core，前后各有 prelude 和 coda |
| 规模 | 1.4B（24 层）与 2.6B（48 层） | 3.5B，prelude / core / coda 分别为 2 / 4 / 2 层 |
| 训练数据 | 约 7.7T token | 约 800B token |
| 训练时的循环次数 | 固定 4 次 | 每个 micro-batch 随机采样，均值 32，分布带长尾 |
| 训练细节 | 每一步都计算语言模型 loss，并学习一个提前退出的分布 | 只对最后 8 次迭代反传梯度；每轮把输入 embedding 与当前状态拼接后经线性层映射 |
| 推理 | 每轮循环后由退出门给出“在此停下”的概率，累计退出概率达到设定阈值就停止循环，较简单的 token 可以少算几轮 | 可自由选择循环次数，论文结果展示到 64 次 |

### 奔皓的三点补充

**第一，input injection 对中间 loop 有一定帮助**。对 Huginn 这种中间 loop 的结构，input injection 还是有一定帮助的，loop 次数稍多时尤其如此；没有它，Huginn 式的结构在相同逻辑深度下容易输给 Ouro。

**第二，Ouro 内部“长出”了中间 loop**。如果控制两个模型的逻辑深度，把 loop 的部分展开，再比较同一层 hidden state 的 CKA \[9\] 等相似度指标，会发现 Ouro 内部自己学出了和中间 loop 很像的结构：有对应 prelude 和 coda 的层。Prelude 和 coda 可以理解为编码和解码，中间则是一步步精炼（refinement）的隐表示。

他也提到，其他 looped 模型里可能也有类似现象，所以这未必是新发现；但 Huginn 这种在中间 loop 的做法，可能恰好契合了这种归纳偏置。他还提到，有论文认为 RL 主要改变的是模型中间的一小部分，他猜测这部分可能负责推理之类的能力。

> **注**：这方面的一个例子是 2026 年 7 月的一篇预印本 \[10\]：它发现 RL 带来的提升高度集中在少数几层，很多时候只训练单独一层就能接近全参数 RL 的效果，而贡献最大的层集中在网络中部。

**第三，Huginn 的随机深度采样非常重要**。不管是对不动点的塑形，还是对推理时的计算调节，它都很关键。奔皓认为“test-time scaling”这个说法有些歧义：在他看来，它真正的意义是外推，比如训练时只见过 16 次循环，推理时想 loop 到 64 次，“unfortunately，我觉得这个不太可能”，尤其在语言模型里。随机深度采样真正支持的是弹性计算（elastic compute）：训练时最多 loop 16 次，推理时就可以自由选择 loop 多少次，只要不超过 16。

## 五、要不要学不动点：depth sampling 的得与失

铺垫完架构，主持人把问题抛给奔皓。他先给了结论：**如果只想在固定 loop 次数（比如 4 次或 5 次）下把性能做到最好，把模型当成一个普通的 Transformer 来用，不管内存等其他代价，那就不应该去学不动点**，这样性能会更好。

### 常见做法：depth sampling

如果要学不动点，就需要一些额外的算法，其中最知名的是 depth sampling：训练时每个 batch（也可以细到每个 micro-batch）采样一个深度，前向算这么多步，然后在这一步上施加 loss。

奔皓的一个核心观点是：监督本身就是一种资源。假设目标预算是 loop 5 次，depth sampling 会把一部分监督加在第 1 到 4 步，或者更深的地方，第 5 步上的监督就相应变少，导致模型在 5 步时的性能下降。

它带来的好处是稳定性：它要求每多走一步，loss 都不上升。这不一定让性能变好，但能让模型变稳。背后可能有一些数学可以推导：从 Jacobian 及其特征值的角度看，要让迭代收缩，特征值需要小于 1，这是可以证明的。但最直观的理解是：如果每一个深度都有 loss，而且 loss 不能变高，那么模型能学到的最简单的捷径，就是待在一个稳定的状态里不动，这就是所谓的不动点，或者说 attractor。

### 一个反直觉的实验结果

但他自己的实验发现：即使目标预算是 5，深度分布的均值也设为 5、长尾一直覆盖到 64，测试时展开到 64 步，结果也未必打得过固定深度 5 训练、不学不动点的对照模型。

他的结论是：这可能是学不动点的算法有问题，而不是不动点本身有问题。Depth sampling 只是学不动点的方法之一。比如 DEQ（Deep Equilibrium Models）\[11\] 的做法就让训练和推理完全一致：训练时前向用一个不动点求解器（fixed-point solver）迭代，直到收敛程度达到某个阈值；反向再用隐式梯度（implicit gradient），在理想情况下，它精确对应于反向传播的数学解。这种情况下也许能学到很好的性能，不一定会遇到上面的问题；难点在于它非常难训，DEQ 出了名地不稳定，需要 warm-up 之类的技巧。Depth sampling 则是一种折中。

> **注**：DEQ 由 Shaojie Bai、Zico Kolter 和 Vladlen Koltun 于 2019 年提出，可以看作一个无限深的权重共享网络：前向不再逐层计算，而是直接用求根算法（原论文用的是 Broyden 方法）解出满足 z\* = f(z\*, x) 的不动点；反向则利用不动点处的隐函数定理求梯度，不必保存中间步骤。

## 六、不动点是理想解，还是退化状态？

主持人问：学到的不动点，是我们想要的解，还是可能是一种退化的状态（degenerate state）？

### 不动点和性能是解耦的

奔皓说，他在之前的一篇论文 \[2\] 里的论点是：不动点本身和模型性能其实是解耦的。模型本身可能就有很多不动点（或者说 attractor），训练做的事情是尽可能把这些 attractor 对齐到正确的任务指标上，也就是希望 attractor 对应的 hidden state 解码出来，正好是正确的 token、正确的答案。所以不动点并不一定是退化的。

> **注**：这篇论文即 Equilibrium Reasoners。它认为，推理之所以能泛化，是因为模型学到了“以任务为条件的 attractor”：隐空间动力学的稳定不动点恰好对应合法的解。论文在数独、迷宫等任务上通过增加迭代步数和多次随机重启来扩展测试时计算；据论文报告，展开到相当于 4 万层的深度时，Sudoku-Extreme 的准确率从前馈模型的 2.6% 提升到 99% 以上。

如果真的出现了退化，可能是因为施加监督时，模型还没有到达那个 attractor，监督被加在了到达 attractor 之前的路径上。这样一来，多迭代几轮，模型确实可能收敛，但收敛到的是一个不好的点。

### Ouro 为什么多迭代会变差

他认为，这或许也是 Ouro 迭代次数超过训练时性能明显下降的原因。主持人问：Ouro 的设计是否就没有到达不动点？奔皓的看法是：Ouro 可能还不足以把监督“推”到不动点上，但它每个 loop 都有 loss，这会有一定帮助，迭代下去不太会发散。问题在于，它训练时只 loop 4 次，也没有 depth sampling，没有任何东西激励模型在 loop 超过 4 次之后仍然待在第 4 步的状态附近，于是它可能继续往前走，直到走到一个退化的地方。相比之下，Huginn 应该只要在 64 步以内都还行，超过 64 步才有一点点衰减。

> **注**：Ouro 训练时固定循环 4 次（最初尝试过 8 次，因 loss 尖峰和梯度震荡改为 4 次），每一步都有语言模型 loss。论文报告，把循环次数加到 5 至 8 次时，基础模型的性能“适度下降”：循环 8 次时，1.4B 模型的 MMLU 从 67.45 降到 64.49，2.6B 模型从 74.60 降到 72.24；推理版本在难题上下降更多，如 2.6B 推理模型的 AIME25 从 50.30 降到 24.33。至于 Huginn，性能大约在 64 步前持续提升，之后不再提升，但通常也不会变差。

### 解耦，但也有耦合

主持人总结说，听起来不动点和性能之间并没有必然联系。奔皓同意这种思考方式，但也提醒其中有些微妙之处：有些做法会把两者耦合在一起。以 depth sampling 为例，它一方面把监督加在了很深的深度上，相当于把不动点和任务指标对齐；另一方面，它本身也有能力塑造不动点，是一种实现“路径无关性”（path independence）的技巧，下一节会细讲。“所以它一下子解决了两个问题”，两者之间有耦合，并不是分得那么开，但这样拆开来想有助于思考。

> **注**：不动点还有一个很实际的用处。奔皓团队在博客系列的第二部分 \[13\] 中报告：解码时只保留每个 token 最后一次循环的 KV（terminal KV sharing），可以把 1.6B 模型的 KV cache 缩小到三分之一。用固定深度训练的模型这样做会明显掉点（GSM8K 从 50.6 降到 21.2），用学到的深度先验（learned depth prior：训练时循环深度的分布不再人为指定，而是根据预测效果学出来，并用熵项保持分布足够宽）训练的模型则基本不受影响。

## 七、架构和算法如何影响收敛：路径无关性

主持人接着问：架构设计和算法设计会如何影响收敛，包括最终收敛到什么样的点？奔皓列了三类做法：

- **Residual scaling（残差缩放）**：架构上比较重要的是对残差连接做缩放，有些论文会给残差乘上一个比例系数，让后面的层的贡献更小一些 \[14\]。
- **Input injection（输入注入）**：设计得好的 input injection 有助于收敛，但它本身并不必然能促进收敛，更大的作用是让模型收敛到的点与最初输入的 context 相关。如果迭代到无穷，却不一直把 context 注入进来，就会得到一个退化的 attractor，它和 prompt 没有任何关系，也就失去了意义。这是从 DEQ 那条线去理解 input injection 的价值。
- **Loss 侧的 Jacobian 正则**：这已经不是架构设计，而是算法：对 Jacobian \[12\] 做一些约束，可以直接促进收敛。他提到最近比较火的 Fixed-Point Reasoners \[14\] 也用了类似的技巧。

> **注**：Fixed-Point Reasoners 并没有直接使用 Jacobian 正则，而是用 pre-norm 加共享的可学习残差缩放系数（也作用在每轮重新注入的输入上）让状态保持有界，配合一个靠初始化来鼓励的收缩条件和阻尼更新来促进收敛；推理时，当不动点残差足够小就停止循环。它的目标（让迭代收缩）与 Jacobian 正则一致，具体手段更接近上面的第一类。

### 具体到 Huginn：depth sampling 与截断反传

主持人追问：Huginn 能收敛到一个相对不错的不动点，是不是因为它有 input injection、用了 normalization，再加上 depth sampling？

奔皓认为，至少在 Huginn 这篇论文里，normalization 和 input injection 不是最首要的因素。更重要的是两点：一是 depth sampling，二是前面还没提到的截断反向传播。截断反传是说不做完整的梯度回传：比如 loop 超过一定步数之后，永远只对最后固定的若干步反传，这样显存不会随步数继续增长。这是训练 RNN 时非常常见的做法，它对不动点的塑形也有帮助。

大家可能会从效率的角度理解这两者，它们确实都很省：depth sampling 不会把大量资源都押在很深的深度上，这很合理，因为并不是每个 token 都需要那么深的计算；截断反传也一样，如果反传的显存和激活随前向步数线性增长，训练会很容易炸。但除了效率，这两者对不动点的塑形也有帮助。

### 路径无关性

奔皓说，可以从路径无关性的角度来理解。DEQ 这条线上有一篇很有名的论文 \[15\]，它的基本观点是：要让 attractor 性能足够好，或者按他们的说法有足够的泛化性，就要保证路径无关性。所谓路径无关性，是指无论从哪个点出发、走了多少步，最终到达的不动点或 attractor 都是同一个。

> **注**：这篇论文发现，平衡模型能否靠增加测试时的迭代次数来解决更难的问题，与系统的路径无关性高度相关。

在他看来，两种做法正好各自对应路径无关性的一半：

- **Depth sampling 让结果与步数无关**。训练时走多少步是随机的，模型只好学会在各种步数下都到达同一个状态。
- **截断反传让结果与起点无关**。前面几步的状态没有梯度贡献，模型“不知道自己从哪里来，但知道自己最后要往哪边走”。

所以他总结，对 Huginn 来说，这两点才是对不动点塑形更重要的因素；合适的 normalization 和 input injection 也是重要的设计，防止出现发散。

## 结语与下篇预告

上半场的讨论有一条清晰的主线：loop 的代价切实存在，一是 KV cache 更多，二是性能难以达到同等逻辑深度、不共享权重的标准 Transformer 这一上限；而它的收益，需要通过完整的 scaling 曲线和充分调优的 baseline 来验证。“要不要学不动点”，本质上是在固定深度的最佳性能与多迭代的稳定性之间做取舍；奔皓还给出了一个很有用的视角：depth sampling 和截断反传，分别让结果与步数、与起点无关。

下一篇整理圆桌下半场：沿深度循环与 CoT 是不是一回事、表达力证明还有没有意义、loop 怎样与 MoE 结合，以及外推、ACT 和并行解码。

## 参考文献

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026.

&#91;2\] [Equilibrium Reasoners: Learning Attractors Enables Scalable Reasoning](https://arxiv.org/abs/2605.21488). arXiv:2605.21488, 2026.

&#91;3\] [Towards Looped Models Done Right](https://ifm-research.notion.site/Towards-Looped-Models-Done-Right-3ade511912ec8128987dfeb7a5580043). Blog series, 2026.

&#91;4\] [AI and Memory Wall](https://arxiv.org/abs/2403.14123). IEEE Micro; arXiv:2403.14123, 2024.

&#91;5\] [Scaling Data-Constrained Language Models](https://arxiv.org/abs/2305.16264). NeurIPS 2023, arXiv:2305.16264.

&#91;6\] [Full-bandwidth transformer](https://arxiv.org/abs/2608.08888). arXiv:2608.08888, 2026.

&#91;7\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;8\] [Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach](https://arxiv.org/abs/2502.05171) (Huginn). NeurIPS 2025, arXiv:2502.05171.

&#91;9\] [Similarity of Neural Network Representations Revisited](https://arxiv.org/abs/1905.00414) (CKA). ICML 2019, arXiv:1905.00414.

&#91;10\] [Is One Layer Enough? Training A Single Transformer Layer Can Match Full-Parameter RL Training](https://arxiv.org/abs/2607.01232). arXiv:2607.01232, 2026.

&#91;11\] [Deep Equilibrium Models](https://arxiv.org/abs/1909.01377) (DEQ). NeurIPS 2019, arXiv:1909.01377.

&#91;12\] [Stabilizing Equilibrium Models by Jacobian Regularization](https://arxiv.org/abs/2106.14342). ICML 2021, arXiv:2106.14342.

&#91;13\] [Towards Looped Models Done Right, Part II: Rethinking at Fixed Points](https://arxiv.org/abs/2610.06833). arXiv:2610.06833, 2026.

&#91;14\] [Fixed-Point Reasoners: Stable and Adaptive Deep Looped Transformers](https://arxiv.org/abs/2606.18206). arXiv:2606.18206, 2026.

&#91;15\] [Path Independent Equilibrium Models Can Better Exploit Test-Time Computation](https://arxiv.org/abs/2211.09961). NeurIPS 2022, arXiv:2211.09961.

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
