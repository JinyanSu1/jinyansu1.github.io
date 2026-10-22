---
layout: post
title: "Event Recap, Part 1 | Looping Saves Parameters, Not KV Cache: Chunyuan Deng on LT2 and Historical KV Replay / 活动回顾（一）｜Loop 省参数，却不省 KV cache：邓淳远谈 LT2 与 Historical KV Replay"
date: 2026-10-22
categories: technical
tags: [ai, llm, architecture, looped-lm, linear-attention, kv-cache, event-recap]
excerpt: "NICE hosted an online talk and panel, \"Looped Language Model: Rethinking Model Depth and Parameters.\" Part 1 covers Chunyuan Deng's talk: a loop saves parameters, not KV cache — so LT2 moves looping onto linear attention. Plus Historical KV Replay, a new method that replays earlier loops' KVs in reverse order, not yet in the public version of the paper."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

On October 17 at 9 p.m. ET (9 a.m. on Sunday, October 18, Beijing time), NICE hosted an online talk and panel, “Looped Language Model: Rethinking Model Depth and Parameters.” There was a lot to cover, so this recap comes in three parts: the first covers Chunyuan Deng’s talk, and the second and third cover the two halves of the panel discussion. This is part one.

The idea behind looped LMs is simple: run the same set of layers several times, adding computational depth without adding parameters. But a loop saves parameters, not KV cache. That is where Chunyuan’s talk starts: can combining loops with linear attention keep the benefits of looping while lowering the cost of inference? Beyond the analysis in the published paper, he also presented Historical KV Replay, a new method from his team that is not yet in the public version of the paper.

## Key takeaways

- **Looping saves parameters, not KV cache.** When a standard (full-attention) Transformer loops, its KV cache grows linearly with the number of loops. At long context lengths, a full-attention model that does not loop at all is more expensive than a linear-attention model that loops many times. This is why LT2 moves looping onto linear attention.
- **Writing to the same memory several times increases expressiveness.** Linear attention compresses the history into a fixed-size “memory,” which you can think of as a lookup table. For each incoming token, the delta rule “erases, then writes” the entry associated with that token: it first erases the old content, then writes the new content. Per the DeltaProduct analysis, erasing and writing n times at the same position updates n entries in one step instead of just one, provided the n writes really modify different, non-overlapping entries, which the team verified largely holds in common settings.
- **But when linear attention is looped directly, each loop writes to its own memory.** The theory above therefore does not strictly apply, and the recurrence over time and the recurrence over depth are never connected. This leaves room for co-design.
- **The new method, Historical KV Replay, replays earlier loops’ KVs in reverse order.** It brings large gains in both recall and language modeling. Order is crucial: reverse order works, while forward order barely helps.
- **The cost is manageable, and the gains are not just from “computing more.”** The amount of replay grows quadratically with the number of loops (loop k writes its own KVs and also rewrites the KVs of the previous k−1 loops, so 4 loops require 1+2+3+4 = 10 writes in total), but models today usually loop only two or three times. In controlled comparisons, the team also tried other ways of adding the same amount of compute: looping more times (just more rounds, with each loop still writing only its own memory), widening GDN (Gated DeltaNet, the linear attention that LT2 loops), and stacking DeltaProduct inside each layer (erasing and writing several times at the same position). All of these helped, but none matched replay.
- **Extrapolation matters more than tinkering with the architecture.** Chunyuan argues that without extrapolation, one has to work very hard to justify the value of weight sharing (if a looped model cannot loop more at inference than in training, it is just a fixed-depth model whose layers share parameters, and its main advantage is fewer parameters; extrapolation is what lets it loop more on demand at inference time, trading extra compute for better results). ACT (adaptive computation, which lets each token decide how many loops to run based on its difficulty) is very hard to implement, and it is unclear whether it can be solved. Post-training, especially combining on-policy distillation with loops, deserves attention.

## Glossary

The table below explains several terms that recur in this article. Readers familiar with them can skip it.

| Term | Plain-language explanation |
| --- | --- |
| Loop / Looped LM | Running the same set of layers (or the whole model) several times with the same parameters each time. Looping 4 times is like stacking those layers 4 times while keeping only one copy of the parameters |
| Weight sharing | Multiple loops use the same set of parameters; this is where looping’s parameter savings come from |
| KV cache | The keys and values that standard attention caches for every past token during generation, so that later tokens can query them; it grows with context length, number of layers and number of loops |
| Linear attention | Instead of storing all past KVs, compresses the history into a fixed-size state matrix (recurrent memory) that is updated token by token; its memory does not grow with context length |
| Delta rule | An update rule for linear attention: before writing new content, it partially erases the old content in the current key’s direction, i.e., “erase once, write once” |
| GDN / KDA | Two linear-attention variants based on the delta rule. GDN (Gated DeltaNet) adds a forget gate; KDA (Kimi Delta Attention) makes the forget gate finer-grained |
| Head dim | The dimension of the key and query vectors in each attention head, commonly 128 or 256 |
| SWA | Sliding window attention: each token only attends to tokens within a fixed-length window of recent tokens |
| Hybrid | An architecture that combines a few full-attention layers with many linear or sparse attention layers, e.g., one full-attention layer for every three linear-attention layers |
| Recall | The ability to accurately retrieve a specific piece of information from a long context, typically tested with “needle in a haystack”; a traditional weakness of linear attention |
| Chunkwise | A common parallel algorithm for linear attention: split the sequence into chunks, compute in parallel within each chunk, and recur across chunks, which makes efficient GPU kernels possible |
| Extrapolation | Looping more times at inference than in training (e.g., training with 8 loops and running inference with 16) while the model still works or even improves |
| ACT | Adaptive Computation Time: each token decides how many loops to run based on its difficulty |
| On-policy distillation | The student model generates its own content and the teacher gives token-by-token guidance on it, instead of the student simply imitating text the teacher wrote |

## Speakers

**Chunyuan Deng (speaker):** PhD student at Rice University, advised by Prof. Hanjie Chen. His research focuses on the design and optimization of LLM pretraining architectures, as well as the interpretability of language models. The work presented in this talk is LT2: Linear-Time Looped Transformers \[1\].

*\[Figure: cover slide of Chunyuan’s talk\]*

## 1. Motivation: looping saves parameters, but not KV cache

The selling point of looped models is parameter efficiency: reuse the same layers several times, and the computational depth multiplies while the parameter count stays the same. But when Chunyuan’s team first started working on loops, their impression was that they were “very expensive.” The reason is that a loop shares parameters, but not the KV cache.

In a full-attention Transformer, every layer stores a key and a value for every token. If the model loops 4 times, the same token has to store a copy in each loop, so the KV cache grows in proportion to the number of loops. For looping on full attention, this overhead is “simply unacceptable,” and it is hard to imagine extrapolating it to many loops.

Linear attention is different: its recurrent memory is small, and both its training FLOPs and its inference memory scale well. As a result, at long context lengths a full-attention model that does not loop at all is far more expensive than a linear-attention model that loops many times.

> **Note:** Here is a back-of-the-envelope estimate for a single layer and a single attention head (ignoring compression techniques such as GQA). Let the head dimension be d and the context length be N. Full attention stores a key vector and a value vector for every token, 2N·d numbers in total. The state of a linear attention such as GDN is a d×d matrix, d² numbers, independent of N (linear attention takes the outer product of each token’s key and value to get a d×d matrix and accumulates it into the same state, so the state stays the same size no matter how many tokens are read). With d = 128 and N = 32K, the former is about 512 times the latter. So even if a linear-attention model loops a hundred times or more, its total per-layer state is still smaller than that of a full-attention model that does not loop.

