import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from '../Form';
import TextField from '../TextField';
import CheckboxField from '../CheckboxField';

const required = (value: unknown) => (value ? null : 'Required');

describe('Form', () => {
  it('renders children with field objects', () => {
    render(
      <Form initialValues={{ name: '' }} onSubmit={async () => null}>
        {(fields) => <TextField {...fields.name} label="Name" />}
      </Form>,
    );
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('tracks field value on change', () => {
    render(
      <Form initialValues={{ name: '' }} onSubmit={async () => null}>
        {(fields) => <TextField {...fields.name} label="Name" />}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    expect(screen.getByLabelText('Name')).toHaveValue('Alice');
  });

  it('shows error on blur for invalid field', () => {
    render(
      <Form
        initialValues={{ name: '' }}
        validationRules={{ name: required }}
        onSubmit={async () => null}
      >
        {(fields) => <TextField {...fields.name} label="Name" />}
      </Form>,
    );
    fireEvent.blur(screen.getByLabelText('Name'));
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not show error before blur or submit', () => {
    render(
      <Form
        initialValues={{ name: '' }}
        validationRules={{ name: required }}
        onSubmit={async () => null}
      >
        {(fields) => <TextField {...fields.name} label="Name" />}
      </Form>,
    );
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('validates all fields on submit and blocks onSubmit when errors exist', () => {
    const handleSubmit = jest.fn();
    render(
      <Form
        initialValues={{ name: '', email: '' }}
        validationRules={{ name: required, email: required }}
        onSubmit={handleSubmit}
      >
        {(fields) => (
          <>
            <TextField {...fields.name} label="Name" />
            <TextField {...fields.email} label="Email" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.click(screen.getByText('Save'));
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onSubmit with current values when valid', async () => {
    const handleSubmit = jest.fn(async () => null);
    render(
      <Form
        initialValues={{ name: '' }}
        validationRules={{ name: required }}
        onSubmit={handleSubmit}
      >
        {(fields) => (
          <>
            <TextField {...fields.name} label="Name" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Alice' });
    });
  });

  it('resets to initialValues after successful submit', async () => {
    render(
      <Form
        initialValues={{ name: '' }}
        onSubmit={async () => null}
      >
        {(fields) => (
          <>
            <TextField {...fields.name} label="Name" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('');
    });
  });

  it('disables fields during async submit', async () => {
    let resolveSubmit: (v: null) => void;
    const submitPromise = new Promise<null>((r) => { resolveSubmit = r; });

    render(
      <Form initialValues={{ name: '' }} onSubmit={() => submitPromise}>
        {(fields) => (
          <>
            <TextField {...fields.name} label="Name" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeDisabled();
    });

    await act(async () => { resolveSubmit!(null); });
    expect(screen.getByLabelText('Name')).not.toBeDisabled();
  });

  it('sets formError when onSubmit returns a string', async () => {
    render(
      <Form initialValues={{ name: '' }} onSubmit={async () => 'Server error'}>
        {(fields, { formError }) => (
          <>
            <TextField {...fields.name} label="Name" />
            {formError && <p data-testid="custom-error">{formError}</p>}
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      expect(screen.getByTestId('custom-error')).toHaveTextContent('Server error');
    });
  });

  it('clears formError on next submit attempt', async () => {
    let callCount = 0;
    render(
      <Form
        initialValues={{ name: '' }}
        validationRules={{ name: required }}
        onSubmit={async () => { callCount++; return callCount === 1 ? 'Error' : null; }}
      >
        {(fields) => (
          <>
            <TextField {...fields.name} label="Name" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error');
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('handles boolean fields with checked/onChange', () => {
    render(
      <Form initialValues={{ agree: false }} onSubmit={async () => null}>
        {(fields) => <CheckboxField {...fields.agree} label="Agree" />}
      </Form>,
    );
    const checkbox = screen.getByLabelText('Agree');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('onValueChange updates form state', () => {
    let onValueChange: (value: string) => void;
    render(
      <Form initialValues={{ color: '' }} onSubmit={async () => null}>
        {(fields) => {
          onValueChange = fields.color.onValueChange;
          return <input data-testid="proxy" value={fields.color.value} readOnly />;
        }}
      </Form>,
    );
    act(() => { onValueChange!('blue'); });
    expect(screen.getByTestId('proxy')).toHaveValue('blue');
  });

  it('exposes reset in metadata for manual reset', async () => {
    render(
      <Form initialValues={{ name: '' }} onSubmit={async () => 'Error'}>
        {(fields, { reset }) => (
          <>
            <TextField {...fields.name} label="Name" />
            <button type="button" onClick={reset}>Reset</button>
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('passes allValues to validator for cross-field validation', () => {
    const matchPassword = (_value: unknown, all: Record<string, unknown>) =>
      all.password !== all.confirm ? 'Must match' : null;

    render(
      <Form
        initialValues={{ password: '', confirm: '' }}
        validationRules={{ confirm: matchPassword }}
        onSubmit={async () => null}
      >
        {(fields) => (
          <>
            <TextField {...fields.password} label="Password" />
            <TextField {...fields.confirm} label="Confirm" />
            <button type="submit">Save</button>
          </>
        )}
      </Form>,
    );
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Confirm'), { target: { value: 'xyz' } });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByLabelText('Confirm')).toHaveAttribute('aria-invalid', 'true');
  });
});
