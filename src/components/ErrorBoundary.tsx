import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('QuickKart ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E5E4DF] rounded-xl p-8">
            <p className="text-xs font-medium text-[#C2590A] mb-2">Application Notice</p>
            <h1 className="text-xl font-bold text-[#181A18] mb-3">
              Something interrupted your QuickKart session
            </h1>
            <p className="text-sm text-[#5C615C] mb-6 leading-relaxed">
              {this.state.message.slice(0, 240)}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors"
            >
              Reload QuickKart
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
