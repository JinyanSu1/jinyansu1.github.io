---
layout: post
title: "Adaptive Rewards for Efficient Reasoning"
date: 2026-04-01
categories: [Research]
tags: [alignment, reasoning]
math: true
excerpt: "How can we balance accuracy and efficiency in LLM reasoning? Our recent work on adaptive rewards tackles the overthinking problem."
---

Large language models with chain-of-thought reasoning have demonstrated impressive problem-solving abilities. However, a critical challenge remains: **how do we prevent models from overthinking simple problems while ensuring they think deeply enough about hard ones?**

## The Overthinking Problem

Consider a simple math problem: *What is 2 + 3?* A reasoning model might generate hundreds of tokens exploring different approaches, when the answer is trivially 5. This wastes compute and increases latency.

Formally, let $r(y, y^*)$ be the correctness reward and $c(y)$ be the length cost. We want to optimize:

$$\max_\theta \mathbb{E}_{x \sim \mathcal{D}} \left[ r(y_\theta(x), y^*) - \lambda \cdot c(y_\theta(x)) \right]$$

where $\lambda$ controls the accuracy-efficiency trade-off.

## Adaptive Rewards

Our key insight is that the penalty $\lambda$ should not be fixed — it should adapt based on problem difficulty. For easy problems, we want a high penalty (think fast). For hard problems, we want a low penalty (think carefully).

We define difficulty as:

$$d(x) = 1 - \mathbb{E}_\theta[r(y_\theta(x), y^*)]$$

And set:

$$\lambda(x) = \lambda_0 \cdot (1 - d(x))$$

## Results

This simple approach reduces average reasoning length by **40%** while maintaining accuracy on benchmarks like GSM8K and MATH.

```python
def adaptive_reward(response, gold, difficulty):
    correctness = compute_correctness(response, gold)
    length_cost = len(response.tokens) / MAX_LENGTH
    lambda_val = LAMBDA_0 * (1 - difficulty)
    return correctness - lambda_val * length_cost
```

The key takeaway: **not all problems deserve equal thinking time**, and teaching models this distinction is both simple and effective.
