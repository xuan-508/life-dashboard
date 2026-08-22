// Cloudflare Pages Function: /api/load
// 接收 POST { module, secret } 或 GET ?module=xxx&secret=xxx，校验后从 KV 读取数据

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// POST 方式：body = { module, secret }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { module, secret } = body;

    // 校验 secret
    if (!secret || secret !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 校验 module 非空（不做白名单限制，个人应用有 secret 校验即可）
    if (!module) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing module' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 从 KV 读取
    const value = await env.PORTFOLIO_KV.get(module);
    const data = value ? JSON.parse(value) : null;

    return new Response(JSON.stringify({ ok: true, module, data }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// GET 方式：?module=xxx&secret=xxx
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const module = url.searchParams.get('module');
    const secret = url.searchParams.get('secret');

    // 校验 secret
    if (!secret || secret !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 校验 module 非空
    if (!module) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing module' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 从 KV 读取
    const value = await env.PORTFOLIO_KV.get(module);
    const data = value ? JSON.parse(value) : null;

    return new Response(JSON.stringify({ ok: true, module, data }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
