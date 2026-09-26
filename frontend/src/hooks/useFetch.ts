import { useState, useEffect, useCallback, useRef } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface FetchOptions extends AxiosRequestConfig {
  skip?: boolean;
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function useFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { skip = false, ...requestOptions } = options;

  // Las opciones suelen llegar como objeto literal (nuevo en cada render);
  // se guardan en una ref para no recrear fetchData ni provocar bucles.
  const requestOptionsRef = useRef(requestOptions);
  requestOptionsRef.current = requestOptions;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { headers, ...rest } = requestOptionsRef.current;
      const response: AxiosResponse<T> = await axios({
        method: "GET",
        url: `${API_BASE}${url}`,
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      setData(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Error al conectar con el servidor";
      setError(message);
      console.error("useFetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, [url, skip, fetchData]);

  return { data, loading, error, refetch };
}

export default useFetch;