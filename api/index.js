const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // 1. Leemos la variable directamente de Vercel
    const secret = process.env.SFMC_JWT_SECRET;
    
    // 2. Cargamos tu HTML
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // 3. Preparamos el mensaje de diagnóstico
    let diagnostico = "";
    if (!secret) {
        diagnostico = "LA VARIABLE SFMC_JWT_SECRET ESTÁ VACÍA EN VERCEL";
    } else {
        diagnostico = "EL SECRETO ES: " + secret;
    }

    // 4. Inyectamos el valor directamente en el lugar donde esperas el token
    // Usamos todos los IDs que hemos probado para no fallar
    html = html.replace('TOKEN_DE_SESION_AQUI', diagnostico);
    html = html.replace('TOKEN_VA_AQUI', diagnostico);
    html = html.replace('Esperando interacción de Salesforce...', diagnostico);

    // 5. Enviamos la respuesta
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};