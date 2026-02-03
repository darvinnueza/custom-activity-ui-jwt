module.exports = async (req, res) => {
    // 1. Cabeceras de seguridad y CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let tokenRecibido = "No hay token";
    let datosDecodificados = {};

    if (req.method === 'POST') {
        try {
            // MANEJO ROBUSTO DEL BODY:
            let body = req.body;
            
            // Si el body llega como string (pasa mucho en Vercel), lo parseamos
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    // Si no es JSON, puede ser URL encoded
                    const params = new URLSearchParams(body);
                    body = Object.fromEntries(params.entries());
                }
            }

            const rawToken = body.jwt;
            
            if (rawToken) {
                tokenRecibido = "✅ Recibido";
                // Decodificamos la parte central del JWT (Payload)
                const base64Payload = rawToken.split('.')[1];
                const decodedText = Buffer.from(base64Payload, 'base64').toString();
                datosDecodificados = JSON.parse(decodedText);
            }
        } catch (err) {
            tokenRecibido = "❌ Error procesando el body";
            datosDecodificados = { error: err.message };
        }
    }

    // HTML de respuesta que se inyectará en tu Salesforce
    const html = `
        <div style="font-family:monospace; background:#1a1a1a; color:#00ff00; padding:20px; border:2px solid #00ff00; border-radius:10px;">
            <h3 style="margin-top:0;">🚀 SISTEMA OPERATIVO</h3>
            <p><b>MÉTODO:</b> ${req.method}</p>
            <p><b>JWT:</b> ${tokenRecibido}</p>
            <hr style="border:1px solid #333;">
            <b>CONTENIDO DEL TOKEN (DATOS REALES):</b>
            <pre style="background:#000; padding:15px; border:1px solid #333; overflow:auto; max-height:200px; color:#00ff00;">${JSON.stringify(datosDecodificados, null, 2)}</pre>
            <div style="margin-top:15px; font-size:11px; color:#888;">
                Si ves datos arriba, la conexión es exitosa.
            </div>
        </div>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};