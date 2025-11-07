<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estado extends Model
{
    protected $table = 'dw.dm_uf';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['id', 'nm_uf', 'geojson', 'quantidade'];

    protected $casts = [
        'geojson' => 'array',
        'quantidade' => 'integer',
    ];

    public function municipios()
    {
        return $this->hasMany(Municipio::class, 'uf_id');
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