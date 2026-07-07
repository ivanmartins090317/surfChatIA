# Especificação Técnica — Relatório de Testes Manuais HTML

> **Projeto:** Surf Performance & Board AI  
> **Padrão:** POP-QA-SURF-001  
> **Fonte de cores:** `docs/DESIGN_SYSTEM.md` §2

---

## Paleta de Cores (CSS Variables)

Alinhada ao Design System dark-first do produto. **Nunca** use a paleta ByStartup (`#6c63ff`).

```css
:root {
  /* Neutros */
  --bg-page: #0B0F14;
  --bg-card: #141A22;
  --bg-card2: #1B222B;
  --bg-card3: #252E39;
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.14);

  /* Marca — lima elétrico (primária) */
  --accent: #C4FA4E;
  --accent-hover: #CBFB50;
  --accent-pressed: #A9E02F;
  --accent-glow: rgba(196, 250, 78, 0.15);
  --on-accent: #0B0F14;

  /* Secundária — aqua oceânico */
  --aqua: #2DD9BE;
  --aqua-glow: rgba(45, 217, 190, 0.12);
  --on-aqua: #04211D;

  /* Estados semânticos */
  --pass: #3CCB7F;
  --pass-bg: rgba(60, 203, 127, 0.12);
  --fail: #FF5D5D;
  --fail-bg: rgba(255, 93, 93, 0.12);
  --block: #F5B849;
  --block-bg: rgba(245, 184, 73, 0.12);
  --pending: #6B7787;
  --pending-bg: rgba(107, 119, 135, 0.12);
  --info: #5B9DFF;
  --info-bg: rgba(91, 157, 255, 0.12);

  /* Texto */
  --text-primary: #F5F8FA;
  --text-secondary: #A7B0BD;
  --text-tertiary: #6B7787;

  /* Layout */
  --radius: 16px;
  --radius-lg: 20px;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-sans: 'Inter', 'Segoe UI', system-ui, sans-serif;

  /* Gradientes */
  --grad-primary: linear-gradient(135deg, #C4FA4E 0%, #7BE28A 100%);
  --grad-ocean: linear-gradient(160deg, #1B222B 0%, #0B2E33 100%);
  --grad-surface-glow: radial-gradient(120% 120% at 50% 0%, rgba(196, 250, 78, 0.10), transparent 60%);
}
```

### Regras visuais

- Texto sobre lima: sempre `--on-accent` (`#0B0F14`), nunca branco
- CTAs e destaques do relatório: lima; tags secundárias / info: aqua
- Cards com borda `--border`; hover com `--border-strong`
- Scoreboard “Taxa %”: pode usar gradiente `--grad-primary` no número

---

## Google Fonts (head do HTML)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
```

---

## Estrutura HTML do Relatório

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório de Testes Manuais — Surf Performance & Board AI</title>
  <!-- Fonts + CSS inline com variáveis acima -->
</head>
<body>

  <div id="lightbox" onclick="closeLightbox()">
    <span id="lightbox-close">&#x2715;</span>
    <img id="lightbox-img" src="" alt="Evidência ampliada" onclick="event.stopPropagation()" />
  </div>

  <header class="topbar">
    <div class="topbar-brand">
      <div class="logo-mark" aria-hidden="true">🏄</div>
      <div>
        <h1>Surf Performance & Board AI</h1>
        <span>Relatório de Testes Manuais · MVP</span>
      </div>
    </div>
    <div class="topbar-meta">
      <span class="badge-version">POP-QA-SURF-001</span>
    </div>
  </header>

  <section class="hero">
    <div class="hero-inner">
      <div class="hero-tag">QA Report</div>
      <h2>Homologação Manual — MVP</h2>
      <p>Validação E2E dos fluxos P0/P1: auth, perfil, análise de performance, prancha mágica e compatibilidade.</p>
      <div class="hero-meta">
        <div class="hero-meta-item"><label>Projeto</label><span>Surf Performance & Board AI</span></div>
        <div class="hero-meta-item"><label>Plataforma</label><span>Web · Next.js 15</span></div>
        <div class="hero-meta-item"><label>Executor</label><span id="meta-executor">—</span></div>
        <div class="hero-meta-item"><label>Data</label><span id="meta-data">—</span></div>
        <div class="hero-meta-item"><label>Ambiente</label><span id="meta-ambiente">Local (localhost:3000)</span></div>
      </div>
    </div>
  </section>

  <main class="container">
    <!-- scoreboard, progress, flows, bugs, matrix — ver SKILL.md -->
  </main>

  <footer class="footer">
    Surf Performance & Board AI · <strong>POP-QA-SURF-001</strong> · Design System dark-first
  </footer>

</body>
</html>
```

---

## JavaScript Obrigatório

```javascript
const testData = {
  auth:       { total: 5, pass: 0, fail: 0, block: 0 },
  profile:    { total: 3, pass: 0, fail: 0, block: 0 },
  performance:{ total: 6, pass: 0, fail: 0, block: 0 },
  board:      { total: 4, pass: 0, fail: 0, block: 0 },
  compat:     { total: 2, pass: 0, fail: 0, block: 0 },
  security:   { total: 2, pass: 0, fail: 0, block: 0 },
  shell:      { total: 2, pass: 0, fail: 0, block: 0 },
};

// Funções: initScoreboard(), toggleFlow(id), openLightbox(src), closeLightbox()
// DOMContentLoaded → meta-executor, meta-data, initScoreboard()
```

Chaves de `testData` devem corresponder aos fluxos FL-01…FL-07.

---

## Status Badges

```html
<span class="status pass dot">Aprovado</span>
<span class="status fail dot">Reprovado</span>
<span class="status block dot">Bloqueado</span>
<span class="status pending dot">Pendente</span>
```

Estilo sugerido: pill com fundo semântico (`--pass-bg`, etc.) + ponto colorido (`.dot::before`).

---

## Evidências

**Caminho relativo no HTML:** `evidencias/tc09-analise-link-pronta.jpeg`

```html
<div class="evidence-item" onclick="openLightbox('evidencias/tc09-analise-link-pronta.jpeg')">
  <img src="evidencias/tc09-analise-link-pronta.jpeg" alt="TC-09 — Análise por link"
    onerror="this.parentElement.classList.add('missing');" />
  <div class="evidence-caption">TC-09 — Análise por link</div>
</div>
```

| Padrão | Exemplo |
|--------|---------|
| `tc[número]-[descricao-curta].[ext]` | `tc09-analise-link-pronta.jpeg` |
| | `tc15-upload-tres-fotos.png` |

Extensões: `.jpeg`, `.jpg`, `.png`, `.webp`

---

## Sincronização com PENDENCIAS.md

Ao aprovar TCs, marque o item equivalente em `docs/state/PENDENCIAS.md`:

| TC aprovado | Pendência relacionada |
|-------------|----------------------|
| TC-09, TC-10, TC-11 | Análise performance E2E + upload bucket `media` |
| TC-07, TC-08 | Edição de perfil |
| TC-21, TC-22 | RLS dois usuários |
| TC-15–TC-18 | Prancha mágica E2E |
| TC-19, TC-20 | Compatibilidade E2E |
| TC-12 | Link malicioso rejeitado |

---

## Checklist de Qualidade

- [ ] Paleta Surf (lima/aqua), não ByStartup
- [ ] Título e footer com nome do projeto
- [ ] Console sem erros JS
- [ ] Scoreboard e matriz coerentes com `testData`
- [ ] Acordeão e lightbox funcionais
- [ ] Relatório autocontido (CSS/JS inline)
