<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GeoController;

Route::options('{any}', function () {
    return response()->json([], 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin');
})->where('any', '.*');

Route::get('/test-connection', [GeoController::class, 'testConnection']);
Route::get('/estados', [GeoController::class, 'getEstados']);
Route::get('/municipios/{ufId}', [GeoController::class, 'getMunicipios']);
Route::get('/imoveis/{municipioId}', [GeoController::class, 'getImoveis']);