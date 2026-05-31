import { API_CLIENTE, getHeaders } from './api';

export const cargarClientes = async () => {
  const response = await fetch(API_CLIENTE, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al cargar clientes');
  return data;
};

export const cargarDetalleCliente = async (idCliente) => {
  const response = await fetch(`${API_CLIENTE}/${idCliente}`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al cargar detalle del cliente');
  return data;
};

export const guardarCliente = async (cliente) => {
  const esEdicion = Boolean(cliente.id_cliente);
  const response = await fetch(
    esEdicion ? `${API_CLIENTE}/${cliente.id_cliente}` : API_CLIENTE,
    {
      method: esEdicion ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cliente),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al guardar cliente');
  return { data, esEdicion };
};

export const desactivarCliente = async (idCliente) => {
  const response = await fetch(`${API_CLIENTE}/${idCliente}`, { method: 'DELETE', headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al desactivar cliente');
  return data;
};
