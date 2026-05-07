import { useState, useCallback } from 'react';
import { Card } from '@/components/Card';

interface TestCase {
  description: string;
  expected: string;
}

interface CodeQueryConfig {
  language: string;
  starterCode?: string;
  testCases: TestCase[];
}

interface CodeQueryProps {
  exercise: {
    id: string;
    prompt: string;
    config: CodeQueryConfig;
    hints: string[];
  };
  onSubmit: (answer: { code: string; language: string }) => void;
  disabled?: boolean;
}

const PLACEHOLDERS: Record<string, string> = {
  sql: '-- Write your SQL query here\nSELECT ',
  python: '# Write your Python code here\n',
  javascript: '// Write your JavaScript code here\n',
  typescript: '// Write your TypeScript code here\n',
  java: '// Write your Java code here\n',
  csharp: '// Write your C# code here\n',
  go: '// Write your Go code here\npackage main\n',
  rust: '// Write your Rust code here\nfn main() {\n    \n}',
  bash: '#!/bin/bash\n# Write your shell script here\n',
};

export function CodeQuery({ exercise, onSubmit, disabled = false }: CodeQueryProps) {
  const { language = 'text', starterCode, testCases = [] } = exercise.config ?? {};
  const placeholder = PLACEHOLDERS[language.toLowerCase()] ?? `// Write your ${language} code here\n`;
  const [code, setCode] = useState(starterCode ?? '');

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 8);
  const canSubmit = !disabled && code.trim().length > 0;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      // Tab inserts two spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const val = target.value;
        const updated = val.substring(0, start) + '  ' + val.substring(end);
        setCode(updated);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [disabled],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {exercise.prompt}
      </p>

      {/* Language badge */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          padding: 'var(--space-xs) var(--space-sm)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-code)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {language}
      </div>

      {/* Code editor area */}
      <Card
        style={{
          padding: 0,
          overflow: 'hidden',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', minHeight: lineCount * 22 + 32 }}>
          {/* Line numbers gutter */}
          <div
            aria-hidden="true"
            style={{
              padding: 'var(--space-md) var(--space-sm)',
              background: 'var(--bg-elevated)',
              borderRight: '1px solid var(--bg-border)',
              fontFamily: 'var(--font-code)',
              fontSize: '0.8125rem',
              lineHeight: '22px',
              color: 'var(--text-tertiary)',
              textAlign: 'right',
              userSelect: 'none',
              minWidth: 40,
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={`${language} code editor`}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            style={{
              flex: 1,
              padding: 'var(--space-md)',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-code)',
              fontSize: '0.8125rem',
              lineHeight: '22px',
              color: 'var(--text-primary)',
              resize: 'vertical',
              minHeight: lineCount * 22 + 32,
              outline: 'none',
              tabSize: 2,
              whiteSpace: 'pre',
              overflowX: 'auto',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </Card>

      {/* Test cases */}
      {testCases.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            Test Cases
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {testCases.map((tc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {tc.description}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-code)',
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      marginTop: 2,
                    }}
                  >
                    Expected: {tc.expected}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit({ code: code.trim(), language })}
        aria-label="Submit code"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: canSubmit ? 'var(--signal)' : 'var(--bg-border)',
          color: canSubmit ? 'var(--bg-void)' : 'var(--text-tertiary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
