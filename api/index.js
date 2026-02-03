const fs = require("fs");
const path = require("path");
const jwtLib = require("jsonwebtoken");

function safeJson(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

module.exports = async (req, res) => {
  const SFMC_JWT_SECRET = process.env.SFMC_JWT_SECRET || "";

  // 1) EL JWT REAL normalmente viene en QUERY: ?jwt=xxx.yyy.zzz
  //    (porque este endpoint es el "edit.url" que carga el iframe)
  const jwtFromQuery = req.query && (req.query.jwt || req.query.JWT);

  // 2) A veces llega por body (save/publish/execute), lo dejamos soportado
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      const params = new URLSearchParams(body);
      body = Object.fromEntries(params.entries());
    }
  }
  const jwtFromBody = body && (body.jwt || body.JWT);

  // 3) También existen estos NO-JWT (Fuel tokens) que vienen del requestTokens()
  const tokenFromBody = body && (body.token || body.fuel2token);

  // Elegimos candidato JWT REAL (query primero)
  const jwtCandidate = jwtFromQuery || jwtFromBody || "";

  let verifiedPayload = null;
  let verifyError = null;

  // Validación formato JWT: debe tener 2 puntos => 3 partes
  const looksLikeJwt = typeof jwtCandidate === "string" && jwtCandidate.split(".").length === 3;

  if (!SFMC_JWT_SECRET) {
    verifyError = "Falta SFMC_JWT_SECRET en Vercel.";
  } else if (!jwtCandidate) {
    verifyError =
      "No llegó jwt en query (?jwt=...) ni en body. OJO: token/fuel2token NO es JWT.";
  } else if (!looksLikeJwt) {
    verifyError =
      "Llegó un valor en 'jwt', pero NO tiene formato JWT (no tiene a.b.c). Probablemente estás mirando token/fuel2token.";
  } else {
    try {
      verifiedPayload = jwtLib.verify(jwtCandidate, SFMC_JWT_SECRET);
    } catch (e) {
      verifyError = e.message;
    }
  }

  // Cargamos tu template SIN CAMBIAR DISEÑO
  const htmlPath = path.join(process.cwd(), "template.html");
  let html = fs.readFileSync(htmlPath, "utf8");

  // Panel debug (lo que reemplaza TOKEN_DE_SESION_AQUI)
  const resultado = `
    <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
      <p><strong>1) ¿Llegó JWT real por QUERY? (edit.url)</strong><br>
        <span style="color:#aaa;font-size:11px;">req.query.jwt:</span><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromQuery ? jwtFromQuery : "(vacío)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>2) ¿Llegó JWT por BODY?</strong><br>
        <span style="color:#aaa;font-size:11px;">body.jwt:</span><br>
        <span style="font-size:10px;word-break:break-all;">${jwtFromBody ? jwtFromBody : "(vacío)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>3) Tokens NO-JWT (esto es lo que te confundía)</strong><br>
        <span style="color:#aaa;font-size:11px;">body.token / body.fuel2token:</span><br>
        <span style="font-size:10px;word-break:break-all;">${tokenFromBody ? tokenFromBody : "(vacío)"}</span>
      </p>

      <hr style="border-color:#555;">

      <p><strong>4) Resultado validación JWT</strong><br>
        ${
          verifiedPayload
            ? `<span style="color:#0f0;">✅ JWT VÁLIDO</span>
               <pre style="font-size:11px;white-space:pre-wrap;word-break:break-all;color:#fff;margin-top:10px;">${safeJson(verifiedPayload)}</pre>`
            : `<span style="color:#ff4444;">❌ NO AUTORIZADO:</span>
               <span style="color:#ffaaaa;">${verifyError || "sin detalle"}</span>`
        }
      </p>

      <p style="margin-top:10px;font-size:12px;color:#fff;"><strong>MÉTODO:</strong> ${req.method}</p>
    </div>
  `;

  html = html.replace("TOKEN_DE_SESION_AQUI", resultado);
  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
};