This is the starting point of LT2 \[1\]: **loop on linear attention**, so that both training FLOPs and inference memory stay well-behaved. A set of numbers from Chunyuan’s slides makes this concrete: for a 0.6B model at 32k context, the looped Transformer’s KV cache is 12.1 GB, while LT2’s is only 0.05 GB; decoding speeds are 6.3 and 19.4 tokens per second, respectively.

&#91;image: Chunyuan’s slides, p. 3\]

*Figure: A looped Transformer stores a separate KV cache for each loop, which grows with context length; LT2 keeps only one fixed-size state per loop.*

## 2. The intuition: write to the same memory several times

LT2 mainly studies linear attention of the GDN \[2\] and KDA \[3\] type. As Chunyuan explained, their state transition matrix (the matrix that, each time a token is read, determines how the old memory changes: how much it decays and what gets erased; see α\_t(I − β\_t k\_t k\_tᵀ) in the formula below) can be written in a “diagonal plus low-rank” (DPLR) form. This class of linear attention currently works well and is widely used.

First, what does the delta rule do? For each incoming token, the model updates the memory matrix S using the token’s key k\_t, value v\_t and write strength β\_t (using GDN as the example, with slightly simplified notation):

```latex
S_t = \alpha_t \left(I - \beta_t k_t k_t^{\top}\right) S_{t-1} + \beta_t k_t v_t^{\top}
```

The term I − β\_t k\_t k\_tᵀ in parentheses is the identity matrix minus a rank-1 matrix: it partially erases the memory’s old content in the k\_t direction, and the second term then writes the new value into that direction. This is what Chunyuan meant by “erase once and write once along k\_t.” α\_t is the forget gate, which controls how much the old memory decays overall; KDA makes this gate finer-grained than GDN does. In the GDN paper’s framing, the gate enables rapid memory erasure, while the delta rule enables targeted updates.

The earlier DeltaProduct \[4\] work goes a step further: instead of erasing and writing once per token, it does so n\_h times in a row at the same position. The state transition matrix then becomes a product of n\_h such matrices:

```latex
A_t = \prod_{j=1}^{n_h} \left(I - \beta_{t,j}\, k_{t,j} k_{t,j}^{\top}\right)
```

Each factor is “identity minus rank 1,” so the product is “identity minus a matrix of rank at most n\_h”; together with the forget gate, this is what the paper calls “diagonal plus rank n\_h.” Intuitively, one erase-and-write can only change the memory’s content in one direction, while n\_h of them can change n\_h directions. A “direction” here is the direction of a key vector: if you think of the memory as a table looked up by key, each key direction roughly corresponds to one entry, and the closer the keys of the successive writes are to orthogonal, the more they modify unrelated entries. DeltaProduct’s theoretical analysis shows that the larger n\_h is, the stronger the model’s state tracking (e.g., working out where each item ends up after a sequence of swaps); experimentally, it outperforms DeltaNet, which writes only once per token, on both state tracking and language modeling.

Chunyuan put it more plainly: the theory looks complicated, but it is actually easy to understand. As long as the keys used in the successive writes are mutually orthogonal, or at least not fully collinear, each write goes in a different direction, which is like being able to erase several times. So doing a few more products at the linear-attention step, i.e., looping at the position of the delta rule, gives stronger control over the recurrent memory.

But do keys “collide” in practice, i.e., are the keys of successive writes nearly collinear? The team checked: the larger the head dim, the harder it is for keys to collide, and the smaller, the easier. According to the statistics in the slides, at default settings such as a head dim of 128 or 256, the absolute cosine between the keys of two adjacent loops in GDN averages only about 0.05, so collisions are rare; when the head dim drops to 32 and the number of loops rises to 16, collisions become much more frequent. The gain in expressiveness from rank 1 to rank n\_h is therefore fairly reliable.

> **Note:** In high-dimensional space, two vectors with random directions are naturally close to orthogonal. The cosine of the angle between two random d-dimensional unit vectors has a mean of 0 and a standard deviation of about 1/√d, so it typically deviates from 0 by only about 1/√d, roughly 0.09 for d = 128. The closer the cosine is to 0, the closer the two vectors are to orthogonal. So the larger the head dim, the less likely keys are to collide.

There is a subtlety here, though. When a GDN or KDA is looped directly, each loop maintains its own recurrent memory: loop 1 writes its own KVs into its own memory, loop 2 writes into another one, and so on. The theory above is about repeatedly erasing and writing the same memory, whereas direct looping writes to different memories. Chunyuan admitted that applying the theory this way is “actually not rigorous.”

Seen from another angle, the recurrence over time (updating the memory token by token) and the recurrence over depth (updating representations loop by loop) could be treated as a single whole. Arrange all tokens and all loops in a “token × loop” grid: unrolled step by step, it is a single data stream, and training with teacher forcing (feeding in the whole ground-truth text at once and computing all positions in parallel) amounts to computing the whole grid at once. With direct looping, the two dimensions run separately and have never been designed jointly. Chunyuan thinks there may be a good opportunity for co-design here, which leads to the new method in the next section.

## 3. New work: Historical KV Replay

This section covers the team’s recent work, which is not yet in the public version of the paper; Chunyuan said they may update the paper later.

### How it works: rewrite the old KVs when writing new memory

Take a single token as an example: going up the network, it passes through loops 1, 2, 3 and 4 in turn. Normally, each loop writes only the KVs computed in that loop into its own memory, and the KVs of different loops have nothing to do with each other. Replay works like this: when loop k writes its memory, it also brings over the KVs of the earlier loops and writes them again. For example, loop 2 brings over loop 1’s KVs and writes them once more; loop 3 rewrites the KVs of loops 2 and 1; and so on. This creates a form of co-design between the recurrence over depth and the recurrence over time.

Chunyuan offered an analogy: you read the first book, then the second; after finishing the second, you flip back through the first because you are afraid you have forgotten it; after finishing the third, you review the second and the first.

From the perspective of the previous section, replay makes loop k’s memory receive, at the same token position, erase-and-write operations with keys from multiple loops. In other words, it “writes to the same memory several times”: each step’s update goes from rank 1 to rank at most k. Replay introduces no new parameters and does not change the memory size. According to the formulas in the slides, the forget-gate decay is applied only once per token, and each write uses the write strength β of the loop it comes from.

&#91;image: Chunyuan’s slides, p. 7\]

*Figure: The number j in each cell denotes the KVs that the token computed in loop j; loop k writes its own KVs first and loop 1’s KVs last.*

### Order is crucial: replay in reverse

**Replay in reverse order (4→3→2→1), not in forward order (1→2→3→4).** For loop 4, this means writing its own KVs first, then those of loops 3, 2 and 1 in turn. In terms of the reading analogy: after finishing a new book, don’t start rereading from the first book; learn the new one first, then work backwards to review the older ones.

In experiments, forward order brings almost no gain, while reverse order substantially improves recall and also brings large gains in pretraining language modeling. A comparison in the slides (1.3B model, 4 loops) makes the point clearly. Both orders write exactly the same KVs the same number of times; only the order differs. On a recall test at length 2k, looped GDN without replay scores 34.58, forward replay 34.71 and reverse replay 41.10; the averages over 8 zero-shot tasks are 58.39, 58.45 and 61.10, respectively. Chunyuan noted that the improvement is especially pronounced on recall tasks close to real-world use, such as “needle in a haystack.” He also offered a way to think about it: the more loops there are, the more representations replay accumulates along depth, somewhat like a latent chain of thought (latent CoT) unrolled along depth.

