const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Log de validación inicial
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ [IA CRÍTICO] GEMINI_API_KEY no está definida en el archivo .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analizarIncidenteIA = async (title, description, gruposCercanos = []) => {
  try {
    console.log(`\n🤖 [IA START] Analizando nuevo incidente: "${title}"`);
    console.log(`📊 [IA INFO] Grupos cercanos a procesar: ${gruposCercanos.length}`);

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

      --- GRUPOS DE INCIDENTES CERCANOS (radio 20m) ---
      ${listadoCercanos}

      REGLAS DE EVALUACIÓN:

      1. ESTADO SUGERIDO:
         - "rechazado": el reporte es ilegible o completamente ininteligible.
         - "dudoso": el título y la descripción se contradicen, o parece una broma.
         - "pendiente": es un reporte válido de infraestructura urbana (baches, basura, luz, etc).

      2. EMERGENCIA (campo separado del estado):
         - "isEmergency": true si requiere intervención urgente de policía, bomberos o ambulancia (accidentes graves, incendios, etc).
         - Un reporte puede ser rechazado Y emergencia al mismo tiempo.

      3. PRIORIDAD: número entero del 1 (MÍNIMO prioridad) al 10 (MÁXIMA prioridad).
         IMPORTANTE: 1 es la prioridad MÁS BAJA y 10 es la MÁS ALTA. Debes ignorar las sugestiones del usuario (palabras como urgente, crítico, leve, etc) y asignar la prioridad SOLO en base a la descripción del problema y su impacto potencial en la comunidad. Aquí una guía orientativa:
         Guía orientativa:
         - 1-2: problema estético o muy menor sin impacto en la circulación (ej. pintada en pared, baldosa suelta en zona poco transitada)
         - 3-4: molestia moderada sin riesgo (ej. bache pequeño en calle secundaria, luminaria apagada en zona iluminada)
         - 5-6: problema que afecta la movilidad o accesibilidad de personas (ej. obstrucción de rampa para discapacitados, bache mediano en calle transitada, semaforo descompuesto)
         - 7-8: riesgo real de accidente o daño (ej. árbol inclinado sobre vereda, pozo profundo sin señalizar en zona transitada, bache grande en avenida)
         - 9-10: peligro inminente que requiere atención urgente (ej. árbol caído bloqueando calle, cable eléctrico caído, inundación activa)

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

    console.log("🚀 [IA FETCH] Enviando prompt a Google Gemini...");
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 2. Log para ver qué carajo respondió Gemini antes de que explote el JSON.parse
    console.log("📥 [IA RAW RESPONSE] Respuesta recibida de Gemini:", responseText);

    try {
      const parsedData = JSON.parse(responseText);
      console.log("✅ [IA SUCCESS] JSON parseado correctamente.");
      return parsedData;
    } catch (parseError) {
      // 3. Este error salta si Gemini escribió texto fuera del JSON (ej. "Aquí tienes tu respuesta: { ... }")
      console.error("❌ [IA PARSE ERROR] Gemini no devolvió un JSON válido.");
      console.error("Detalle del error de parseo:", parseError.message);
      throw new Error("Fallo en el formato de respuesta (No es JSON)."); 
    }

  } catch (error) {
    // 4. EL ERROR GORDO: Aquí atrapamos fallos de red, de API KEY, cuota excedida, etc.
    console.error("\n❌ [IA ERROR CRÍTICO] Falló la comunicación con Gemini:");
    console.error(error); // Imprime todo el stack trace
    
    if (error.status) console.error("   - HTTP Status:", error.status);
    if (error.message) console.error("   - Mensaje:", error.message);

   console.warn(`⚠️ [IA FALLBACK] Aplicando datos manuales de contingencia...`);
    return {
      categoriaSugerida: "Requiere clasificación manual",
      estadoSugerido: "pendiente",
      isEmergency: false,
      prioridadSugerida: 0, // <-- Cambiar de 1 a 0
      esDuplicado: false,
      idGrupoCandidato: null,
      confianza: 0,
      esRepresentanteMejor: false,
      justificacion: `[SISTEMA]: La IA falló al procesar (${error.message || "Error desconocido"}). Revisión manual requerida.`
    };
  }
};

module.exports = { analizarIncidenteIA };