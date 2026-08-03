/**
 * Strips answer-revealing fields from an exercise `config` before it's sent
 * to the client. Must be applied everywhere exercise config leaves the
 * server — lessons.ts, assessments.ts, and exams.ts all embed exercise
 * config in their responses.
 *
 * Found and fixed 2026-08-04: the real seed-data shape for MULTIPLE_CHOICE
 * is `options: [{text, correct: boolean}]`, and that `correct` flag was
 * never being stripped — the correct answer to every multiple-choice
 * exercise and exam question was visible in the API response to anyone
 * inspecting network traffic. This also underlay a separate scoring bug
 * (see exercises.ts's scoreExercise and exams.ts's scoreAnswer): scoring
 * code was reading `config.correctIndex`, a field that doesn't exist on
 * any real exercise, so submissions were being derived/graded from
 * `options[].correct` after the fact — meaning that field being visible
 * client-side was a real answer leak, not a display-only concern.
 */
export function sanitizeExerciseConfig(config: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...config };
  delete cleaned.correctIndex;
  delete cleaned.correctAnswer;
  delete cleaned.correctPairs;
  delete cleaned.correctOrder;
  delete cleaned.acceptableAnswers;
  delete cleaned.correctCategories;
  delete cleaned.correctId;

  if (Array.isArray(cleaned.options)) {
    cleaned.options = (cleaned.options as Array<unknown>).map((o) => {
      if (o && typeof o === 'object' && 'correct' in (o as Record<string, unknown>)) {
        const { correct: _correct, ...rest } = o as Record<string, unknown>;
        return rest;
      }
      return o;
    });
  }
  return cleaned;
}
