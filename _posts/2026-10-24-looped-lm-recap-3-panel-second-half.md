---
layout: post
title: "Event Recap, Part 3 | Looped LM Panel, Second Half: Loops and CoT, Expressiveness, MoE, Extrapolation and Speedups / 活动回顾（三）｜Looped LM 圆桌（下）：Loop 与 CoT、表达力、MoE、外推与加速"
date: 2026-10-24
categories: technical
tags: [ai, llm, architecture, looped-lm, moe, event-recap]
excerpt: "The third and final part of the recap of NICE's event \"Looped Language Model: Rethinking Model Depth and Parameters\": whether looping along depth is the same thing as CoT, whether expressiveness proofs still mean anything, how loops should be combined with MoE, and a set of questions about using loops at inference — extrapolation, ACT and parallel decoding."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

This is the third and final part of the recap of NICE’s event “Looped Language Model: Rethinking Model Depth and Parameters,” covering the second half of the panel discussion. The panel was hosted by Wenyue Hua, with Chunyuan Deng and Benhao Huang as panelists.

The second half ranged more widely: Is looping along depth the same thing as looping along time (that is, CoT)? Do expressiveness proofs still mean anything? How should loops be combined with MoE? And finally, a set of questions about “how to use loops at inference”: extrapolation, adaptive computation (ACT) and parallel decoding.

## Key takeaways

- **Looping along depth and looping along time look much alike from the standpoint of computational depth.** Chunyuan thinks that in both cases “you have to take that many sequential steps in total; the only difference is how you take them.” One difference he sees lies in the data: explicit CoT can be synthesized, whereas it is unclear how to construct supervision for latent CoT.
- **The difference between loops and soft tokens lies in how the KV cache is used.** Over the lifetime of a single token, looping twice and generating one extra soft token reach similar depths. Letting the previous token’s deep-layer state flow back into the next token’s shallow layers is exactly the starting point of the Full-Bandwidth Transformer.
- **RL brings a new opportunity, and an underlying concern.** Looping itself does not get in the way of RL; the opportunity lies in assigning credit to the intermediate loops. The concern is that looping may itself already be doing something similar to RL, so the gains from RL may shrink.
- **Expressiveness proofs are not pointless.** Inductive bias determines how quickly a model learns. Chunyuan’s conclusion is that “It’s all about the computational depth,” and that learnability matters more at present.
- **Loop × MoE: different loops should choose different experts.** Several works find that looping twice is the sweet spot, though Benhao would like people to “loop at least three times.”
- **Extrapolation is hard for natural language, and ACT looks reasonable but is hard to make work.** Both aim to change the number of loops at inference: extrapolation loops more times than in training, while ACT lets each token decide for itself how many times to loop. Both run into a mismatch between training and inference, and ACT also faces infrastructure difficulties. Benhao believes a more realistic direction for speedups is to keep the number of loops unchanged and instead, borrowing from Diffusion Forcing, stagger the different loops of different tokens and decode them in parallel.

## Glossary

The table below explains several terms that recur in this article. Readers familiar with them can skip it.

| Term | Plain-language explanation |
| --- | --- |
| Soft token / Coconut | Coconut feeds the model’s last-layer hidden state directly back in as the input for the next step, without decoding it into text; this “continuous thought” is a soft token |
| Teacher forcing | In training, the ground-truth text is fed in directly as the preceding context (rather than tokens the model generated itself), so all positions can be computed in parallel. To preserve this parallelism, in the standard architecture each position can see, at a given layer, only the information of earlier positions at that same layer, not their deeper states. So a result that an earlier token reaches in a deep layer can be used by later tokens only once they reach an equally deep layer, which leaves few layers for further processing |
| State tracking | Continuously keeping track of a state that changes with the input, for example determining where each item ends up after a sequence of swaps is carried out in order |
| TC⁰ / NC¹ | Two classes in circuit complexity: TC⁰ corresponds to constant-depth, highly parallel computation; NC¹ allows depth to grow logarithmically with input length and is generally believed to be strictly more powerful (though this has not been proven). Some state-tracking problems are NC¹-complete |
| Extrapolation | Looping more times at inference than in training, with the model still working or even doing better |
| ACT | Adaptive Computation Time: letting each token decide for itself how many times to loop, according to its difficulty |
| Mixture-of-Depths | A router decides whether each token skips a given layer, dynamically allocating compute along depth |
| HRM / TRM | Two models that solve puzzles by applying a very small network recursively (about 27M and 7M parameters, respectively), commonly used on Sudoku, mazes and ARC-AGI |
| Diffusion Forcing | A training method for diffusion models in which each token in a sequence has its own independent noise level, so the model can keep denoising older frames while starting to generate new ones |
| Speculative decoding | Drafting upcoming tokens cheaply first and then verifying them in parallel with the full model, to reduce the number of sequential steps |

## Panelists

**Chunyuan Deng:** PhD student at Rice University, advised by Prof. Hanjie Chen. His research focuses on the design and optimization of LLM pretraining architectures, as well as the interpretability of language models. His representative work is LT2: Linear-Time Looped Transformers \[1\]; his talk at the event is covered in part one of this series.

**Benhao Huang:** Master’s student at CMU, advised by Prof. Zico Kolter. He works mainly on looped LMs and fixed points, with the aim of improving the reasoning ability and efficiency of foundation models. His representative work includes Equilibrium Reasoners \[2\] and the blog series Towards Looped Models Done Right \[3\].

**Wenyue Hua (host):** Member of Technical Staff at Microsoft AI (MAI). PhD from Rutgers University, advised by Prof. Yongfeng Zhang, followed by a postdoc at UCSB. Research focuses on LLM reasoning and LLM-based agents, with many papers at top NLP and machine learning venues, including ACL, EMNLP, ICLR, NeurIPS and TACL. Serves as an Area Chair for ACL.

## 1. Is looping along depth the same as looping along time?

The host, Wenyue Hua, wanted to hear the two panelists’ thoughts: Why has there been such a surge of papers on looping recently (though it could also be a coincidence)? Are looping along depth and looping along time essentially the same thing? How does this kind of implicit reasoning relate to explicit CoT? And does it affect credit assignment in RL?

### Chunyuan: it depends on how you define “essentially”

Chunyuan said it depends on how we define “essentially.” One could first ask: are RNNs and Transformers essentially the same thing? A Transformer can also be trained step by step like an RNN, instead of in parallel with teacher forcing. Architecturally, what matters most is the operations: an architecture is, in the end, a collection of operators. If “essentially” refers to computational depth from the perspective of expressiveness, then he personally thinks the two are indeed fairly similar: in total, you have to take that many sequential steps, and the only difference is how you take them.

As for whether explicit CoT is needed, he sees one difference between explicit CoT and latent CoT in the training data: the former can be written by hand, or synthesized by people or models; for the latter, he cannot yet think of a workable way to synthesize the data or construct the supervision.

