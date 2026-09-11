import { render, screen } from '@testing-library/react';
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
});
