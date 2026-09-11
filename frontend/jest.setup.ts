// jsdom doesn't implement ResizeObserver. Headless UI calls observe() internally,
// so the methods must exist — an empty class body isn't enough.
global.ResizeObserver = class ResizeObserver {
  public observe() {}

  public unobserve() {}

  public disconnect() {}
};
