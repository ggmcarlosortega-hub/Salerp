import { API_DOCUMENTO, getHeaders, getFileHeaders } from './api';

export const guardarDocumentoComercial = async (tipo, payload, documentoEnEdicion) => {
  const endpoint = tipo === 'cotizacion' ? 'cotizacion' : 'factura';
  const esEdicion = Boolean(documentoEnEdicion);
  const idParaUrl = documentoEnEdicion?.id_documento || documentoEnEdicion?.id_factura || documentoEnEdicion?.id_cotizacion;
  const url = esEdicion ? `${API_DOCUMENTO}/${endpoint}/${idParaUrl}` : `${API_DOCUMENTO}/${endpoint}`;

  const response = await fetch(url, {
    method: esEdicion ? 'PUT' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al guardar documento');
  return { data, esEdicion, idParaUrl, endpoint };
};

export const guardarContrato = async (payload, documentoEnEdicion) => {
  const esEdicion = Boolean(documentoEnEdicion);
  const idContrato = documentoEnEdicion?.id_documento;
  const url = esEdicion ? `${API_DOCUMENTO}/contrato/${idContrato}` : `${API_DOCUMENTO}/contrato`;

  const response = await fetch(url, {
    method: esEdicion ? 'PUT' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al guardar contrato');
  return { data, esEdicion, idContrato };
};

export const guardarAbono = async (formData, documentoEnEdicion) => {
  const esEdicion = Boolean(documentoEnEdicion);
  const idAbono = documentoEnEdicion?.id_documento;
  const url = esEdicion ? `${API_DOCUMENTO}/abono/${idAbono}` : `${API_DOCUMENTO}/abono`;

  const response = await fetch(url, {
    method: esEdicion ? 'PUT' : 'POST',
    headers: getFileHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al guardar abono');
  return { data, esEdicion, idAbono };
};

export const obtenerDocumento = async (tipoEndpoint, id) => {
  const response = await fetch(`${API_DOCUMENTO}/${tipoEndpoint}/${id}`, { headers: getHeaders() });
  if (!response.ok) return null;
  return await response.json();
};

export const cambiarEstadoDocumento = async (tipoEndpoint, id, activar = false) => {
  const url = activar
    ? `${API_DOCUMENTO}/${tipoEndpoint}/${id}/reactivar`
    : `${API_DOCUMENTO}/${tipoEndpoint}/${id}`;
  const method = activar ? 'PUT' : 'DELETE';

  const response = await fetch(url, { method, headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al cambiar estado del documento');
  return data;
};

export const abrirPDF = (tipoEndpoint, id) => {
  const url = `${API_DOCUMENTO}/${tipoEndpoint}/${id}/pdf`;
  window.open(url, '_blank');
};
