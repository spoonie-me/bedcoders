import { useState } from 'react';
import { COURSES } from '@/data/examAlignment';

interface CourseModuleProps {
  trackId: string;
}

export function ExamAlignment({ trackId }: CourseModuleProps) {
  const [open, setOpen] = useState(false);

  const courses = COURSES[trackId];
  if (!courses || courses.length === 0) return null;

  return (
    <div style={{ marginTop: 'var(--space-3xl)', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          fontSize: '1rem',
          fontWeight: 600,
        }}
        aria-expanded={open}
      >
        <span style={{ color: 'var(--gold)', fontSize: '1.1rem', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          ▾
        </span>
        Course Curriculum
      </button>

      {open && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          {courses.map((course) => (
            <div key={course.courseId} style={{ marginBottom: 'var(--space-2xl)' }}>
              {/* Course header */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {course.description}
                </p>
              </div>

              {/* Modules */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {course.modules.map((module) => (
                  <div
                    key={module.name}
                    style={{
                      padding: 'var(--space-md)',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--bg-border)',
                    }}
                  >
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gold)', marginBottom: 'var(--space-sm)' }}>
                      {module.name}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                      {module.topics.map((topic) => (
                        <span
                          key={topic}
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--bg-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
