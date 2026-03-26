/**
 * Hotel API Service
 *
 * Todos os requests incluem automaticamente:
 *   - Header `X-API-KEY` com a chave configurada em EXPO_PUBLIC_HOTELS_API_KEY
 *   - Header `Content-Type: application/json`
 *   - Header `Accept: application/json`
 *
 * Configuração via variáveis de ambiente:
 *   EXPO_PUBLIC_HOTELS_API_URL  → base URL da API
 *   EXPO_PUBLIC_HOTELS_API_KEY  → chave de autenticação
 *
 * Envelope de resposta da API:
 *   { success: boolean, data: T, message: string | null, timestamp: number }
 */

import {
  Hotel,
  HotelSearchParams,
  HotelApiEnvelope,
  HotelApiResponse,
} from '../types';

// ─── Config ─────────────────────────────────────────────────────────────────

const HOTELS_API_URL =
  process.env.EXPO_PUBLIC_HOTELS_API_URL ?? 'https://api.your-hotels-provider.com/v1';

const HOTELS_API_KEY =
  process.env.EXPO_PUBLIC_HOTELS_API_KEY ?? '';

if (__DEV__ && (!HOTELS_API_KEY || HOTELS_API_KEY === 'your-hotels-api-key')) {
  console.warn(
    '🏨 Hotels API não configurada!\n' +
    '1. Defina EXPO_PUBLIC_HOTELS_API_URL no arquivo .env\n' +
    '2. Defina EXPO_PUBLIC_HOTELS_API_KEY no arquivo .env\n' +
    '3. Reinicie o servidor de desenvolvimento',
  );
}

// ─── HTTP Client ─────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Monta a query string a partir de um objeto de parâmetros,
 * ignorando valores undefined, null e string vazia.
 */
function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
  );
}

/**
 * Cliente HTTP base.
 *
 * Injeta X-API-KEY em todas as chamadas e desempacota o envelope
 * { success, data, message, timestamp } retornado pela API.
 */
async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<HotelApiResponse<T>> {
  const { method = 'GET', params, body, signal } = options;

  const qs = params ? buildQueryString(params) : '';
  const url = `${HOTELS_API_URL}${path}${qs}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-KEY': HOTELS_API_KEY,
  };

  const init: RequestInit = {
    method,
    headers,
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const response = await fetch(url, init);

    // Tenta parsear sempre como JSON (tanto sucesso quanto erro podem retornar JSON)
    let envelope: Partial<HotelApiEnvelope<T>> = {};
    try {
      envelope = await response.json();
    } catch {
      // resposta não é JSON
    }

    // HTTP error (4xx, 5xx)
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message:
            envelope.message ??
            `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        },
      };
    }

    // A API pode retornar HTTP 200 mas com success: false no envelope
    if (envelope.success === false) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: envelope.message ?? 'Erro retornado pela API',
          statusCode: response.status,
        },
      };
    }

    return { success: true, data: envelope.data as T };

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: { code: 'REQUEST_ABORTED', message: 'Requisição cancelada', statusCode: 0 },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        statusCode: 0,
      },
    };
  }
}

// ─── Hotel Service ────────────────────────────────────────────────────────────

export const hotelService = {
  /**
   * Busca hotéis/hostels com filtros opcionais.
   * GET /hotels
   *
   * Response: Hotel[]
   * Exemplo:
   *   const result = await hotelService.search({ city: 'Madrid' });
   *   if (result.success) console.log(result.data); // Hotel[]
   */
  async search(
    params: HotelSearchParams = {},
    signal?: AbortSignal,
  ): Promise<HotelApiResponse<Hotel[]>> {
    return request<Hotel[]>('/hotels', {
      params: {
        query: params.query,
        name: params.name,
        city: params.city,
        country: params.country,
        country_code: params.country_code,
        latitude: params.latitude,
        longitude: params.longitude,
        radius_km: params.radiusKm,
        min_rating: params.minRating,
        amenities: params.amenities?.join(','),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
      signal,
    });
  },

  /**
   * Busca detalhes de um hotel específico.
   * GET /hotels/:id
   */
  async getById(
    hotelId: number,
    signal?: AbortSignal,
  ): Promise<HotelApiResponse<Hotel>> {
    return request<Hotel>(`/hotels/${hotelId}`, { signal });
  },

  /**
   * Busca hotéis próximos a uma coordenada (Haversine feito pela API).
   * Atalho para search() com latitude/longitude.
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    signal?: AbortSignal,
  ): Promise<HotelApiResponse<Hotel[]>> {
    return hotelService.search({ latitude, longitude, radiusKm }, signal);
  },

  /**
   * Pesquisa hotéis por cidade.
   * Atalho para search() com city.
   */
  async searchByCity(
    city: string,
    extraParams: Omit<HotelSearchParams, 'city'> = {},
    signal?: AbortSignal,
  ): Promise<HotelApiResponse<Hotel[]>> {
    return hotelService.search({ city, ...extraParams }, signal);
  },
};

