import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginador reutilizable para las tablas del panel admin (Incidentes, Usuarios).
// Anterior/Siguiente + números de página, con elipsis si hay muchas páginas.
//
// Props:
//   page       → página actual (1-based)
//   totalPages → cantidad total de páginas
//   onPageChange → función que recibe el nuevo número de página
//   total      → (opcional) cantidad total de resultados, para el texto "N resultados"
function getPageNumbers(page, totalPages) {
  const pages = [];
  const add = (p) => { if (!pages.includes(p)) pages.push(p); };

  add(1);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < totalPages) add(p);
  }
  if (totalPages > 1) add(totalPages);

  return pages.sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onPageChange, total }) {
  if (!totalPages || totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  const btnBase =
    "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-1 py-2">
      {typeof total === "number" && (
        <p className="text-xs text-slate-400 order-2 sm:order-1">
          {total} resultado{total !== 1 ? "s" : ""}
        </p>
      )}

      <div className="flex items-center gap-1 order-1 sm:order-2 mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className={`${btnBase} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map((p, i) => {
          const prev = pageNumbers[i - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-xs text-slate-300">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`${btnBase} ${
                  p === page
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
          className={`${btnBase} text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="hidden sm:block order-3 w-0" />
    </div>
  );
}
