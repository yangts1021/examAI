#!/usr/bin/env node
// ============================================================
// ExamAI Upload Tool - Local Server
//
// 啟動方式:  node upload-tool/server.js
// 開啟網頁:  http://localhost:3456
//
// 功能:
//   - 提供上傳工具網頁
//   - Claude CLI 模式：接收圖片 → 呼叫 claude -p → 回傳 JSON
//   - 不需要任何 API Key (使用已登入的 claude CLI)
// ============================================================

import { createServer } from 'http';
import https from 'https';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3456;


function execPromise(cmd, options) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) reject({ error, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

async function runClaude(imagePaths) {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = '128000';
  const execOpts = { env, cwd: dirname(__dirname), maxBuffer: 50 * 1024 * 1024 };

  // Warmup: run a quick claude command first (this seems to help)
  console.log(`[warmup] claude -p ...`);
  try {
    const { stdout: warmup } = await execPromise('echo "reply OK" | claude -p', execOpts);
    console.log(`[warmup] 結果: ${warmup.trim()}`);
  } catch (e) {
    console.error(`[warmup] 失敗:`, e.error?.message || e);
  }

  // Build full prompt with heredoc to support multi-line
  const fileListStr = imagePaths.map(f => `- ${f}`).join('\n');
  const prompt = `Analyze exam paper image(s). Output ONLY valid JSON, no markdown.

Format: {"subject":"","scope":"","questions":[{"questionNumber":1,"text":"","optionA":"","optionB":"","optionC":"","optionD":"","correctAnswer":"A","explanation":"","diagramCoordinates":[ymin,xmin,ymax,xmax],"groupId":"","groupContent":""}]}

Rules:
1. Extract ALL questions. Solve each, set correctAnswer (A/B/C/D).
2. explanation: 1-2 sentences why the answer is correct.
3. If questions share context, use same groupId and put shared passage in groupContent.
4. If question has a diagram/figure, provide diagramCoordinates [ymin,xmin,ymax,xmax] on 0-1000 scale. Otherwise omit.
5. All text in Traditional Chinese.

Image(s):
${fileListStr}`;

  // Use heredoc to pipe multi-line prompt to claude -p
  const escaped = prompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const cmd = `cat <<'EXAMAI_PROMPT_EOF' | claude -p --model claude-opus-4-6\n${escaped}\nEXAMAI_PROMPT_EOF`;
  console.log(`[執行] prompt length: ${prompt.length}`);

  try {
    const { stdout, stderr } = await execPromise(cmd, execOpts);
    if (stderr) process.stderr.write(`[claude stderr] ${stderr}\n`);
    if (stdout) process.stdout.write(`[claude stdout] ${stdout.length} bytes received\n`);
    return stdout;
  } catch ({ error, stdout, stderr }) {
    if (stderr) process.stderr.write(`[claude stderr] ${stderr}\n`);
    throw new Error(`Claude CLI 執行失敗 (exit ${error.code}): ${stderr || stdout || error.message}`);
  }
}

function extractJson(text) {
  // Clean up: remove leading/trailing whitespace
  const trimmed = text.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Try extracting from markdown code block (greedy to get the largest block)
  const codeBlockMatches = [...trimmed.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/g)];
  for (const match of codeBlockMatches) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  // Try finding the largest JSON object in the text
  // Look for opening { and find its matching closing }
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace !== -1) {
    // Try from the first { to the last }
    const lastBrace = trimmed.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
  }

  throw new Error(`無法從 Claude 回應中解析 JSON。回應前 200 字: ${trimmed.substring(0, 200)}`);
}

