import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires onClick when activated', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has a tap target of at least 44px (WCAG 2.5.5)', () => {
    render(<Button size="sm">Tiny</Button>);
    const btn = screen.getByRole('button');
    expect(btn.style.minHeight).toBe('44px');
  });

  it('applies caller styles last (so caller wins)', () => {
    render(<Button style={{ background: 'red' }}>X</Button>);
    expect(screen.getByRole('button').style.background).toBe('red');
  });
});
