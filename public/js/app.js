/* global Postmonger */
(function () {
    const API_BASE = window.location.origin;

    const loading = document.getElementById("loading");
    const denied  = document.getElementById("denied");
    const ok      = document.getElementById("ok");
    const debug   = document.getElementById("debug");

    function show(el){ if (el) el.style.display = "block"; }
    function hide(el){ if (el) el.style.display = "none"; }
    function log(obj){ if (debug) debug.textContent = JSON.stringify(obj, null, 2); }

    function deny(reason){
        hide(loading);
        hide(ok);
        show(denied);
        log({ access: "denied", reason });
    }

    // Estado inicial
    hide(denied);
    hide(ok);
    show(loading);

    // Si NO está Postmonger => NO está dentro de SFMC => denegar
    if (typeof Postmonger === "undefined") {
        deny("not_opened_from_salesforce");
        return;
    }

    const session = new Postmonger.Session();
    let payload = {};
    let uiJwt = null;

    session.on("initActivity", d => payload = d || {});

    session.on("requestedTokens", async (tokens) => {
        try {
            const r = await fetch(`${API_BASE}/api/ui-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                tokens,
                journeyId: payload?.key || null,
                activityId: payload?.id || null
                })
            });

            const data = await r.json().catch(() => ({}));

            if (!r.ok || !data.ui_jwt) {
                deny("invalid_or_missing_token");
                return;
            }

            uiJwt = data.ui_jwt;

            // Ping protegido (opcional, solo para confirmar)
            const ping = await fetch(`${API_BASE}/api/ui-ping`, {
                headers: { Authorization: `Bearer ${uiJwt}` }
            }).then(x => x.json()).catch(() => ({ ok:false }));

            hide(loading);
            hide(denied);
            show(ok);

            // En producción quita esto si no quieres mostrar info
            log({ session: { ok: data.ok, expires_in: data.expires_in }, ping });

            // Habilita botón Listo
            session.trigger("setActivityValid", true);

        } catch (e) {
            deny("session_error");
        }
    });

    // Botón "Listo" en Journey Builder
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
ا})();