async function handleAnalyze(req, res) {
  console.log('[收到分析請求]');

  // Prevent socket timeout during long-running analysis
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true, 30000);

  let body = '';
  try {
    for await (const chunk of req) body += chunk;
  } catch (err) {
    console.error('[錯誤] 讀取請求 body 失敗:', err.message);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '讀取請求失敗' }));
    return;
  }

  console.log(`[請求大小] ${(body.length / 1024 / 1024).toFixed(2)} MB`);

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    console.error('[錯誤] JSON 解析失敗');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '無效的 JSON 請求' }));
    return;
  }

  const { images } = payload; // Array of { data: base64, mimeType: string }
  if (!images || !images.length) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '未提供圖片' }));
    return;
  }

  // Save images to project .tmp dir (claude -p has permission to read project files)
  const tmpDir = join(__dirname, '.tmp');
  try { await mkdir(tmpDir, { recursive: true }); } catch {}
  const tmpFiles = [];

  try {
    for (let i = 0; i < images.length; i++) {
      const ext = images[i].mimeType.includes('png') ? '.png' : '.jpg';
      const filePath = join(tmpDir, `exam_${i}${ext}`);
      const buffer = Buffer.from(images[i].data, 'base64');
      await writeFile(filePath, buffer);
      tmpFiles.push(filePath);
    }

    console.log(`[分析中] 使用 Claude CLI 處理 ${tmpFiles.length} 張圖片...`);

    // Start chunked response with heartbeat to keep connection alive
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });

    const heartbeat = setInterval(() => {
      try { res.write(' '); } catch {}
    }, 15000);

    let result;
    try {
      result = await runClaude(tmpFiles);
    } finally {
      clearInterval(heartbeat);
    }

    console.log(`[Claude 原始回應] (前 500 字):\n${result.substring(0, 500)}\n---`);
    const data = extractJson(result);

    console.log(`[完成] 解析出 ${data.questions?.length || 0} 題`);

    // Send the actual JSON result
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error('[錯誤]', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    for (const f of tmpFiles) {
      try { await unlink(f); } catch {}
    }
  }
}

async function handleSave(req, res) {
  console.log('[收到儲存請求]');

  let body = '';
  try {
    for await (const chunk of req) body += chunk;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '讀取請求失敗' }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '無效的 JSON' }));
    return;
  }

  const gasUrl = payload.gasUrl;
  if (!gasUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '未提供 GAS URL' }));
    return;
  }

  const gasBody = JSON.stringify({ action: payload.action, data: payload.data });

  try {
    const gasResult = await new Promise((resolve, reject) => {
      const gasReq = https.request(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      }, (gasRes) => {
        // Follow redirects (GAS does 302)
        if (gasRes.statusCode >= 300 && gasRes.statusCode < 400 && gasRes.headers.location) {
          https.get(gasRes.headers.location, (redirectRes) => {
            let data = '';
            redirectRes.on('data', (c) => data += c);
            redirectRes.on('end', () => resolve(data));
          }).on('error', reject);
          return;
        }
        let data = '';
        gasRes.on('data', (c) => data += c);
        gasRes.on('end', () => resolve(data));
      });
      gasReq.on('error', reject);
      gasReq.write(gasBody);
      gasReq.end();
    });

    console.log(`[GAS 回應] ${gasResult.substring(0, 200)}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(gasResult);
  } catch (err) {
    console.error('[GAS 錯誤]', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'GAS 請求失敗: ' + err.message }));
  }
}

async function handleRequest(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const html = await readFile(join(__dirname, 'index.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('找不到 index.html');
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/analyze') {
    await handleAnalyze(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/save') {
    await handleSave(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

process.on('uncaughtException', (err) => {
  console.error('[未捕獲例外]', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[未處理的 Promise 拒絕]', err);
});

const server = createServer(handleRequest);
server.timeout = 0; // Disable socket timeout entirely
server.keepAliveTimeout = 600000;
server.headersTimeout = 600000;
server.requestTimeout = 600000;
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   ExamAI 上傳工具 - 本地伺服器啟動      ║');
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log('  ║                                          ║');
  console.log('  ║   支援模式:                              ║');
  console.log('  ║   • Gemini API (需 API Key)              ║');
  console.log('  ║   • Claude CLI (免 API Key)              ║');
  console.log('  ║                                          ║');
  console.log('  ║   按 Ctrl+C 停止                        ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
