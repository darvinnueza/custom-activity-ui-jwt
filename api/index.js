const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Si entras por navegador, verás el 403 que ya tienes
    if (req.method !== 'POST') {
        return res.status(403).send('Acceso Denegado: Solo via Salesforce MC.');
    }

    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET;

    try {
        // Validamos el token
        jwt.verify(token, secret);

        // Leemos el template.html que tienes en la raíz
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Metemos el token en el HTML
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    } catch (err) {
        // Si el secreto está mal o el token es viejo
        return res.status(401).send('Error de Seguridad: JWT no válido o Secret incorrecto.');
    }
};