> **Note:** The explanation Chunyuan gives in his slides is “the last write wins”: each write erases part of the old content along its own key direction, so the KV pair written last is overwritten the least. In forward order, the last write is the current loop’s own KVs, so the final state of the memory is almost the same as without replay; in reverse order, the last write is loop 1’s KVs, which are therefore preserved most completely in every loop’s memory. A test-time intervention experiment supports this. For a 1.3B model trained with Full Replay, changing only how replay is done at inference, switching to forward order lowers 2k recall by 7.7 points and dropping the loop-1 pair lowers it by 8.5 points, while dropping the previous loop’s pair lowers it by only 0.8 points. The model clearly relies mainly on loop 1’s KVs, which are written last.

### Cost: quadratic growth, but few loops

A natural question is whether replay is expensive. Each replay means one more delta-rule erase-and-write. With n loops, the total number of writes is 1 + 2 + … + n = n(n+1)/2, which grows quadratically with the number of loops. Fortunately, people do not loop very many times today (“nobody loops ten thousand times”), usually just two or three, and in that range the extra cost is not large.

There is also a small engineering trick. Replay forms a small set of KVs along the depth dimension, so instead of doing several rounds of reads and writes one after another, you can stack them into a small matrix and run a chunkwise computation along depth (chunkwise normally splits along the sequence length; here it splits along depth). This lets you reuse existing GDN kernels and keeps the decoding cost down. According to the slides, during decoding each loop still reads and writes the state only once; what is added is computation, not state reads and writes.

Chunyuan presented the following cost comparison. Compared with a looped model that is also based on linear attention but does no replay, Full Replay has lower training throughput and slightly slower decoding because of the extra replay and writes, but overall inference remains acceptable. The specific numbers (0.6B model, a single H100): training throughput at 4k length drops from 41.2k to 34.6k tokens per second (about 16% lower), and decoding speed at 32k context drops from 19.4 to 18.4 tokens per second (about 5% lower). The slowdown here is the extra cost of replay relative to plain looping; compared with a looped full-attention model, linear attention is still far cheaper at long context lengths.

### A cheaper variant: First-loop Replay

Instead of replaying the whole history, this variant replays only the first loop’s KVs: each loop no longer writes its own KVs but writes loop 1’s KVs instead, so the number of writes per token is the same as with plain looping. This is somewhat like the idea behind YOCO \[5\]: early depths provide the KVs for later depths.

> **Note:** YOCO (You Only Cache Once) is a decoder-decoder architecture: the first half of the network produces a single global KV cache, which all layers in the second half share through cross-attention, greatly reducing the size of the KV cache.

One key detail: only the earlier loops’ KVs are reused, not their decay coefficients (α), write strengths (β) or queries; each loop still uses its own α, β and query. If α and β are reused as well, results get much worse. Chunyuan said this has a bit of a “hybrid” feel: it uses some historical information while keeping each loop’s own information. It is a good balance point they found: training and decoding speeds are basically unaffected, and it still captures part of replay’s gains. The numbers in the slides: training throughput drops by only about 1%, decoding is actually about 4% faster, and the gain in average score is about 70% of Full Replay’s (+1.94 vs. +2.78 on the 0.6B model).

In the ablations, they compared forward order, reverse order, replaying only the first loop, and several other combinations and orders. Taking Full Replay’s improvement as 100% (0.6B model), forward order captures only 2%, “current loop + previous loop” 16%, “current loop + loop 1” 84%, and First-loop Replay 70%. The key, then, is to keep loop 1’s KVs and write them last. Based on these ablations, the recommended approach is to keep the first loop’s KVs while letting each later loop use its own write strength and decay, capturing the gains at a lower cost. After recent discussions, however, the team also feels that First-loop Replay is sometimes not stable enough. In the talk, Chunyuan recommended Full Replay instead: it costs a bit more, but it does work better.

### The gains are not just from “computing more”

To rule out the explanation that replay simply spends more compute, they compared replay with other ways of adding compute: looping more times (e.g., 6 times), widening GDN, and, while looping the whole model, stacking the DeltaProduct-style repeated erase-and-write from the previous section inside each layer. All of these help, and more compute generally brings more gain, but the improvements may all fall short of replay. In the comparison plot in the slides (0.6B model), these approaches raise the average score only from 55.7 to somewhere between 56 and 57, and both their training and decoding speeds are lower than First-loop Replay’s, whereas First-loop Replay and Full Replay reach 57.7 and 58.5, respectively. Chunyuan concludes that replay’s gains cannot be explained simply by compute; moreover, some of the other approaches run into system-level problems and are less efficient.

Finally, Chunyuan added that what he showed is the pure linear-attention setting. The more realistic setting is a hybrid one, and replay works on hybrid models as well, with good results: the slides show that on 0.6B Full+GDN and GDN+DSA hybrids, Full Replay raises the average score by 1.4 and 2.0 and 2k recall by 3.1 and 4.3, respectively. In his view, combining loops with linear attention is always a trade-off between speed and quality: wherever a looped Transformer would be used, you can fairly freely swap in a looped GDN and get a good balance between speed and quality.

## 4. Other findings from the paper

Besides replay, Chunyuan picked out a few points from the published paper \[1\] that are worth sharing. The paper itself tries many hybrid combinations of linear attention, sparse attention, SWA and more, with fairly thorough ablations.

> **Note:** LT2 studies two looped variants, one with linear attention (LT2-linear) and one with sparse attention (LT2-sparse). For the former, looping repeatedly refines the memory; for the latter, it expands the effective receptive field. The receptive field is how wide a range of inputs can influence the output at a given position; in a language model, it is how far back a token can draw information from. Take sliding window attention as an example. In each round, every token sees only the most recent w tokens; in the next loop, those w tokens have already absorbed the information in their own windows during the previous round, so earlier content can reach the current token indirectly through them. Each additional loop therefore extends the coverage back by one window, to about n·w tokens after n loops, the same coverage as stacking n layers of sliding window attention. “Effective” refers precisely to this indirect coverage relayed through intermediate tokens. The paper also proposes two hybrids: one combining GDN with the sparse attention DSA, which runs in linear time throughout and matches the quality of a standard looped Transformer; and one combining GDN with a small number of full-attention layers, which surpasses the standard looped baseline.

### Loop-level hybrids

When building hybrids, the first idea that comes to mind is mixing along depth, e.g., one full-attention layer for every three linear-attention layers. With loops, you can also mix across loops, which gives a cross-loop hybrid: for example, the first loop uses full attention throughout and the second switches to SWA.

This works because a loop shares only the parameters, which Chunyuan calls the slow weights; anything other than the parameters can change from loop to loop. The attention mask is a typical fast weight, and if you loop the whole model, even the loss function can differ across loops. This opens up a new design space: besides depth-level hybrids, there are loop-level hybrids.

The team compared two schemes that change the attention window size from loop to loop, and the results were somewhat surprising:

- **Shrinking the window loop by loop** (like a CNN, e.g., full attention → 512 → 256 → 128): lower loss (perplexity 9.26), but downstream performance does not improve (average score 60.71).
- **Growing the window loop by loop** (e.g., 128 → 256 → 512 → full attention): slightly worse loss (perplexity 9.42), but downstream performance is actually a little higher (average score 62.47).

