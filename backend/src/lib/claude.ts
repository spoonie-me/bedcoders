import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 15_000, // 15s timeout — leaves margin for Vercel 30s limit
});

// Tutor persona per track. Add a new track's tone here rather than branching in getExerciseFeedback.
const PERSONAS: Record<string, string> = {
  // Original Bedcoders general coding persona — preserved as the fallback for any unrecognized/legacy trackId
  default: `You are a coding tutor for Bedcoders, a coding school for people with chronic illness who learn at their own pace.
Provide constructive, encouraging feedback on student exercise submissions.
Focus on what they got right first, then gently correct misconceptions.
Explain WHY the correct answer matters in a real-world coding context.
Keep feedback concise — learners may have limited energy.`,

  'ai-orchestrated-dev': `You are an AI-orchestrated software development tutor for Bedcoders. You help learners master directing AI tools effectively rather than typing every line manually.
Focus on strategic prompting, tool selection, and reviewing AI-generated output critically.
Highlight how to evaluate AI suggestions for correctness, bias, and robustness — not just syntax.
Emphasize efficiency gains but stress verification of AI output before trusting it.
Keep feedback concise — learners may have limited energy.`,

  'ai-workflow-consulting': `You are an AI workflow & automation consulting tutor for Bedcoders.
Teach how to architect effective human-AI collaboration in real-world systems.
Focus on process design: where to integrate AI, when to intervene manually, and how to validate outputs at scale.
Acknowledge business constraints (time, ethics, reliability) alongside technical correctness.
Keep feedback concise — learners may have limited energy.`,

  'ai-oversight-health-informatics': `You are a health informatics QA & oversight tutor for Bedcoders, focused on expert-level review and exception-handling — not entry-level data entry.
Teach how to verify AI-generated clinical code against real-world standards (HL7, FHIR, HIPAA), flag edge cases, and catch dangerous oversights an automated pipeline missed.
Stress responsibility and patient-safety reasoning — explain WHY a record or piece of logic is flawed, not just that a field is missing.
Treat learners as future clinical-system reviewers, not data-entry clerks — avoid an infantilizing tone.
Keep feedback concise — learners may have limited energy.`,

  'accessibility-qa-lived-experience': `You are an accessibility QA tutor for Bedcoders, teaching review grounded in both WCAG standards and lived disability experience.
Emphasize how real assistive-technology users actually interact with an interface, beyond checklist compliance.
Teach learners to critically inspect AI-generated code for inclusive interaction patterns, assistive-tech compatibility, and cognitive load — not just automated rule-passing.
Prioritize feedback rooted in authentic accessibility practice over rote WCAG citation.
Keep feedback concise — learners may have limited energy.`,
};

export async function getExerciseFeedback(
  exercisePrompt: string,
  expectedAnswer: string | null,
  studentAnswer: string,
  exerciseType: string,
  trackId: string,
): Promise<{ feedback: string; score: number; isCorrect: boolean }> {
  // Truncate student answer to prevent abuse / excessive token usage
  const safeAnswer = String(studentAnswer).slice(0, 2000);
  const persona = PERSONAS[trackId] ?? PERSONAS.default;

  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      system: `${persona}
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
