import { useState, useCallback } from 'react';

export const useFetch = (fetchFn) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const ejecutar = useCallback(async (...args) => {
    setCargando(true);
    setError('');
    try {
      const resultado = await fetchFn(...args);
      setData(resultado);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, [fetchFn]);

  return { data, cargando, error, ejecutar, setData, setError };
};
