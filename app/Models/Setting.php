<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public $timestamps = false;
    protected $fillable = ['key', 'value'];

    public $incrementing = false;

    protected $keyType = 'string';

    protected $primaryKey = 'key';
}
