import PocketBase from 'pocketbase';

// Use LOCAL in dev, PROD in production build (Vite only inlines VITE_* vars)
const raw = import.meta.env.DEV
  ? (import.meta.env.VITE_LOCAL_POCKETBASE_URL ?? 'http://127.0.0.1:8090')
  : (import.meta.env.VITE_PROD_POCKETBASE_URL ?? 'https://su3.fly.dev');
const url = (raw ?? 'https://su3.fly.dev').replace(/\/$/, ''); // no trailing slash
const pb = new PocketBase(url);

export { pb };
