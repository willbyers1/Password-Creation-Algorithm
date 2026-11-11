import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Changing this key clears a previous error (e.g. a new run). */
  resetKey?: unknown;
}

interface State {
  error: boolean;
  resetKey?: unknown;
}

/** Keeps a rendering failure in the stage from blanking the whole page. Never logs input. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { error: false, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Intentionally silent: error details could include user input.
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="bg-ink p-4 text-ground">
          The animation could not be drawn. Press Generate to run it again, or reload the page.
        </div>
      );
    }
    return this.props.children;
  }
}