For today’s looped architectures, if you only do SFT or pretraining, there is no major conflict between looping and CoT: the model simply uses greater depth to learn CoT, rather than doing away with it. In RL, however, greater depth (or an architecture like the Full-Bandwidth Transformer) may indeed have an effect. RL requires sampling; in agentic settings, the model needs many intermediate variables for state tracking, and it has to rely on either CoT or depth for that. With greater depth, the CoT may become shorter, and RL itself also demands token efficiency. Likewise, with latent reasoning methods such as Coconut \[4\], the CoT may also get shorter. He thinks these two things really do lead to differences in RL.

> **Note:** Coconut (Chain of Continuous Thought) feeds the model’s last-layer hidden state directly back in as the input embedding for the next step, without decoding it into text, so that reasoning takes place in a continuous latent space.

## 2. Loop vs. Coconut, seen through the lifetime of a token

### Similar depth; the difference is in how the KV cache is used

Suppose you draw out the topology, follow the concrete lifetime of a single token and write out a loop and a Coconut-style soft token side by side: for example, a model that loops twice, versus an L-layer model that does not loop but generates one extra soft token. The two look very similar in depth. The difference lies in the details: how the KV cache is used.

When looping, it helps if the previous token’s final hidden state can be injected into the shallow layers of the next token; this is precisely the motivation for the Full-Bandwidth Transformer \[5\]. In an ordinary loop, because training uses teacher forcing, the deep-layer information has not yet been formed when the later token’s shallow layers are computed, so naturally it is unavailable. Soft tokens are similar: whether the previous token is a soft token or an ordinary explicit token changes which of its layers’ KVs the later tokens can see.

> **Note:** The Full-Bandwidth Transformer takes the top-layer hidden state at the previous position, fuses it through a gating unit with the embedding of the currently sampled token, and uses the result as the bottom-layer input at the next position; the rest of the architecture, the KV cache and the training objective are the same as in a standard model. Because this dependency cannot be parallelized directly, training uses multiple forward passes: each additional pass shifts the previous pass’s hidden states one position to the right and runs the whole network again, and this feedback is added only late in training (for example, only a single pass is run for roughly the first 75% of training). In experiments at the 1B scale with up to 400B tokens, the paper reports that it can match or approach a standard model trained on about 1.5× as many tokens; by the paper’s estimate, the added compute per token at decoding time is under 1%, and the model runs about 2.3% slower when measured in vLLM.

### What makes RNNs special

Benhao raised a point he found very interesting. Picking up on Chunyuan’s mention of RNNs and Transformers a moment earlier, he noted that within frameworks that measure model capability, such as complexity classes and circuit complexity, RNNs have something special about them, for example state tracking. Soft tokens can “inject” this ability back into Transformer-style architectures; looping alone, without any other mechanism, may not be able to do so.

> **Note:** Fixed-depth Transformers and many state-space models fall into the complexity class TC⁰, so they are generally believed to be unable to solve NC¹-complete state-tracking problems such as composing permutations \[6\]; each additional step of CoT or soft tokens, by contrast, amounts to letting the model perform one more step of sequential computation.

## 3. What looping means for RL

### The extra cost is mainly in prefill

Benhao mentioned that designs like the Full-Bandwidth Transformer, which send deep-layer states back to shallow layers, may carry some extra cost when used for RL: getting the deep-layer hidden states requires additional iterations or forward passes. In settings with a lot of prefill (the stage in which the model reads in the entire input at once and builds the KV cache), such as agentic tasks, this could become a problem, and RL training would also cost somewhat more.

### A new opportunity: assigning credit to intermediate loops

As for credit assignment, Benhao’s view is that, looking at looping alone, nothing stands in the way of RL: you do RL on a looped Transformer the same way you do on a Transformer, with no difference. But if you want to assign credit to the intermediate steps of the loop (for example, when looping four times, giving some credit to the 1st, 2nd and 3rd loops as well), then it is worth thinking about whether there are interesting ways to do so. For instance, during RL, could some of the intermediate loops take on tasks such as tool calling?

### An underlying concern: looping may already be doing something like RL

Beyond that, he also has a worry he is not entirely sure about: when RL is done on top of a looped model, will the gains be as large as before? A looped model may itself already be doing something similar to RL.

The host followed up: what does it mean that “looping itself is doing RL”? Benhao explained:

> RL is a kind of distribution sharpening: it makes the distribution sharper, a bit like mode seeking. Looping, on the other hand, can be seen as a kind of power iteration: it keeps the more stable modes, like keeping the directions corresponding to the largest and second-largest eigenvalues.

> **Note:** Power iteration is a classic method for finding a matrix’s dominant eigenvector: repeatedly multiply a vector by the matrix and normalize it, and the components along other directions gradually decay, leaving the direction corresponding to the largest eigenvalue. Benhao’s analogy is that both make the model contract toward a few dominant modes, so the two may overlap.

## 4. Do expressiveness proofs still mean anything?

On the looping side, there is work such as the Universal Transformer (UT) \[8\], which seemingly can approximate any function; other papers say that with unbounded CoT or infinite numerical precision, Transformers come close to being Turing complete. Many architectures can be proven to be fairly general once certain conditions are relaxed. So do expressiveness proofs have little to do with how architectures are designed?

> **Note:** The Universal Transformer paper shows that, given enough memory and a number of recurrent steps that grows with input length, it is computationally universal. Pérez et al. proved that Transformers are Turing complete under the assumption that weights and activations can take arbitrary precision, but not with fixed precision \[9\]. Merrill and Sabharwal proved that with a linear number of CoT steps, Transformers can recognize all regular languages, and with a polynomial number of steps they recognize exactly the class P \[10\], that is, the decision problems an ordinary algorithm can solve in polynomial time.

### Benhao: inductive bias determines how fast a model learns

Benhao said some architectures have their own inductive biases and learn certain tasks faster. For example, a looped model can learn Sudoku very quickly, while a Transformer of the same depth has a somewhat harder time, because it lacks a suitable inductive bias. Beyond that, though, if depth is not limited, and instead of training you could know, like a god, exactly which weights to use and set them directly, then the solution certainly exists within the Transformer’s function class.

### Chunyuan: It’s all about the computational depth

Chunyuan went on to say that there is actually a lot of discussion about expressiveness in the linear attention community. For example, the Transformer belongs to TC⁰, while GDN (Gated DeltaNet, a kind of linear attention) is an NC¹ structure. He has read a dozen or so papers discussing such questions, including the Universal Transformer, “but UT needs ACT to have that property.” After reading so many, his final conclusion is:

> It’s all about the computational depth.

You can do it in depth, or you can use a lot of CoT; essentially, there really is not much of a difference.

