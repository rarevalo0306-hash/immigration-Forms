import { isNativeApp } from './native';

/** Where the server functions (api/) live: the site itself, or the live site from inside the phone app. */
export const apiUrl = (name: string) => (isNativeApp() ? `https://caminoformularios.com/api/${name}` : `${import.meta.env.BASE_URL}api/${name}`);
