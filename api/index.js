const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  const secret = process.env.SFMC_JWT_SECRET || "";
  let tokenRecibido = "";
  let verificacionHtml = "";
  let payloadHtml = "";
  let estadoHtml = `<span style="color:#ff4444;">NO VALIDADO</span>`;

  // Solo permitimos POST (porque ahí viene el JWT)
  if (req.method !== "POST") {
    const htmlPath = path.join(process.cwd(), "template.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    html = html.replace(
      "TOKEN_DE_SESION_AQUI",
      `<div style="background:#000;color:#fff;padding:15px;font-family:monospace;border:2px solid #fff;">
        <p><strong>Esperando POST desde Journey Builder...</strong></p>
        <p style="font-size:12px;color:#aaa;">Método actual: ${req.method}</p>
      </div>`
    );

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  }

  // --- Parse body robusto (JSON o x-www-form-urlencoded) ---
  let body = req.body;
  try {
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }
  } catch (e) {
    body = {};
  }

  // --- Extraer JWT ---
  // SFMC normalmente lo manda como body.jwt cuando useJwt=true
  tokenRecibido = body?.jwt || body?.JWT || "";

  // fallback: Authorization: Bearer <token>
  if (!tokenRecibido && req.headers && req.headers.authorization) {
    const m = req.headers.authorization.match(/^Bearer\s+(.+)$/i);
    if (m) tokenRecibido = m[1];
  }

  // Si no llegó token, 401
  if (!tokenRecibido) {
    return res.status(401).send("NO AUTORIZADO: no llegó JWT");
  }

  // --- Validar que parezca JWT (3 partes con puntos) ---
  const partes = tokenRecibido.split(".");
  if (partes.length !== 3) {
    return res
      .status(401)
      .send("NO AUTORIZADO: el token recibido NO es un JWT válido (formato).");
  }

  // --- Verificar firma con tu SFMC_JWT_SECRET ---
  try {
    if (!secret) {
      return res.status(500).send("ERROR: SFMC_JWT_SECRET no está configurado.");
    }

    const decoded = jwt.verify(tokenRecibido, secret);

    estadoHtml = `<span style="color:#0f0;">VALIDADO ✅</span>`;
    verificacionHtml = `<p><strong>JWT:</strong> ${estadoHtml}</p>`;

    payloadHtml = `
      <div style="margin-top: 15px; background: #111; color: #fff; padding: 10px; border: 1px dashed #0f0;">
        <strong style="color: #0f0;">PAYLOAD (JWT VERIFIED):</strong>
        <pre style="font-size: 11px; white-space: pre-wrap; word-break: break-all; color: #fff; margin-top: 10px;">${JSON.stringify(decoded, null, 2)}</pre>
      </div>
    `;
  } catch (err) {
    return res.status(401).send(`NO AUTORIZADO: JWT inválido (${err.message})`);
  }

  // --- Render HTML (SIN mostrar el secret) ---
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  const resultado = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      ${verificacionHtml}
      <hr style="border-color:#555;">
      <p><strong>Token recibido:</strong><br>
        <span style="font-size:10px;word-break:break-all;color:#9f9;">${tokenRecibido}</span>
      </p>
      ${payloadHtml}
      <p style="margin-top:15px;font-size:12px;color:#fff;"><strong>MÉTODO:</strong> ${req.method}</p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", resultado);
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
};