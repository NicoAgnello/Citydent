// Error boundary genérico de React.
// Sin esto, cualquier excepción sin capturar durante el render de un hijo
// desmonta TODO el árbol de React y deja la pantalla en blanco sin ningún
// mensaje. Este componente atrapa esos errores, muestra un aviso legible en
// su lugar y loguea el error completo en consola para poder diagnosticarlo.
//
// Uso:
//   <ErrorBoundary label="Estadísticas">
//     <AdminEstadisticasTab ... />
//   </ErrorBoundary>
//
// NOTA: tiene que ser un componente de clase — React todavía no expone
// getDerivedStateFromError/componentDidCatch como hook.
import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Ocurrió un error al mostrar esta sección{this.props.label ? ` (${this.props.label})` : ""}.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Recargá la página. Si el problema sigue, avisá al equipo técnico con el mensaje de la consola del navegador.
            </p>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs font-semibold text-primary hover:underline mt-1"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
