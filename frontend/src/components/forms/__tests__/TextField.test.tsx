import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextField from '../TextField';

describe('TextField', () => {
  it('renders label wired to the input', () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders without error state by default', () => {
    render(<TextField label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    const errorId = input.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('');
  });

  it('renders error state when error prop is set', () => {
    render(<TextField label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorId = input.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Required');
  });

  it('forwards placeholder prop', () => {
    render(<TextField label="Email" placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('forwards disabled prop', () => {
    render(<TextField label="Email" disabled />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('forwards name prop', () => {
    render(<TextField label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });
});
