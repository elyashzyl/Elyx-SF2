<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckMessengerEnabled
{
    public function handle(Request $request, Closure $next)
    {
        $disabled = DB::table('settings')->where('key', 'messenger_system_enabled')->value('value') === 'false';
        if ($disabled) {
            abort(404);
        }
        return $next($request);
    }
}
