<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Estado;
use App\Models\Municipio;
use App\Models\Imovel;

class GeoController extends Controller
{
    public function testConnection()
    {
        try {
            $pdo = DB::connection()->getPdo();
            
            $tables = DB::select("
                SELECT table_schema, table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'dw'
            ");
            
            $count = DB::table('dw.dm_uf')->count();
            
            $sample = DB::select("
                SELECT 
                    id, 
                    nm_uf, 
                    pg_typeof(geojson) as geojson_type,
                    quantidade
                FROM dw.dm_uf
                LIMIT 1
            ");
            
            return response()->json([
                'status' => 'Conexão OK',
                'driver' => DB::connection()->getDriverName(),
                'database' => DB::connection()->getDatabaseName(),
                'tables' =>

 $tables,
                'dm_uf_count' => $count,
                'sample' => $sample
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro de conexão',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function getEstados()
    {
        try {
            ini_set('memory_limit', '-1');
            set_time_limit(0);
            
            $estados = DB::select("
                SELECT 
                    id, 
                    nm_uf,
                    geojson::text as geojson,
                    quantidade
                FROM dw.dm_uf
                ORDER BY id
                LIMIT 2
            ");

            if (empty($estados)) {
                return response()->json([
                    'type' => 'FeatureCollection',
                    'features' => [],
                    'message' => 'Nenhum estado encontrado'
                ]);


            }

            $features = [];
            
            foreach ($estados as $estado) {
                try {
                    $geojson = json_decode($estado->geojson, true);
                    
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        continue;
                    }

                    $centroid = $this->calculateCentroid($geojson);

                    $features[] = [
                        'type' => 'Feature',
                        'properties' => [
                            'id' => $estado->id,
                            'name' => $estado->nm_uf,
                            'quantidade' => $estado->quantidade ?? 0,
                            'type' => 'estado',
                            'centroid' => $centroid,
                        ],
                        'geometry' => $geojson,
                    ];
                } catch (\Exception $e) {
                    continue;
                }


            }

            return response()->json([
                'type' => 'FeatureCollection',
                'features' => $features,
            ]);
        } catch (\PDOException $e) {
            return response()->json([
                'error' => 'Erro de conexão com banco de dados',
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao carregar estados',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile())
            ], 500);
        }
    }

    public function getMunicipios($ufId)
    {
        try {
            ini_set('memory_limit', '-1');
            set_time_limit(0);
            
            $municipios = DB::select("
                SELECT 
                    id, 
                    nm_municipio,
                    geojson::text as geojson,


                    quantidade
                FROM dw.dm_municipio
                WHERE uf_id = ?
                ORDER BY id
            ", [$ufId]);

            if (empty($municipios)) {
                return response()->json([
                    'type' => 'FeatureCollection',
                    'features' => [],
                    'message' => 'Nenhum município encontrado'
                ]);
            }

            $features = [];
            
            foreach ($municipios as $municipio) {
                try {
                    $geojson = json_decode($municipio->geojson, true);
                    
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        continue;
                    }

                    $centroid = $this->calculateCentroid($geojson);

                    $features[] = [
                        'type' => 'Feature',
                        'properties' => [
                            'id' => $municipio->id,
                            'name' => $municipio->nm_municipio,
                            'quantidade' => $municipio->quantidade ?? 0,
                            'type' => 'municipio',
                            'centroid' => $centroid,
                        ],
                        'geometry' => $geojson,
                    ];
                } catch (\Exception $e) {
                    continue;
                }
            }

            return response()->json([
                'type' => 'FeatureCollection',
                'features' => $features,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao carregar municípios',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile())
            ], 500);
        }
    }

    public function getImoveis($municipioId)
    {
        try {
            ini_set('memory_limit', '-1');


            set_time_limit(0);
            
            $imoveis = DB::select("
                SELECT 
                    id, 
                    cod_imovel,
                    geojson::text as geojson
                FROM dw.dm_sicar
                WHERE municipio_id = ?
                ORDER BY id
            ", [$municipioId]);

            if (empty($imoveis)) {
                return response()->json([
                    'type' => 'FeatureCollection',
                    'features' => [],
                    'message' => 'Nenhum imóvel encontrado'
                ]);
            }

            $features = [];
            
            foreach ($imoveis as $imovel) {
                try {
                    $geojson = json_decode($imovel->geojson, true);
                    
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        continue;
                    }

                    $features[] = [
                        'type' => 'Feature',
                

        'properties' => [
                            'id' => $imovel->id,
                            'cod_imovel' => $imovel->cod_imovel,
                            'type' => 'imovel',
                        ],
                        'geometry' => $geojson,
                    ];
                } catch (\Exception $e) {
                    continue;
                }
            }

            return response()->json([
                'type' => 'FeatureCollection',
                'features' => $features,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao carregar imóveis',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile())
            ], 500);
        }
    }

    private function calculateCentroid($geojson)
    {
        if (!$geojson || !isset($geojson['coordinates']) || !isset($geojson['type'])) {
            return null;


        }

        $coordinates = $geojson['coordinates'];
        $allPoints = [];

        try {
            switch ($geojson['type']) {
                case 'MultiLineString':
                    foreach ($coordinates as $lineString) {
                        foreach ($lineString as $point) {
                            if (is_array($point) && count($point) >= 2) {
                                $allPoints[] = $point;
                            }
                        }
                    }
                    break;
                
                case 'LineString':
                    foreach ($coordinates as $point) {
                        if (is_array($point) && count($point) >= 2) {
                            $allPoints[] = $point;
                        }
                    }
                    break;
                
                case 'Polygon':
                    foreach ($coordinates as $ring) {
                        foreach ($ring as $point) {
                            

if (is_array($point) && count($point) >= 2) {
                                $allPoints[] = $point;
                            }
                        }
                    }
                    break;
                
                case 'MultiPolygon':
                    foreach ($coordinates as $polygon) {
                        foreach ($polygon as $ring) {
                            foreach ($ring as $point) {
                                if (is_array($point) && count($point) >= 2) {
                                    $allPoints[] = $point;
                                }
                            }
                        }
                    }
                    break;
                
                case 'Point':
                    return $coordinates;
                
                case 'MultiPoint':
                    foreach ($coordinates as $point) {
                        if (is_array($point) && count($point) >= 2) {
                            $allPoints[] = $point;


                        }
                    }
                    break;
            }

            if (empty($allPoints)) {
                return null;
            }

            $sumLng = 0;
            $sumLat = 0;
            $count = count($allPoints);

            foreach ($allPoints as $point) {
                $sumLng += $point[0];
                $sumLat += $point[1];
            }

            return [$sumLng / $count, $sumLat / $count];
        } catch (\Exception $e) {
            return null;
        }
    }
}