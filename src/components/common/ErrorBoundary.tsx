import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EasyMock ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unable to Display Report</h2>
          <p className="text-sm text-slate-600">
            An unexpected error occurred while rendering the report view. Your test attempts remain securely stored in your browser.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-50 rounded-xl text-left font-mono text-xs text-rose-700 overflow-x-auto border border-slate-200 max-h-32">
              {this.state.error.message}
            </div>
          )}
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Mock Test Setup</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
