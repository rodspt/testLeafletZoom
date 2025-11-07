const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://nginx/req';
  }
  return 'http://192.168.112.1:8080/req';
};

export interface Feature {
  type: 'Feature';
  properties: {
    id: number;
    name: string;
    quantidade?: number;
    cod_imovel?: string;
    type: 'estado' | 'municipio' | 'imovel';
    centroid?: [number, number];
  };
  geometry: GeoJSON.Geometry;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

async function fetchWithCORS(url: string): Promise<Response> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

export async function getEstados(): Promise<FeatureCollection> {
  try {
    const API_URL = getApiUrl();
    const response = await fetchWithCORS(`${API_URL}/estados`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estados:', error);
    throw error;
  }
}

export async function getMunicipios(ufId: number): Promise<FeatureCollection> {
  try {
    const API_URL = getApiUrl();
    const response = await fetchWithCORS(`${API_URL}/municipios/${ufId}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar municípios:', error);
    throw error;
  }
}

export async function getImoveis(municipioId: number): Promise<FeatureCollection> {
  try {
    const API_URL = getApiUrl();
    const response = await fetchWithCORS(`${API_URL}/imoveis/${municipioId}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    throw error;
  }
}