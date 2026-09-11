import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectField from '../SelectField';

describe('SelectField', () => {
  const options = (
    <>
      <option value="">Pick one</option>
      <option value="a">Alpha</option>
      <option value="b">Beta</option>
    </>
  );

  it('renders label wired to the select', () => {
    render(<SelectField label="Role">{options}</SelectField>);
    const select = screen.getByLabelText('Role');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  it('renders without error state by default', () => {
    render(<SelectField label="Role">{options}</SelectField>);
    const select = screen.getByLabelText('Role');
    expect(select).not.toHaveAttribute('aria-invalid');
    const errorId = select.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('');
  });

  it('renders error state when error prop is set', () => {
    render(
      <SelectField label="Role" error="Required">
        {options}
      </SelectField>,
    );
    const select = screen.getByLabelText('Role');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    const errorId = select.getAttribute('aria-describedby')!;
    expect(document.getElementById(errorId)).toHaveTextContent('Required');
  });

  it('forwards disabled prop', () => {
    render(
      <SelectField label="Role" disabled>
        {options}
      </SelectField>,
    );
    expect(screen.getByLabelText('Role')).toBeDisabled();
  });

  it('forwards name prop', () => {
    render(
      <SelectField label="Role" name="role">
        {options}
      </SelectField>,
    );
    expect(screen.getByLabelText('Role')).toHaveAttribute('name', 'role');
  });
});
