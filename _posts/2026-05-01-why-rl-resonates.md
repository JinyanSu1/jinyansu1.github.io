---
layout: post
title: "Why RL Resonates With Me / 为什么我会想做 RL"
date: 2026-05-01
categories: personal
tags: [reflection, rl, life, research]
excerpt: "Late at night, half asleep, I suddenly realized how to solve an interview problem I had failed the day before. I had not had this kind of Eureka moment for a long time. Reflections on research, learning, exams, and why RL feels like an abstraction of life."
---

<div class="lang-switcher">
  <button type="button" class="lang-btn active" data-lang="en">English</button>
  <button type="button" class="lang-btn" data-lang="zh">中文</button>
</div>

<div class="lang-content lang-en" lang="en" markdown="1">

<p><em>(Purely human written, then translated by ChatGPT.)</em></p>

I have always had some difficulties with communication and expression. There are many things in my mind that I cannot quite put into words, which is why I have always resisted writing. Whenever I write, the result often feels messy, scattered, and lacking in logic. But perhaps this is not entirely my fault. Human language itself was designed for the majority, and not everyone is neurotypical. Even if my writing is chaotic, even if many things remain inexpressible, some words will eventually click with some people.

Late at night, half asleep and half awake, I suddenly realized how to solve a problem I had failed during an interview the day before. I had not had this kind of Eureka moment for a long time. When I was an undergraduate, this used to happen often: after an exam, at some completely unexpected moment, I would suddenly understand how to solve a problem I had missed, and I would feel an immense sense of joy. But later, as I entered research and began my PhD, the objectives and rewards became increasingly vague. Little by little, the joy that learning once brought me disappeared. For the past four or five years, I have hardly had the time to sit down and learn quietly. I also forgot how to design rewards and do optimization for myself.

Compared with research, exams in school had a much clearer and more immediate reward structure. In order for most students to achieve reasonably good grades, the evaluation set was often not too different from the training set. I did not even need RL. Simple SFT on ground-truth answers was already enough for me to get a good score.

Research, however, is much trickier. First, I do not know what the reward function is. I can only design a proxy reward using heuristics, optimize it, and then gradually adjust the reward function itself. This creates two problems. The first is reward hacking: I may achieve good-looking metrics, while the actual performance in the real world remains poor. Yet I cannot simply avoid optimizing the reward. Optimization is almost an instinct of human beings. Every problem can be turned into an optimization problem; the only differences are the objective and the constraints. The second problem is that the true reward I receive is extremely noisy, so I do not know whether the reward function I defined is actually a good one.

Recently, while preparing for interviews, I developed some new intuitions about the training pipeline of LLMs. Since I had not taken exams for years, I had forgotten many of the fundamentals, or only retained a vague impression of them. So when I tried to solve problems directly and realized that I could not do them at all, I felt extremely frustrated. Even after spending a lot of time, I still could not solve them. This felt like doing RLVR directly on a very weak base model.

At that point, SFT became necessary. I needed to first look at the correct answers, review the relevant knowledge, and memorize or imitate the right solutions. However, merely looking at the correct answers was not enough to help me achieve a high score. In particular, because my time was limited, my number of SFT steps was also limited. I did not even overfit; I could not even memorize the correct answers.

Then came RL: putting the answers away and trying to write code and solve the problems by myself. Only then did I discover many problems that never appeared when I was simply "copying from the answer." This is very similar to LLM training. With SFT alone, we only learn how to predict the next token given the correct previous tokens. But if we need to solve the problem from scratch, there are far too many possible trajectories, and far too many places where things can go wrong. During inference, when there is no correct answer to refer to at every step, even a small mistake somewhere in the middle can cause the final result to be wrong. But with RL, we are forced to explore different paths. Sometimes we make new discoveries, and through this process, we gradually learn to generalize.

These reflections have given me more passion for the work I am currently doing. To be honest, I have never felt a strong attachment to computer science as a discipline. Compared with discrete things, I have always preferred continuous ones. Although I am pursuing a PhD in CS, what I actually chose was ML and AI. Compared with computers, I am more interested in studying things related to human beings, such as psychology and philosophy. These are things I can "experiment" with directly in life. Although I have never studied them systematically, life itself is the best classroom.

The emergence of LLMs has completely mitigated the gap between "what I want to do" and "what I am doing." As a person, I feel that one eternal mission is to figure out your own life. Curiosity about life is such a beautiful thing. No matter what I do, I hope it is centered around human beings. When I find traces of life in my work, I feel that I am not merely working; I am exploring life itself.

