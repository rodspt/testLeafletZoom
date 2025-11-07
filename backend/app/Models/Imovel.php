<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Imovel extends Model
{
    protected $table = '

dw.dm_sicar';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['id', 'cod_imovel', 'municipio_id', 'geojson'];

    protected $casts = [
        'geojson' => 'array',
    ];

    public function municipio()
    {
        return $this->belongsTo(Municipio::class, 'municipio_id');
    }
}