/**
 * 体彩 API 代理 — Vercel Serverless Function
 * 将 /tc-api/* 请求转发到 webapi.sporttery.cn，附带正确的 Referer 头
 */
export default async function handler(req) {
  const url = new URL(req.url);

  // 去掉 /api/tc-proxy 前缀，拼接体彩官网路径
  const targetPath = url.pathname.replace('/api/tc-proxy', '');
  const targetUrl = `https://webapi.sporttery.cn${targetPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Referer: 'https://www.lottery.gov.cn/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: `代理请求失败: ${e.message}` }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
