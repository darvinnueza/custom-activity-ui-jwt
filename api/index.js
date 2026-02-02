const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Si la petición es GET (navegador normal), bloqueamos de inmediato
    if (req.method !== 'POST') {
        return res.status(403).send('<h1>403 - Acceso Prohibido</h1><p>Esta UI solo es accesible mediante una firma JWT de Salesforce.</p>');
    }

    const token = req.body.jwt;
    const secret = process.env.SFMC_JWT_SECRET;

    if (!token) {
        return res.status(401).send('Falta Token JWT.');
    }

    try {
        jwt.verify(token, secret);
        // Ajusta esta ruta a donde hayas movido el HTML
        const htmlPath = path.join(process.cwd(), 'template.html'); 
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Inyectamos el token para que lo veas en pantalla
        html = html.replace('', token);
        res.status(200).send(html);
    } catch (err) {
        return res.status(401).send('Token inválido.');
    }
};