> **Note:** Fixed-depth, log-precision Transformers can be simulated by TC⁰ circuit families \[11\]. On linear RNNs, research has proven that when the eigenvalues of the transition matrices are allowed to be negative (lying in \[−1, 1\]), linear RNNs whose transition matrices are products of “identity minus outer product” matrices, including models such as DeltaNet, can recognize any regular language \[12\] (the eigenvalues of standard GDN are all positive, so strictly speaking this relaxation is needed); and some regular languages (such as the word problem for the symmetric group S5) are NC¹-complete. As for UT and ACT, strictly speaking, the universality proof in the UT paper requires the number of recurrent steps to grow with input length, and ACT is one way to make the number of steps vary with the input.

In Chunyuan’s view, architecture design basically comes down to two lines of thinking: either improve expressiveness, so that the architecture can express more and has a stronger function class; or improve learnability, so that the model can learn that function class more easily. He thinks that, for now, learnability may matter more; expressiveness is discussed more by people on the linear attention side.

## 5. Loops and MoE: should different loops choose the same experts?

The host noted that MoE is now a fairly mainstream architecture, but as far as she knows, there is still little work on looping in MoE models. Benhao’s blog \[3\] converted both Ouro-style \[13\] and Huginn-style \[14\] architectures to MoE for comparison, and ByteDance Seed and other institutions recently released a paper, SMELT \[15\]. Her questions: MoE adds parameters, while looping adds FLOPs; MoE also brings issues such as dynamic top-k routing (different loops may select different experts) and communication costs. When loops are added to MoE models, the number of loops seems to be small; SMELT appears to loop only twice (R = 2). Does looping many times not work well with MoE? Or do looped LMs simply not need many loops? Also, could communication costs and the KV cache become a bigger burden with MoE?

> **Note:** SMELT is a collaboration among Tsinghua University, ByteDance Seed, M-A-P and TokenWave.AI. It loops the middle half of the layers twice, and by making the model narrower and adding experts, it matches the baseline in per-token FLOPs, non-embedding parameter count and KV cache. The paper reports that at scales of up to 54B non-embedding parameters (1.6B active), it saves 6.8%–18.0% of training FLOPs along the compute-optimal frontier.

### Benhao: the cost must be paid, and the router may favor a few experts

Benhao stressed that he has not run related experiments, so what follows is only a hypothesis: the logic is the same as with KV sharing. The hidden states of different loops are already very similar, and they sit at the same position, which reinforces the similarity, so the router may end up with a few experts that are always especially active. This is also why many works tell us that the redundancy between different loops of a looped model is still large, which is what makes KV sharing, quantization, KV eviction (discarding some of the KVs) and even router reuse possible.

He thinks a router that always picks exactly the same experts would be a problem; if there are a few very active experts while several others vary across loops, that is still acceptable. Perhaps some special designs could be built around this property.

> **Note:** Benhao’s blog \[3\] has a related result: in the MoE setting, forcing later loops to reuse the experts selected by the first loop lowered accuracy on all six test tasks.

### Chunyuan: different loops should choose different experts

Chunyuan largely agreed. He said looping has only two properties: depth and weight sharing. Without extrapolation, and when comparing against a model of the same depth, only weight sharing remains, and every question can be approached from there. For example, in a 12-layer MoE model, let layers 3 and 7 share the router weights W. The router’s logits are the input representation x multiplied by W; when W is the same, which experts each layer selects depends only on its own x. So if the two layers select the same experts, that shows their representations look similar to the router; it is not caused by the shared weights.

### How many loops are right?

The host then asked: are there any current looped LMs that loop fairly deeply? The depth of looping should have nothing to do with whether MoE is used.

Benhao said that looping twice is quite a good sweet spot, as seen in Loopie \[16\] as well as SMELT, mentioned earlier.

> **Note:** Loopie (Loop the Loopies!) follows the Qwen3-MoE architecture and pretrains two models from scratch, Loopie-20B-A2B and Loopie-6B-A0.6B; it uses “intra-layer looping,” in which each layer is executed twice before moving on to the next. Comparing 2, 3 and 4 loops, the paper finds that the marginal benefit of looping is largest at R = 2, while cautioning that this does not mean more loops are ineffective in themselves. SMELT likewise finds 2 loops to be best in ablations at the 200M scale; the paper’s explanation is that, to match FLOPs, the more loops there are, the narrower the model has to be.

## 6. Extrapolation: feasible on toy tasks, hard for natural language

The host asked two things: first, why is extrapolation unlikely? Second, is extrapolation, that is, looping more times at inference than in training, even necessary? Especially now that the number of loops is generally small, basically two or three, how should we think about extrapolation?

### Benhao: it depends on the task

Benhao thinks the answer depends on what the task is; it is highly dependent on the data and the task. Fairly toy problems such as Sudoku, mazes or, somewhat more generally, 3-SAT are actually very well suited to looping, and training a looped model on them can yield the ability to extrapolate.

> **Note:** Benhao’s Equilibrium Reasoners \[2\] is one such example: the paper reports that on Sudoku, unrolling the model to a depth equivalent to 40,000 layers raises accuracy from 2.6% for a feed-forward model to over 99%.

But if the task becomes natural language, and a very general task at that, with essentially the same distribution as current pretraining data, it becomes very hard, because this is fundamentally a problem of mismatch between training and inference. Toy tasks can reduce this mismatch because in tasks like Sudoku, even intermediate reasoning states are valid inputs: the same set of rules is applied repeatedly to a state, and the rules themselves do not change. Real language settings are not that simple, and the mismatch between training and inference will be severe.

So he thinks that training with only 8 steps and running 16 steps at inference is very hard. Staying stable may already be a good outcome; more often, performance degrades. And as discussed earlier, if the model has not learned a fixed point, using more steps may not work particularly well, all the more so beyond the training distribution.

### Chunyuan: it may also be a data problem

Chunyuan said that extrapolation is not only an algorithmic problem; it may also be a data problem: algorithms alone cannot make extrapolation stable, and what helps is finding a recipe that works in certain settings.

## 7. ACT: reasonable on paper, hard in practice

The host asked: is ACT feasible from an engineering standpoint?

### Chunyuan: the infrastructure is too hard, and the gains are unproven

Chunyuan said he has no idea at all how to build the infrastructure. He had previously tried something similar to Mixture-of-Depths \[18\] himself, that is, MoE along depth. If you route along depth, the first token might want to go through layers 1, 3 and 7, and the second token through layers 1, 4 and 6, and then the problems start: how do you batch? How do you train? He has no idea how such an ML system should be built.

> **Editor’s note:** ACT was proposed by Graves in 2016, originally for RNNs: at each step the model additionally outputs a halting probability, and computation stops once the cumulative probability exceeds a threshold. Mixture-of-Depths uses a router to score each token and lets only the top-scoring fraction of tokens (for example, 12.5%) pass through a layer’s attention and MLP, while the remaining tokens skip it via the residual connection; because the number of tokens each layer processes is fixed in advance, the computation graph remains static.

