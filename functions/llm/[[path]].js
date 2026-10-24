/**
 * Cloudflare Pages Function —— 同源中转，专门解决"服务商不返回 CORS 头"的问题。
 *
 * 背景：浏览器里的页面直接请求大模型 API 时，服务商必须返回
 * Access-Control-Allow-Origin 才放行。DashScope / DeepSeek / Kimi / 硅基流动
 * 都会返回，智谱 GLM（open.bigmodel.cn）不返回 —— 于是浏览器直接报
 * "Failed to fetch"。把这个请求先发到同源的 /llm/xxx，再由这里用服务器身份
 * 转发给上游，就不存在跨域问题了。
 *
 * 用法（接口地址一栏填相对路径即可）：
 *   /llm/zhipu       → 智谱 GLM
 *   /llm/dashscope   → 阿里云百炼
 *   /llm/deepseek    → DeepSeek
 *   /llm/moonshot    → Kimi
 *   /llm/siliconflow → 硅基流动
 *   /llm?url=https://任意服务商/v1/chat/completions   → 手动指定
 *
 * API Key 仍由页面放在 Authorization: Bearer xxx 里发送，这里原样转发，
 * 不会落盘、不会打印。
 */

const PROVIDERS = {
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  moonshot: "https://api.moonshot.cn/v1/chat/completions",
  siliconflow: "https://api.siliconflow.cn/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

const ALIASES = Object.keys(PROVIDERS);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request) },
  });
}

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const seg = Array.isArray(params.path) ? params.path.join("/") : params.path || "";

  // 直接访问 /llm 时给出说明书，方便自查
  if (request.method === "GET" && !seg) {
    return json(
      {
        ok: true,
        message: "同源中转已就绪。把接口地址填成 /llm/<服务商> 即可。",
        providers: ALIASES.map((name) => ({ name, url: "/llm/" + name, upstream: PROVIDERS[name] })),
        custom: "/llm?url=https://完整地址/chat/completions",
      },
      200,
      request
    );
  }

  if (request.method !== "POST") {
    return json({ error: { message: "只支持 POST 请求" } }, 405, request);
  }

  let target = PROVIDERS[seg];
  if (!target) {
    const custom = new URL(request.url).searchParams.get("url");
    if (custom && /^https?:\/\//i.test(custom)) target = custom;
  }
  if (!target) {
    return json(
      {
        error: {
          message: `未知的服务商 "${seg || "(空)"}"。可用：${ALIASES.join("、")}；也可以写成 /llm?url=<完整接口地址>`,
        },
      },
      400,
      request
    );
  }

  const body = await request.text();
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers.Authorization = auth;

  let upstream;
  try {
    upstream = await fetch(target, { method: "POST", headers, body });
  } catch (err) {
    return json(
      { error: { message: `中转请求上游失败：${err && err.message ? err.message : err}`, target } },
      502,
      request
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      "X-Proxy-Target": target,
      ...corsHeaders(request),
    },
  });
}
