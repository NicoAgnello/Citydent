// BackEnd/services/osm.service.js

/** ///////LAS COORDENADAS VIENEN DESDE EL FRONT, DONDE VA A ESTAR LA OTRA PARTE DE OPENSTREETMAP
 * 
 * 
 * 
 * 
 * Convierte coordenadas (lat, lng) en una dirección legible usando OpenStreetMap (Nominatim).
 * @param {Number} lat - Latitud
 * @param {Number} lng - Longitud
 * @returns {Promise<String>} - La dirección formateada o un mensaje por defecto.
 */
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    // Si no hay coordenadas, no podemos buscar la dirección
    if (!lat || !lng) return '';

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    
    // FETCH nativo de Node.js (disponible en Node 18+)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Es obligatorio por las políticas de uso de OSM incluir un User-Agent identificatorio
        'User-Agent': 'CityFlow_Backend/1.0 (luca.mmorales237@gmail.com)',
        'Accept-Language': 'es' // Para que la dirección venga en español
      }
    });

    if (!response.ok) {
      throw new Error('Error al consultar Nominatim (OSM)');
    }

    const data = await response.json();
    
    // display_name contiene la dirección completa armada por OSM
    return data.display_name || 'Dirección no encontrada';
  } catch (error) {
    console.error('❌ Error en OSM Reverse Geocoding:', error.message);
    return 'Ubicación sin dirección exacta'; // Fallback por si la API falla
  }
};

module.exports = {
  getAddressFromCoordinates
};