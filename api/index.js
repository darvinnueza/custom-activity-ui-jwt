const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let debugInfo = "";
    let token = null;

    if (req.method === 'POST') {
        // Intentamos capturar el token de todas las formas
        if (req.body && req.body.jwt) {
            token = req.body.jwt;
        } else if (typeof req.body === 'string') {
            const params = new URLSearchParams(req.body);
            token = params.get('jwt');
        }
        
        // Si sigue sin haber token, guardamos qué diablos llegó en el body
        if (!token) {
            debugInfo = "POST recibido pero sin campo JWT. Body: " + JSON.stringify(req.body).substring(0, 50);
        }
    } else {
        debugInfo = "Entraste por navegador (GET), por eso no hay token.";
    }

    if (token) {
        try {
            jwt.verify(token, secret);
            html = html.replace('TOKEN_DE_SESION_AQUI', token); // Asegúrate que este ID esté en tu HTML
        } catch (err) {
            html = html.replace('TOKEN_DE_SESION_AQUI', "ERROR DE VALIDACION: " + err.message);
        }
    } else {
        html = html.replace('TOKEN_DE_SESION_AQUI', debugInfo);
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};