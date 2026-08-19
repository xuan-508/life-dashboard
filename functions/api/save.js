// Cloudflare Pages Function: /api/save
// 接收 POST { module, data, secret }，校验 secret 后写入 KV

const ALLOWED_MODULES = [
  'ld_accounts',
  'ld_habits',
  'ld_habit_logs',
  'ld_fitness',
  'ld_fitness_goal',
  'ld_fitness_height',
  'ld_schedule',
  'ld_shopping',
  'ld_media',
];

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { module, data, secret } = body;

    // 校验 secret
    if (!secret || secret !== env.API_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 校验 module 白名单
    if (!module || !ALLOWED_MODULES.includes(module)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid module' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 写入 KV
    const value = JSON.stringify(data);
    await env.DATA_STORE.put(module, value);

    return new Response(JSON.stringify({ ok: true, module, size: value.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// GET 请求返回简单说明
export async function onRequestGet({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  return new Response(
    JSON.stringify({ endpoint: '/api/save', method: 'POST', description: 'Save module data to KV' }),
    { headers: corsHeaders }
  );
}
