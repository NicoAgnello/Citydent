import axios from 'axios';

// Este archivo es para que se mande la cookie siempre con cada peticion.

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

export default api;