Many things are abstractions of life. Gradient descent, constrained optimization, and RL all reflect life in their own ways. These ideas attract me with a unique kind of beauty.

</div>

<div class="lang-content lang-zh" lang="zh" style="display: none;" markdown="1">

我在沟通和交流上一直有一些问题，脑子里的很多东西没法表达出来，所以我一直很排斥写作，因为自己写出来的东西又乱又没有逻辑。（其实不完全是我的问题，人类的语言本身就是为大多数人设计的，但并不是所有的人都是 neural-typical 的）。即使我写的很混乱，很多东西也没办法表达，或者总会有一些话和一些人 click 到吧。

半夜在睡梦中迷迷糊糊的时候，对于前一天面试时没做对的题，突然一下知道怎么做了。我已经很久没有这种 Eureka moment 了。读本科的时候经常会在考试完后突然在某个不经意的瞬间悟到某些题的解法，然后感到无比的快乐。后来开始了做科研，读博，objective 和 reward 变得越来越模糊，学习曾经给我带来的快乐一点一点的消失了。大约四五年，我都没有时间静下心来学习，也不知道如何设计 reward 以及做 optimization。

比起科研，学生时代那种考试，reward 非常的明晰和及时，并且，为了让大部分同学都有一个相当不错的成绩，eval set 的题和 training set 很多时候变化不大，我甚至都不需要 RL，简单的 SFT on ground truth answer 就已经够我取得一个好的分数了。可是科研则 tricky 多了。首先，我不知道 reward function 是什么，我只能借助一些 heuristic 来设计一个 proxy reward，然后去 optimize，并逐渐调整自己的 reward function。这会出现两个问题：一是 reward hacking，我可能取得了看起来好的 metric，但实际在真实场景中表现不行，但又没法不去 optimize the reward。做优化，是人类天生的 instinct，所有的问题都可以变为优化问题，只是 objective 和 constraint 不同而已。第二个问题是，由于我真实得到的 reward 非常 noisy，我并不知道我定义的 reward function 是否是好的。

最近为了复习面试，对 LLM 的训练的 pipeline 有了一些新的感悟：由于几年没有考试过了，我大部分基础的东西都已经不记得了，或者只有模糊的印象。所以直接上手解题，然后发现自己完全不会的时候，我会觉得非常 frustrated，因为我即使花费很多时间去做，但依然做不出来。这就像直接在一个很差的 base model 上做 RLVR。这时候，SFT 就很必要了，先看一下正确答案，复习一些相关的知识点，记忆或者 imitate 正确答案。然而，只看正确答案并不能让我得到很高的分数，尤其是，我的时间有限（SFT 的 step 有限），我甚至都没 overfit，连正确答案都背不下来。接下来就是 RL：脱离答案，自己尝试着写代码和解题过程，这时就会发现很多之前"对着答案抄写"所没有的问题。这和 LLM 训练很像，仅仅是 SFT，我们只能学会在给定正确的 previous token 时如何预测下一个，但是，如果需要我们从头开始把题做出来，中间可以有的 trajectory 可太多了，可能出错的地方也太多了，在 inference 的时候，也就是没有正确答案可以随时 refer to 的时候，中间某个地方一旦出了一些小错误，最后的结果就错了。但如果做 RL，会不得不去探索不同的路径，有时候会有一些新的发现，在这个过程中逐渐学会泛化。

这些感悟让我对我目前所从事的工作产生了更多的 passion。说实话，我对计算机这个学科没有太多的感觉，比起离散的东西，我更喜欢连续的。虽然我读了 CS 的博士，但我选择的其实是 ML 和 AI。比起计算机，我更喜欢研究和人类相关的东西（比如心理和哲学），这样我就可以直接在生活里"做实验"，虽然我没有系统的学习过这些东西，但对这些东西，生活才是最好的课堂。LLM 的出现彻底 mitigate 了"我想做的事情"和"我正在做的事情"之间的 gap。作为一个人，我觉得，一个永恒的使命是，figure out your own life。对生命的好奇心真的是一个十分美好的东西。无论我做什么，我希望其都是以人为中心，当我在工作中找到生活的影子时，我会觉得，我不是在工作，而是在探索人生。很多东西都是生活的抽象，无论是梯度下降，constrained optimization 还是 RL，这些东西以一种独特的魅力吸引着我。

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
