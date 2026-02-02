const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let token = null;

    // 1. Intentamos sacar el token del body (donde Salesforce lo mete)
    if (req.method === 'POST') {
        if (req.body && req.body.jwt) {
            token = req.body.jwt;
        } else if (typeof req.body === 'string') {
            // Caso 2: Viene como string tipo "jwt=valor..."
            const params = new URLSearchParams(req.body);
            token = params.get('jwt');
        } else if (req.body && typeof req.body === 'object') {
            // Caso 3: Viene como objeto pero sin la llave directa
            token = Object.keys(req.body)[0] === 'jwt' ? req.body.jwt : null;
        }
    }

    // 2. Si encontramos algo, lo procesamos
    if (token) {
        try {
            jwt.verify(token, secret);
            // Reemplazamos el mensaje de espera por el JWT real
            html = html.replace('Esperando interacción de Salesforce...', token);
        } catch (err) {
            // Si el token llega pero la firma falla (Secret mal puesto en Vercel)
            html = html.replace('Esperando interacción de Salesforce...', 'TOKEN RECIBIDO, PERO FIRMA INVÁLIDA (Revisa el Secret)');
        }
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};