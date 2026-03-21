import { useState } from 'react';
import { Card } from '@/components/Card';

interface CaseStudyStep {
  prompt: string;
  type: string;
  options?: string[];
  correctIndex?: number;
  rubric?: string;
}

interface CaseStudyConfig {
  scenario: string;
  steps: CaseStudyStep[];
}

interface CaseStudyProps {
  exercise: {
    id: string;
    prompt: string;
    config: CaseStudyConfig;
    hints: string[];
  };
  onSubmit: (answer: { stepAnswers: any[] }) => void;
  disabled?: boolean;
}

export function CaseStudy({ exercise, onSubmit, disabled = false }: CaseStudyProps) {
  const cfg = exercise.config as any ?? {};
  const scenario = cfg.scenario;
  // Seed data may use 'questions' key instead of 'steps'
  const steps: CaseStudyStep[] = cfg.steps ?? cfg.questions ?? [];
  const [currentStep, setCurrentStep] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<any[]>(() => steps.map(() => null));
  const [showSummary, setShowSummary] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const hasAnswered = stepAnswers[currentStep] !== null;

  const setCurrentAnswer = (value: any) => {
    if (disabled) return;
    setStepAnswers((prev) => {
      const next = [...prev];
      next[currentStep] = value;
      return next;
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      setShowSummary(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleFinalSubmit = () => {
    onSubmit({ stepAnswers });
  };

  if (showSummary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Case Study Summary
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {steps.map((s, i) => (
            <Card
              key={i}
              style={{
                padding: 'var(--space-md)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Step {i + 1} of {steps.length}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                {s.prompt}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  padding: 'var(--space-sm)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {s.type === 'MULTIPLE_CHOICE' && s.options
                  ? s.options[stepAnswers[i]] ?? 'No answer'
                  : stepAnswers[i] ?? 'No answer'}
              </div>
            </Card>
          ))}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={handleFinalSubmit}
          aria-label="Submit case study"
          style={{
            alignSelf: 'flex-start',
            padding: 'var(--space-md) var(--space-xl)',
            background: disabled ? 'var(--bg-border)' : 'var(--signal)',
            color: disabled ? 'var(--text-tertiary)' : 'var(--bg-void)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            letterSpacing: '0.02em',
          }}
        >
          Submit All
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Scenario */}
      <Card
        style={{
          padding: 'var(--space-lg)',
          borderLeft: '3px solid var(--gold)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--gold)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Scenario
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {scenario}
        </p>
      </Card>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                i < currentStep
                  ? 'var(--success)'
                  : i === currentStep
                    ? 'var(--signal)'
                    : 'var(--bg-border)',
              transition: 'background var(--transition-fast)',
            }}
            aria-hidden="true"
          />
        ))}
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginLeft: 'var(--space-sm)',
            whiteSpace: 'nowrap',
          }}
        >
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      {/* Current step */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-md)',
          }}
        >
          {step.prompt}
        </p>

        {/* Sub-exercise: multiple choice */}
        {step.type === 'MULTIPLE_CHOICE' && step.options && (
          <div
            role="radiogroup"
            aria-label={`Step ${currentStep + 1} options`}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
          >
            {step.options.map((opt, i) => {
              const isSelected = stepAnswers[currentStep] === i;
              return (
                <Card
                  key={i}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={opt}
                  tabIndex={disabled ? -1 : 0}
                  onClick={() => setCurrentAnswer(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentAnswer(i);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    borderColor: isSelected ? 'var(--signal)' : 'var(--bg-border)',
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--signal)' : 'var(--bg-border)'}`,
                      background: isSelected ? 'var(--signal)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {opt}
                  </span>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sub-exercise: open-ended */}
        {step.type === 'OPEN_ENDED' && (
          <textarea
            value={stepAnswers[currentStep] ?? ''}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Write your answer..."
            aria-label={`Step ${currentStep + 1} answer`}
            rows={4}
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              resize: 'vertical',
              minHeight: 80,
              opacity: disabled ? 0.6 : 1,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={(e) => {
              if (!disabled) e.currentTarget.style.borderColor = 'var(--signal)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--bg-border)';
            }}
          />
        )}
      </div>

      {/* Next / Finish button */}
      <button
        type="button"
        disabled={disabled || !hasAnswered}
        onClick={handleNext}
        aria-label={isLastStep ? 'Review answers' : 'Next step'}
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled || !hasAnswered ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled || !hasAnswered ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled || !hasAnswered ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        {isLastStep ? 'Review Answers' : 'Next Step'}
      </button>
    </div>
  );
}
