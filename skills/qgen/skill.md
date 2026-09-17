---
name: question-generator
description: Generate trivia questions for a Millionaire-style quiz game, categorized by difficulty (easy, medium, hard). Use when creating or expanding the question bank for the quiz bee game.
---

# Question Generator Skill

## Purpose
Generate trivia questions for a "Who Wants to Be a Millionaire"-style quiz game.
Questions must be factual, varied in topic, and categorized by difficulty.

## Output Format
Each question must follow this exact JSON structure:

{
  "id": <number>,
  "question": "<question text>",
  "choices": ["<choice A>", "<choice B>", "<choice C>", "<choice D>"],
  "correctIndex": <0-3, index of correct answer in choices array>,
  "difficulty": "easy" | "medium" | "hard"
}

## Rules
- Generate a mix of general knowledge, science, history, geography, pop culture, and tech topics.
- Easy questions = common knowledge, obvious answers.
- Medium questions = require some specific knowledge.
- Hard questions = niche, tricky, or require precise recall.
- No duplicate questions.
- Each question must have exactly 4 choices, only 1 correct.
- Keep question text under 20 words when possible.
- Avoid ambiguous or opinion-based questions — only factual, verifiable answers.

## Example Output

{
  "id": 1,
  "question": "What is the largest planet in our solar system?",
  "choices": ["Earth", "Jupiter", "Mars", "Saturn"],
  "correctIndex": 1,
  "difficulty": "easy"
}

## Usage
When asked to generate questions for the quiz game, follow this format strictly.
Generate the requested quantity, distributed across difficulty tiers unless specified otherwise.