import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CheckboxField from '../CheckboxField';

describe('CheckboxField', () => {
  it('renders label wired to the checkbox', () => {
    render(<CheckboxField label="Agree to terms" />);
    const checkbox = screen.getByLabelText('Agree to terms');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders without error state by default', () => {
    render(<CheckboxField label="Agree to terms" />);
    const checkbox = screen.getByLabelText('Agree to terms');
    expect(checkbox).not.toHaveAttribute('aria-invalid');
    const errorId = checkbox.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('');
  });

  it('renders error state when error prop is set', () => {
    render(<CheckboxField label="Agree to terms" error="Must accept" />);
    const checkbox = screen.getByLabelText('Agree to terms');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    const errorId = checkbox.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Must accept');
  });

  it('forwards disabled prop', () => {
    render(<CheckboxField label="Agree to terms" disabled />);
    expect(screen.getByLabelText('Agree to terms')).toBeDisabled();
  });

  it('forwards checked prop', () => {
    render(<CheckboxField label="Agree to terms" checked onChange={() => {}} />);
    expect(screen.getByLabelText('Agree to terms')).toBeChecked();
  });

  it('forwards name prop', () => {
    render(<CheckboxField label="Agree to terms" name="terms" />);
    expect(screen.getByLabelText('Agree to terms')).toHaveAttribute('name', 'terms');
  });

  it('calls onValueChange with checked state', () => {
    const handleValueChange = jest.fn();
    render(<CheckboxField label="Agree to terms" onValueChange={handleValueChange} />);
    fireEvent.click(screen.getByLabelText('Agree to terms'));
    expect(handleValueChange).toHaveBeenCalledWith(true);
  });

  it('uses value prop as checked when boolean', () => {
    render(<CheckboxField label="Agree to terms" value={true} onChange={() => {}} />);
    expect(screen.getByLabelText('Agree to terms')).toBeChecked();
  });
});
