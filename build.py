#!/usr/bin/env python3
"""Gera o site (index.html) a partir do arquivo do jogo usado no Claude.

Uso: python3 build.py <caminho/do/z-arena.html>

- tira o "envelope" da página do Claude;
- troca os vídeos/imagens /_blob/<id> pelos arquivos da pasta media/;
- injeta o Supabase (login, online e progresso) via src/zsb.js e src/zsb.css.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"
CFG = {
    "url": "https://fpntdutdeisbbgiyjvjk.supabase.co",
    "key": "sb_publishable_q4e8Cdn50xWHv98_mF98Nw_FqPe9rjB",  # chave pública (pode ficar no site)
    "providers": [],  # "google", "discord" quando forem configurados no Supabase
}


def main(src):
    s = open(src, encoding="utf-8").read()
    i = s.find('<!DOCTYPE html><html lang="pt-BR">')
    if i > 0:
        s = s[i:]
        s = re.sub(r"(</body></html>)\s*</body></html>\s*$", r"\1\n", s)
    media = {f.split(".")[0]: f for f in os.listdir(os.path.join(ROOT, "media"))}
    missing = set()

    def rep(m):
        k = m.group(1)
        if k not in media:
            missing.add(k)
            return m.group(0)
        return "media/" + media[k]

    s = re.sub(r"/_blob/([0-9a-f]{32})", rep, s)
    if missing:
        sys.exit("faltam arquivos em media/: " + ", ".join(sorted(missing)))
    s = s.replace("<title>Z Arena · Etapa 1</title>", "<title>Z Arena</title>", 1)
    import json
    zjs = open(os.path.join(ROOT, "src", "zsb.js"), encoding="utf-8").read()
    zcss = open(os.path.join(ROOT, "src", "zsb.css"), encoding="utf-8").read()
    head = (
        '<meta name="description" content="Z Arena: jogo de estratégia por turnos no navegador.">'
        "<script>window.ZCFG=" + json.dumps(CFG) + ";</script>"
        '<script src="' + SUPABASE_JS + '"></script>'
        "<style>" + zcss + "</style>"
        "<script>" + zjs + "</script>"
    )
    j = s.find("<head>") + len("<head>")
    j = s.find(">", s.find("<meta", j)) + 1  # depois do <meta charset>
    s = s[:j] + head + s[j:]
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(s)
    print("index.html:", len(s), "bytes")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs/z-arena.html")
