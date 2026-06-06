const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analizarIncidenteIA = async (title, description, gruposCercanos = []) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const listadoCercanos = gruposCercanos.length > 0
      ? gruposCercanos.map(g => {
          const otros = g.incidentes.length > 1
            ? g.incidentes
                .filter(inc => inc.title !== g.title)
                .map(inc => `  - "${inc.title}": "${inc.description}"`)
                .join('\n')
            : '  - (sin otros reportes)';

          return `ID: ${g._id} | REPRESENTANTE: "${g.title}" - "${g.description}"\nOTROS REPORTES DEL GRUPO:\n${otros}`;
        }).join('\n\n')
      : "No hay grupos de incidentes reportados cerca.";

    const prompt = `
      Eres un analista experto del sistema de reportes urbanos "CityFixer" de una municipalidad.
      Tu tarea es analizar un nuevo reporte ciudadano y compararlo con grupos de incidentes cercanos para detectar si pertenece a un problema ya reportado.

      --- NUEVO REPORTE ---
      TÍTULO: "${title}"
      DESCRIPCIÓN: "${description}"

      --- GRUPOS DE INCIDENTES CERCANOS (radio 500m) ---
      ${listadoCercanos}

      REGLAS DE EVALUACIÓN:

      1. ESTADO SUGERIDO:
         - "rechazado": el reporte es ilegible o completamente ininteligible.
         - "dudoso": el título y la descripción se contradicen, o parece una broma.
         - "pendiente": es un reporte válido de infraestructura urbana (baches, basura, luz, etc).

      2. EMERGENCIA (campo separado del estado):
         - "isEmergency": true si requiere intervención urgente de policía, bomberos o ambulancia (accidentes graves, incendios, etc).
         - Un reporte puede ser rechazado Y emergencia al mismo tiempo.

      3. PRIORIDAD: número del 1 al 5 según gravedad y urgencia.
         - 1: baja (ej. bache pequeño)
         - 5: alta (ej. árbol caído bloqueando calle)

      4. CATEGORÍA: sugiere una (ej: "bache", "alumbrado", "basura", "vandalismo", "otro").

      5. DUPLICADOS:
         - Si el nuevo reporte describe el MISMO PROBLEMA que uno de los grupos cercanos, marca "esDuplicado": true y en "idGrupoCandidato" pon el ID exacto de ese grupo.
         - Si el reporte es "dudoso" o "rechazado", igualmente analizá similitud y completá "idGrupoCandidato" si corresponde.
         - Si no hay candidato, pon null en "idGrupoCandidato".
         - "confianza": número entre 0.0 y 1.0 que indica cuán seguro estás de que el nuevo reporte pertenece al grupo candidato. Si no hay candidato, pon 0.0.

      6. REPRESENTANTE DEL GRUPO:
         - Solo aplica cuando "esDuplicado" es true.
         - Comparás el nuevo reporte contra el REPRESENTANTE actual del grupo candidato (el que aparece como "REPRESENTANTE" en los grupos cercanos).
         - "esRepresentanteMejor": true si el nuevo reporte es más descriptivo, claro y completo que el representante actual para identificar el problema. false en cualquier otro caso o si no hay duplicado.

      ESTRUCTURA DE RESPUESTA (solo este JSON):
      {
        "categoriaSugerida": "string",
        "estadoSugerido": "rechazado" | "dudoso" | "pendiente",
        "isEmergency": boolean,
        "prioridadSugerida": number,
        "esDuplicado": boolean,
        "idGrupoCandidato": "string o null",
        "confianza": number,
        "esRepresentanteMejor": boolean,
        "justificacion": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());

  } catch (error) {
    console.warn(`⚠️ [Aviso IA] Gemini no disponible. Aplicando fallback.`);
    return {
      categoriaSugerida: "Requiere clasificación manual",
      estadoSugerido: "pendiente",
      isEmergency: false,
      prioridadSugerida: 1,
      esDuplicado: false,
      idGrupoCandidato: null,
      confianza: 0,
      esRepresentanteMejor: false,
      justificacion: "[SISTEMA]: La IA no pudo procesar este reporte. Se deben establecer prioridad, categoría y duplicados manualmente."
    };
  }
};

module.exports = { analizarIncidenteIA };