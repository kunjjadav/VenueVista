import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "map": {
        "api_key_required": "Google Maps API Key Required",
        "add_key_hint": "Add your VITE_GOOGLE_MAPS_API_KEY to the .env file to enable the interactive map.",
        "center": "Map Center",
        "restaurants_loaded": "Restaurants loaded",
        "cluster": "Cluster",
        "score": "Score",
        "aria_map_container": "Interactive map showing restaurant data",
        "aria_cluster_marker": "Cluster marker showing high restaurant density"
      }
    }
  },
  es: {
    translation: {
      "map": {
        "api_key_required": "Se requiere clave de API de Google Maps",
        "add_key_hint": "Agregue su VITE_GOOGLE_MAPS_API_KEY al archivo .env para habilitar el mapa interactivo.",
        "center": "Centro del mapa",
        "restaurants_loaded": "Restaurantes cargados",
        "cluster": "Grupo",
        "score": "Puntuación",
        "aria_map_container": "Mapa interactivo mostrando datos de restaurantes",
        "aria_cluster_marker": "Marcador de grupo mostrando alta densidad de restaurantes"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
