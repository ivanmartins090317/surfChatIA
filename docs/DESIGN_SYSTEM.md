# Design System — Surf Performance & Board AI

> **Versão:** 1.0 · **Última atualização:** 03/07/2026 · **Stack alvo:** Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Radix · Lucide Icons
>
> Este documento é a **fonte única de verdade** visual e de interação do produto. Componentes, telas e novas features devem derivar destes tokens e regras. Ao criar uma nova tela, primeiro consulte este documento; só desvie com justificativa registrada.

---

## Sumário

1. [Visão de marca e princípios de design](#1-visão-de-marca-e-princípios-de-design)
2. [Fundamentos: Cores](#2-fundamentos-cores)
3. [Fundamentos: Tipografia](#3-fundamentos-tipografia)
4. [Fundamentos: Espaçamento e Grid](#4-fundamentos-espaçamento-e-grid)
5. [Fundamentos: Raio, Bordas e Elevação](#5-fundamentos-raio-bordas-e-elevação)
6. [Glassmorphism e Superfícies](#6-glassmorphism-e-superfícies)
7. [Iconografia e Imagem](#7-iconografia-e-imagem)
8. [Tokens de implementação (CSS + Tailwind)](#8-tokens-de-implementação-css--tailwind)
9. [Componentes](#9-componentes)
10. [Data Visualization](#10-data-visualization)
11. [Padrões de tela (por módulo do MVP)](#11-padrões-de-tela-por-módulo-do-mvp)
12. [Movimento e Animação](#12-movimento-e-animação)
13. [Acessibilidade](#13-acessibilidade)
14. [Responsividade e Navegação](#14-responsividade-e-navegação)
15. [Checklist de entrega (Definition of Done)](#15-checklist-de-entrega-definition-of-done)

---

## 1. Visão de marca e princípios de design

**Conceito criativo:** *"Precisão encontra o oceano."* Uma ferramenta de coaching por IA com o rigor técnico de um laboratório de performance e a energia crua do surf. A interface é **dark, imersiva e video-first**, porque o produto vive de análise de vídeo/imagem — o conteúdo do usuário é a estrela, a UI é o técnico ao lado.

### Personalidade da marca

| Atributo | O que significa na UI |
|----------|-----------------------|
| **Técnico / confiável** | Dados legíveis, números tabulares, hierarquia clara, sem ruído decorativo |
| **Energético / atlético** | Acento verde-lima elétrico, tipografia display forte, microinterações com "punch" |
| **Fluido / oceânico** | Cantos muito arredondados, gradientes sutis, transições com física de mola |
| **Focado** | Um CTA primário por tela, whitespace generoso, progressive disclosure |

### Princípios (ordem de prioridade em conflitos)

1. **Conteúdo do usuário primeiro.** Vídeo, frames e pranchas ocupam o palco; controles são periféricos e discretos.
2. **Uma decisão por tela.** Cada tela tem um único CTA primário em lima; o resto é subordinado.
3. **Feedback sempre visível.** Todo processo de IA tem estado (`enviando → processando → pronto → erro`) com skeletons, não spinners longos.
4. **Legível no escuro.** Contraste verificado independentemente para o tema escuro (nunca inferido do claro).
5. **Mobile-first.** Surfista usa no celular, muitas vezes na praia, com uma mão e sol forte — alvos grandes, alto contraste.
6. **Termo técnico + tradução.** Jargão de surf (rocker, rail, litragem) sempre com explicação curta acessível.

---

## 2. Fundamentos: Cores

O sistema é **dark-first**. Um tema claro opcional é definido no fim da seção, mas o produto nasce escuro (como a referência).

### 2.1 Neutros (base fria, quase-preto azulado)

| Token | Hex | Papel semântico |
|-------|-----|-----------------|
| `bg` | `#0B0F14` | Fundo do app |
| `surface-1` | `#141A22` | Card padrão |
| `surface-2` | `#1B222B` | Card elevado, input, popover |
| `surface-3` | `#252E39` | Hover de superfície, chips |
| `border` | `rgba(255,255,255,0.08)` | Hairline padrão |
| `border-strong` | `rgba(255,255,255,0.14)` | Divisor enfático, foco de card |
| `text-primary` | `#F5F8FA` | Texto principal (≈ 15.8:1 sobre `bg`) |
| `text-secondary` | `#A7B0BD` | Texto secundário (≈ 6.9:1 sobre `bg`) |
| `text-tertiary` | `#6B7787` | Texto desabilitado/placeholder (≈ 3.4:1 — só para large/UI não essencial) |

### 2.2 Cor primária — Lima elétrico (energia, ação, progresso)

Herança direta da referência. É a cor de **ação, destaque e progresso positivo**. Sempre pareada com **texto quase-preto** quando usada como fundo.

| Token | Hex | Uso |
|-------|-----|-----|
| `primary-300` | `#DBFF7A` | Hover claro / highlight de gráfico |
| `primary-400` | `#CBFB50` | Estado hover do botão primário |
| **`primary-500`** | **`#C4FA4E`** | **Cor primária canônica (CTA, foco, dados-chave)** |
| `primary-600` | `#A9E02F` | Pressed / borda ativa |
| `primary-700` | `#84B31E` | Sobre superfícies claras (tema claro) |
| `on-primary` | `#0B0F14` | Texto/ícone sobre lima (contraste ≈ 14:1 ✔) |

> ⚠️ **Nunca** use texto branco sobre lima (contraste insuficiente). Use `on-primary` (`#0B0F14`).

### 2.3 Cor secundária — Aqua oceânico (identidade "board/ocean", categorização)

Diferencia o produto de um fintech genérico e carrega a identidade de surf. Usada em **dados secundários, tags de prancha, estados informativos e gradientes**.

| Token | Hex | Uso |
|-------|-----|-----|
| `aqua-400` | `#4FE9D0` | Highlight / linha de gráfico secundária |
| **`aqua-500`** | **`#2DD9BE`** | Cor secundária canônica |
| `aqua-600` | `#1CB8A0` | Pressed / borda |
| `on-aqua` | `#04211D` | Texto sobre aqua |

### 2.4 Cores semânticas de estado

| Token | Hex | Sobre `bg` | Uso |
|-------|-----|-----------|-----|
| `success-500` | `#3CCB7F` | ✔ 5.9:1 | Sucesso, "análise pronta", tendência positiva |
| `warning-500` | `#F5B849` | ✔ 9.7:1 | Atenção, upload grande, dados parciais |
| `danger-500` | `#FF5D5D` | ✔ 5.2:1 | Erro, falha de processamento, ação destrutiva |
| `info-500` | `#5B9DFF` | ✔ 5.6:1 | Dica, informação neutra |

Cada cor tem um par de **superfície tênue** para fundos de badge/alerta (12% de opacidade sobre a cor):
`success-bg = rgba(60,203,127,.12)`, `warning-bg = rgba(245,184,73,.12)`, `danger-bg = rgba(255,93,93,.12)`, `info-bg = rgba(91,157,255,.12)`.

> **Regra `color-not-only`:** estado nunca é comunicado só por cor — sempre acompanhado de ícone Lucide (`CheckCircle2`, `AlertTriangle`, `XCircle`, `Info`) e/ou texto.

### 2.5 Paleta de data-viz (categórica)

Ordem de atribuição para séries/categorias (garante distinção também para daltônicos, complementada por forma/rótulo):

1. `#C4FA4E` (lima) · 2. `#2DD9BE` (aqua) · 3. `#5B9DFF` (azul) · 4. `#A78BFA` (violeta) · 5. `#FF8A5B` (coral) · 6. `#F5B849` (âmbar)

### 2.6 Gradientes

| Token | Definição | Uso |
|-------|-----------|-----|
| `grad-primary` | `linear-gradient(135deg, #C4FA4E 0%, #7BE28A 100%)` | CTA de destaque, hero de score |
| `grad-ocean` | `linear-gradient(160deg, #1B222B 0%, #0B2E33 100%)` | Fundo de hero, cards de prancha |
| `grad-surface-glow` | `radial-gradient(120% 120% at 50% 0%, rgba(196,250,78,.10), transparent 60%)` | Brilho de topo em telas de resultado |

### 2.7 Contraste — regras invioláveis

- Texto normal ≥ **4.5:1**; texto grande (≥ 24px ou 18px bold) e glyphs de UI ≥ **3:1**.
- Linhas/barras de gráfico vs. fundo ≥ **3:1**; rótulos de dado ≥ **4.5:1**.
- Bordas e divisores devem permanecer visíveis no escuro (nunca `border` < 8% de opacidade em elementos estruturais).

---

## 3. Fundamentos: Tipografia

**Pareamento:** `Space Grotesk` (display/headings — geométrica, atlética, técnica) + `Inter` (corpo/UI — legibilidade superior em dados e formulários). Números sempre com **tabular figures** (`font-feature-settings: "tnum"`) em métricas, medidas de prancha, preços e timers.

```ts
// next/font — app/layout.tsx
import { Space_Grotesk, Inter } from "next/font/google";

export const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display", display: "swap" });
export const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
```

### 3.1 Escala tipográfica (base 16px / 1rem)

| Token | Tamanho | Line-height | Peso | Fonte | Uso |
|-------|---------|-------------|------|-------|-----|
| `display-2xl` | 60px / 3.75rem | 1.05 | 700 | Display | Números-herói (score de sessão) |
| `display-xl` | 48px / 3rem | 1.08 | 700 | Display | Título de landing/onboarding |
| `display-lg` | 40px / 2.5rem | 1.1 | 700 | Display | Métrica destaque em card |
| `h1` | 32px / 2rem | 1.15 | 700 | Display | Título de página |
| `h2` | 28px / 1.75rem | 1.2 | 500 | Display | Seção |
| `h3` | 24px / 1.5rem | 1.25 | 500 | Display | Subseção / título de card |
| `h4` | 20px / 1.25rem | 1.3 | 600 | Sans | Título de item |
| `body-lg` | 18px / 1.125rem | 1.6 | 400 | Sans | Texto de leitura (análise) |
| `body` | 16px / 1rem | 1.5 | 400 | Sans | Corpo padrão (mín. mobile) |
| `body-sm` | 14px / 0.875rem | 1.45 | 400 | Sans | Texto de apoio, labels |
| `caption` | 12px / 0.75rem | 1.35 | 500 | Sans | Legenda, metadados |
| `overline` | 11px / 0.6875rem | 1.3 | 600 | Sans | Rótulo (uppercase, `letter-spacing: .08em`) |

**Regras:**
- Corpo nunca abaixo de **16px** no mobile (evita zoom automático do iOS).
- Comprimento de linha: 60–75 caracteres (desktop), 35–60 (mobile).
- Hierarquia por **tamanho/peso/espaço**, não só por cor.
- Texto longo prefere **quebra** a truncamento; quando truncar, usar reticências + acesso ao texto completo.

---

## 4. Fundamentos: Espaçamento e Grid

Sistema base **4/8**. Use somente estes incrementos.

| Token | px | Uso típico |
|-------|----|-----------|
| `space-0.5` | 2 | Ajuste fino de ícone |
| `space-1` | 4 | Gap interno mínimo |
| `space-2` | 8 | Gap entre ícone e label |
| `space-3` | 12 | Padding interno compacto |
| `space-4` | 16 | Padding padrão de card / gutter mobile |
| `space-5` | 20 | Gap entre elementos |
| `space-6` | 24 | Padding de card confortável |
| `space-8` | 32 | Separação de blocos |
| `space-10` | 40 | Separação de seções |
| `space-12` | 48 | Seções grandes |
| `space-16` | 64 | Respiro de página (desktop) |
| `space-20` | 80 | Hero |

### Hierarquia de espaçamento vertical
- Entre itens relacionados: **8–12px**
- Entre grupos dentro de uma seção: **16–24px**
- Entre seções: **32–48px**

### Grid & containers

| Breakpoint | Largura | Colunas | Gutter | Margem lateral |
|------------|---------|---------|--------|----------------|
| `sm` (mobile) | 375–767 | 4 | 16 | 16 |
| `md` (tablet) | 768–1023 | 8 | 20 | 24 |
| `lg` (desktop) | 1024–1439 | 12 | 24 | 32 |
| `xl` (wide) | ≥ 1440 | 12 | 24 | auto (max-w 1200) |

- Container de conteúdo: `max-w-[1200px]` centralizado no desktop.
- Colunas de leitura (texto de análise): `max-w-[720px]`.
- Sem scroll horizontal em nenhuma largura.

---

## 5. Fundamentos: Raio, Bordas e Elevação

A referência é **muito arredondada** — é assinatura da marca.

### 5.1 Raio

| Token | px | Uso |
|-------|----|-----|
| `radius-xs` | 8 | Chips pequenos, tags |
| `radius-sm` | 12 | Inputs, badges |
| `radius-md` | 16 | Botões retangulares, imagens pequenas |
| `radius-lg` | 20 | Cards internos |
| `radius-xl` | 28 | **Card padrão** |
| `radius-2xl` | 36 | Cards hero, sheets, painel de vídeo |
| `radius-full` | 9999 | Pílulas: botões primários, nav flutuante, avatares |

### 5.2 Bordas
- Hairline padrão: `1px solid rgba(255,255,255,.08)`.
- Card destacado / foco de container: `rgba(255,255,255,.14)`.
- Borda "acento": `1px solid rgba(196,250,78,.35)` para card selecionado/ativo.

### 5.3 Elevação (dark — combina tint de superfície + sombra sutil + glow opcional)

No escuro, elevação vem **mais de superfície mais clara** do que de sombra pesada.

| Token | Superfície | Sombra | Uso |
|-------|-----------|--------|-----|
| `elev-0` | `surface-1` | nenhuma | Card em repouso |
| `elev-1` | `surface-2` | `0 2px 8px rgba(0,0,0,.30)` | Card hover, dropdown |
| `elev-2` | `surface-2` | `0 8px 24px rgba(0,0,0,.40)` | Popover, menu |
| `elev-3` | `surface-2` | `0 16px 48px rgba(0,0,0,.55)` | Modal, sheet, nav flutuante |
| `glow-primary` | — | `0 8px 32px rgba(196,250,78,.28)` | CTA primário em destaque |
| `glow-focus` | — | `0 0 0 3px rgba(196,250,78,.45)` | Anel de foco (teclado) |

> **Escala consistente:** use apenas estes valores. Nunca sombras aleatórias por tela.

---

## 6. Glassmorphism e Superfícies

Usado com **propósito** (indica camada flutuante/dismissível), não como decoração — conforme regra `blur-purpose`. Aplicado em: **bottom nav flutuante, headers sticky sobre vídeo, overlays de mídia e sheets**.

```css
/* .glass — superfície de vidro padrão (dark) */
.glass {
  background: rgba(20, 26, 34, 0.55);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}
```

**Regras de glass:**
- Contraste do texto sobre glass deve ser verificado como se fosse superfície opaca (assuma o pior caso do fundo).
- **Fallback:** onde `backdrop-filter` não é suportado, cair para `surface-2` opaco (`@supports not (backdrop-filter: blur(1px))`).
- Nunca empilhar dois glass translúcidos um sobre o outro (perde legibilidade).
- Scrim de modal: preto **48–60%** (`rgba(0,0,0,.55)`) para isolar o foreground.

---

## 7. Iconografia e Imagem

- **Biblioteca:** [Lucide](https://lucide.dev) (via `lucide-react`). Uma única família, sem misturar sets.
- **Nunca emoji como ícone estrutural.**
- **Stroke:** 1.5px (padrão UI) / 2px (ênfase). Consistente por camada.
- **Tamanhos-token:** `icon-sm 16` · `icon-md 20` · `icon-lg 24` · `icon-xl 32`. Sem valores aleatórios.
- **Filled vs outline:** outline como padrão; filled só para estado ativo (ex.: item de nav selecionado).
- **Alvo de toque:** ícone clicável ≥ 44×44pt — usar `hitSlop`/padding quando o glyph é menor.
- **Alinhamento:** ícone alinhado à baseline do texto, padding consistente.

### Ícones canônicos por domínio

| Contexto | Ícone Lucide |
|----------|--------------|
| Análise de performance | `Activity`, `Waves`, `Video` |
| Upload | `UploadCloud`, `Film`, `ImagePlus`, `Link2` |
| Prancha mágica | `Sparkles`, `Ruler`, `Rocket` |
| Compatibilidade | `GitCompareArrows`, `Scale`, `Target` |
| Estados | `CheckCircle2`, `Loader2` (spin), `AlertTriangle`, `XCircle` |
| Perfil | `User`, `Settings`, `LogOut` |

### Imagem / mídia
- Formatos: **WebP/AVIF**; sempre `width`/`height` ou `aspect-ratio` para evitar CLS.
- `next/image` com `sizes` responsivo; `loading="lazy"` abaixo da dobra.
- Player/preview de vídeo com `aspect-ratio: 9/16` (vertical, padrão de session mobile) ou `16/9`.
- Skeleton shimmer enquanto mídia carrega — nunca frame vazio.

---

## 8. Tokens de implementação (CSS + Tailwind)

Convenção **shadcn/ui**: variáveis semânticas em HSL/valores no `:root` (tema escuro é o default). Componentes consomem tokens semânticos, **nunca hex cru**.

### 8.1 CSS Variables — `app/globals.css`

```css
@layer base {
  :root {
    /* Base dark (default) */
    --background: 210 30% 6%;        /* #0B0F14 */
    --foreground: 200 20% 97%;       /* #F5F8FA */

    --card: 210 24% 11%;             /* #141A22 */
    --card-foreground: 200 20% 97%;

    --popover: 210 20% 14%;          /* #1B222B */
    --popover-foreground: 200 20% 97%;

    --muted: 210 18% 17%;            /* #252E39 */
    --muted-foreground: 214 12% 70%; /* #A7B0BD */

    --primary: 74 94% 64%;           /* #C4FA4E */
    --primary-foreground: 210 30% 6%;/* #0B0F14 */

    --secondary: 171 68% 51%;        /* #2DD9BE */
    --secondary-foreground: 171 80% 8%;

    --accent: 210 18% 17%;
    --accent-foreground: 200 20% 97%;

    --success: 152 56% 52%;          /* #3CCB7F */
    --warning: 40 90% 62%;           /* #F5B849 */
    --destructive: 0 100% 68%;       /* #FF5D5D */
    --destructive-foreground: 200 20% 97%;
    --info: 217 100% 68%;            /* #5B9DFF */

    --border: 0 0% 100% / 0.08;
    --input: 210 20% 14%;
    --ring: 74 94% 64%;              /* foco = primary */

    --radius: 1.75rem;               /* 28px = radius-xl (card padrão) */
  }
}
```

### 8.2 Tailwind — `tailwind.config.ts` (trecho)

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        info: "hsl(var(--info))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        xs: "8px", sm: "12px", md: "16px", lg: "20px",
        xl: "28px", "2xl": "36px",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "elev-1": "0 2px 8px rgba(0,0,0,.30)",
        "elev-2": "0 8px 24px rgba(0,0,0,.40)",
        "elev-3": "0 16px 48px rgba(0,0,0,.55)",
        "glow-primary": "0 8px 32px rgba(196,250,78,.28)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-soft": "cubic-bezier(0.7, 0, 0.84, 0)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

> **Tema claro (opcional/futuro):** definir `:root:not(.dark)` invertendo neutros e usando `primary-700 (#84B31E)` para contraste de lima sobre claro. O produto entrega **dark como default**.

---

## 9. Componentes

Base: **shadcn/ui** (Radix por baixo → acessibilidade nativa). Abaixo, as customizações de marca por componente.

### 9.1 Botões

| Variante | Aparência | Uso |
|----------|-----------|-----|
| **Primary** | Fundo `primary`, texto `on-primary`, `radius-full`, `shadow-glow-primary` no hover | **Único CTA por tela** (ex.: "Analisar session") |
| **Secondary** | `.glass` + borda `white/10`, texto `foreground` | Ações secundárias |
| **Outline** | Transparente, borda `white/14` | Terciária |
| **Ghost** | Sem fundo; hover `muted` | Ações em barra de ferramentas |
| **Destructive** | `destructive` bg, texto branco | Excluir prancha/análise |

**Especificações:**
- Altura: `sm 36` · `md 44` (padrão) · `lg 52`. Mobile mínimo **44px**.
- Padding horizontal: 16 (sm) / 20 (md) / 24 (lg).
- Ícone + label: gap 8; ícone `icon-md` (20).
- **Estado de loading:** `disabled` + `Loader2` girando + label muda ("Analisando…"). Nunca clicável durante async.
- **Press:** escala `0.97`, 120ms (`scale-feedback`), sem shift de layout.
- **Foco (teclado):** `glow-focus` (anel lima 3px). Nunca remover outline.
- Todo botão clicável tem `cursor-pointer` e `touch-action: manipulation`.

### 9.2 Cards

Container base do produto. `radius-xl` (28), `bg card`, borda hairline, padding 24 (desktop) / 20 (mobile).

Variantes:
- **Metric card** — número `display-lg` tabular + `overline` label + delta com ícone de tendência colorido (`success`/`destructive`). Espelha o card de "Total Balance" da referência.
- **Media card** — thumbnail de vídeo/imagem (aspect-ratio fixo), badge de status flutuante, título + metadados. `radius-2xl`.
- **Analysis card** — título de seção + corpo `body-lg` + lista de bullets; usado em "Pontos fortes / Pontos de melhoria".
- **Board spec card** — layout de ficha técnica (label→valor em grid 2 colunas), imagens da prancha em galeria.
- **Selectable card** — usado em "escolher prancha mágica de referência": borda vira `rgba(196,250,78,.35)` + check quando selecionado.

Hover (desktop): eleva para `elev-1` + borda `border-strong`, 180ms `out-soft`. Sem hover-only para info crítica.

### 9.3 Inputs e Formulários

- **Label sempre visível** acima do campo (`body-sm`, `text-secondary`). Nunca placeholder como label.
- Altura mínima **44px**; `bg input` (`surface-2`), borda hairline, `radius-sm`.
- Foco: borda `primary` + `glow-focus`.
- **Helper text** persistente abaixo de campos complexos (ex.: "Litragem em litros; deixe vazio se não souber").
- **Erro:** borda `destructive`, mensagem abaixo do campo com ícone `AlertTriangle` + causa **e** correção ("Vídeo acima de 200MB. Comprima ou envie um link.").
- Validação **on blur**, não a cada tecla.
- Tipos semânticos (`email`, `tel`, `number`) para acionar teclado móvel correto; `autocomplete`/`textContentType`.
- Campos obrigatórios marcados com `*`.
- Ao submeter com erro: foco automático no primeiro campo inválido; múltiplos erros → resumo no topo com âncoras.
- `aria-live="polite"` / `role="alert"` para erros lidos por leitor de tela.

**Campos do perfil (PRD 4.1):** nível de surf (segmented/select), peso/altura (number com unidade), tipo de onda (select). Agrupar logicamente com `fieldset`.

### 9.4 Segmented control (tabs de período/filtro)

Espelha o "Week / Month / Year" da referência. Trilho `surface-2` `radius-full`; item ativo = pílula `primary` com `on-primary`; inativos `text-secondary`. Transição do indicador 200ms `out-soft`. Usar para: período de estatísticas, foco da análise (Velocidade/Manobras/Consistência).

### 9.5 Badges / Pills de status

Formato pílula, `caption` peso 500, ícone 14 + texto. Sempre cor + ícone (nunca só cor):

| Status | Cor | Ícone | Texto |
|--------|-----|-------|-------|
| Processando | `info-bg` / `info` | `Loader2` (spin) | "Processando" |
| Pronto | `success-bg` / `success` | `CheckCircle2` | "Pronto" |
| Falhou | `danger-bg` / `danger` | `XCircle` | "Falhou" |
| Rascunho | `muted` / `text-secondary` | `Circle` | "Rascunho" |

### 9.6 Upload / Dropzone

Componente-chave (todos os módulos começam por upload). 

- Área tracejada (`border-strong` dashed), `radius-2xl`, altura generosa, ícone `UploadCloud` grande + label "Arraste um vídeo ou toque para enviar" + hint de formatos/tamanho.
- Estados: repouso → **drag-over** (borda `primary`, fundo `primary-bg`) → **uploading** (barra de progresso lima + %) → **pronto** (thumbnail + nome + tamanho + botão remover) → **erro**.
- Tabs internas: `Arquivo` · `Imagens (frames)` · `Link` (YouTube/Instagram) — refletindo PRD 4.2.
- Progresso com número tabular; nunca travar a UI durante upload.

### 9.7 Navegação flutuante (bottom nav — mobile)

Assinatura da referência. Pílula `.glass` flutuante (`elev-3`), presa acima da safe-area inferior (`env(safe-area-inset-bottom)`), **máx. 5 itens**.

- Item ativo: ícone **filled** + fundo pílula `primary` com `on-primary` (destaque forte, como na referência); inativos: outline `text-secondary`.
- Itens do MVP: `Home` (dashboard), `Análises` (`Activity`), `Pranchas` (`Sparkles`), `Perfil` (`User`). CTA central de upload pode ser um FAB lima destacado.
- Ícone + label (label `caption`); nunca icon-only.
- Localização da nav é constante em todas as telas top-level.

### 9.8 Sidebar (desktop ≥ 1024px)

Navegação adaptativa: no desktop, a bottom nav vira **sidebar** fixa à esquerda (`surface-1`, largura 240–280). Item ativo com barra/indicador lima à esquerda + destaque de fundo. Ações destrutivas (Logout) separadas visualmente no rodapé.

### 9.9 Modal / Sheet

- Desktop: **modal** centralizado (`elev-3`, `radius-2xl`, scrim 55%).
- Mobile: **bottom sheet** deslizando de baixo, com "grabber" e swipe-down para fechar.
- Sempre com botão de fechar (`X`) visível + rota de escape (Esc/back).
- Confirmar antes de descartar com alterações não salvas (`sheet-dismiss-confirm`).
- Animar a partir da origem (scale+fade / slide-in) para continuidade espacial.

### 9.10 Toast / Feedback

- Posição: topo-direita (desktop) / topo (mobile, abaixo da safe-area).
- Auto-dismiss 3–5s; `aria-live="polite"`, **não rouba foco**.
- Ações destrutivas oferecem **Undo** ("Análise excluída · Desfazer").
- Sucesso confirmado com checkmark/toast; erro com caminho de recuperação (Retry).

### 9.11 Estados vazios (empty states)

Ilustração/ícone discreto + título + 1 linha de orientação + CTA. Ex.: "Nenhuma análise ainda. Envie sua primeira session para receber feedback." + botão primário.

### 9.12 Skeletons / Loading

- Operações > 300ms → skeleton shimmer (não spinner).
- Reserva de espaço = layout final (evita CLS).
- Análise de IA (assíncrona) mostra card com badge "Processando" + skeleton do texto; atualiza para conteúdo quando `done`.

---

## 10. Data Visualization

Baseado no gráfico de "Statistic" da referência (linha suave com ponto destacado). Lib recomendada: **Recharts** ou **visx** (React), com tema dark customizado.

### Diretrizes
- **Tipo por dado:** tendência → linha; comparação → barra; proporção (≤5 cat.) → donut; progresso único → gauge/radial.
- Cores da [paleta categórica](#25-paleta-de-data-viz-categórica); nunca depender só de cor (adicionar rótulo/forma/legenda).
- **Gridlines** sutis (`white/06`); não competir com os dados.
- **Tooltip** no hover (web) / tap (mobile) com valor exato; alvo de toque ≥ 44pt nos pontos.
- **Legenda** sempre visível e próxima; clicável para toggle de série.
- **Eixos** com unidade e escala legível; auto-skip de ticks no mobile.
- **Formatação locale-aware** (pt-BR) para números/datas.
- **Estados:** loading → skeleton do gráfico; vazio → "Sem dados ainda" + orientação; erro → mensagem + retry (nunca eixo vazio quebrado).
- Alternativa em **tabela** e `aria-label` com o insight-chave para leitores de tela.
- Respeitar `prefers-reduced-motion` (dado legível imediatamente, sem depender da animação de entrada).

### Componente especial: **Surf Score Gauge**
Medidor radial (0–100) para nota de performance da session. Arco em `grad-primary`, número central `display-2xl` tabular, label `overline`. Faixas com cor semântica (baixo=`warning`, médio=`info`, alto=`success`/lima) sempre acompanhadas de rótulo textual.

---

## 11. Padrões de tela (por módulo do MVP)

### 11.1 Autenticação & Onboarding (PRD 4.1)
- Tela split (desktop) / full (mobile): lado visual com `grad-ocean` + `grad-surface-glow` e headline `display-xl` ("Sua evolução no surf, analisada por IA"), lado com form.
- Login/cadastro (Supabase Auth): email + senha, toggle mostrar/ocultar, `autocomplete`.
- Onboarding progressivo do perfil (nível, peso, altura, tipo de onda) com **indicador de etapas** e navegação para trás. Auto-save de rascunho.

### 11.2 Dashboard / Home
- Header de boas-vindas (avatar + nome, espelha "Welcome, Arina" da referência) + CTA primário de upload.
- **Metric cards** no topo: nº de análises, score médio, streak de semanas ativas.
- **Surf Score Gauge** + gráfico de tendência de evolução (segmented Week/Month/Year).
- Lista "Análises recentes" (media cards com badge de status).
- Bottom nav flutuante / sidebar conforme breakpoint.

### 11.3 Análise de performance (PRD 4.2)
- **Fluxo:** Upload (arquivo/imagens/link) → contexto (tipo de onda, foco: segmented) → CTA "Analisar" → estado **Processando** (badge + skeleton) → **Resultado**.
- **Tela de resultado:** player/preview no topo (`radius-2xl`), Surf Score Gauge, seções em Analysis cards: *Resumo da sessão* · *Pontos fortes* · *Pontos de melhoria* · *3 prioridades de treino* (lista numerada com ícones). Coluna de leitura `max-w-720`.

### 11.4 Minha Prancha Mágica (PRD 4.3)
- Cadastro: galeria de upload (deck, fundo, rails, rabeta, bico) + campos de medidas (number+unidade) + campos de sensação (textarea com helper).
- **Ficha técnica gerada:** Board spec card com grid label→valor (shape, rails, fundo, rabeta, rocker, litragem) + bloco destaque `grad-ocean` "Por que ela funciona tão bem para você".
- Badge `Sparkles` "Prancha mágica".

### 11.5 Essa prancha combina comigo? (PRD 4.4)
- Entrada: upload de imagens da prancha candidata + medidas anunciadas + **select da prancha mágica** de referência (Selectable cards).
- **Resultado comparativo:** veredito em destaque (Analysis card com cor semântica de "match"), tabela **Prós × Contras** (colunas com `success`/`warning`), e comparação lado a lado com a prancha mágica (aqua = mágica, lima = candidata) usando ícone `GitCompareArrows`. Sempre com rótulo, não só cor.

---

## 12. Movimento e Animação

**Tokens de duração/easing (globais — mesmo ritmo em todo o app):**

| Token | Valor | Uso |
|-------|-------|-----|
| `dur-fast` | 120ms | Press, toggle |
| `dur-base` | 200ms | Hover, tabs, estados |
| `dur-slow` | 300ms | Entrada de card, sheet |
| `dur-max` | 400ms | Transição de tela (teto) |
| `ease-out-soft` | `cubic-bezier(0.16,1,0.3,1)` | Entrada |
| `ease-in-soft` | `cubic-bezier(0.7,0,0.84,0)` | Saída |
| spring | mola física | Sheets, drag, nav |

**Regras:**
- Só `transform` e `opacity` (nunca `width`/`height`/`top`/`left`) → sem CLS.
- Entrada `ease-out`; saída `ease-in` e **~60–70% mais curta** que a entrada.
- Máx. 1–2 elementos animados por view; stagger de lista 30–50ms/item.
- Toda animação = causa/efeito (nunca decorativa pura).
- **Interruptível:** gesto/tap do usuário cancela animação em curso; UI nunca bloqueia input.
- Sheets/modais animam a partir da origem; navegação forward = esquerda/cima, back = direita/baixo.
- **`prefers-reduced-motion`:** reduzir/desligar animações; conteúdo continua legível e funcional.

---

## 13. Acessibilidade

Prioridade **CRÍTICA** — validar antes de qualquer entrega.

- **Contraste:** texto ≥ 4.5:1; large/UI ≥ 3:1; verificado no tema escuro isoladamente.
- **Foco visível:** `glow-focus` (anel lima) em tudo interativo; nunca remover.
- **Navegação por teclado:** ordem de tab = ordem visual; suporte completo; skip-link "pular para conteúdo".
- **Leitor de tela:** `aria-label` em botões icon-only; `alt` descritivo em imagens significativas; ordem de leitura lógica; foco move para o conteúdo principal após troca de rota.
- **Cor não é único indicador:** sempre ícone/texto junto (estados, gráficos, comparações).
- **Alvos de toque:** ≥ 44×44pt, gap ≥ 8px; `hitSlop` para ícones pequenos.
- **Dynamic Type / zoom:** suportar escala de texto do sistema sem quebrar layout nem truncar; `viewport` com `initial-scale=1`, nunca desabilitar zoom.
- **Formulários:** label associado (`for`/`id`), erro claro (causa+correção), `role="alert"`/`aria-live`, foco no 1º campo inválido.
- **Rotas de escape:** cancel/back em modais e fluxos multi-etapa.
- **Reduced motion:** respeitado globalmente.

---

## 14. Responsividade e Navegação

- **Mobile-first**, breakpoints `375 / 768 / 1024 / 1440`.
- Navegação **adaptativa:** bottom nav flutuante (< 1024) ↔ sidebar fixa (≥ 1024). Nunca misturar Tab + Sidebar + Bottom Nav no mesmo nível hierárquico.
- Estado ativo sempre destacado (cor/peso/indicador).
- **Back previsível:** preserva scroll, filtros e input ao voltar; suporte a gesto de sistema (iOS swipe-back / Android predictive back).
- **Deep linking:** toda tela-chave alcançável por URL (compartilhar análise, prancha).
- **Safe areas:** headers, nav flutuante e CTA fixos respeitam notch/status bar/home indicator.
- **Fixed offsets:** conteúdo scrollável reserva padding para nav/CTA fixos (não fica escondido).
- Sem scroll horizontal; `min-h-dvh` no lugar de `100vh`.
- Ações destrutivas separadas espacialmente das ações normais de navegação.

---

## 15. Checklist de entrega (Definition of Done)

**Visual**
- [ ] Sem emoji como ícone (só Lucide/SVG)
- [ ] Ícones da mesma família, stroke e tamanhos-token consistentes
- [ ] Tokens semânticos usados (sem hex cru em componente)
- [ ] Raio, sombra e glass conforme escala (sem valores avulsos)
- [ ] Press-state sem shift de layout

**Interação**
- [ ] Feedback de press em ≤ 150ms em tudo tappável
- [ ] Alvos ≥ 44×44pt, gap ≥ 8px
- [ ] Microinterações 150–300ms com easing dos tokens
- [ ] Estados disabled/loading claros e não interativos
- [ ] Um único CTA primário por tela

**Escuro / contraste**
- [ ] Texto primário ≥ 4.5:1 e secundário ≥ 3:1 no escuro
- [ ] Bordas/divisores visíveis; estados distinguíveis
- [ ] Scrim de modal 48–60%

**Layout**
- [ ] Safe areas respeitadas (nav flutuante/headers/CTA)
- [ ] Conteúdo não escondido atrás de barras fixas
- [ ] Testado em 375px e landscape; sem scroll horizontal
- [ ] Ritmo 4/8 em componente, seção e página

**Acessibilidade**
- [ ] Foco visível em tudo interativo
- [ ] Labels/hints/erros em formulários (com aria-live)
- [ ] Cor não é o único indicador
- [ ] `prefers-reduced-motion` e Dynamic Type suportados
- [ ] Deep link funcional para telas-chave

---

### Referência visual

O sistema é inspirado em uma UI fintech dark com acento verde-lima, cantos muito arredondados, glassmorphism e navegação flutuante em pílula — adaptada para o contexto **video-first e oceânico** do Surf Performance & Board AI (adição de secundário aqua, paleta categórica de data-viz e o *Surf Score Gauge*).