Suppose a fairly good scenario: ACT works, and people first discover that letting each token take a different number of steps brings very large gains; that would in turn push the ML systems community to come up with better solutions. But he has not seen any recent evidence that token-level ACT brings much benefit; it may instead bring more instability, and training at different depths is also hard.

### Benhao: it looks reasonable, but is not worth pursuing further

Benhao agreed with Chunyuan. He sees ACT as a path that seems to make a lot of sense but in practice may not be worth pursuing further; some people have spent a long time on it and found that it still does not really work. One reason is the ML-system problem Chunyuan mentioned; a more fundamental reason, in his view, is that the number of loops is small to begin with: with so few loops, how much room is there for adaptivity?

Moreover, from the perspective of fixed points, the hidden states produced by very shallow loops are still quite unstable, so ACT would aggravate the mismatch between training and inference. The results he has seen are basically all performance drops in exchange for a tiny bit of inference speedup, so he does not think ACT suits the language setting well. However, in the HRM \[19\] and TRM \[20\] line of work, which was very popular a while back, ACT is very well motivated, and he sees no problem with those approaches.

> **Note:** HRM (Hierarchical Reasoning Model) has only 27M parameters and achieved strong results on Sudoku-Extreme, Maze-Hard and ARC-AGI with about 1,000 training examples; it implements ACT with a “halt / continue” head trained by Q-learning. TRM recursively applies just a single 2-layer network of about 7M parameters and further simplifies ACT to a single halting head that judges whether the current answer is correct, removing the extra forward pass previously required. On such puzzles, difficulty varies greatly from one puzzle to another, and intermediate states are themselves valid inputs, which may be one reason ACT is well motivated here but hard to make work in language modeling.

## 8. More realistic speedups: parallel and speculative decoding

Benhao said that, as for the best engineering solution, speculative decoding and parallel generation for looped LMs are a very interesting direction.

Diffusion Forcing \[21\] from video generation, and the techniques commonly used for real-time game generation in world models, can all be used in looped models. The reason is precisely weight sharing: in diffusion, the same model is fed different diffusion time steps; in looping, the same model is applied repeatedly across different loops. The two are structurally very similar, so a similar kind of parallelism is possible. Rather than doing adaptive looping, it is better to put the effort here, where the speedup will be large.

> **Note:** Diffusion Forcing trains a diffusion model to denoise a set of tokens that each carry an independent noise level, so that, like a causal model, it can start generating later tokens before earlier ones are fully denoised.

He also recommended a paper by the authors of Huginn \[14\]: Efficient Parallel Samplers for Recurrent-Depth Models \[22\].

> **Note:** The paper has been accepted at ICML 2026. It proposes a diffusion-forcing-style sampler: every forward pass decodes at least one new token from the intermediate hidden states, while several earlier tokens continue to be refined in parallel within the loop, forming a “wavefront” that moves forward (new tokens have just started looping while older ones have already looped many rounds; within one forward pass, the tokens are at different rounds, like a diagonal line advancing step by step). Total compute stays the same, and the speedup comes from making fuller use of the GPU; on the 3.5B Huginn model, the paper reports speedups of up to about 5× on tasks such as GSM8K, MATH500, HumanEval and MBPP, with very little change in accuracy.

## References

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026.

&#91;2\] [Equilibrium Reasoners: Learning Attractors Enables Scalable Reasoning](https://arxiv.org/abs/2605.21488). arXiv:2605.21488, 2026.

&#91;3\] [Towards Looped Models Done Right](https://ifm-research.notion.site/Towards-Looped-Models-Done-Right-3ade511912ec8128987dfeb7a5580043). Blog series, 2026.

&#91;4\] [Training Large Language Models to Reason in a Continuous Latent Space](https://arxiv.org/abs/2412.06769) (Coconut). arXiv:2412.06769, 2024.

&#91;5\] [Full-bandwidth transformer](https://arxiv.org/abs/2608.08888). arXiv:2608.08888, 2026.

&#91;6\] [The Illusion of State in State-Space Models](https://arxiv.org/abs/2404.08819). ICML 2024, arXiv:2404.08819.

&#91;7\] [T²MLR: Transformer with Temporal Middle-Layer Recurrence](https://arxiv.org/abs/2607.15178). arXiv:2607.15178, 2026.

&#91;8\] [Universal Transformers](https://arxiv.org/abs/1807.03819). ICLR 2019, arXiv:1807.03819.

&#91;9\] [Attention is Turing Complete](https://jmlr.org/papers/volume22/20-302/20-302.pdf). JMLR 22(75), 2021.

&#91;10\] [The Expressive Power of Transformers with Chain of Thought](https://arxiv.org/abs/2310.07923). ICLR 2024, arXiv:2310.07923.

&#91;11\] [The Parallelism Tradeoff: Limitations of Log-Precision Transformers](https://arxiv.org/abs/2207.00729). TACL 2023, arXiv:2207.00729.

&#91;12\] [Unlocking State-Tracking in Linear RNNs Through Negative Eigenvalues](https://arxiv.org/abs/2411.12537). ICLR 2025, arXiv:2411.12537.

&#91;13\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;14\] [Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach](https://arxiv.org/abs/2502.05171) (Huginn). NeurIPS 2025, arXiv:2502.05171.

&#91;15\] [SMELT: Scaling Laws for Compute-Matched MoE Looped Transformers](https://arxiv.org/abs/2609.01343). arXiv:2609.01343, 2026.

&#91;16\] [Loop the Loopies!](https://arxiv.org/abs/2607.16051) (Loopie). arXiv:2607.16051, 2026.

&#91;17\] [Adaptive Computation Time for Recurrent Neural Networks](https://arxiv.org/abs/1603.08983) (ACT). arXiv:1603.08983, 2016.

&#91;18\] [Mixture-of-Depths: Dynamically allocating compute in transformer-based language models](https://arxiv.org/abs/2404.02258). arXiv:2404.02258, 2024.

&#91;19\] [Hierarchical Reasoning Model](https://arxiv.org/abs/2506.21734) (HRM). arXiv:2506.21734, 2025.

&#91;20\] [Less is More: Recursive Reasoning with Tiny Networks](https://arxiv.org/abs/2510.04871) (TRM). arXiv:2510.04871, 2025.

&#91;21\] [Diffusion Forcing: Next-token Prediction Meets Full-Sequence Diffusion](https://arxiv.org/abs/2407.01392). NeurIPS 2024, arXiv:2407.01392.

&#91;22\] [Efficient Parallel Samplers for Recurrent-Depth Models and Their Connection to Diffusion Language Models](https://arxiv.org/abs/2510.14961). ICML 2026, arXiv:2510.14961.

---

*This series: [Part 1｜LT2 and Historical KV Replay](/blog/2026/10/looped-lm-recap-1-lt2/) · [Part 2｜Panel, First Half](/blog/2026/10/looped-lm-recap-2-panel-first-half/) · Part 3｜Panel, Second Half (this post)*

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

