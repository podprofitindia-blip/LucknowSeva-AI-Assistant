import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'अज्ञात त्रुटि' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LucknowSeva ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  private handleClearCorruptStorage = () => {
    try {
      localStorage.removeItem('lucknowseva_real_providers_v1');
      localStorage.removeItem('lucknowseva_real_bookings_v1');
    } catch {
      // ignore
    }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              ऐप लोड करने में समस्या आई
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              चिंता न करें, आपका वास्तविक डेटा सुरक्षित है। कृपया ऐप को पुनः लोड करें।
            </p>

            {this.state.errorMessage && (
              <div className="p-2.5 rounded-xl bg-slate-100 text-[11px] font-mono text-slate-700 text-left overflow-x-auto">
                त्रुटि: {this.state.errorMessage}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>पुनः लोड करें</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCorruptStorage}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>कैश साफ़ कर पुनः खोलें</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
