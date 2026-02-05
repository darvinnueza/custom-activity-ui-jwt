import jwt from "jsonwebtoken";

export default async function handler(req, res) {
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!token) return res.status(401).json({ ok: false, error: "missing_bearer" });

        const secret = process.env.UI_JWT_SECRET;
        if (!secret) return res.status(500).json({ ok: false, error: "missing_UI_JWT_SECRET" });

        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
            issuer: "custom-activity-ui-jwt"
        });

        return res.status(200).json({ ok: true, decoded });
    } catch (e) {
        return res.status(401).json({ ok: false, error: "invalid_token", detail: String(e?.message || e) });
    }
}