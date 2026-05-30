import { useState } from "react";
import { Loader2 } from "lucide-react";

const DNI_REGEX = /^\d{8}$/;

function stripDni(value) {
  return value.replace(/\D/g, "");
}

export default function DniSetupScreen({ onSubmit, loading }) {
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = stripDni(dni);
    if (!DNI_REGEX.test(clean)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }
    setError("");
    onSubmit(clean);
  };

  return (
    <div className="min-h-screen bg-azul-oscuro flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-blanquito w-1.5 h-8 rounded-full inline-block" />
            <h1 className="text-white text-2xl font-bold tracking-tight">CityFixer</h1>
          </div>
          <p className="text-white/50 text-xs text-center">Tu ciudad, tu voz</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex flex-col gap-1">
            <h2 className="text-azul-oscuro font-bold text-lg">Un último paso</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Para completar tu perfil necesitamos tu DNI. Solo se pedirá esta vez.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                DNI
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value);
                  if (error) setError("");
                }}
                placeholder="12.345.678"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-celestito"
              />
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || stripDni(dni).length !== 8}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold disabled:opacity-50 hover:bg-azul transition-colors"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Continuar
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
