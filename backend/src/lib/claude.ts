// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 15_000, // 15s timeout — leaves margin for Vercel 30s limit
});

export async function getExerciseFeedback(
  exercisePrompt: string,
  expectedAnswer: string | null,
  studentAnswer: string,
  exerciseType: string,
): Promise<{ feedback: string; score: number; isCorrect: boolean }> {
  // Truncate student answer to prevent abuse / excessive token usage
  const safeAnswer = String(studentAnswer).slice(0, 2000);

  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      system: `You are a coding tutor for Bedcoders, a coding school for people with chronic illness who learn at their own pace.
Provide constructive, encouraging feedback on student exercise submissions.
Focus on what they got right first, then gently correct misconceptions.
Explain WHY the correct answer matters in a real-world coding context.
Keep feedback concise — learners may have limited energy.
Return JSON: { "feedback": "...", "score": 0-100, "isCorrect": true/false }`,
      messages: [
        {
          role: 'user',
          content: `Exercise type: ${exerciseType}
Question: ${exercisePrompt}
${expectedAnswer ? `Expected answer: ${expectedAnswer}` : ''}
Student's answer: ${safeAnswer}

Evaluate this submission and return JSON with feedback, score (0-100), and isCorrect.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // fallback below
    }

    return {
      feedback: text,
      score: 50,
      isCorrect: false,
    };
  } catch (err) {
    console.error('Claude API error:', err);
    return {
      feedback: 'AI feedback is temporarily unavailable. Your answer has been recorded for manual review.',
      score: 0,
      isCorrect: false,
    };
  }
}