本文是 NICE 举办的「Looped Language Model：重新思考模型的深度与参数」活动回顾的第三篇，也是最后一篇，整理圆桌讨论的下半场。圆桌由华文越主持，邓淳远和黄奔皓两位嘉宾参与讨论。

下半场的话题更发散：沿深度循环和沿时间循环（也就是 CoT）是不是一回事？表达力证明还有没有意义？loop 和 MoE 怎么结合？以及外推、自适应计算（ACT）和并行解码这几个关于“推理时怎么用 loop”的问题。

## 本文要点

- **沿深度循环与沿时间循环，从计算深度看很像**。淳远认为两者都“总共要走那么多 sequential step，区别只是怎么走”；他觉得一个不同之处在数据：显式 CoT 可以合成，latent CoT 的监督则不知道该怎么构造。
- **Loop 与 soft token 的差别在 KV cache 怎么用**。从一个 token 的生命周期看，loop 两次和多生成一个 soft token 深度相近；让上一个 token 的深层状态流回下一个 token 的浅层，正是 Full-Bandwidth Transformer 的出发点。
- **RL 是新机会，也有隐忧**。Loop 本身不妨碍 RL，机会在于给中间的 loop 分配 credit；隐忧是 loop 可能本身就在做类似 RL 的事，RL 的增幅可能变小。
- **表达力证明并非“鸡肋”**。归纳偏置决定学得快慢；淳远的结论是 “It's all about the computational depth”，当下更重要的是可学习性。
- **Loop × MoE：不同 loop 选不同 expert 才对**。多项工作发现 loop 两次是 sweet spot，奔皓希望大家“好歹 loop 三次”。
- **外推在自然语言上很难，ACT 看起来合理却难走**。两者都想在推理时改变 loop 次数：外推是比训练时 loop 更多次，ACT 是让每个 token 自己决定 loop 几次；两者都会遇到训练与推理不匹配的问题，ACT 还面临 infra 上的困难。奔皓认为，更现实的加速方向是不改变 loop 次数，而是借鉴 Diffusion Forcing，把不同 token 的不同 loop 错开并行解码。

## 读前速查

下表解释本文反复出现的几个术语，熟悉的读者可以直接跳过。

| 术语 | 白话解释 |
| --- | --- |
| Soft token / Coconut | Coconut 把模型最后一层的隐状态直接当作下一步的输入，而不解码成文字，这种“连续思维”就是 soft token |
| Teacher forcing | 训练时直接用真实文本作为前文输入（而不是模型自己生成的 token），因此所有位置可以并行计算。为了保持这种并行，标准结构里每个位置在某一层只能看到前面位置同一层的信息，看不到它们更深层的状态；所以前一个 token 在深层得出的结果，后面的 token 要到同样深的层才能用上，留给继续加工的层数很少 |
| State tracking | 状态追踪：持续跟踪一个随输入变化的状态，例如依次执行一串交换操作后判断每个物品在哪 |
| TC⁰ / NC¹ | 电路复杂度中的两个类别：TC⁰ 对应固定深度、高度并行的计算；NC¹ 允许深度随输入长度对数增长，一般认为严格更强（尚未被证明），某些状态追踪问题就是 NC¹ 完全的 |
| 外推 | 推理时 loop 次数超过训练时，模型仍然有效甚至更好 |
| ACT | Adaptive Computation Time，自适应计算：让每个 token 按难度自己决定 loop 几次 |
| Mixture-of-Depths | 由路由器决定每个 token 是否跳过某一层，在深度上动态分配计算 |
| HRM / TRM | 两个用很小的网络反复递归来解谜题的模型（参数分别约 27M 和 7M），常用于数独、迷宫、ARC-AGI |
| Diffusion Forcing | 一种扩散模型训练方法：序列里每个 token 有各自独立的噪声水平，因而可以一边继续去噪旧的帧、一边开始生成新的帧 |
| 投机解码 | 先用便宜的方式草拟后续 token，再用完整模型并行验证，以减少串行步数 |

## 参与嘉宾

**邓淳远**：Rice University 博士生，导师为 Hanjie Chen 教授。研究聚焦 LLM 预训练架构设计与优化，也关注语言模型的可解释性。代表工作为 LT2: Linear-Time Looped Transformers \[1\]，他在活动中的主题分享见本系列第一篇。

**黄奔皓**：CMU 硕士生，导师为 Zico Kolter 教授。主要研究 looped LM 与不动点（fixed point），致力于提升基础模型的推理能力与效率。代表工作包括 Equilibrium Reasoners \[2\] 和博客系列 Towards Looped Models Done Right \[3\]。

**华文越（主持）**：微软 MAI 研究员（Member of Technical Staff）。博士毕业于 Rutgers University，导师为张永锋教授，之后在 UCSB 从事博士后研究。主要研究方向为 LLM reasoning 与 LLM-based agent，在 ACL、EMNLP、ICLR、NeurIPS、TACL 等 NLP 与机器学习领域的顶级会议和期刊发表多篇论文，并担任 ACL Area Chair。

## 一、沿深度循环与沿时间循环是一回事吗？

主持人华文越想听两位谈谈：为什么最近 loop 方向的论文像井喷一样多（当然也可能是偶然）？沿深度的循环和沿时间的循环，本质上是一回事吗？这些隐式推理与显式 CoT 是什么关系？对 RL 的 credit assignment 会有影响吗？

### 淳远：取决于怎么定义“本质”

淳远说，这取决于我们怎么定义“本质”。可以先问一个问题：RNN 和 Transformer 本质上是一回事吗？Transformer 训练时也可以不用 teacher forcing 并行计算，而是像 RNN 那样一步一步地走。从架构上说，最重要的是看 operation：架构归根结底是一堆 operator。如果“本质”指的是从表达力的角度谈计算深度，那他个人觉得两者确实比较像：总共就是要走那么多 sequential step（串行步骤），区别只是怎么走。

至于是否需要显式 CoT，他认为显式 CoT 与 latent CoT 的一个区别在于训练数据：前者可以人工编写，也可以由人或模型合成；后者该如何合成数据、构造监督，他目前还想不到可行的办法。

对现在的 loop 结构来说，如果只是做 SFT 或预训练，loop 和 CoT 并没有什么大的冲突：模型只是用更深的深度去学 CoT，而不是把 CoT 消解掉了。但在 RL 这里，更深的深度（或者像 Full-Bandwidth Transformer 这样的结构）确实可能产生影响。RL 需要采样；在 agentic 场景下，模型需要很多中间变量来做 state tracking，这时它必须借助 CoT 或深度。有了更深的深度，CoT 的长度可能会被削减，而 RL 本身也要求 token 效率。同样，如果用 Coconut \[4\] 这类 latent reasoning 的方法，CoT 也可能变短。他认为这两种东西在 RL 上确实会产生差异。