For reference, a conventional depth-level hybrid (with full attention interleaved within every loop) has a perplexity of 9.30 and an average score of 61.51. Lower loss usually goes with better downstream performance, but these results go the other way.

### Randomly sampled attention patterns

If you treat each position along the depth and loop dimensions as a “slot,” you can choose independently whether each slot uses full attention or efficient attention. A more aggressive approach is to randomly sample the attention type of each slot during training: the overall ratio of full to efficient attention stays fixed, but their positions vary randomly. At inference, majority voting is done over multiple sampled configurations.

The method does bring some improvement, but at too high a cost: at inference, each sampled configuration has to be run separately before voting, so the compute grows in proportion to the number of samples (in the slides, 5 samples at 5× the compute raise the average score only from 61.51 to 61.75). Chunyuan considers it impractical for real use; this set of experiments was only an exploratory attempt.

## 5. Distilling from Ouro: no need to train from scratch

The last part of the talk was about distillation: converting a full-attention looped model such as Ouro \[6\] into a linear-attention hybrid model without training from scratch. Ouro is an open-source family of whole-model looped language models, which part two of this series introduces in detail. Chunyuan noted that switching to sparse attention is relatively easy, while switching to linear attention is bound to cost some performance; because this work leans toward linear attention, they tried it anyway.

> **Note:** According to the LT2 paper, the Ouro-hybrid-1.4B obtained this way (called Ouro-LT2-1.4B in the slides) was trained on only about 1B tokens, yet it outperforms industry 1B-class models and is competitive with 4B-class models. According to the slides, the teacher is Ouro-1.4B, which loops 4 times and whose 24 layers all use full attention; the student keeps full attention in only 6 of those layers and replaces the other 18 with GDN plus replay. Training has three stages: first, aligning each layer’s hidden states and selecting the 6 layers to keep (100M tokens, length 512); then, per-loop logit distillation (600M tokens, length 4k); and finally, 32k long-context training on OpenThoughts-v3 (600M tokens). The final student reaches about 95.5% of the teacher’s average performance across 6 tasks. The contribution of each component is also clear: without replay, interleaving the 6 full-attention layers uniformly at fixed intervals retains only 65.3%, the best previous layer-selection method reaches 86.9%, and their method reaches 92.9%; adding Full Replay raises this to 95.5%.

Chunyuan shared three key points.

**First, distillation data is crucial: different data maps to different downstream abilities.** The data you distill on tends to determine which benchmarks improve: pretraining data corresponds to commonsense benchmarks, while open-source reasoning data may line up with math-reasoning benchmarks such as GSM8K and AIME. As for MMLU, they have not yet found data that lines up with it: “maybe our experiments weren’t thorough enough, but MMLU may also just be harder.”

**Second, choosing which layers keep full attention is crucial.** This point comes from earlier work \[7\]: when distilling into a hybrid, you should not interleave linear-attention layers uniformly at a fixed ratio. Instead, first assess the importance of each layer, then decide which layers keep full attention (that work estimates each layer’s importance with a short training run on generic text). This step substantially improves distillation. According to Chunyuan, one usually finds that the early-to-middle layers should keep full attention, while the other layers can be replaced.

**Third, a loop-specific trick: a dual curriculum over depth and length.** A curriculum arranges training from easy to hard. Long-context training usually increases the length gradually from short to long; with loops, you can likewise go from shallow to deep, first distilling the first loop until it closely matches the teacher, then the second loop. Their preferred approach is to advance both together: loop 1 paired with short contexts, loop 2 with longer ones. In their method, this works well.

## 6. Future directions

For depth-recurrent models, Chunyuan sees three directions worth watching:

- **Extrapolation matters more than tinkering with the architecture.** In his view, continuing to tweak architectures is not that critical; what really matters is extrapolation. Without extrapolation, one has to work very hard to justify the value of weight sharing. He explained this later in the panel discussion: a loop has only two properties, depth and weight sharing, and if there is no extrapolation and the comparison is against a model of the same depth, only weight sharing remains (see part three of this series). Conversely, with extrapolation, weight sharing provides value that a standard Transformer cannot: loop only a few times in training, then loop more on hard problems at inference, trading extra compute for better results without adding parameters or producing a longer chain of thought. Benhao also said in the panel that this kind of extrapolation is what test-time scaling really means (see part two of this series).
- **ACT is very hard to implement.** He is not sure whether this problem can be solved. The main difficulty is at the infra level: different tokens loop different numbers of times, which makes batching and training systems hard to design. Even so, he still lists ACT as a direction worth watching.
- **Pay more attention to post-training.** Not just SFT and RL; combining on-policy distillation \[8\] with loops in particular may work well.

> **Note:** On-policy distillation means the student model receives token-by-token guidance from the teacher on sequences it generates itself, rather than only learning from text the teacher wrote in advance. This way, the student sees and corrects the mistakes it would actually make during training; a representative work is \[8\].

Extrapolation and ACT are discussed in more depth in the second half of the panel; see part three of this series.

## Closing and what’s next

Before the Q&A, host Wenyue Hua remarked that the work seems to start from some findings about linear attention and then discover that adding loops is a very natural combination. Looking back at Chunyuan’s talk, the reasoning follows a single thread: the KV cache cost that looping brings is resolved with linear attention, and joint time-and-depth designs such as replay substantially improve linear attention’s weakness in recall.

Next up is the first half of the panel: Where are the bottlenecks in LLM architecture? Do the gains of looping really come from the architecture, or just from spending more compute? Should looped models learn fixed points?

## References

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026. Code: github.com/chili-lab/LT2

&#91;2\] [Gated Delta Networks: Improving Mamba2 with Delta Rule](https://arxiv.org/abs/2412.06464) (GDN). ICLR 2025, arXiv:2412.06464.

&#91;3\] [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692) (KDA). arXiv:2510.26692, 2025.

&#91;4\] [DeltaProduct: Improving State-Tracking in Linear RNNs via Householder Products](https://arxiv.org/abs/2502.10297). NeurIPS 2025, arXiv:2502.10297.

&#91;5\] [You Only Cache Once: Decoder-Decoder Architectures for Language Models](https://arxiv.org/abs/2405.05254) (YOCO). NeurIPS 2024, arXiv:2405.05254.

&#91;6\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;7\] [Distilling to Hybrid Attention Models via KL-Guided Layer Selection](https://arxiv.org/abs/2512.20569). ICLR 2026, arXiv:2512.20569.

&#91;8\] [On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649). ICLR 2024, arXiv:2306.13649.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

美东时间 10 月 17 日晚 9 点（北京时间 10 月 18 日周日上午 9 点），NICE 举办了一场线上 Talk + Panel 活动「Looped Language Model：重新思考模型的深度与参数」。内容较多，回顾分三篇发出：第一篇是邓淳远的主题分享，第二、三篇整理圆桌讨论的上下半场。本文是第一篇。

Looped LM 的想法很简单：把同一组层反复用几遍，不增加参数，只增加计算深度。但 loop 省下的是参数，省不下 KV cache。淳远的分享正是以此为出发点：将 loop 与线性注意力结合，能否在保留 loop 优势的同时降低推理成本？除了已公开论文里的分析，他还分享了团队最近、尚未写进公开论文的新方法 Historical KV Replay。

