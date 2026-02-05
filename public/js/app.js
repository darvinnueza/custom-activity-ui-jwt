/* global Postmonger */
(function () {
    const API_BASE = window.location.origin;

    const loading = document.getElementById("loading");
    const noauth = document.getElementById("noauth");
    const ok = document.getElementById("ok");
    const debug = document.getElementById("debug");

    function show(el){ el.style.display="block"; }
    function hide(el){ el.style.display="none"; }
    function log(obj){ debug.textContent = JSON.stringify(obj,null,2); }

    hide(noauth); hide(ok); show(loading);

    if (typeof Postmonger === "undefined") {
        hide(loading); show(noauth);
        log({ error:"postmonger_not_loaded" });
        return;
    }

    const session = new Postmonger.Session();
    let payload = {};
    let uiJwt = null; // opcional si luego lo quieres usar

    session.on("initActivity", d => payload = d || {});

    session.on("requestedTokens", async (tokens) => {
        try {
        const r = await fetch(`${API_BASE}/api/ui-session`, {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({
            tokens,
            journeyId: payload?.key,
            activityId: payload?.id
            })
        });

        const data = await r.json();
        if (!r.ok || !data.ui_jwt) throw new Error("JWT_DENIED");
        uiJwt = data.ui_jwt;

        const ping = await fetch(`${API_BASE}/api/ui-ping`, {
            headers:{ Authorization:`Bearer ${uiJwt}` }
        }).then(x=>x.json());

        hide(loading); show(ok);
        log({ session:data, ping });

        session.trigger("setActivityValid", true);

        } catch (e) {
            hide(loading); show(noauth);
            log({ error:String(e.message||e) });
        }
    });

    // ✅ ESTO ES LO QUE TE FALTABA: manejar el botón "Listo"
    session.on("clickedNext", () => {
        // 1) asegurar estructura
        payload = payload || {};
        payload.arguments = payload.arguments || {};
        payload.metaData = payload.metaData || {};

        // 2) marcar configurada
        payload.metaData.isConfigured = true;

        // 3) guardar algo mínimo (luego aquí guardarás campaignId, etc.)
        payload.arguments.execute = payload.arguments.execute || {};
        payload.arguments.execute.inArguments = [
        { uiConfigured: true }
        ];

        // 4) actualizar y cerrar
        session.trigger("updateActivity", payload);
        session.trigger("nextStep");
    });

    session.on("clickedCancel", () => {
        session.trigger("ready");
    });

    session.trigger("ready");
    session.trigger("requestTokens");
    session.trigger("requestActivity");
})();