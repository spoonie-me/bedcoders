import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('exposes ARIA progressbar role with bounds', () => {
    render(<ProgressBar value={42} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
  });

  it('clamps values above 100', () => {
    render(<ProgressBar value={250} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps values below 0', () => {
    render(<ProgressBar value={-30} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('supports a custom aria-label', () => {
    render(<ProgressBar value={10} label="Lesson progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Lesson progress');
  });

  it('hides numeric label by default and shows when requested', () => {
    const { rerender } = render(<ProgressBar value={50} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
    rerender(<ProgressBar value={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
