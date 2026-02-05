/* global Postmonger */
(function () {
    const API_BASE = window.location.origin;

    const loading = document.getElementById("loading");
    const noauth = document.getElementById("noauth");
    const ok = document.getElementById("ok");
    const debug = document.getElementById("debug");

    function show(el){ if (el) el.style.display="block"; }
    function hide(el){ if (el) el.style.display="none"; }
    function log(obj){ if (debug) debug.textContent = JSON.stringify(obj,null,2); }

    hide(noauth); hide(ok); show(loading);

    if (typeof Postmonger === "undefined") {
        hide(loading); show(noauth);
        log({ error:"postmonger_not_loaded" });
        return;
    }

    const session = new Postmonger.Session();
    let payload = {};
    let uiJwt = null;

    // ✅ NUEVO: si NO llegan tokens, es que NO está abierto desde Journey Builder
    const TOKEN_TIMEOUT_MS = 2000;
    let tokensReceived = false;

    const tokenTimer = setTimeout(() => {
        if (!tokensReceived) {
            hide(loading); show(noauth);
            log({ error:"access_denied", reason:"tokens_not_received (not SFMC context)" });
        }
    }, TOKEN_TIMEOUT_MS);

    session.on("initActivity", d => payload = d || {});

    session.on("requestedTokens", async (tokens) => {
        tokensReceived = true;
        clearTimeout(tokenTimer);

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

    // ✅ Manejo del botón "Listo"
    session.on("clickedNext", () => {
        payload = payload || {};
        payload.arguments = payload.arguments || {};
        payload.metaData = payload.metaData || {};

        payload.metaData.isConfigured = true;

        payload.arguments.execute = payload.arguments.execute || {};
        payload.arguments.execute.inArguments = [
            { uiConfigured: true }
        ];

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