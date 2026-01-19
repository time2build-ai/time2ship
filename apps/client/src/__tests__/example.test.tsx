import { render, screen } from '@testing-library/react';

describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should render a component', () => {
    const TestComponent = () => <div>Hello, World!</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
});
