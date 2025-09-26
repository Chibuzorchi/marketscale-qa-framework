<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/record', function () {
    return view('record');
});

Route::get('/library', function () {
    return view('library');
});

Route::get('/requests', function () {
    return view('requests');
});
