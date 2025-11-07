<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Municipio extends Model
{
    protected $table = 'dw.dm_municipio';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['id', 'uf_id', 'nm_municipio', 'geojson', 'quantidade'];

    protecte

d $casts = [
        'geojson' => 'array',
        'quantidade' => 'integer',
    ];

    public function estado()
    {
        return $this->belongsTo(Estado::class, 'uf_id');
    }

    public function imoveis()
    {
        return $this->hasMany(Imovel::class, 'municipio_id');
    }

    public function getCentroidAttribute()
    {
        if (!$this->geojson) {
            return null;
        }

        $geojson = is_string($this->geojson) ? json_decode($this->geojson, true) : $this->geojson;
        
        if (!isset($geojson['coordinates'])) {
            return null;
        }

        $coordinates = $geojson['coordinates'];
        $allPoints = [];

        if ($geojson['type'] === 'MultiLineString') {
            foreach ($coordinates as $lineString) {
                foreach ($lineString as $point) {
                    $allPoints[] = $point;
                }
            }
        } elseif ($geojson['type'] === 'LineString') {
            $allPoints = $coordinates;
        } el

seif ($geojson['type'] === 'Polygon') {
            foreach ($coordinates as $ring) {
                foreach ($ring as $point) {
                    $allPoints[] = $point;
                }
            }
        } elseif ($geojson['type'] === 'MultiPolygon') {
            foreach ($coordinates as $polygon) {
                foreach ($polygon as $ring) {
                    foreach ($ring as $point) {
                        $allPoints[] = $point;
                    }
                }
            }
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
    }
}