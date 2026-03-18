import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let details = '';

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Erro no Firestore: ${parsed.error}`;
            details = JSON.stringify(parsed, null, 2);
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Ops! Algo deu errado</h1>
            </div>
            
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            
            {details && (
              <div className="mb-6">
                <p className="text-sm font-bold text-slate-700 mb-2">Detalhes técnicos:</p>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-auto max-h-60">
                  {details}
                </pre>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
