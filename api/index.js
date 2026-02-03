const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // 1. Configuramos los permisos (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const secret = process.env.SFMC_JWT_SECRET;

    if (req.method === 'POST') {
        const token = req.body.jwt;

        try {
            // AQUÍ DECODIFICAMOS EL TOKEN
            const decoded = jwt.verify(token, secret);

            // Devolvemos un JSON con la data real para que la veas
            return res.status(200).send(`
                <div style="background: #1a1a1a; color: #00ff00; padding: 15px; font-family: monospace; border: 1px solid #333;">
                    <h4 style="margin-top:0;">✅ JWT DECODIFICADO</h4>
                    <p><b>Activity ID:</b> ${decoded.activityId}</p>
                    <p><b>Contact Key:</b> ${decoded.contactKey || 'Disponible en ejecución'}</p>
                    <hr>
                    <p style="font-size: 10px; color: #888;">Este es el contenido real que tu VoiceBot procesará.</p>
                </div>
            `);
        } catch (err) {
            return res.status(401).send(`<div style="color:red;">Error de firma: ${err.message}</div>`);
        }
    }

    res.status(200).send("Listo para recibir el Token...");
};