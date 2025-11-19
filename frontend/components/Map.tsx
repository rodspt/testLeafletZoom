'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getEstados, getMunicipios, getImoveis, FeatureCollection } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Feature {
  type: string;
  properties: {
    id: number;
    name: string;
    quantidade?: number;
    type: 'estado' | 'municipio' | 'imovel';
    centroid?: [number, number];
    cod_imovel?: string;
  };
  geometry: any;
}

function MapController({
  onZoomEnd,
  currentLevel,
  onMapReady
}: {
  onZoomEnd: (zoom: number) => void;
  currentLevel: string;
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomEnd(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomEnd]);

  return null;
}

export default function Map() {
  const [mounted, setMounted] = useState(false);
  const [estados, setEstados] = useState<FeatureCollection | null>(null);
  const [municipios, setMunicipios] = useState<FeatureCollection | null>(null);
  const [imoveis, setImoveis] = useState<FeatureCollection | null>(null);
  const [currentLevel, setCurrentLevel] = useState<'estado' | 'municipio' | 'imovel'>('estado');
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadEstados();
    }
  }, [mounted]);

  const loadEstados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEstados();
      console.log('=== DADOS RECEBIDOS ===');
      console.log('Total de features:', data.features.length);
      console.log('Primeira feature completa:', JSON.stringify(data.features[0], null, 2));

      if (data.features[0]?.geometry?.coordinates) {
  const coords = data.features[0].geometry.coordinates[0];
  console.log('Primeiras coordenadas:', coords.slice(0, 5));
  console.log('Tipo de geometria:', data.features[0].geometry.type);
}

      if (data.features.length === 0) {
        setError('Nenhum estado encontrado');
        return;
      }

      setEstados(data);
      setMunicipios(null);
      setImoveis(null);
      setCurrentLevel('estado');
      setSelectedEstado(null);
      setSelectedMunicipio(null);
    } catch (error: any) {
      console.error('Erro ao carregar estados:', error);
      setError(error.message || 'Erro ao carregar estados');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipios = async (ufId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMunicipios(ufId);
      console.log('Municípios carregados:', data);
      setMunicipios(data);
      setImoveis(null);
      setCurrentLevel('municipio');
      setSelectedEstado(ufId);
      setSelectedMunicipio(null);
    } catch (error: any) {
      console.error('Erro ao carregar municípios:', error);
      setError(error.message || 'Erro ao carregar municípios');
    } finally {
      setLoading(false);
    }
  };

  const loadImoveis = async (municipioId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImoveis(municipioId);
      console.log('Imóveis carregados:', data);
      setImoveis(data);
      setCurrentLevel('imovel');
      setSelectedMunicipio(municipioId);
    } catch (error: any) {
      console.error('Erro ao carregar imóveis:', error);
      setError(error.message || 'Erro ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomEnd = (zoom: number) => {
    console.log('Zoom atual:', zoom);
    setCurrentZoom(zoom);

    if (zoom >= 7 && currentLevel === 'estado' && selectedEstado && mapInstance) {
      console.log('Zoom >= 7 detectado, carregando municípios do estado:', selectedEstado);
      loadMunicipios(selectedEstado);
    } else if (zoom < 7 && currentLevel === 'municipio') {
      console.log('Zoom < 7 detectado, voltando para estados');
      setCurrentLevel('estado');
      setMunicipios(null);
      setImoveis(null);
    } else if (zoom >= 9 && currentLevel === 'municipio' && selectedMunicipio && mapInstance) {
      console.log('Zoom >= 9 detectado, carregando imóveis do município:', selectedMunicipio);
      loadImoveis(selectedMunicipio);
    } else if (zoom < 9 && currentLevel === 'imovel' && selectedEstado) {
      console.log('Zoom < 9 detectado, voltando para municípios');
      setCurrentLevel('municipio');
      setImoveis(null);
    }
  };

  const handleMapReady = (map: L.Map) => {
    setMapInstance(map);
  };

  const onEachEstado = (feature: any, layer: any) => {
    layer.bindPopup(`
      <strong>${feature.properties.name}</strong><br/>
      Quantidade: ${feature.properties.quantidade || 0}
    `);
  };

  const onEachMunicipio = (feature: any, layer: any) => {
    layer.bindPopup(`
      <strong>${feature.properties.name}</strong><br/>
      Quantidade: ${feature.properties.quantidade || 0}
    `);
  };

  const onEachImovel = (feature: any, layer: any) => {
    layer.bindPopup(`
      <strong>Imóvel</strong><br/>
      Código: ${feature.properties.cod_imovel}
    `);
  };

const estadoStyle = () => ({
  color: '#FF0000',
  weight: 5,
  opacity: 1,
});

const municipioStyle = () => ({
  color: '#00FF00',
  weight: 4,
  opacity: 1,
});

const imovelStyle = () => ({
  color: '#0000FF',
  weight: 3,
  opacity: 1,
});

  if (!mounted) {
    return <div className="w-full h-screen flex items-center justify-center">Carregando mapa...</div>;
  }

  console.log('CurrentLevel:', currentLevel);
console.log('Condição de renderização:', estados && currentLevel === 'estado' && estados.features.length > 0);

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded shadow">
          Carregando...
        </div>
      )}

      {error && (
        <div className="absolute top-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-white px-4 py-2 rounded shadow">
        <div className="text-sm font-semibold">Nível: {currentLevel}</div>
        {selectedEstado && <div className="text-xs">Estado ID: {selectedEstado}</div>}
        {selectedMunicipio && <div className="text-xs">Município ID: {selectedMunicipio}</div>}
        <div className="text-xs">Features: {estados?.features.length || 0}</div>
        <button
          onClick={loadEstados}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Resetar
        </button>
      </div>

<MapContainer
  center={[-14.235, -51.9253]}  // Brazil center lat,lng
  zoom={5}                     // zoom level to show whole country
  style={{ height: '100%', width: '100%' }}
>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController onZoomEnd={handleZoomEnd} currentLevel={currentLevel} onMapReady={handleMapReady} />

        {estados && currentLevel === 'estado' && estados.features.length > 0 && (
          <>
<GeoJSON
  key="estados"
  data={estados as any}
  style={estadoStyle}
  coordsToLatLng={(coords) => [coords[1], coords[0]]}
  onEachFeature={(feature, layer) => {
    console.log('Feature adicionada ao mapa:', feature.properties.name);
    onEachEstado(feature, layer);
  }}
/>
            {estados.features.map((feature: Feature) => {
              if (feature.properties.centroid) {
                return (
                  <CircleMarker
                    key={`centroid-${feature.properties.id}`}
                    center={[feature.properties.centroid[1], feature.properties.centroid[0]]}
                    radius={10}
                    fillColor="red"
                    color="white"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                    eventHandlers={{
                      click: () => {
                        console.log('Tooltip do estado clicado:', feature.properties);
                        setSelectedEstado(feature.properties.id);

                        if (mapInstance) {
                          const center: [number, number] = [
                            feature.properties.centroid[1],
                            feature.properties.centroid[0]
                          ];
                          mapInstance.setView(center, 8);
                        }

                        loadMunicipios(feature.properties.id);
                      }
                    }}
                  >
                     <Tooltip permanent direction="top" opacity={1}>
                      <strong>{feature.properties.name}</strong><br/>
                      Quantidade: {feature.properties.quantidade || 0}
                    </Tooltip>
                  </CircleMarker>
                );
              }
              return null;
            })}
          </>
        )}

        {municipios && currentLevel === 'municipio' && municipios.features.length > 0 && (
          <>
            <GeoJSON
              key={`municipios-${selectedEstado}`}
              data={municipios as any}
              style={municipioStyle}
              onEachFeature={onEachMunicipio}
            />
            {municipios.features.map((feature: Feature) => {
                if (feature.properties.centroid) {
                  return (
                    <CircleMarker
                      key={`centroid-mun-${feature.properties.id}`}
                      center={[feature.properties.centroid[1], feature.properties.centroid[0]]}
                      radius={8}
                      fillColor="orange"
                      color="white"
                      weight={2}
                      opacity={1}
                      fillOpacity={0.8}
                      eventHandlers={{
                        click: () => {
                          console.log('Tooltip do município clicado:', feature.properties);
                          setSelectedMunicipio(feature.properties.id);

                          if (mapInstance) {
                            const center: [number, number] = [
                              feature.properties.centroid[1],
                              feature.properties.centroid[0]
                            ];
                            mapInstance.setView(center, 11);
                          }

                          loadImoveis(feature.properties.id);
                        }
                      }}
                    >
                      <Tooltip permanent direction="top" opacity={1}>
                        <strong>{feature.properties.name}</strong><br/>
                        Quantidade: {feature.properties.quantidade || 0}
                      </Tooltip>
                    </CircleMarker>
                  );
                }
                return null;
              })}
          </>
        )}

        {imoveis && currentLevel === 'imovel' && imoveis.features.length > 0 && (
          <GeoJSON
            key={`imoveis-${selectedMunicipio}`}
            data={imoveis as any}
            style={imovelStyle}
            onEachFeature={onEachImovel}
          />
        )}
      </MapContainer>
    </div>
  );
}