const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;

    // 1. Bloqueo de seguridad que ya viste que funciona
    if (req.method !== 'POST') {
        return res.status(403).send('Acceso Denegado: Solo via Salesforce MC.');
    }

    // 2. Extraer el JWT (Vercel procesa el body automáticamente si es JSON)
    const token = req.body.jwt;

    if (!token) {
        return res.status(401).send('Error: No se recibió el token JWT.');
    }

    try {
        // 3. Validar identidad
        jwt.verify(token, secret);

        // 4. Leer y enviar el HTML
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Inyectamos el token en tu recuadro gris
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    } catch (err) {
        return res.status(401).send('Error de Seguridad: JWT inválido.');
    }
};