## 本文要点

- **Loop 省参数，不省 KV cache**。在标准（full attention）Transformer 上 loop，KV cache 随 loop 次数线性增长。长上下文下，一个不 loop 的 full attention 模型，比一个 loop 很多次的线性注意力模型还贵。这是 LT2 把 loop 搬到线性注意力上的出发点。
- **同一块记忆多写几次，表达力更强**。线性注意力把历史压缩进一块固定大小的“记忆”，可以把它想象成一张查找表。每读入一个 token，就按 delta rule 对表中与它对应的那一条“先擦后写”：先擦掉旧内容，再写入新内容。按 DeltaProduct 的分析，如果在同一位置连续擦写 n 次，一步就能更新 n 条内容，而不只是 1 条。前提是这 n 次改的确实是不同的条目、互不重叠，团队验证在常用设置下基本满足。
- **但直接 loop 线性注意力，每个 loop 写的是各自的记忆**。上面的理论因此不能严格套用，时间维度和深度维度的循环也没有打通，这里留下了联合设计（co-design）的空间。
- **新方法 Historical KV Replay：倒序回放之前 loop 的 KV**。它在召回和语言建模上都带来很大提升。顺序很关键：倒序有效，正序几乎无效。
- **成本可控，收益也不只来自“多算几遍”**。回放量随 loop 次数二次增长（第 k 个 loop 除了写自己的 KV，还要把前面 k−1 个 loop 的 KV 再写一遍，loop 4 次总共要写 1+2+3+4 = 10 次），但现在通常只 loop 两三次。对照实验中，他们还试了其他同样增加计算量的做法：loop 更多次（只是多走几轮，每个 loop 仍只写自己的记忆）、把 GDN（Gated DeltaNet，即 LT2 里被 loop 的那种线性注意力）做宽、层内叠加 DeltaProduct（同一位置多擦写几次），这些都有收益，但都不如 replay。
- **外推比魔改架构更重要**。淳远认为，没有外推，就得很努力地去论证 weight sharing 的价值（推理时如果不能比训练时 loop 更多次，looped 模型就只是一个深度固定、层间共享参数的模型，优势基本只剩省参数；有了外推，才能在推理时按需多 loop 几轮，用更多计算换更好的结果）；ACT（自适应计算：让每个 token 按难度自己决定 loop 几次）实现难度很大，能否解决尚不确定；post-training，尤其是 on-policy distillation 与 loop 的结合，值得关注。

## 读前速查

下表解释本文反复出现的几个术语，熟悉的读者可以直接跳过。

| 术语 | 白话解释 |
| --- | --- |
| Loop / Looped LM | 把同一组层（或整个模型）重复执行多次，每次用同一套参数。loop 4 次相当于把这组层叠 4 遍，参数只有一份 |
| Weight sharing | 权重共享，指多个 loop 共用同一套参数，这是 loop 省参数的来源 |
| KV cache | 标准注意力在生成时为每个历史 token 缓存的 key 和 value，供后续 token 查询；占用随上下文长度、层数和 loop 次数增长 |
| 线性注意力 | 不保存全部历史 KV，而是把历史压进一个固定大小的状态矩阵（recurrent memory），逐 token 更新；内存不随上下文变长而增长 |
| Delta rule | 线性注意力的一种更新规则：写入新内容前，先把记忆在当前 key 方向上的旧内容擦掉一部分，即“擦一次、写一次” |
| GDN / KDA | 两种基于 delta rule 的线性注意力。GDN（Gated DeltaNet）加了遗忘门；KDA（Kimi Delta Attention）把遗忘门做得更细 |
| Head dim | 每个注意力头里 key、query 向量的维度，常见取值为 128 或 256 |
| SWA | 滑动窗口注意力（sliding window attention）：每个 token 只看最近一段固定长度窗口内的 token |
| Hybrid | 混合架构：少量 full attention 层搭配大量线性或稀疏注意力层，例如每 3 层线性注意力配 1 层 full attention |
| 召回（recall） | 从长上下文中准确找回某条信息的能力，典型测试是“大海捞针”；这是线性注意力的传统弱项 |
| Chunkwise | 线性注意力常用的并行算法：把序列切成小块，块内并行计算、块间递推，便于写高效的 GPU kernel |
| 外推 | 推理时 loop 次数超过训练时（例如训练 8 次、推理 16 次），模型仍然有效甚至更好 |
| ACT | Adaptive Computation Time，自适应计算：让每个 token 按难度自己决定 loop 几次 |
| On-policy distillation | 让学生模型自己生成内容，再由教师模型对其中每个 token 给出指导，而不是只模仿教师写好的文本 |

## 嘉宾介绍

**邓淳远（主讲）**：Rice University 博士生，导师为 Hanjie Chen 教授。研究聚焦 LLM 预训练架构设计与优化，也关注语言模型的可解释性。本次分享的工作是 LT2: Linear-Time Looped Transformers \[1\]。

*〔配图：淳远 PPT 封面〕*

## 一、动机：loop 省参数，却不省 KV cache

Looped 模型的卖点是参数效率：同一组层重复用几次，参数量不变，计算深度却翻了几倍。但淳远团队最初研究 loop 时的感受是：这个东西“非常贵”。原因在于，loop 共享的是参数，KV cache 并不共享。

在 full attention Transformer 里，每一层都要为每个 token 存一份 key 和 value。模型 loop 4 次，同一个 token 就要在每个 loop 里各存一份，KV cache 与 loop 次数成正比地增长。在 full attention 上 loop，这样的开销“实在是接受不了”，也很难想象把它外推到很多轮。

线性注意力则不同：它的 recurrent memory 很小，训练 FLOPs 和推理内存都有比较好的性质。因此，在长上下文下，一个不 loop 的 full attention 模型，远比一个 loop 很多次的线性注意力模型要贵。

> **注**：可以用单层、单个 attention head 粗算一下（不考虑 GQA 等压缩手段）。设 head dim 为 d、上下文长度为 N。Full attention 要为每个 token 存一对 key、value 向量，共 2N·d 个数；GDN 这类线性注意力的状态是一个 d×d 的矩阵，共 d² 个数，与 N 无关（线性注意力把每个 token 的 key 和 value 做外积，得到一个 d×d 的矩阵，再累加进同一个状态里，所以不管读入多少 token，状态都是这么大）。取 d = 128、N = 32K，前者约为后者的 512 倍。因此，线性注意力模型即使 loop 上百次，每层的状态总量也还小于一个不 loop 的 full attention 模型。

这就是 LT2 \[1\] 的出发点：**在线性注意力上做 loop**，让训练 FLOPs 和推理内存都保持良好的性质。PPT 中的一组数字很直观：0.6B 模型在 32k 上下文下，looped Transformer 的 KV cache 为 12.1 GB，LT2 只有 0.05 GB；解码速度分别为每秒 6.3 个和 19.4 个 token。

&#91;image: 淳远 PPT 第 3 页\]

*图：Looped Transformer 每个 loop 各存一份 KV cache，随上下文长度增长；LT2 每个 loop 只保留一个固定大小的状态。*

## 二、理论直觉：同一块记忆，多写几次

LT2 主要研究 GDN \[2\]、KDA \[3\] 这类线性注意力。淳远介绍，它们的状态转移矩阵（即每读入一个 token 时，决定旧记忆如何变化、衰减多少、擦掉哪些内容的那个矩阵，见下文公式中的 α\_t(I − β\_t k\_t k\_tᵀ)）可以写成“对角 + 低秩”（DPLR，diagonal-plus-low-rank）的形式，这是目前效果较好、也较主流的一类线性注意力。

