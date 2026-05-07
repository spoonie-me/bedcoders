import { Card } from '@/components/Card';
import { ExerciseFeedback } from './shared/ExerciseFeedback';
import { ExerciseHints } from './shared/ExerciseHints';
import { MultipleChoice } from './MultipleChoice';
import { OpenEnded } from './OpenEnded';
import { Matching } from './Matching';
import { Sequencing } from './Sequencing';
import { FillInBlank } from './FillInBlank';
import { CaseStudy } from './CaseStudy';
import { DiagramLabel } from './DiagramLabel';
import { CodeQuery } from './CodeQuery';
import { TrueFalseJustify } from './TrueFalseJustify';
import { Categorization } from './Categorization';

export type ExerciseType =
  | 'MULTIPLE_CHOICE'
  | 'OPEN_ENDED'
  | 'MATCHING'
  | 'SEQUENCING'
  | 'FILL_IN_BLANK'
  | 'CASE_STUDY'
  | 'DIAGRAM_LABEL'
  | 'CODE_QUERY'
  | 'TRUE_FALSE_JUSTIFY'
  | 'CATEGORIZATION';

export interface ExerciseData {
  id: string;
  ref: string;
  prompt: string;
  type: ExerciseType;
  config: Record<string, any>;
  hints: string[];
  explanation?: string;
  isKnowledgeCheck: boolean;
  xpReward: number;
}

export interface ExerciseRendererProps {
  exercise: ExerciseData;
  onSubmit: (answer: any) => void;
  feedback?: string;
  score?: number;
  disabled?: boolean;
}

const COMPONENTS: Record<
  ExerciseType,
  React.ComponentType<{ exercise: any; onSubmit: (answer: any) => void; disabled?: boolean }>
> = {
  MULTIPLE_CHOICE: MultipleChoice,
  OPEN_ENDED: OpenEnded,
  MATCHING: Matching,
  SEQUENCING: Sequencing,
  FILL_IN_BLANK: FillInBlank,
  CASE_STUDY: CaseStudy,
  DIAGRAM_LABEL: DiagramLabel,
  CODE_QUERY: CodeQuery,
  TRUE_FALSE_JUSTIFY: TrueFalseJustify,
  CATEGORIZATION: Categorization,
};

export function ExerciseRenderer({
  exercise,
  onSubmit,
  feedback,
  score,
  disabled = false,
}: ExerciseRendererProps) {
  const Component = COMPONENTS[exercise.type];

  if (!Component) {
    return (
      <Card
        style={{
          padding: 'var(--space-lg)',
          borderLeft: '3px solid var(--error)',
        }}
      >
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'var(--error)',
            margin: 0,
          }}
        >
          Unknown exercise type:{' '}
          <code style={{ fontFamily: 'var(--font-code)' }}>{exercise.type}</code>
        </p>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 'var(--space-xl)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '0.6875rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
          }}
        >
          {exercise.ref}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {exercise.isKnowledgeCheck && (
            <span
              style={{
                padding: '2px var(--space-sm)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--gold)',
              }}
            >
              Knowledge Check
            </span>
          )}
          <span
            style={{
              padding: '2px var(--space-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-code)',
              fontSize: '0.625rem',
              color: 'var(--text-tertiary)',
            }}
          >
            +{exercise.xpReward} XP
          </span>
        </div>
      </div>

      {/* Exercise component */}
      <Component exercise={exercise} onSubmit={onSubmit} disabled={disabled} />

      {/* Hints — visible before submission */}
      {!disabled && exercise.hints.length > 0 && (
        <ExerciseHints hints={exercise.hints} />
      )}

      {/* Feedback — visible after submission */}
      <ExerciseFeedback
        feedback={feedback}
        score={score}
        explanation={disabled ? exercise.explanation : undefined}
      />
    </Card>
  );
}
