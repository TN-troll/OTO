import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  const defaultProps = {
    title: 'Test Section',
    activeCount: 0,
    onClear: vi.fn(),
    children: <div>Section content</div>,
  };

  it('renders the title', () => {
    render(<CollapsibleSection {...defaultProps} />);
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('starts collapsed by default', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts expanded when defaultExpanded is true', () => {
    render(<CollapsibleSection {...defaultProps} defaultExpanded />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles expanded state on click', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides active filter badge when activeCount is 0', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={0} />);
    expect(screen.queryByLabelText(/active filter/i)).not.toBeInTheDocument();
  });

  it('shows active filter badge with count when activeCount > 0', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={3} />);
    const badge = screen.getByLabelText('3 active filters');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('shows singular label for 1 active filter', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={1} />);
    expect(screen.getByLabelText('1 active filter')).toBeInTheDocument();
  });

  it('does not show clear button when activeCount is 0', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={0} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows clear button when activeCount > 0', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={2} />);
    expect(screen.getByRole('button', { name: /clear test section filters/i })).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<CollapsibleSection {...defaultProps} activeCount={2} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: /clear test section filters/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('has proper aria-controls linking header to content', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    const controlsId = toggle.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId!)).toBeInTheDocument();
  });

  it('renders children inside the collapsible region', () => {
    render(<CollapsibleSection {...defaultProps} defaultExpanded />);
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('applies ease-smooth timing class for content animation', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    const controlsId = toggle.getAttribute('aria-controls')!;
    const content = document.getElementById(controlsId);
    expect(content?.className).toContain('ease-smooth');
  });

  it('applies ease-smooth timing class for chevron rotation', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    const svg = toggle.querySelector('svg');
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain('ease-smooth');
  });

  it('toggle button meets minimum touch target of 44px', () => {
    render(<CollapsibleSection {...defaultProps} />);
    const toggle = screen.getByRole('button', { name: /Test Section/i });
    expect(toggle.className).toContain('min-h-touch');
    expect(toggle.className).toContain('min-w-touch');
  });

  it('clear button meets minimum touch target of 44px', () => {
    render(<CollapsibleSection {...defaultProps} activeCount={2} />);
    const clearBtn = screen.getByRole('button', { name: /clear test section filters/i });
    expect(clearBtn.className).toContain('min-h-touch');
    expect(clearBtn.className).toContain('min-w-touch');
  });
});