> **注**：Coconut（Chain of Continuous Thought）把模型最后一层的隐状态直接作为下一步的输入 embedding，而不解码成文字，让推理在连续的隐空间中进行。

## 二、Loop vs Coconut：从一个 token 的生命周期看

### 深度相近，差别在 KV cache 怎么用

如果把拓扑结构画出来，看一个 token 具体的生命周期，把 loop 和 Coconut 式的 soft token 分别写出来：比如一个 loop 两次的模型，和一个不 loop 的 L 层模型、但多生成一个 soft token，两者的深度看起来很像。区别在细节上：怎么利用 KV cache。

做 loop 时，如果能让上一个 token 的最终 hidden state 注入到下一个 token 的浅层，是有好处的，这正是 Full-Bandwidth Transformer \[5\] 的动机。而在一般的 loop 里，由于用 teacher forcing 训练，深层的信息在后面 token 的浅层计算时还没有形成，自然是拿不到的。Soft token 也类似：前一个 token 是 soft token 还是普通的显式 token，后面的 token 能看到它哪些层的 KV，情况也不一样。

> **注**：Full-Bandwidth Transformer 把上一个位置最顶层的隐状态，经门控单元与当前采样出的 token embedding 融合，作为下一个位置在最底层的输入；其余架构、KV cache 和训练目标都与标准模型相同。由于这种依赖无法直接并行，训练时采用多遍前向：每多一遍，就把上一遍的隐状态右移一位再跑一次整个网络，并且只在训练后期加入这种反馈（例如前约 75% 的训练只跑单遍）。论文在 1B 规模、最多 400B token 的实验中报告，它可以匹配或接近用约 1.5 倍 token 训练的标准模型；按论文估算，解码时每个 token 增加的计算量不到 1%，在 vLLM 中实测约慢 2.3%。

### RNN 的独特之处

奔皓认为一个很有意思的点是：刚才淳远提到 RNN 和 Transformer，在复杂度类、电路复杂度这类衡量模型能力的框架下，RNN 有它的独特之处，比如 state tracking。Soft token 可以把这种能力“注入回” Transformer 类架构；只做 loop、不引入其他机制，则未必能做到。

> **注**：固定深度的 Transformer 和不少状态空间模型都落在 TC⁰ 这一复杂度类中，因此一般认为它们无法完成置换复合这类 NC¹ 完全的状态追踪问题 \[6\]；而 CoT 或 soft token 每多生成一步，就相当于让模型多做一步串行计算。

## 三、Loop 对 RL 意味着什么

### 额外代价主要在 prefill

奔皓提到，Full-Bandwidth Transformer 这类把深层状态送回浅层的设计用于 RL 时，可能会有一些额外代价：想拿到深层的 hidden state，就需要额外的迭代或前向。在 prefill（模型先把整段输入一次性读进来、建好 KV cache 的阶段）很多的场景，比如 agentic 任务，这可能会成为问题，RL 训练也会多一些代价。

### 新机会：给中间的 loop 分配 credit

至于 credit assignment，奔皓认为：只看 loop 本身，没有什么会阻止它做 RL，Transformer 怎么做，looped Transformer 就怎么做，没什么区别。但如果想给 loop 中间的步骤分配 credit，比如 loop 四次，想给第 1、2、3 次也分配一些 credit，就可以思考有没有一些有意思的做法了。举个例子：做 RL 时，能不能让中间几个 loop 去承担 tool calling 之类的任务？

### 隐忧：loop 本身可能就在做类似 RL 的事

除此之外，他也有一个不太确定的担心：loop 之后再做 RL，增幅会不会没有之前那么大？因为 loop 模型本身可能也在做一些类似 RL 的事情。

主持人追问：“loop 本身在做 RL”是什么意思？奔皓的解释是：

> RL 是一种 distribution sharpening，让分布更尖锐，有点 mode seeking 的感觉；loop 则可以看作一种 power iteration，它会把比较稳定的模式留下来，就像留下最大、次大特征值对应的方向。

> **注**：幂迭代（power iteration）是求矩阵主特征向量的经典方法：反复用矩阵去乘一个向量并归一化，其他方向的分量会逐渐衰减，最后留下最大特征值对应的方向。奔皓的类比是：两者都会让模型向少数主导模式收缩，所以可能有重叠。

## 四、表达力证明还有意义吗？

loop 方向有 Universal Transformer（UT）\[8\] 这类工作，好像能逼近所有函数；还有论文说，在无限 CoT 或无限数值精度的条件下，Transformer 接近图灵完备。很多架构在放宽某些条件后，都能证明自己是比较通用的。那么，表达力证明是不是和架构怎么设计关系不大？

> **注**：Universal Transformer 论文表明，在内存足够、循环步数随输入长度增长时，它是计算通用的。Pérez 等人证明，在权重和激活可以取任意精度的假设下，Transformer 是图灵完备的，而固定精度时则不是 \[9\]。Merrill 和 Sabharwal 证明，允许线性步数的 CoT 时，Transformer 能识别所有正则语言，允许多项式步数时恰好能识别 P 类问题 \[10\]，即用普通算法在多项式时间内就能解决的那类判定问题。

### 奔皓：归纳偏置决定学得快慢

奔皓说，有些架构有自己的归纳偏置，对某些任务学得更快。比如 loop 模型在数独任务上可以学得很快，而同样深度的 Transformer 学起来就有点困难，因为它没有合适的归纳偏置。但除此之外，如果不限制深度，又不通过训练，而是像神一样知道该用什么权重并直接设置好，那 Transformer 的函数类里肯定是有这个解的。

### 淳远：It's all about the computational depth

淳远接着说，线性注意力社区其实有很多关于表达力的讨论。比如 Transformer 属于 TC⁰，GDN（Gated DeltaNet，一种线性注意力）则是一个 NC¹ 的结构。他大概看过十几篇讨论这类问题的文章，包括 Universal Transformer，“但 UT 得配合 ACT 才有这种性质”。看了这么多，他最后的结论是：

> It's all about the computational depth.

你可以在深度上做，也可以用很多 CoT，本质上确实不会有特别大的区别。

> **注**：固定深度、对数精度的 Transformer 可以被 TC⁰ 电路族模拟 \[11\]。关于线性 RNN，有研究证明，允许转移矩阵特征值取负（落在 \[−1, 1\]）、由“单位阵减外积”的矩阵连乘构成的线性 RNN，包括 DeltaNet 这类模型，可以识别任意正则语言 \[12\]（标准 GDN 的特征值都是正的，严格说需要做这一放宽）；而某些正则语言（如 S5 置换群上的字问题）是 NC¹ 完全的。至于 UT 与 ACT，严格来说，UT 论文的通用性证明要求循环步数随输入长度增长，ACT 是让步数随输入变化的一种方式。

