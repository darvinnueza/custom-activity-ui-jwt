const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // 1. Configuración de cabeceras para evitar bloqueos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const secret = process.env.SFMC_JWT_SECRET || "NO_HAY_SECRET_EN_VERCEL";
    
    // Variables de diagnóstico
    let diagnostico = {
        paso1_post: "No recibido",
        paso2_token: "Vacío",
        paso3_validacion: "Pendiente",
        paso4_data: null
    };

    if (req.method === 'POST') {
        diagnostico.paso1_post = "✅ ¡POST Recibido!";
        const token = req.body.jwt;

        if (token) {
            diagnostico.paso2_token = "✅ Token detectado (empieza por: " + token.substring(0, 10) + "...)";
            
            try {
                // AQUÍ COMPARAMOS EL TOKEN CON TU SECRET
                const decoded = jwt.verify(token, secret);
                diagnostico.paso3_validacion = "✅ ÉXITO: El Secret y el Token coinciden.";
                diagnostico.paso4_data = decoded;
            } catch (err) {
                diagnostico.paso3_validacion = "❌ ERROR: El Secret NO coincide (Firma inválida: " + err.message + ")";
            }
        }
    }

    // Respuesta visual clara para que dejes de adivinar
    const htmlResponse = `
        <div style="font-family: monospace; background: #121212; color: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #00ff00;">🔍 ESTADO DE LA CONEXIÓN</h2>
            <hr border="1" color="#333">
            
            <p><b>1. ¿LLEGÓ EL POST?:</b> ${diagnostico.paso1_post}</p>
            <p><b>2. ¿HAY TOKEN EN EL BODY?:</b> ${diagnostico.paso2_token}</p>
            <p><b>3. ¿EL SECRET ES VÁLIDO?:</b> <span style="color: ${diagnostico.paso3_validacion.includes('✅') ? '#00ff00' : '#ff0000'}">${diagnostico.paso3_validacion}</span></p>
            
            <div style="background: #000; padding: 10px; border: 1px solid #00ff00; margin-top: 10px;">
                <b>4. DATOS DECODIFICADOS:</b>
                <pre style="font-size: 11px; color: #00ff00;">${diagnostico.paso4_data ? JSON.stringify(diagnostico.paso4_data, null, 2) : 'No hay datos para mostrar'}</pre>
            </div>
            <p style="font-size: 10px; color: #666;">Secret actual (primeros 5): ${secret.substring(0, 5)}***</p>
        </div>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlResponse);
};