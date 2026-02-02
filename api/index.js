const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Si entras por el navegador (GET), te damos el 403 que ya viste
    if (req.method !== 'POST') {
        return res.status(403).send('403 - Acceso Denegado');
    }

    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET;

    try {
        // Validamos el JWT
        jwt.verify(token, secret);

        // Leemos el template.html de la RAÍZ
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // INYECTAMOS EL TOKEN: Esto llena el div vacío
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        res.status(401).send('Error de validación JWT');
    }
};