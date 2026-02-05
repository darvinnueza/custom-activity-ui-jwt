import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

    try {
        const { tokens, journeyId, activityId, mid } = req.body || {};

        // Validación mínima (modo “soft”): si no viene tokens, NO habilitas UI
        // OJO: en SFMC a veces tokens trae fuel2token, token, restHost, etc.
        const hasSomething = !!tokens && (
            !!tokens.token || !!tokens.fuel2token || !!tokens.legacyToken || !!tokens.restHost
        );

        if (!hasSomething) {
            return res.status(401).json({ ok: false, error: "unauthorized", reason: "missing_tokens" });
        }

        const secret = process.env.UI_JWT_SECRET;
        if (!secret) return res.status(500).json({ ok: false, error: "missing_UI_JWT_SECRET" });

        const ttl = Number(process.env.UI_JWT_TTL_SECONDS || "600"); // 10 min por defecto

        const ui_jwt = jwt.sign(
            {
                typ: "ui",
                journeyId: journeyId || null,
                activityId: activityId || null,
                mid: mid || null
            },
            secret,
            {
                algorithm: "HS256",
                expiresIn: ttl,
                issuer: "custom-activity-ui-jwt"
            }
        );

        return res.status(200).json({ ok: true, ui_jwt, expires_in: ttl });
    } catch (e) {
        return res.status(500).json({ ok: false, error: "session_error", detail: String(e?.message || e) });
    }
}