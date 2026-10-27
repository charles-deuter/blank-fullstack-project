import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FooForm from '../FooForm';
import type { CreateFooInput } from '@/server-actions/foo';

const NAME_MESSAGE = 'name is required and must be a non-empty string';
const DESCRIPTION_MESSAGE = 'description must be a string of at most 500 characters';
const CATEGORY_MESSAGE =
  'category is required and must be one of general, internal, external';
const PRIORITY_MESSAGE = 'priority is required and must be one of low, medium, high';

const VALID_VALUES: CreateFooInput = {
  name: 'widget',
  description: 'a short note',
  category: 'internal',
  priority: 'high',
  is_active: false,
};

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'widget' } });
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'a short note' },
  });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'internal' } });
  fireEvent.click(screen.getByLabelText('Priority'));
  fireEvent.click(screen.getByRole('option', { name: 'High' }));
  fireEvent.click(screen.getByLabelText('Active'));
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Create foo' }));
}

describe('FooForm', () => {
  it.each([
    ['Name', NAME_MESSAGE],
    ['Category', CATEGORY_MESSAGE],
    ['Priority', PRIORITY_MESSAGE],
  ])('shows the %s message when the empty field is blurred', (label, message) => {
    render(<FooForm onSubmit={jest.fn()} />);
    fireEvent.blur(screen.getByLabelText(label));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the description message when 501 characters are blurred', () => {
    render(<FooForm onSubmit={jest.fn()} />);
    const description = screen.getByLabelText('Description');
    fireEvent.change(description, { target: { value: 'a'.repeat(501) } });
    fireEvent.blur(description);
    expect(screen.getByText(DESCRIPTION_MESSAGE)).toBeInTheDocument();
  });

  it('accepts exactly 500 characters of description', () => {
    render(<FooForm onSubmit={jest.fn()} />);
    const description = screen.getByLabelText('Description');
    fireEvent.change(description, { target: { value: 'a'.repeat(500) } });
    fireEvent.blur(description);
    expect(screen.queryByText(DESCRIPTION_MESSAGE)).not.toBeInTheDocument();
  });

  it('shows every required message on an empty submit and never calls onSubmit', () => {
    const onSubmit = jest.fn();
    render(<FooForm onSubmit={onSubmit} />);
    submit();
    expect(screen.getByText(NAME_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(CATEGORY_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(PRIORITY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(DESCRIPTION_MESSAGE)).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows all four messages on submit when the description is too long', () => {
    const onSubmit = jest.fn();
    render(<FooForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'a'.repeat(501) },
    });
    submit();
    for (const message of [
      NAME_MESSAGE,
      DESCRIPTION_MESSAGE,
      CATEGORY_MESSAGE,
      PRIORITY_MESSAGE,
    ]) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit once with the exact values when the form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(null);
    render(<FooForm onSubmit={onSubmit} />);
    fillValidForm();
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(VALID_VALUES);
  });

  it('renders a returned string as the form-level error', async () => {
    render(<FooForm onSubmit={jest.fn().mockResolvedValue('name is taken')} />);
    fillValidForm();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('name is taken');
    expect(screen.getByLabelText('Name')).toHaveValue('widget');
  });

  it('resets every field to its initial value after a null return', async () => {
    render(<FooForm onSubmit={jest.fn().mockResolvedValue(null)} />);
    fillValidForm();
    submit();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(''));
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('Priority')).toHaveTextContent('Select a priority');
    expect(screen.getByLabelText('Active')).toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the fields and the button while onSubmit is pending', async () => {
    let resolveSubmit: (result: string | null) => void = () => {};
    const onSubmit = jest.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    render(<FooForm onSubmit={onSubmit} />);
    fillValidForm();
    submit();

    const button = await screen.findByRole('button', { name: 'Creating…' });
    expect(button).toBeDisabled();
    for (const label of ['Name', 'Description', 'Category', 'Priority', 'Active']) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }

    await act(async () => resolveSubmit(null));
    expect(screen.getByRole('button', { name: 'Create foo' })).toBeEnabled();
  });
});
