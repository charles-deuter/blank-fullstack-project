import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListboxField from '../ListboxField';
import type { ListboxFieldOption } from '../ListboxField';

const options: ListboxFieldOption[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

describe('ListboxField', () => {
  it('renders label wired to the button', () => {
    render(<ListboxField label="Color" options={options} />);
    const button = screen.getByLabelText('Color');
    expect(button).toBeInTheDocument();
  });

  it('renders without error state by default', () => {
    render(<ListboxField label="Color" options={options} />);
    const button = screen.getByLabelText('Color');
    expect(button).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('renders error state when error prop is set', () => {
    render(<ListboxField label="Color" options={options} error="Pick one" />);
    const button = screen.getByLabelText('Color');
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Pick one');
  });

  it('shows placeholder when no value is selected', () => {
    render(<ListboxField label="Color" options={options} placeholder="Choose a color" />);
    expect(screen.getByLabelText('Color')).toHaveTextContent('Choose a color');
  });

  it('shows selected option label when value is set', () => {
    render(<ListboxField label="Color" options={options} value="green" />);
    expect(screen.getByLabelText('Color')).toHaveTextContent('Green');
  });

  it('forwards disabled prop', () => {
    render(<ListboxField label="Color" options={options} disabled />);
    expect(screen.getByLabelText('Color')).toBeDisabled();
  });

  it('forwards name prop', () => {
    render(<ListboxField label="Color" options={options} name="color" />);
    expect(document.querySelector('input[name="color"]')).toBeInTheDocument();
  });

  it('renders options when opened', () => {
    render(<ListboxField label="Color" options={options} />);
    fireEvent.click(screen.getByLabelText('Color'));
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    const handleChange = jest.fn();
    render(
      <ListboxField label="Color" options={options} value="" onChange={handleChange} />,
    );
    fireEvent.click(screen.getByLabelText('Color'));
    fireEvent.click(screen.getByText('Blue'));
    expect(handleChange).toHaveBeenCalledWith('blue');
  });
});
