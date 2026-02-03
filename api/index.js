module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let datosDecodificados = null;
    let metodo = req.method;

    if (req.method === 'POST') {
        try {
            let body = req.body;
            // Si Vercel no parseó el body, lo hacemos nosotros
            if (typeof body === 'string') { body = JSON.parse(body); }
            
            const rawToken = body.jwt;
            if (rawToken) {
                const base64Payload = rawToken.split('.')[1];
                const decodedText = Buffer.from(base64Payload, 'base64').toString();
                datosDecodificados = JSON.parse(decodedText);
            }
        } catch (e) {
            datosDecodificados = { error: "Fallo al decodificar: " + e.message };
        }
    }

    const html = `
        <div style="font-family:monospace; background:#1a1a1a; color:#0f0; padding:20px; border:2px solid #0f0; border-radius:10px;">
            <h3 style="margin:0;">🚀 SISTEMA OPERATIVO</h3>
            <p>MÉTODO ACTUAL: <b>${metodo}</b></p>
            <hr style="border:1px solid #333;">
            ${datosDecodificados 
                ? `<b>✅ DATOS RECIBIDOS:</b><pre style="background:#000; padding:10px; border:1px solid #333; overflow:auto;">${JSON.stringify(datosDecodificados, null, 2)}</pre>`
                : `<p style="color:#ff0;">⏳ Esperando que el JavaScript envíe el Token...</p>`
            }
        </div>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
};