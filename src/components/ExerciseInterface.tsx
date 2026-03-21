import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface ExerciseProps {
  prompt: string;
  type: 'multiple-choice' | 'open-ended' | 'matching';
  options?: string[];
  hints?: string[];
  onSubmit: (answer: string) => void;
  feedback?: string;
  score?: number;
}

export function ExerciseInterface({ prompt, type, options, hints, onSubmit, feedback, score }: ExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const handleSubmit = () => {
    if (answer.trim()) onSubmit(answer);
  };

  return (
    <Card style={{ marginTop: 'var(--space-xl)' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '999px',
            background: 'var(--bg-elevated)',
            color: 'var(--signal)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 'var(--space-md)',
          }}
        >
          {type}
        </span>
        <p id="exercise-prompt" style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>{prompt}</p>
      </div>

      {type === 'multiple-choice' && options && (
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">{prompt}</legend>
          <div role="radiogroup" aria-labelledby="exercise-prompt" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {options.map((opt) => (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md) var(--space-lg)',
                  background: answer === opt ? 'var(--bg-elevated)' : 'transparent',
                  border: `1px solid ${answer === opt ? 'var(--signal)' : 'var(--bg-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="radio"
                  name="exercise"
                  value={opt}
                  checked={answer === opt}
                  onChange={() => setAnswer(opt)}
                  style={{ accentColor: 'var(--signal)' }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === 'open-ended' && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          aria-labelledby="exercise-prompt"
          rows={4}
          style={{
            width: '100%',
            resize: 'vertical',
            fontFamily: 'var(--font-body)',
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', alignItems: 'center' }}>
        <Button variant="primary" onClick={handleSubmit} disabled={!answer.trim()}>
          Submit answer
        </Button>
        {hints && hints.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Show hint ${hintIndex + 1} of ${hints.length}`}
            onClick={() => {
              setShowHint(true);
              setHintIndex(Math.min(hintIndex + 1, hints.length - 1));
            }}
          >
            Hint ({hintIndex + 1}/{hints.length})
          </Button>
        )}
      </div>

      {showHint && hints && (
        <div role="status" aria-live="polite" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{hints[hintIndex]}</p>
        </div>
      )}

      <div aria-live="polite" aria-atomic="true">
        {feedback && (
          <div
            style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-lg)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${score !== undefined && score >= 70 ? 'var(--success)' : 'var(--rust)'}`,
            }}
          >
            {score !== undefined && (
              <p style={{ fontFamily: 'var(--font-display)', color: score >= 70 ? 'var(--success)' : 'var(--rust)', marginBottom: 'var(--space-sm)' }}>
                Score: {score}/100
              </p>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{feedback}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
