const jwtLib = require("jsonwebtoken");

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET || "";
    const jwtFromQuery = req.query && (req.query.jwt || req.query.JWT);

    if (!secret) return res.status(500).json({ ok: false, error: "Missing SFMC_JWT_SECRET" });
    if (!jwtFromQuery) return res.status(401).json({ ok: false, error: "No jwt in query" });

    const looksLikeJwt = jwtFromQuery.split(".").length === 3;
    if (!looksLikeJwt) return res.status(401).json({ ok: false, error: "Not a JWT format" });

    try {
        const decoded = jwtLib.verify(jwtFromQuery, secret);
        return res.status(200).json({ ok: true, decoded });
    } catch (e) {
        return res.status(401).json({ ok: false, error: e.message });
    }
};