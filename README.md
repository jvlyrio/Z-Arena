# Z Arena

Jogo de navegador por turnos de Dragon Ball, no estilo do Naruto Arena.

**Jogar:** https://jvlyrio.github.io/Z-Arena/

## Como o repositório está organizado

- `index.html` — o site publicado (gerado, não editar à mão).
- `src/z-arena.html` — o jogo (fonte). É o mesmo arquivo da versão que roda no Claude.
- `src/zsb.js` e `src/zsb.css` — ligação com o Supabase: login (convidado, e-mail, Google, Discord), salas online, chat e progresso salvo.
- `media/` — vídeos e imagens grandes.
- `build.py` — gera o `index.html` a partir de `src/z-arena.html`.
- `tests/` — testes automáticos (Playwright) usados antes de cada publicação.

## Atualizar o site

```
python3 build.py src/z-arena.html
git add -A && git commit -m "..." && git push
```

O GitHub Pages publica sozinho em cerca de 1 minuto.