在淳远看来，架构设计基本就是这两个逻辑：要么提升表达力，让它能表达更多、函数类更强；要么提升可学习性（learnability），让模型更容易把这个函数类学出来。他觉得就当下而言，可学习性可能更重要；表达力则是线性注意力那边的人讨论得多一些。

## 五、Loop 与 MoE：不同 loop 该选同样的 expert 吗？

主持人说，MoE 现在是比较主流的架构，但据她的了解，在 MoE 上做 loop 的工作还不多。奔皓的博客 \[3\] 里把 Ouro \[13\] 和 Huginn \[14\] 式的结构都改成了 MoE 做对比，字节跳动 Seed 等机构最近也有一篇 SMELT \[15\]。她的疑问是：MoE 增加的是参数，loop 增加的是 FLOPs；MoE 还有不固定的 top-k routing（不同 loop 选中的 expert 可能不同）、通信成本等问题。在 MoE 上加 loop，loop 次数似乎都比较少，SMELT 好像只 loop 两次（R = 2），是不是在 MoE 上 loop 很多次不太行？还是说 looped LM 本来就不需要 loop 太多次？另外，通信成本和 KV cache 在 MoE 上会不会成为更大的负担？

> **注**：SMELT 由清华大学、字节跳动 Seed、M-A-P 和 TokenWave.AI 合作完成。它让中间一半的层 loop 两次，并通过把模型做窄、增加 expert，使每个 token 的 FLOPs、非 embedding 参数量和 KV cache 都与 baseline 对齐。据论文报告，在最大 54B 非 embedding 参数（1.6B 激活）的规模上，它在计算最优前沿上节省了 6.8%–18.0% 的训练 FLOPs。

### 奔皓：成本要付，router 可能偏爱少数 expert

奔皓强调自己没有做过相关实验，以下都只是假设：这和 KV sharing 是一个道理。不同 loop 的 hidden state 本来就很像，位置也一样，这会加剧相似性，router 可能出现几个 expert 一直特别活跃的情况。这也是为什么很多工作都告诉我们，looped 模型不同 loop 之间的冗余还是很大，所以才能做 KV sharing、量化、KV eviction（淘汰部分 KV），甚至 router 复用。

他觉得，如果一个 router 始终选完全一样的 expert，是有问题的；如果有几个非常活跃的 expert，同时有好几个 expert 在不同 loop 之间变化，那还可以接受。也许可以针对这种特性做一些特殊设计，

> **注**：奔皓博客 \[3\] 中有一个相关结果：在 MoE 设置下，强制后面的 loop 复用第一个 loop 选中的 expert，六项测试任务的准确率全部下降。

### 淳远：不同 loop 选不同 expert 才对

淳远也比较同意。他说：loop 只有两个性质，深度和 weight sharing。如果没有外推，又要和同等深度的模型比，那就只剩下 weight sharing，所有问题都可以从这里出发。比如在一个 12 层的 MoE 里，让第 3 层和第 7 层共享 router 权重 W。router 的 logits 是输入表示 x 乘以 W，W 相同时，两层选哪些 expert 只取决于各自的 x。所以两层若选中相同的 expert，说明的是两层的表示在 router 看来相近，而不是共享权重造成的。

### Loop 几次合适？

主持人又问：目前的 looped LM 有没有 loop 得比较深的？loop 的深度和用不用 MoE 应该没有关系。

奔皓说， loop 两次是一个挺好的 sweet spot，包括 Loopie \[16\]，以及刚才提到的 SMELT。

> **注**：Loopie（Loop the Loopies!）沿用 Qwen3-MoE 架构，从头预训练了 Loopie-20B-A2B 和 Loopie-6B-A0.6B 两个模型；它采用“层内 loop”，每一层先重复执行两次再进入下一层。论文在 2、3、4 次 loop 的对比中发现，loop 的边际收益在 R = 2 时最大，同时也提醒这不代表更多次 loop 本身无效。SMELT 在 200M 规模的消融中同样发现 2 次最好，论文给出的解释是：为了匹配 FLOPs，loop 次数越多，模型就必须做得越窄。

## 六、外推：toy task 可以，自然语言很难

主持人问了两件事：一是为什么外推不太可能？二是有没有外推的必要，也就是让推理时的 loop 次数超过训练时？尤其在目前 loop 次数都比较少、基本是两三次的情况下，该怎么看待外推？

### 奔皓：取决于任务

奔皓认为这个问题要看任务是什么，和数据、任务的相关性非常大。如果是数独、迷宫，或者更一般一点的 3-SAT 这类比较 toy 的问题，它们其实非常适合 loop，在上面训练 loop 模型是有可能得到外推能力的。

> **注**：奔皓的 Equilibrium Reasoners \[2\] 就是这类任务上的一个例子：据论文报告，在数独任务上把模型展开到相当于 4 万层的深度，准确率从前馈模型的 2.6% 提升到 99% 以上。

但如果把任务换成自然语言，而且是非常通用的任务，基本上和当前预训练数据的分布一样，就很难做了，因为这本质上是一个训练和推理不匹配（mismatch）的问题。Toy task 之所以能减少这种 mismatch，是因为在数独这类任务里，即使是中间的推理状态，也可以作为合法的输入：同一套规则在一个状态上反复应用，规则本身不会变。真实的语言场景没有那么简单，训练和推理的 mismatch 会很严重。

所以他觉得，训练时只训 8 步、推理时推 16 步，非常难。能保持稳定，可能就已经不错了；更多情况下会看到性能衰减。再加上前面讲的，如果没有学到不动点，即使用了更多步，效果也可能没有特别好；超出训练分布的话，就更是如此。

### 淳远：可能也是数据问题

淳远说，外推不只是一个算法问题，可能还是一个数据问题：没法只靠算法把外推稳定下来，而是要在某些场景下找到一套 recipe（配方）才会有帮助。

## 七、ACT：看起来合理，实际难走

主持人问： ACT 在工程上可行吗？

### 淳远：infra 太难，收益也未被证明

淳远说，infra 完全不知道怎么做。他之前自己做过类似 Mixture-of-Depths \[18\] 的尝试，也就是在深度上做 MoE。如果在深度上做路由，可能第一个 token 想走第 1、3、7 层，第二个 token 要走第 1、4、6 层，问题就来了：怎么 batching？怎么训练？完全不知道这样的 ML system 该怎么做。

> **编者注**：ACT 由 Graves 在 2016 年提出，最初用于 RNN：模型在每一步额外输出一个“停止”概率，累计超过阈值就停止计算。Mixture-of-Depths 则用路由器为每个 token 打分，只让得分最高的一部分 token（例如 12.5%）经过某一层的 attention 和 MLP，其余 token 直接通过残差连接跳过；由于每层处理的 token 数事先固定，计算图仍是静态的。

假设一种比较好的情况：ACT 做成了，大家先发现让每个 token 走不同的步数能带来非常大的收益，那反而会推动 ML system 去给出更好的解决方案。但他最近也没有看到证据说明 token 级 ACT 能带来多大收益，反而可能带来更多不稳定，不同深度的训练也很难。

