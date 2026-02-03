const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Habilitamos CORS para que Salesforce no bloquee la respuesta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const secret = process.env.SFMC_JWT_SECRET;
    let tokenData = null;

    // 2. Si recibimos el POST con el JWT
    if (req.method === 'POST') {
        const token = req.body.jwt;
        if (token) {
            try {
                // AQUÍ ES DONDE "ABRIMOS EL SOBRE"
                tokenData = jwt.verify(token, secret);
            } catch (err) {
                console.error("Error validando JWT:", err.message);
            }
        }
    }

    // 3. Cargamos el HTML original para no romper la interfaz
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Si logramos decodificar el token, mostramos los datos reales en el cuadro
    if (tokenData) {
        const infoReal = `
            <div style="background: #002b36; color: #859900; padding: 10px; font-family: monospace; font-size: 11px;">
                <b>¡TOKEN DECODIFICADO CON ÉXITO!</b><br>
                MERCADO: ${tokenData.fuel2token ? 'Conectado' : 'Pendiente'}<br>
                ACTIVITY ID: ${tokenData.activityId}<br>
                <details><summary>Ver JSON completo</summary>${JSON.stringify(tokenData, null, 2)}</details>
            </div>
        `;
        html = html.replace('TOKEN_DE_SESION_AQUI', infoReal);
    } else {
        html = html.replace('TOKEN_DE_SESION_AQUI', "Esperando validación final...");
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};