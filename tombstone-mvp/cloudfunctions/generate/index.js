const https = require('https');
const { URL } = require('url');

// ===== 配置：换成你的模型服务（豆包/通义/GLM/Moonshot 等 OpenAI 兼容端点）=====
// 推荐用环境变量注入，避免把 key 写进代码仓库。
const CONFIG = {
  baseUrl: (process.env.LLM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, ''),
  apiKey: process.env.LLM_API_KEY || 'YOUR_API_KEY',
  model: process.env.LLM_MODEL || 'YOUR_MODEL_ID'
};

const SYSTEM = '你是「人生墓碑」的文案主笔，专长是把普通人的小毛病写成一针见血、又好笑又暖的段子。';

exports.main = async (event) => {
  const { mode, name, tags, experience, relation } = event || {};
  const user = buildPrompt({ mode, name, tags, experience, relation });
  try {
    const content = await chat(SYSTEM, user);
    const data = extractJson(content);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
};

function buildPrompt({ mode, name, tags, experience, relation }) {
  const isFriend = mode === 'friend';
  return `【任务】根据用户输入生成一张"墓碑卡片"的内容，严格输出 JSON，不要输出任何额外文字或解释。

【输入变量】
- 模式 mode：${mode}
- 主角名 name：${name}
- 性格标签 tags：${(tags && tags.length) ? tags.join('、') : '（无）'}
- 经历/口头禅 experience：${experience || '（无）'}
- 关系 relation：${relation || '（无）'}

【输出 JSON 结构】
{
  "epitaph": "一句话墓志铭，≤30字",
  "highlights": ["高光回顾1","高光回顾2","高光回顾3","高光回顾4"],
  "comments": ["寄语1","寄语2","寄语3"]
}

【文案基调】
1. "毒舌但治愈"：损得要准，但落脚点是暖，让人会心一笑而非难堪。
2. "荒谬化"：把日常小毛病夸张成史诗级成就，制造反差。
3. 金句感：墓志铭要能单独截图传播。
4. 必须贴合用户给的标签和经历，禁止套用万能模板。

【硬性约束（违反即不合格）】
- 禁止暴力、自伤/自杀倾向、歧视、涉黄、政治内容。
${isFriend ? '- friend 模式必须"夸损参半"：每条贬损都需搭配一个优点或夸赞，禁止纯贬损、外貌羞辱、人身攻击。' : ''}
- 不输出任何与"真实死亡"相关的沉重内容，只玩"人生阶段总结"的梗。

【亲友寄语口吻映射】
- 死党：损友式，互怼但护短
- 同事：职场吐槽式
- 对象：又爱又恨式
- 亲戚：催婚/关心式

只输出 JSON。`;
}

function chat(system, user) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl + '/chat/completions');
    const payload = JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.9,
      max_tokens: 800
    });

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.apiKey,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error('模型接口错误 HTTP ' + res.statusCode + ': ' + body.slice(0, 200)));
          return;
        }
        try {
          const json = JSON.parse(body);
          const content = (json.choices && json.choices[0] && json.choices[0].message)
            ? json.choices[0].message.content
            : '';
          resolve(content);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractJson(text) {
  const s = String(text || '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a === -1 || b === -1 || b <= a) throw new Error('模型未返回有效 JSON');
  const data = JSON.parse(s.slice(a, b + 1));
  if (!data.epitaph || !Array.isArray(data.highlights) || !Array.isArray(data.comments)) {
    throw new Error('返回结构不完整');
  }
  return {
    epitaph: String(data.epitaph).slice(0, 40),
    highlights: data.highlights.slice(0, 4).map(String),
    comments: data.comments.slice(0, 3).map(String)
  };
}