### 奔皓：看着合理，实际不适合继续走

奔皓同意淳远的看法。他认为ACT是一条看起来很 make sense、但实际可能不太适合继续走的路，有些人花了很久时间，发现还是不太 work。一方面是淳远说的 ML system 问题；他觉得更本质的原因是，现在 loop 次数本来就不多，loop 这么少，还能有多少自适应的空间？

另外，如果从不动点的角度考虑，很浅的 loop 得到的 hidden state 其实还很不稳定，ACT 会加剧训练和推理的 mismatch。他看到的结果基本都是性能下降，换来一点点推理加速，所以他不认为 ACT 很适合语言的设定。不过在之前很火的 HRM \[19\]、TRM \[20\] 这类工作里，做 ACT 是非常有动机的，那些做法他觉得没什么问题。

> **注**：HRM（Hierarchical Reasoning Model）只有 27M 参数，用约 1000 个训练样例在 Sudoku-Extreme、Maze-Hard 和 ARC-AGI 上取得了很强的结果，它用一个经 Q-learning 训练的“停止 / 继续”头来实现 ACT。TRM 只用一个 2 层、约 7M 参数的网络反复递归，并进一步简化了 ACT：只训练一个判断当前答案是否正确的停止头，省掉了原先需要的额外一次前向。在这类谜题上，不同题目的难度差异很大，中间状态本身也是合法的输入，这或许是 ACT 在这里有动机、在语言建模中却难以奏效的原因之一。

## 八、更现实的加速：并行与投机解码

奔皓说：关于工程上的最优解，looped LM 的投机解码（speculative decoding）和并行生成，是一个很有意思的方向。

视频生成里的 Diffusion Forcing \[21\]，或者 world model 中实时游戏生成常用的技巧，在 loop 模型里都是可以用的。原因正是 weight sharing：在 diffusion 里，是同一个模型被注入不同的 diffusion time step；在 loop 里，是同一个模型被反复用于不同的 loop。两者在结构上很像，所以可以做类似的并行。与其做 adaptive loop，不如把精力放在这上面，加速会很大。

> **注**：Diffusion Forcing 训练扩散模型去噪一组各自带有独立噪声水平的 token，因此可以像因果模型一样，在前面的 token 还没有完全去噪时就开始生成后面的 token。

他还推荐了 Huginn \[14\] 作者的一篇工作 Efficient Parallel Samplers for Recurrent-Depth Models \[22\]。

> **注**：这篇论文已被 ICML 2026 接收。它提出一种 diffusion forcing 式的采样器：每次前向都从中间的隐状态解码出至少一个新 token，同时之前的若干 token 继续在循环中并行精炼，形成一个向前推进的“波前”（新 token 刚开始循环，旧 token 已循环多轮；同一次前向里各 token 处在不同轮次，像一道斜线逐步向前推进）。总计算量不变，加速来自更充分地利用 GPU；据论文报告，在 3.5B 的 Huginn 模型上，GSM8K、MATH500、HumanEval、MBPP 等任务最高可加速约 5 倍，准确率变化很小。

## 参考文献

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026.

&#91;2\] [Equilibrium Reasoners: Learning Attractors Enables Scalable Reasoning](https://arxiv.org/abs/2605.21488). arXiv:2605.21488, 2026.

&#91;3\] [Towards Looped Models Done Right](https://ifm-research.notion.site/Towards-Looped-Models-Done-Right-3ade511912ec8128987dfeb7a5580043). Blog series, 2026.

&#91;4\] [Training Large Language Models to Reason in a Continuous Latent Space](https://arxiv.org/abs/2412.06769) (Coconut). arXiv:2412.06769, 2024.

&#91;5\] [Full-bandwidth transformer](https://arxiv.org/abs/2608.08888). arXiv:2608.08888, 2026.

&#91;6\] [The Illusion of State in State-Space Models](https://arxiv.org/abs/2404.08819). ICML 2024, arXiv:2404.08819.

&#91;7\] [T²MLR: Transformer with Temporal Middle-Layer Recurrence](https://arxiv.org/abs/2607.15178). arXiv:2607.15178, 2026.

&#91;8\] [Universal Transformers](https://arxiv.org/abs/1807.03819). ICLR 2019, arXiv:1807.03819.

&#91;9\] [Attention is Turing Complete](https://jmlr.org/papers/volume22/20-302/20-302.pdf). JMLR 22(75), 2021.

&#91;10\] [The Expressive Power of Transformers with Chain of Thought](https://arxiv.org/abs/2310.07923). ICLR 2024, arXiv:2310.07923.

&#91;11\] [The Parallelism Tradeoff: Limitations of Log-Precision Transformers](https://arxiv.org/abs/2207.00729). TACL 2023, arXiv:2207.00729.

&#91;12\] [Unlocking State-Tracking in Linear RNNs Through Negative Eigenvalues](https://arxiv.org/abs/2411.12537). ICLR 2025, arXiv:2411.12537.

&#91;13\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;14\] [Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach](https://arxiv.org/abs/2502.05171) (Huginn). NeurIPS 2025, arXiv:2502.05171.

&#91;15\] [SMELT: Scaling Laws for Compute-Matched MoE Looped Transformers](https://arxiv.org/abs/2609.01343). arXiv:2609.01343, 2026.

&#91;16\] [Loop the Loopies!](https://arxiv.org/abs/2607.16051) (Loopie). arXiv:2607.16051, 2026.

&#91;17\] [Adaptive Computation Time for Recurrent Neural Networks](https://arxiv.org/abs/1603.08983) (ACT). arXiv:1603.08983, 2016.

&#91;18\] [Mixture-of-Depths: Dynamically allocating compute in transformer-based language models](https://arxiv.org/abs/2404.02258). arXiv:2404.02258, 2024.

&#91;19\] [Hierarchical Reasoning Model](https://arxiv.org/abs/2506.21734) (HRM). arXiv:2506.21734, 2025.

&#91;20\] [Less is More: Recursive Reasoning with Tiny Networks](https://arxiv.org/abs/2510.04871) (TRM). arXiv:2510.04871, 2025.

&#91;21\] [Diffusion Forcing: Next-token Prediction Meets Full-Sequence Diffusion](https://arxiv.org/abs/2407.01392). NeurIPS 2024, arXiv:2407.01392.

&#91;22\] [Efficient Parallel Samplers for Recurrent-Depth Models and Their Connection to Diffusion Language Models](https://arxiv.org/abs/2510.14961). ICML 2026, arXiv:2510.14961.

---

*本系列：[第一篇｜LT2 与 Historical KV Replay](/blog/2026/10/looped-lm-recap-1-lt2/) · [第二篇｜圆桌（上）](/blog/2026/10/looped-lm-recap-2-panel-first-half/) · 第三篇｜圆桌（下）（本篇）*

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
