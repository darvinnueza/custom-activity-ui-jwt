const fs = require("fs");
const path = require("path");
const jwtLib = require("jsonwebtoken");

function safeJson(obj) {
    try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

// Si req.query viene vacío, sacamos query desde la URL
function getQueryJwt(req) {
    try {
        const fullUrl = req.url || "";
        const q = fullUrl.includes("?") ? fullUrl.split("?")[1] : "";
        if (!q) return "";
        const params = new URLSearchParams(q);
        return params.get("jwt") || params.get("JWT") || "";
    } catch {
        return "";
    }
}

function getBearer(req) {
    const auth = req.headers?.authorization || req.headers?.Authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : "";
}

module.exports = async (req, res) => {
    const SFMC_JWT_SECRET = process.env.SFMC_JWT_SECRET || "";

    // 1) JWT por query (edit/configModal)
    const jwtFromReqQuery = (req.query && (req.query.jwt || req.query.JWT)) || "";
    const jwtFromUrl = getQueryJwt(req);
    const jwtFromQuery = jwtFromReqQuery || jwtFromUrl;

    // 2) JWT por Authorization header
    const jwtFromAuth = getBearer(req);

    // 3) JWT por body (save/publish/execute)
    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch {
            const params = new URLSearchParams(body);
            body = Object.fromEntries(params.entries());
        }
    }
    const jwtFromBody = (body && (body.jwt || body.JWT)) || "";

    // 4) Tokens NO-JWT (solo para que veas lo que te confundía)
    const tokenFromBody = (body && (body.token || body.fuel2token)) || "";

    // Elegimos candidato (prioridad: query -> auth -> body)
    const jwtCandidate = jwtFromQuery || jwtFromAuth || jwtFromBody || "";

    let verifiedPayload = null;
    let verifyError = null;

    const looksLikeJwt =
        typeof jwtCandidate === "string" && jwtCandidate.split(".").length === 3;

    if (!SFMC_JWT_SECRET) {
        verifyError = "Falta SFMC_JWT_SECRET en Vercel.";
    } else if (!jwtCandidate) {
        verifyError =
        "No llegó JWT en query/auth/body. (token/fuel2token NO es JWT).";
    } else if (!looksLikeJwt) {
        verifyError =
        "Llegó un valor, pero NO tiene formato JWT a.b.c (3 partes).";
    } else {
        try {
            verifiedPayload = jwtLib.verify(jwtCandidate, SFMC_JWT_SECRET);
        } catch (e) {
            verifyError = e.message;
        }
    }

    // Render template (sin cambiar tu diseño)
    const htmlPath = path.join(process.cwd(), "template.html");
    let html = fs.readFileSync(htmlPath, "utf8");

    const resultado = `
        <div style="background:#000;color:#0f0;padding:15px;font-family:monospace;border:2px solid #fff;">
        <p><strong>SECRET (Vercel):</strong><br>
            <span style="color:#888;font-size:10px;word-break:break-all;">${SFMC_JWT_SECRET || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>1) JWT por QUERY</strong><br>
            <span style="color:#aaa;font-size:11px;">req.query / url ?jwt=</span><br>
            <span style="font-size:10px;word-break:break-all;">${jwtFromQuery || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>2) JWT por Authorization: Bearer</strong><br>
            <span style="font-size:10px;word-break:break-all;">${jwtFromAuth || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>3) JWT por BODY</strong><br>
            <span style="font-size:10px;word-break:break-all;">${jwtFromBody || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>4) Tokens NO-JWT (solo debug)</strong><br>
            <span style="font-size:10px;word-break:break-all;">${tokenFromBody || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>5) JWT elegido</strong><br>
            <span style="font-size:10px;word-break:break-all;color:#9f9;">${jwtCandidate || "(vacío)"}</span>
        </p>

        <hr style="border-color:#555;">

        <p><strong>6) Resultado validación JWT</strong><br>
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