先看 delta rule 在做什么。每读入一个 token，模型用这个 token 的 key k\_t、value v\_t 和写入强度 β\_t 更新记忆矩阵 S（以 GDN 为例，记号略有简化）：

```latex
S_t = \alpha_t \left(I - \beta_t k_t k_t^{\top}\right) S_{t-1} + \beta_t k_t v_t^{\top}
```

括号里的 I − β\_t k\_t k\_tᵀ 是单位矩阵减去一个秩 1 矩阵：它把记忆在 k\_t 方向上的旧内容擦掉一部分；后一项再把新的 value 写进这个方向。这就是淳远说的“在 k\_t 这个方向上擦一次、写一次”。α\_t 是遗忘门，控制旧记忆整体衰减多少；KDA 在 GDN 的基础上把这个门做得更细。按 GDN 论文的说法，遗忘门负责快速清空记忆，delta rule 负责有针对性地更新。

此前的 DeltaProduct \[4\] 工作更进一步：每个 token 不只擦写一次，而是在同一位置连续做 n\_h 次。于是状态转移矩阵变成 n\_h 个这样的矩阵相乘：

```latex
A_t = \prod_{j=1}^{n_h} \left(I - \beta_{t,j}\, k_{t,j} k_{t,j}^{\top}\right)
```

每个因子都是“单位矩阵减秩 1”，乘起来就是“单位矩阵减去一个秩不超过 n\_h 的矩阵”，再配上遗忘门，就是论文所说的“对角 + 秩 n\_h”。直观地说，一次擦写只能改动记忆在一个方向上的内容，n\_h 次擦写就能改动 n\_h 个方向。这里的“方向”就是 key 向量的方向：如果把记忆看成一张按 key 查找的表，每个 key 方向大致对应表里的一条内容；几次擦写的 key 越接近正交，改动的就越是互不相干的条目。DeltaProduct 的理论分析表明，n\_h 越大，状态追踪（state tracking，例如依次执行一串交换操作后判断每个物品在哪）的能力越强；实验上它在状态追踪和语言建模上都优于每个 token 只写一次的 DeltaNet。

淳远的解释更直白：这个理论看起来很复杂，其实很好理解。只要几次写入用的 key 互相正交，或者至少不完全共线，每次就是在往不同的方向写，相当于能擦好几次。所以，在线性注意力这一步上多做几次乘积，也就是在 delta rule 的位置上 loop，就能对 recurrent memory 有更强的控制。

那实际中 key 会不会“撞车”，即几次写入的 key 几乎共线？团队做了验证：head dim 越大越难撞，越小越容易撞。PPT 中的统计显示，在 head dim 为 128 或 256 这类默认设置下，GDN 里相邻两个 loop 的 key 夹角余弦的绝对值平均只有约 0.05，基本不会撞；head dim 降到 32、loop 次数增加到 16 时，撞车就明显增多。从秩 1 到秩 n\_h 的表达力提升，因此是比较有保障的。

> **注**：高维空间中，两个随机方向的向量天然接近正交：两个 d 维随机单位向量夹角的余弦值平均为 0，标准差约为 1/√d，也就是说它偏离 0 的幅度通常只有 1/√d 左右；d = 128 时约为 0.09。余弦越接近 0，两个向量就越接近正交。所以 head dim 越大，key 越不容易撞车。

不过这里有个微妙之处。直接 loop 一个 GDN 或 KDA 时，每个 loop 都维护一块自己的 recurrent memory：loop 1 用自己的 KV 写自己的记忆，loop 2 写另一块，以此类推。上面的理论讲的是在同一块记忆上反复擦写，直接 loop 时写的却是不同的记忆。淳远坦言，这样套用理论“其实并不严谨”。

换个角度看，沿时间的循环（逐 token 更新记忆）和沿深度的循环（逐 loop 更新表示）本可以看成一个整体：把所有 token 和所有 loop 排成一张“token × loop”的网格，逐步展开看是一条数据流；训练时用 teacher forcing（把整段真实文本一次性喂进去、所有位置并行计算），就相当于一次算出整张网格。直接 loop 时，这两个维度各走各的，并没有被联合设计过。淳远觉得这里或许有不错的 co-design 空间，这也引出了下一节的新方法。

## 三、新进展：Historical KV Replay

这一节是团队最近的工作，还没有写进已公开的论文版本；淳远表示之后可能会更新论文。

### 做法：写新记忆时，把旧 KV 再写一遍

以某一个 token 为例，它往上依次经过 loop 1、2、3、4。普通做法里，每个 loop 只用本 loop 算出的 KV 写自己的记忆，loop 之间的 KV 互不相干。Replay 的做法是：在第 k 个 loop 写记忆时，把之前 loop 的 KV 也拿过来再写一遍。比如 loop 2 会把 loop 1 的 KV 带过来重写一次；loop 3 会重写 loop 2 和 loop 1 的 KV，依此类推。这样就形成了沿深度循环与沿时间循环的一种联合设计。

淳远打了个比方：先读第一本书，再读第二本；读完第二本，回头翻翻第一本，因为怕自己忘了；读完第三本，再回顾第二本和第一本。

从上一节的角度看，replay 让第 k 个 loop 的记忆在同一个 token 位置上，接收来自多个 loop 的 key 的擦写，也就是“同一块记忆多写几次”：每一步更新从秩 1 变为秩不超过 k。replay 不引入新参数，记忆大小也不变。按 PPT 中的公式，遗忘门的衰减每个 token 只施加一次，每次写入则使用对应 loop 的写入强度 β。

&#91;image: 淳远 PPT 第 7 页\]

*图：格子里的数字 j 表示该 token 在 loop j 算出的 KV；第 k 个 loop 先写本 loop 的 KV，最后写 loop 1 的 KV。*

### 顺序非常关键：要倒序

**要倒序回放（4→3→2→1），不要正序（1→2→3→4）**。以第 4 个 loop 为例，就是先写本 loop 的 KV，再依次写 loop 3、2、1 的 KV。用读书的比方说，刚读完一本新书，不要从第一本开始从头再读，而是先学新的，再往回复习旧的。

实验上，正序几乎没有收益；倒序则让召回能力大幅提升，预训练的语言建模也有很大收益。PPT 中的对照（1.3B 模型，loop 4 次）很能说明问题：两种顺序写入的 KV 和写入次数完全相同，只是先后不同；在 2k 长度的召回测试上，不做 replay 的 looped GDN 得分 34.58，正序 34.71，倒序 41.10；8 项零样本任务的平均分依次为 58.39、58.45 和 61.10。淳远特别提到，提升在接近真实场景的召回任务上尤其明显，比如“大海捞针”这类任务。他还给了一个理解角度：loop 越多，replay 沿深度累积的表示就越多，有点像一种沿深度展开的 latent CoT（隐式思维链）。

> **注**：淳远在 PPT 中给出的解释是“后写者胜出”（the last write wins）：每次写入都会沿自己的 key 方向擦掉一部分旧内容，因此最后写入的那一对 KV 被覆盖得最少。正序时最后写入的是本 loop 的 KV，记忆的终态与不做 replay 时相差无几；倒序时最后写入的是 loop 1 的 KV，它在每个 loop 的记忆里都保留得最完整。推理时的干预实验也印证了这一点：对一个用 Full Replay 训练好的 1.3B 模型，只改变推理时的回放方式，改成正序会让 2k 召回下降 7.7 分，去掉 loop 1 那一对下降 8.5 分，而去掉上一个 loop 那一对只下降 0.8 分。可见模型主要依赖的是最后写入的 loop 1 的 KV。

