import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Очищаем localStorage на всякий случай
    try {
      const persistKey = 'persist:root';
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.roadData) {
          parsed.roadData = JSON.stringify({
            calculatedRoads: [],
            lastCalculationTime: null
          });
          localStorage.setItem(persistKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error('Error cleaning storage:', e);
    }
    
    // Перезагружаем страницу
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Сталася помилка</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="font-semibold mb-2">
                  {this.state.error?.message || 'Невідома помилка'}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">
                      Технічні деталі
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={this.handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Очистити дані та перезавантажити
            </Button>
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Спробувати знову
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

