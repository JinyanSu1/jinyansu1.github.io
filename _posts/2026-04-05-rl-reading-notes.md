---
layout: post
title: "Reading Notes: Key Ideas in Reinforcement Learning"
date: 2026-04-05
categories: [Learning]
tags: [reinforcement learning, notes]
math: true
excerpt: "A collection of key concepts and equations from reinforcement learning that I find myself returning to repeatedly."
---

These are some notes I keep coming back to when working on RL-related projects.

## Bellman Equation

The foundation of value-based RL. The optimal value function satisfies:

$$V^*(s) = \max_a \left[ R(s, a) + \gamma \sum_{s'} P(s' | s, a) V^*(s') \right]$$

And for the Q-function:

$$Q^*(s, a) = R(s, a) + \gamma \sum_{s'} P(s' | s, a) \max_{a'} Q^*(s', a')$$

## Policy Gradient Theorem

For parameterized policies $\pi_\theta$, the gradient of the expected return is:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta} \left[ \nabla_\theta \log \pi_\theta(a|s) \cdot Q^{\pi_\theta}(s, a) \right]$$

This is elegant because we don't need to differentiate through the environment dynamics.

## PPO Clipping

PPO's clipped objective prevents large policy updates:

$$L^{CLIP}(\theta) = \mathbb{E} \left[ \min\left( r_t(\theta) \hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) \hat{A}_t \right) \right]$$

where $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$.

## KL Divergence in RLHF

In RLHF, we typically add a KL penalty to prevent the policy from drifting too far from the reference model:

$$\max_\theta \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta} \left[ r_\phi(x, y) - \beta \cdot D_{KL}(\pi_\theta \| \pi_{ref}) \right]$$

The $\beta$ parameter is crucial — too small and the model degenerates, too large and it barely learns.

These equations form the backbone of modern LLM post-training. Understanding them deeply helps build intuition for why certain training recipes work.