### 成本：二次增长，但 loop 次数很少

自然会有人问：replay 贵不贵？每回放一次，就要多做一次 delta rule 擦写。loop n 次时，总写入次数是 1 + 2 + … + n = n(n+1)/2，随 loop 次数二次增长。好在现在大家 loop 的次数都不多，“不会 loop 一万次”，基本控制在两三次；在这个范围内，成本并没有增加特别多。

工程上还有一个小技巧：replay 在深度方向上形成了一组小的 KV，不必依次做好几轮读写，而是可以把它们拼成一个小矩阵，在深度维度上做 chunkwise 计算（平时 chunkwise 是沿序列长度切块，这里是沿深度）。这样就能复用现有的 GDN kernel，把 decoding 的成本压下来。按 PPT 的说明，decoding 时每个 loop 仍然只读写一次状态，多出来的是计算，而不是对状态的读写。

淳远展示的开销对比是：与同样基于线性注意力、但不做 replay 的 looped 模型相比，Full Replay 因为要额外回放、多做写入，训练吞吐会下降，decoding 也会慢一点点，但推理整体还可以接受。具体数字是（0.6B 模型，单张 H100）：4k 长度下的训练吞吐从每秒 41.2k token 降到 34.6k（降幅约 16%），32k 上下文下的解码速度从每秒 19.4 个 token 降到 18.4 个（降幅约 5%）。这里的“慢”是 replay 相对于普通 loop 的额外开销；与 full attention 的 looped 模型相比，线性注意力在长上下文下依然省得多。

### 更省的变体：First-loop Replay

不回放全部历史，只回放第一个 loop 的 KV：每个 loop 不再写入本 loop 的 KV，而是都写入 loop 1 的 KV，每个 token 的写入次数因此与普通 loop 相同。这有点像 YOCO \[5\] 的思路，即让早期深度为后面的深度提供 KV。

> **注**：YOCO（You Only Cache Once）是一种 decoder-decoder 架构：前半部分网络只生成一份全局 KV cache，后半部分各层通过 cross-attention 共用这一份，从而大幅减少 KV cache。

一个关键细节是：只复用之前 loop 的 KV，不复用它们的衰减系数（α）、写入强度（β）和 query，每个 loop 仍然使用自己的 α、β 和 query。如果连 α、β 也复用，效果会很差。淳远说这有一点“混合”的感觉：既用一部分历史信息，又保留每个 loop 自己的信息。这是他们找到的一个比较好的平衡点：训练和 decoding 基本都不掉速，又能吃到一部分 replay 的收益。PPT 中的数字是：训练吞吐只降约 1%，解码反而快约 4%，平均分的提升约为 Full Replay 的 70%（0.6B 模型上分别为 +1.94 和 +2.78）。

消融实验里，他们比较了正序、倒序、只回放第一个 loop，以及几种不同的组合顺序。以 Full Replay 带来的提升为 100%（0.6B 模型），正序只拿到 2%，“本 loop + 上一个 loop”拿到 16%，“本 loop + loop 1”拿到 84%，First-loop Replay 拿到 70%。可见关键在于保留 loop 1 的 KV，并让它最后写入。从这组消融看，比较推荐的做法是：保留第一个 loop 的 KV，同时让后面每个 loop 使用自己的写入强度和衰减，以较低的成本吃到收益。不过团队最近讨论后也觉得，First-loop Replay 有时不够稳定。淳远在分享中更推荐的是 Full Replay：虽然要多付一点代价，但效果确实更好。

### 收益不只来自“多算几遍”

为了排除“replay 只是多花了计算量”这种解释，他们把 replay 和其他增加计算量的方式做了对比：loop 更多次（如 6 次）、把 GDN 做宽，以及在整模型 loop 的同时，在层内叠加上一节说的 DeltaProduct 式重复擦写。这些方法都有收益，计算量越大收益也越大，但带来的提升可能都不如 replay。从 PPT 的对比图看（0.6B 模型），这些做法只把平均分从 55.7 提高到 56 至 57 之间，训练和解码速度也都不如 First-loop Replay；First-loop Replay 和 Full Replay 则分别达到 57.7 和 58.5。淳远据此认为，replay 的收益不能简单用计算量来解释；另外一些方法有时还会遇到 system 层面的问题，效率也没那么高。

最后，淳远补充，这里展示的是纯线性注意力的设置；更贴近实际的是 hybrid 设置，replay 在 hybrid 模型上同样可以用，效果也比较好：PPT 显示，在 0.6B 的 Full+GDN 与 GDN+DSA 两种 hybrid 上，Full Replay 分别让平均分提高 1.4 和 2.0，让 2k 召回提高 3.1 和 4.3。在他看来，做 loop 与线性注意力的组合，永远是在速度和效果之间做权衡：在 looped Transformer 原本的位置上，可以比较自由地换成 loop 的 GDN，拿到一个不错的速度与效果的折中。

## 四、论文中的其他发现

除了 replay，淳远也挑了几点已公开论文 \[1\] 中值得分享的内容。论文本身尝试了线性注意力、稀疏注意力、SWA 等多种组合的 hybrid，并做了比较详尽的消融实验。

> **注**：LT2 研究了线性注意力（LT2-linear）和稀疏注意力（LT2-sparse）两种 loop 版本：loop 对前者的作用是反复精炼记忆，对后者是扩大有效感受野。感受野（receptive field）指一个位置的输出能受到多大范围输入的影响，放在语言模型里，就是一个 token 最远能利用多早之前的信息。以滑动窗口注意力为例：每一轮里，每个 token 只看最近的 w 个 token；到了下一轮 loop，这 w 个 token 已在上一轮吸收了各自窗口内的信息，更早的内容便能经由它们间接传过来。于是每多 loop 一轮，覆盖范围就向前延伸一个窗口，loop n 次后约为 n·w 个 token，与堆叠 n 层滑动窗口注意力的覆盖范围相同。“有效”指的正是这种经由中间 token 接力得到的间接覆盖。论文还提出两种 hybrid：GDN 与稀疏注意力 DSA 组合的版本做到全程线性时间，质量与标准 looped Transformer 相当；GDN 与少量 full attention 层组合的版本，则超过了标准 looped baseline。

### Loop 级别的 hybrid

做 hybrid 时，大家最容易想到的是在深度上混搭，比如每 3 层线性注意力配 1 层 full attention。有了 loop，还可以在 loop 之间混搭，即跨 loop 的 hybrid：比如第一个 loop 全用 full attention，第二个 loop 换成 SWA。

之所以可以这样做，是因为 loop 共享的只是参数，淳远称之为 slow weight；参数以外的东西都可以在 loop 之间切换。Attention mask 就是一种典型的 fast weight；如果做整模型 loop，甚至每个 loop 的 loss function 都可以不同。这样就多出一个新的设计空间：除了深度级别的 hybrid，还有 loop 级别的 hybrid。

团队比较了两种逐 loop 调整注意力窗口大小的方案，结果有些出人意料：

