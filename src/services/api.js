const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const API_CLIENTE = `${API_BASE}/api/cliente`;
export const API_PRODUCTO = `${API_BASE}/api/producto`;
export const API_GASTO = `${API_BASE}/api/gasto`;
export const API_PROVEEDOR = `${API_BASE}/api/proveedor`;
export const API_MAQUINARIA = `${API_BASE}/api/maquinaria`;
export const API_DOCUMENTO = `${API_BASE}/api/documento`;
export const API_DASHBOARD = `${API_BASE}/api/dashboard`;
export const API_EMPRESA = `${API_BASE}/api/empresa`;
export const API_AUTH = `${API_BASE}/api/auth`;

export const getHeaders = (includeContentType = true) => {
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem('user_salerp') : null;
  const usuario = raw ? JSON.parse(raw) : {};
  const headers = {
    'x-empresa-id': usuario.id_empresa || '',
    'x-user-id': usuario.id_acceso || ''
  };

  if (usuario.token) {
    headers['Authorization'] = `Bearer ${usuario.token}`;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const getFileHeaders = () => {
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem('user_salerp') : null;
  const usuario = raw ? JSON.parse(raw) : {};
  const headers = {
    'x-empresa-id': usuario.id_empresa || '',
    'x-user-id': usuario.id_acceso || ''
  };

  if (usuario.token) {
    headers['Authorization'] = `Bearer ${usuario.token}`;
  }

  return headers;
};

export const apiFetch = async (url, options = {}) => {
  const config = {
    headers: getHeaders(!options.isFormData),
    ...options,
  };

  if (options.isFormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
  }

  return data;
};

export const loginUser = async (correo, password) => {
  const response = await fetch(`${API_AUTH}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Error al iniciar sesión');
  }

  const usuario = {
    ...data.usuario,
    token: data.token,
    id_empresa: data.usuario.id_empresa,
    id_acceso: data.usuario.id_acceso,
  };

  sessionStorage.setItem('user_salerp', JSON.stringify(usuario));

  return usuario;
};
