import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FooTable from '../FooTable';
import { createFoo, listFoos, type Foo } from '@/server-actions/foo';

jest.mock('@/server-actions/foo');

const mockCreateFoo = jest.mocked(createFoo);
const mockListFoos = jest.mocked(listFoos);

const EXISTING: Foo = {
  id: 1,
  name: 'older',
  description: null,
  category: 'general',
  priority: 'low',
  is_active: true,
  created_at: '2026-01-02T03:04:05.000Z',
};

const CREATED: Foo = {
  id: 2,
  name: 'widget',
  description: 'a short note',
  category: 'external',
  priority: 'medium',
  is_active: false,
  created_at: '2026-01-03T03:04:05.000Z',
};

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'widget' } });
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'a short note' },
  });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'external' } });
  fireEvent.click(screen.getByLabelText('Priority'));
  fireEvent.click(screen.getByRole('option', { name: 'Medium' }));
  fireEvent.click(screen.getByLabelText('Active'));
  fireEvent.click(screen.getByRole('button', { name: 'Create foo' }));
}

function rowFor(name: string): HTMLElement {
  const row = screen.getByRole('cell', { name }).closest('tr');
  if (!row) throw new Error(`no row for ${name}`);
  return row;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('FooTable', () => {
  it('creates a foo, re-reads the list, and renders the new row with every column', async () => {
    mockCreateFoo.mockResolvedValue({ ok: true, foo: CREATED });
    mockListFoos.mockResolvedValue({ ok: true, foos: [CREATED, EXISTING] });
    render(<FooTable initialFoos={[EXISTING]} initialError={null} />);

    fillAndSubmit();

    expect(await screen.findByText('Created foo #2')).toBeInTheDocument();
    expect(mockCreateFoo).toHaveBeenCalledWith({
      name: 'widget',
      description: 'a short note',
      category: 'external',
      priority: 'medium',
      is_active: false,
    });
    expect(mockListFoos).toHaveBeenCalledTimes(1);

    const cells = within(rowFor('widget'))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual([
      '2',
      'widget',
      'a short note',
      'external',
      'medium',
      'no',
      'Jan 03, 2026, 03:04:05',
    ]);
  });

  it('shows a failed create as the form error and adds no row', async () => {
    mockCreateFoo.mockResolvedValue({
      ok: false,
      message: 'name is required and must be a non-empty string',
    });
    render(<FooTable initialFoos={[EXISTING]} initialError={null} />);

    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'name is required and must be a non-empty string',
    );
    expect(mockListFoos).not.toHaveBeenCalled();
    expect(screen.queryByRole('cell', { name: 'widget' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('clears an earlier success status when a later create fails', async () => {
    mockCreateFoo
      .mockResolvedValueOnce({ ok: true, foo: CREATED })
      .mockResolvedValueOnce({ ok: false, message: 'create failed' });
    mockListFoos.mockResolvedValue({ ok: true, foos: [CREATED] });
    render(<FooTable initialFoos={[]} initialError={null} />);

    fillAndSubmit();
    expect(await screen.findByText('Created foo #2')).toBeInTheDocument();

    fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('create failed');
    expect(screen.queryByText('Created foo #2')).not.toBeInTheDocument();
  });

  it('shows a failed re-read in the status region', async () => {
    mockCreateFoo.mockResolvedValue({ ok: true, foo: CREATED });
    mockListFoos.mockResolvedValue({
      ok: false,
      message: 'Failed to load foo records (HTTP 500)',
    });
    render(<FooTable initialFoos={[]} initialError={null} />);

    fillAndSubmit();

    expect(
      await screen.findByText('Failed to load foo records (HTTP 500)'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(''));
  });

  it('renders initialError in the status region', () => {
    render(
      <FooTable initialFoos={[]} initialError="Failed to load foo records (HTTP 503)" />,
    );
    expect(screen.getByText('Failed to load foo records (HTTP 503)')).toBeInTheDocument();
    expect(screen.getByText('No foo records yet')).toHaveAttribute('colspan', '7');
  });

  it('renders a placeholder for a null description', () => {
    render(<FooTable initialFoos={[EXISTING]} initialError={null} />);
    const cells = within(rowFor('older'))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 6)).toEqual(['1', 'older', '—', 'general', 'low', 'yes']);
  });
});
