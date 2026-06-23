// Dado un punto en el mapa (latitud y longitud), devuelve la dirección
// en texto: calle, número, barrio, ciudad, provincia y código postal.
// Usa la API gratuita de OpenStreetMap (Nominatim), sin necesidad de API key.
// Se usa en MapPicker.jsx cuando el usuario elige una ubicación en el mapa.
export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "es" } }
  );
  const data = await res.json();
  const address = data.address;

  return {
    lat,
    lng,
    calle:        address.road           || "",
    numero:       address.house_number   || "S/N",
    barrio:       address.suburb         || address.neighbourhood || "",
    ciudad:       address.city           || address.town || address.village || "",
    provincia:    address.state          || "",
    codigoPostal: address.postcode       || "",
    displayName:  data.display_name      || "",
  };
}
