import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextAreaField from '../TextAreaField';

describe('TextAreaField', () => {
  it('renders label wired to the textarea', () => {
    render(<TextAreaField label="Bio" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders without error state by default', () => {
    render(<TextAreaField label="Bio" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).not.toHaveAttribute('aria-invalid');
    const errorId = textarea.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('');
  });

  it('renders error state when error prop is set', () => {
    render(<TextAreaField label="Bio" error="Too long" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    const errorId = textarea.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Too long');
  });

  it('forwards placeholder prop', () => {
    render(<TextAreaField label="Bio" placeholder="Tell us about yourself" />);
    expect(screen.getByPlaceholderText('Tell us about yourself')).toBeInTheDocument();
  });

  it('forwards disabled prop', () => {
    render(<TextAreaField label="Bio" disabled />);
    expect(screen.getByLabelText('Bio')).toBeDisabled();
  });

  it('forwards rows prop overriding the default', () => {
    render(<TextAreaField label="Bio" rows={8} />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '8');
  });

  it('calls onValueChange with the textarea value', () => {
    const handleValueChange = jest.fn();
    render(<TextAreaField label="Bio" onValueChange={handleValueChange} />);
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'Hello' } });
    expect(handleValueChange).toHaveBeenCalledWith('Hello');
  });
});
