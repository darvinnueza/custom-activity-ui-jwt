const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    
    // 1. Detectamos el token de Salesforce
    // Salesforce lo envía como un string plano en el body bajo la llave 'jwt'
    const token = req.body ? req.body.jwt : null;

    // 2. Si no hay token (acceso desde navegador), mostramos el aviso de seguridad
    if (!token) {
        return res.status(403).send('<h1>Acceso Denegado</h1><p>Esta UI solo es accesible desde Salesforce.</p>');
    }

    try {
        // 3. Validamos que el token sea legítimo usando tu Secret de Vercel
        jwt.verify(token, secret);

        // 4. Cargamos el HTML y pegamos el token real
        const htmlPath = path.join(process.cwd(), 'template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Reemplazamos el marcador de posición
        html = html.replace('', token);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (err) {
        // Si el token es inválido o el Secret no coincide
        return res.status(401).send('<h1>Error de Identidad</h1><p>El JWT no pudo ser validado.</p>');
    }
};