- **窗口逐 loop 缩小**（像 CNN 那样，例如 full attention → 512 → 256 → 128）：loss 更低（困惑度 9.26），下游任务的表现却上不去（平均分 60.71）。
- **窗口逐 loop 放大**（例如 128 → 256 → 512 → full attention）：loss 略差一些（困惑度 9.42），下游表现反而略高一点（平均分 62.47）。

作为参照，常规的深度级 hybrid（每个 loop 内都穿插 full attention）困惑度为 9.30、平均分为 61.51。通常 loss 越低，下游表现也越好，这组结果却正好相反。

### 随机采样 attention pattern

如果把深度和 loop 两个维度上的每个位置都看作一个“槽位”，每个槽位使用 full attention 还是高效 attention 都可以单独选择。一种更激进的做法是在训练时随机采样每个槽位的 attention 类型：full attention 与高效 attention 的总比例保持不变，但位置随机变化；推理时再对多种采样结果做 majority voting（多数投票）。

该方法确实带来了一定提升，但代价过高：推理时要对多种采样配置分别运行再投票，计算量随采样数成倍增加（PPT 中采样 5 次、计算量为 5 倍，平均分只从 61.51 提高到 61.75）。淳远认为它难以投入实际使用，这组实验只是一次探索性的尝试。

## 五、从 Ouro 蒸馏：不必从头训练

分享的最后一部分是蒸馏：把 Ouro \[6\] 这样的 full attention looped 模型转换成线性注意力的 hybrid 模型，而不必从头训练。Ouro 是一个开源的整模型 loop 语言模型系列，本系列第二篇会详细介绍。淳远提到，换成稀疏注意力比较容易，换成线性注意力则肯定要掉点；因为这项工作更偏线性注意力，他们还是做了尝试。

> **注**：据 LT2 论文，他们用这种方式得到的 Ouro-hybrid-1.4B（PPT 中称 Ouro-LT2-1.4B）只训练了约 1B token，表现就超过了业界的 1B 级模型，并能与 4B 级模型竞争。按 PPT 的介绍，教师是 24 层全部为 full attention、loop 4 次的 Ouro-1.4B；学生只保留其中 6 层 full attention，其余 18 层换成带 replay 的 GDN。训练分三个阶段：先对齐各层隐状态并挑出要保留的 6 层（100M token，长度 512），再逐 loop 做 logit 蒸馏（600M token，长度 4k），最后用 OpenThoughts-v3 做 32k 长上下文训练（600M token）。最终学生在 6 项任务上的平均性能达到教师的约 95.5%。各环节的贡献也很清楚：不加 replay 时，6 层 full attention 按固定间隔均匀穿插只能保留 65.3%，用此前最好的选层方法可达 86.9%，用他们的方法可达 92.9%；再加上 Full Replay，升至 95.5%。

淳远分享了三个关键点。

**第一，蒸馏数据很关键，不同数据对应不同的下游能力**。用什么数据蒸馏，往往就对应提升什么样的 benchmark：用预训练数据，对应的是常识类 benchmark；用偏开源的推理类数据，可能就能对上 GSM8K、AIME 这类数学推理 benchmark。至于 MMLU，他们暂时没找到能对上的数据，“可能是我们实验做得没有那么充分，但可能确实 MMLU 还是比较难”。

**第二，选哪些层保留 full attention 很关键**。这一点来自此前的工作 \[7\]：蒸馏成 hybrid 时，不能按固定比例平均地穿插线性注意力层，而要先评估各层的重要性，再决定哪些层保留 full attention（该工作用一段在通用文本上的短训练来估计每层的重要性），这一步能大幅提升蒸馏效果。据淳远介绍，一般会发现前中部的层还是要保留 full attention，其他位置可以替换。

**第三，loop 特有的技巧：深度与长度的双重 curriculum**。Curriculum 指由易到难地安排训练。长上下文训练通常从短到长逐步加长；loop 上也可以从浅到深，先让第一个 loop 蒸馏得很像，再让第二个 loop 很像。他们比较推荐的做法是两边同步推进：loop 1 配短上下文，loop 2 配更长的上下文。在他们的方法里，这样做效果比较好。

## 六、未来方向

如果做 depth recurrent（沿深度循环）的模型，淳远认为有三个方向值得关注：

- **外推比魔改架构更重要**。在他看来，继续魔改架构没那么关键，真正关键的是外推。没有外推，就得很努力地去论证 weight sharing 这一性质的价值。他在后面圆桌讨论中解释道：loop 只有深度和 weight sharing 两个性质，如果没有外推，又要和同等深度的模型比，就只剩下 weight sharing 了（本系列第三篇会讲到）。反过来，有了外推，weight sharing 就有了标准 Transformer 给不了的价值：训练时只 loop 几次，推理时遇到难题再多 loop 几次，用更多计算换更好的结果，既不增加参数，也不用输出更长的思维链。奔皓在圆桌中也说，test-time scaling 真正的含义就是这种外推（本系列第二篇会讲到）。
- **ACT 实现难度很大**。他不确定这一问题能否解决，难点主要在 infra 层面：不同 token 的 loop 次数各不相同，批处理和训练系统都很难设计。尽管如此，他仍将 ACT 列为值得关注的方向。
- **多关注 post-training**。不只是 SFT 和 RL，尤其是 on-policy distillation \[8\] 与 loop 的结合，可能会有比较好的效果。

> **注**：on-policy distillation 指让学生模型在自己生成的序列上接受教师模型的逐 token 指导，而不是只学习教师预先写好的文本。这样学生在训练时就会见到并纠正自己真正会犯的错误，代表工作如 \[8\]。

关于外推和 ACT，圆桌下半场有更充分的讨论，见本系列第三篇。

## 结语与下篇预告

主持人华文越在 Q&A 前评价说，这项工作像是从线性注意力的一些发现出发，发现把 loop 加上去是一个很自然的组合。回头看淳远的分享，思路是一条线：loop 带来的 KV cache 成本，用线性注意力来化解；再通过 replay 这类时间与深度的联合设计，让线性注意力的召回短板也得到明显改善。

下一篇圆桌上半场：大模型架构的瓶颈在哪里？loop 的收益到底来自架构，还是只是多花了算力？looped 模型要不要学成不动点？

## 参考文献

&#91;1\] [LT2: Linear-Time Looped Transformers](https://arxiv.org/abs/2605.20670). arXiv:2605.20670, 2026. 代码：github.com/chili-lab/LT2

&#91;2\] [Gated Delta Networks: Improving Mamba2 with Delta Rule](https://arxiv.org/abs/2412.06464) (GDN). ICLR 2025, arXiv:2412.06464.

&#91;3\] [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692) (KDA). arXiv:2510.26692, 2025.

&#91;4\] [DeltaProduct: Improving State-Tracking in Linear RNNs via Householder Products](https://arxiv.org/abs/2502.10297). NeurIPS 2025, arXiv:2502.10297.

&#91;5\] [You Only Cache Once: Decoder-Decoder Architectures for Language Models](https://arxiv.org/abs/2405.05254) (YOCO). NeurIPS 2024, arXiv:2405.05254.

&#91;6\] [Scaling Latent Reasoning via Looped Language Models](https://arxiv.org/abs/2510.25741) (Ouro). arXiv:2510.25741, 2025.

&#91;7\] [Distilling to Hybrid Attention Models via KL-Guided Layer Selection](https://arxiv.org/abs/2512.20569). ICLR 2026, arXiv:2512.20569.

&#91;8\] [On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649). ICLR 2024, arXiv:2306.13649.

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
