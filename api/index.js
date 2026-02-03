const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const secret = process.env.SFMC_JWT_SECRET;
    const htmlPath = path.join(process.cwd(), 'template.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    let tokenCrudo = "NO LLEGÓ NADA EN BODY.JWT";
    let tokenValidado = "ESPERANDO POST...";

    if (req.method === 'POST') {
        let body = req.body;
        
        // Manejo de si el body viene como string o objeto
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } 
            catch (e) { 
                const params = new URLSearchParams(body);
                body = Object.fromEntries(params.entries());
            }
        }

        // Extraemos el valor que quieres verificar
        if (body && body.jwt) {
            tokenCrudo = body.jwt;
            
            // Intentamos validar ese token que llegó
            try {
                jwt.verify(tokenCrudo, secret);
                tokenValidado = tokenCrudo; // Si es válido, es el mismo
            } catch (err) {
                tokenValidado = "ERROR DE FIRMA: " + err.message;
            }
        }
    } else {
        tokenValidado = "Vercel recibió un GET. Salesforce aún no dispara el POST.";
    }

    // Formateamos la salida para mostrar ambos valores en el cuadro azul
    const salidaFinal = `
        <b>VALIDADO:</b> ${tokenValidado}
        <br><br>
        <b>JWT CRUDO (body.jwt):</b> ${tokenCrudo}
    `;

    // Inyectamos en tu HTML
    html = html.replace('TOKEN_DE_SESION_AQUI', salidaFinal);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};