/* Z Arena — ligação do jogo com o Supabase (site próprio).
   Imita a mesma interface que o jogo usava dentro do Claude:
   window.claude.use("db") e window.claude.use("user").
   Também cuida do login (convidado / e-mail / Google / Discord) e de salvar o progresso. */
(function () {
  "use strict";
  var CFG = window.ZCFG || {};
  var URL_ = CFG.url, KEY = CFG.key;
  var PROV = CFG.providers || []; // ex.: ["google","discord"] quando estiverem configurados
  var HOME = location.origin + location.pathname;
  if (!window.supabase || !URL_ || !KEY) { console.warn("[ZSB] Supabase indisponível; jogo segue offline."); return; }
  var sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "za_auth" } });
  window.ZSB = sb;
  window.ZSB_U = function () { return USER };

  function lsg(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function lss(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) {} }

  /* ---------- sessão ---------- */
  var USER = null, readyP = null;
  function curUser() { return USER }
  function isGuest(u) { u = u || USER; return !u || !!u.is_anonymous }
  function ensure() {
    if (USER) return Promise.resolve(USER);
    if (!readyP) readyP = (async function () {
      var r = await sb.auth.getSession();
      var s = r && r.data && r.data.session;
      if (!s) {
        var a = await sb.auth.signInAnonymously();
        if (a.error) { readyP = null; throw a.error }
        s = a.data.session;
      }
      USER = s.user; return USER;
    })();
    return readyP;
  }
  var sessP = sb.auth.getSession().then(function (r) { var s = r && r.data && r.data.session; if (s) USER = s.user; return USER }).catch(function () { return null });
  sb.auth.onAuthStateChange(function (ev, s) {
    var prev = USER && USER.id; USER = s ? s.user : null;
    if (ev === "SIGNED_IN" || ev === "USER_UPDATED") { if (USER && USER.id !== prev) onUserChanged(); else accRender() }
    if (ev === "SIGNED_OUT") accRender();
  });

  /* ---------- documentos ---------- */
  var ERR = function (e) { var x = new Error((e && e.message) || "erro"); x.code = (e && /not_found/.test(e.message || "")) ? "not_found" : (e && e.code) || "unavailable"; return x };
  function snapOf(path, row) { var d = row ? row.data : undefined; return { id: path.split("/").pop(), exists: !!row, data: function () { return d ? JSON.parse(JSON.stringify(d)) : undefined }, metadata: { fromCache: false, hasPendingWrites: false } } }
  async function getRow(path) {
    await ensure();
    var r = await sb.from("docs").select("data,updated_at").eq("path", path).maybeSingle();
    if (r.error) throw ERR(r.error); return r.data;
  }
  var CHN = 0;
  function watch(filter, match, onChange) {
    // tempo real + verificação de segurança (caso o tempo real caia)
    var ch = null, dead = false;
    ensure().then(function () {
      if (dead) return;
      ch = sb.channel("z" + (++CHN) + "_" + Math.random().toString(36).slice(2, 7))
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: filter }, function () { onChange() })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "docs" }, function (p) { var o = p && p.old; if (!o || !o.path || match(o.path)) onChange() })
        .subscribe();
    }).catch(function () {});
    return function () { dead = true; if (ch) { try { sb.removeChannel(ch) } catch (e) {} } };
  }
  function doc(path) {
    return {
      id: path.split("/").pop(), path: path,
      get: async function () { return snapOf(path, await getRow(path)) },
      set: async function (d) { await ensure(); var r = await sb.rpc("doc_set", { p: path, d: d || {} }); if (r.error) throw ERR(r.error) },
      update: async function (d) { await ensure(); var r = await sb.rpc("doc_update", { p: path, patch: d || {} }); if (r.error) throw ERR(r.error) },
      delete: async function () { await ensure(); var r = await sb.from("docs").delete().eq("path", path); if (r.error) throw ERR(r.error) },
      onSnapshot: function (next, err) {
        var stop = false, req = 0, lastKey = null, lastSeen = 0;
        function pull() {
          var my = ++req;
          getRow(path).then(function (row) {
            if (stop || my !== req) return; lastSeen = Date.now();
            var key = row ? row.updated_at + "|" + JSON.stringify(row.data).length : "none";
            if (key === lastKey) return; lastKey = key; next(snapOf(path, row));
          }).catch(function (e) { if (!stop && err) err(ERR(e)) });
        }
        pull();
        var un = watch("path=eq." + path, function (p) { return p === path }, pull);
        var t = setInterval(function () { if (!stop && Date.now() - lastSeen > 2500) pull() }, 3000);
        return function () { stop = true; clearInterval(t); un() };
      }
    };
  }
  function query(parent, ob, lim) {
    async function run() {
      await ensure();
      var q = sb.from("docs").select("id,data,updated_at").eq("parent", parent);
      if (ob) q = q.order("ord", { ascending: ob[1] !== "desc", nullsFirst: false });
      if (lim) q = q.limit(lim);
      var r = await q; if (r.error) throw ERR(r.error);
      return { docs: (r.data || []).map(function (x) { var d = x.data; return { id: x.id, exists: true, data: function () { return JSON.parse(JSON.stringify(d)) } } }), empty: !(r.data || []).length, size: (r.data || []).length };
    }
    return {
      path: parent,
      orderBy: function (k, dir) { return query(parent, [k, dir || "asc"], lim) },
      limit: function (n) { return query(parent, ob, n) },
      get: run,
      onSnapshot: function (next, err) {
        var stop = false, req = 0, lastKey = null, lastSeen = 0;
        function pull() {
          var my = ++req;
          run().then(function (s) { if (stop || my !== req) return; lastSeen = Date.now(); var key = s.docs.map(function (d) { return d.id }).join(","); if (key === lastKey) return; lastKey = key; next(s) })
            .catch(function (e) { if (!stop && err) err(ERR(e)) });
        }
        pull();
        var un = watch("parent=eq." + parent, function (p) { return p.indexOf(parent + "/") === 0 }, pull);
        var t = setInterval(function () { if (!stop && Date.now() - lastSeen > 4500) pull() }, 5000);
        return function () { stop = true; clearInterval(t); un() };
      },
      doc: function (id) { id = id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); return doc(parent + "/" + id) },
      add: async function (d) {
        await ensure();
        var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), path = parent + "/" + id;
        var r = await sb.from("docs").insert({ path: path, parent: parent, id: id, data: d || {} });
        if (r.error) throw ERR(r.error); return { id: id, path: path };
      }
    };
  }
  var DB = { doc: doc, collection: function (p) { return query(p, null, 0) } };
  var USERAPI = {
    id: async function () { try { return (await ensure()).id } catch (e) { return null } },
    me: async function () { var u = await ensure(); return { id: u.id, name: lsg("za_nick") || "", guest: isGuest(u) } },
    isOwner: async function () { try { await ensure(); var r = await sb.rpc("is_admin"); return !!(r && r.data) } catch (e) { return false } },
    canEdit: async function () { return USERAPI.isOwner() },
    can: function () { return null }
  };
  window.claude = window.claude || { use: async function (n) { if (n === "db") return DB; if (n === "user") return USERAPI; return null } };

  /* ---------- progresso do jogador ---------- */
  var SKIP = { za_auth: 1, za_pid: 1, za_sync_uid: 1, za_login: 1 };
  function snapshotLocal() {
    var o = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("za_") === 0 && !SKIP[k] && k.indexOf("za_auth") !== 0) o[k] = localStorage.getItem(k) } } catch (e) {}
    return o;
  }
  var lastPush = "", pushing = false;
  async function pushProfile(force) {
    if (!USER || pushing) return;
    var d = snapshotLocal(), s = JSON.stringify(d);
    if (!force && s === lastPush) return;
    if (s.length > 280000) return;
    pushing = true;
    try { var r = await sb.from("profiles").upsert({ uid: USER.id, nick: lsg("za_nick"), data: d, updated_at: new Date().toISOString() }); if (!r.error) lastPush = s } catch (e) {}
    pushing = false;
  }
  setInterval(function () { pushProfile(false) }, 15000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") pushProfile(false) });
  async function onUserChanged() {
    accRender();
    if (!USER) return;
    if (lsg("za_sync_uid") === USER.id) return;
    // primeira vez desta conta neste aparelho: puxa o progresso salvo (se houver)
    try {
      var r = await sb.from("profiles").select("data,nick").eq("uid", USER.id).maybeSingle();
      lss("za_sync_uid", USER.id);
      if (r && r.data && r.data.data && Object.keys(r.data.data).length) {
        var d = r.data.data;
        Object.keys(snapshotLocal()).forEach(function (k) { if (!(k in d)) lss(k, null) });
        Object.keys(d).forEach(function (k) { lss(k, d[k]) });
        lss("za_nick_ok", d.za_nick ? "1" : lsg("za_nick_ok"));
        location.replace(HOME);
        return;
      }
      await pushProfile(true);
    } catch (e) {}
  }
  sessP.then(function (u) { if (u) onUserChanged() });

  /* ---------- telas de login ---------- */
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e }
  var GICON = "<svg viewBox='0 0 48 48' width='20' height='20'><path fill='#FFC107' d='M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z'/><path fill='#FF3D00' d='m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'/><path fill='#4CAF50' d='M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z'/><path fill='#1976D2' d='M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z'/></svg>";
  var DICON = "<svg viewBox='0 0 24 24' width='20' height='20'><path fill='#fff' d='M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7zM8 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z'/></svg>";
  function provBtn(p, label) { var b = el("button", "zlb zl-" + p, (p === "google" ? GICON : DICON) + "<span>" + label + "</span>"); b.type = "button"; return b }
  function emailForm(onSend, btnLabel, onOk) {
    var f = el("form", "zlem"), i = el("input"); i.type = "email"; i.placeholder = "seu@email.com"; i.autocomplete = "email";
    var s = el("button", "nkok", btnLabel || "Receber link de acesso"), m = el("small", "nker");
    f.append(i, s, m);
    f.onsubmit = async function (e) { e.preventDefault(); var v = i.value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { m.textContent = "Digite um e-mail válido."; return } s.disabled = true; m.style.color = "#9fb3e0"; m.textContent = "Enviando…"; var r = await onSend(v); s.disabled = false; if (r && r.error) { m.style.color = ""; m.textContent = r.msg || "Não foi possível enviar agora. Tente de novo em instantes." } else { m.style.color = "#7dffb0"; m.innerHTML = "Pronto! Abra o link que enviamos para <b>" + v.replace(/</g, "&lt;") + "</b>. Pode jogar enquanto isso."; if (onOk) onOk(v) } };
    return f;
  }
  async function sendMagic(email) {
    var r = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: HOME } });
    if (r.error) return { error: 1, msg: /rate|seconds/i.test(r.error.message) ? "Espere um pouco antes de pedir outro link." : null };
    return {};
  }
  // Primeira tela (estilo jogo de celular). Retorna true se ela ficou na tela.
  window.ZLOGIN = function (after) {
    if (lsg("za_login") === "1" || (USER && !USER.is_anonymous)) return false;
    if (document.getElementById("nkm")) return true;
    var ov = el("div", ""); ov.id = "nkm"; var bx = el("div", "nkbox zlbox");
    bx.innerHTML = "<div class='nkz'>Z</div><h2>Bem-vindo à Z Arena!</h2><p>Como você quer entrar?</p>";
    var col = el("div", "zlcol");
    if (PROV.indexOf("google") >= 0) { var g = provBtn("google", "Entrar com Google"); g.onclick = function () { sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: HOME } }) }; col.append(g) }
    if (PROV.indexOf("discord") >= 0) { var d = provBtn("discord", "Entrar com Discord"); d.onclick = function () { sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: HOME } }) }; col.append(d) }
    var eb = el("button", "zlb zl-mail", "✉️<span>Entrar com e-mail</span>"); eb.type = "button"; col.append(eb);
    var or = el("div", "zlor", "<span>ou</span>");
    var gb = el("button", "nkok zlguest", "Jogar como convidado"); gb.type = "button";
    var note = el("p", "zlnote", "Convidado: seu progresso fica só neste aparelho. Dá para salvar a conta depois em <b>Opções</b>.");
    var em = el("div", "zlemw"); em.hidden = true;
    var done = false, fin = function () { if (done) return; done = true; lss("za_login", "1"); ov.remove(); if (after) after() };
    var go = el("button", "zlcont", "Continuar jogando"); go.type = "button"; go.onclick = async function () { go.disabled = true; try { await ensure() } catch (e) {} fin() };
    eb.onclick = function () { em.hidden = !em.hidden; if (!em.childNodes.length) em.append(emailForm(sendMagic, null, function () { if (!go.isConnected) em.append(go) })); var i = em.querySelector("input"); if (i && !em.hidden) i.focus() };
    gb.onclick = async function () { gb.disabled = true; gb.textContent = "Entrando…"; try { await ensure() } catch (e) {} fin() };
    col.append(em);
    bx.append(col, or, gb, note); ov.append(bx); document.body.append(ov);
    // já tem sessão (ex.: voltou pelo link do e-mail)? fecha sozinho
    sessP.then(function (u) { if (u && !u.is_anonymous && ov.isConnected) fin() });
    sb.auth.onAuthStateChange(function (ev, s) { if (s && s.user && !s.user.is_anonymous && ev === "SIGNED_IN" && ov.isConnected) fin() });
    return true;
  };

  /* ---------- Opções → Conta ---------- */
  var ACC = null;
  function accRender() {
    if (!ACC || !ACC.isConnected) return;
    ACC.innerHTML = ""; ACC.append(el("h3", "", "Conta"));
    var u = USER;
    if (!u) { ACC.append(el("p", "zlst", "Você ainda não entrou.")); var b0 = el("button", "nkok", "Entrar"); b0.onclick = function () { lss("za_login", null); var o = document.querySelector(".mmopt"); if (o) o.remove(); window.ZLOGIN(function () { if (window.nickAsk && localStorage.getItem("za_nick_ok") !== "1") window.nickAsk() }) }; ACC.append(b0); return }
    if (isGuest(u)) {
      ACC.append(el("p", "zlst", "🔓 <b>Convidado.</b> Seu progresso fica só neste aparelho. Vincule uma conta para não perder nada."));
      var col = el("div", "zlcol");
      if (PROV.indexOf("google") >= 0) { var g = provBtn("google", "Vincular Google"); g.onclick = function () { link("google") }; col.append(g) }
      if (PROV.indexOf("discord") >= 0) { var d = provBtn("discord", "Vincular Discord"); d.onclick = function () { link("discord") }; col.append(d) }
      col.append(el("p", "zlsm", "Vincular e-mail (vamos mandar um link de confirmação):"));
      col.append(emailForm(async function (v) {
        var r = await sb.auth.updateUser({ email: v }, { emailRedirectTo: HOME });
        if (r.error) { if (/already|registered|exists/i.test(r.error.message)) { return { error: 1, msg: "Esse e-mail já tem uma conta. Use \"Entrar em outra conta\" abaixo (o progresso de convidado deste aparelho será trocado pelo dessa conta)." } } return { error: 1 } }
        return {};
      }, "Vincular e-mail"));
      var other = el("details", "zlother"); other.append(el("summary", "", "Entrar em outra conta"), el("p", "zlsm", "⚠️ O progresso de convidado deste aparelho será trocado pelo da conta em que você entrar."), emailForm(sendMagic));
      col.append(other); ACC.append(col);
    } else {
      var ids = (u.identities || []).map(function (i) { return i.provider }).filter(function (p) { return p !== "anonymous" });
      var nm = { email: "E-mail", google: "Google", discord: "Discord" };
      ACC.append(el("p", "zlst", "✅ <b>Conta salva.</b> " + (u.email ? "(" + String(u.email).replace(/</g, "&lt;") + ") " : "") + "Seu progresso fica guardado e vale em qualquer aparelho."));
      ACC.append(el("p", "zlsm", "Logins vinculados: " + (ids.length ? ids.map(function (p) { return nm[p] || p }).join(", ") : "E-mail")));
      var col2 = el("div", "zlcol");
      PROV.forEach(function (p) { if (ids.indexOf(p) < 0) { var b = provBtn(p, "Vincular " + nm[p]); b.onclick = function () { link(p) }; col2.append(b) } });
      var so = el("button", "zlb zl-out", "<span>Sair da conta</span>"); so.type = "button";
      so.onclick = async function () { await pushProfile(true); await sb.auth.signOut(); Object.keys(snapshotLocal()).forEach(function (k) { lss(k, null) }); lss("za_sync_uid", null); lss("za_login", null); location.replace(HOME) };
      col2.append(so); ACC.append(col2);
    }
  }
  async function link(p) { var r = await sb.auth.linkIdentity({ provider: p, options: { redirectTo: HOME } }); if (r && r.error) alertBox(/already|exists/i.test(r.error.message) ? "Essa conta " + p + " já está ligada a outro jogador. Use \"Entrar em outra conta\"." : "Não foi possível vincular agora.") }
  function alertBox(t) { if (!ACC) return; var m = el("p", "nker", t); ACC.append(m) }
  window.ZACC = function () { ACC = el("div", "zacc"); sessP.then(accRender); accRender(); return ACC };

  // lembrete discreto para convidados
  window.ZGUESTNAG = function () {
    try { if (!USER || !isGuest()) return; var n = +(lsg("za_nagc") || 0) + 1; lss("za_nagc", String(n)); if (n % 8 !== 3) return;
      var t = el("div", "znag", "💾 Vincule sua conta em <b>Opções</b> para não perder seu progresso."); document.body.append(t); setTimeout(function () { t.remove() }, 6000) } catch (e) {}
  };
})();
