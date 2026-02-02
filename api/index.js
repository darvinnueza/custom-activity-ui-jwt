const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;

    // Si entras desde el navegador (GET), bloqueamos
    if (req.method !== 'POST') {
        return res.status(403).send('Acceso Denegado: Solo via Salesforce MC.');
    }

    const token = req.body.jwt;

    if (!token) {
        return res.status(401).send('Error: No se recibió el token JWT.');
    }

    try {
        // Validamos el token
        jwt.verify(token, secret);

        // Leemos el template.html que tienes en la raíz
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Reemplazamos el marcador con el token real
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        return res.status(401).send('Error de Seguridad: JWT inválido o Secret mal configurado.');
    }
};