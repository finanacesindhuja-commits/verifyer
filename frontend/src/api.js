let baseApiUrl = (import.meta.env.VITE_API_URL || '').trim();

// Automatically replace dead or legacy URLs with the active Render server
if (!baseApiUrl || baseApiUrl.includes('verifyer-x832.onrender.com')) {
  baseApiUrl = 'https://verifyer-p511.onrender.com';
}

// Remove trailing slash if present
baseApiUrl = baseApiUrl.replace(/\/+$/, '');

export const API_URL = baseApiUrl;
export default baseApiUrl;
