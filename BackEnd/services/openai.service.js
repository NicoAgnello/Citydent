const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. INICIALIZACIÓN DEL SDK
// Instanciamos el cliente usando la clave de entorno.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Función centralizada para analizar el incidente con Gemini.
 * Evalúa categoría, estado, prioridad y devuelve una justificación.
 */
const analizarIncidenteIA = async (title, description) => {
  try {
    // 2. CONFIGURACIÓN DEL MODELO
    // Elegimos 'gemini-1.5-flash' porque es el más rápido para tareas de texto.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // MUY IMPORTANTE: Esta configuración obliga a Gemini a devolver SOLO un JSON válido, 
      // sin formato Markdown (```json) ni saludos. Previene errores en el JSON.parse()
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // 3. INGENIERÍA DEL PROMPT (Instrucciones precisas)
    // Le explicamos su rol, las reglas de negocio y la estructura de salida.
    const prompt = `
      Eres un analista experto del sistema de reportes urbanos "CityFixer" de una municipalidad.
      Tu tarea es analizar el siguiente incidente reportado por un ciudadano:

      TÍTULO: "${title}"
      DESCRIPCIÓN: "${description}"

      REGLAS DE EVALUACIÓN:
      1. ESTADO SUGERIDO: 
         - Si el reporte es una emergencia vital, requiere policía, bomberos o ambulancia (ej. accidentes graves, incendios, robos en curso), el estado DEBE ser "rechazado" (para que la app no retenga la emergencia y el ciudadano llame al 911).
         - Si el título y la descripción no tienen sentido, parecen una broma, o se contradicen totalmente, el estado DEBE ser "dudoso".
         - Si es un reporte normal de infraestructura (baches, basura, luz), el estado DEBE ser "pendiente".
      
      2. PRIORIDAD: 
         - Asigna un número del 1 (muy baja) al 5 (crítica) dependiendo del riesgo para los transeúntes o la urgencia de infraestructura.
      
      3. CATEGORÍA:
         - Sugiere una categoría corta (ej: "bache", "alumbrado", "basura", "vandalismo", "otro").

      ESTRUCTURA DE RESPUESTA REQUERIDA (Genera solo este JSON):
      {
        "categoriaSugerida": "string",
        "estadoSugerido": "rechazado" | "dudoso" | "pendiente",
        "prioridadSugerida": number,
        "justificacion": "string (Breve explicación de 2 o 3 líneas sobre tus decisiones)"
      }
    `;

    // 4. LLAMADA A LA API
    // Enviamos el prompt al modelo y esperamos la respuesta
    const result = await model.generateContent(prompt);
    
    // Extraemos el texto de la respuesta. 
    // Como activamos el responseMimeType, text() será directamente un string en formato JSON.
    const responseText = result.response.text();
    
    // Convertimos el string a un objeto JavaScript
    const analisis = JSON.parse(responseText);

    return analisis;

  } catch (error) {
    // 5. MANEJO DE ERRORES Y FALLBACK
    // Si la API de Gemini falla (caída del servidor, timeout, límite de cuota),
    // NO queremos que el usuario no pueda subir su incidente. 
    // Devolvemos un objeto seguro por defecto para que el flujo continúe.
    console.error("Error al consultar a Gemini API:", error);
    return {
      categoriaSugerida: "Sin Clasificar",
      estadoSugerido: "pendiente", // Asumimos que es válido para no bloquear al ciudadano
      prioridadSugerida: 1,
      justificacion: "Validación por IA no disponible temporalmente. Se requiere revisión manual."
    };
  }
};

module.exports = {
  analizarIncidenteIA
};