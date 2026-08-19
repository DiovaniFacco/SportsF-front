Sim. Pegando **o documento original inteiro** e aplicando as correções que sugeri, eu faria uma **v2.0.0**, e não apenas pequenas alterações pontuais.

Também vou considerar **FACCO como o nome definitivo do produto**. O documento original tinha FACCO no título, mas ainda usava PLAYCOURT internamente; isso será eliminado.

Abaixo está a versão que eu usaria como **fonte oficial do frontend** daqui para frente.

---

# FACCO — Design System & UI/UX Guidelines

**Versão 2.0.0 — Documento Oficial de Especificação Visual, UX e Design Tokens**

> **Status:** Approved Design Foundation
> **Produto:** FACCO
> **Plataforma:** Web responsiva / Mobile-first
> **Objetivo:** Agendamento de quadras esportivas

Este documento é a **Single Source of Truth** para o design de interface (UI), experiência do usuário (UX), componentes, comportamento responsivo, acessibilidade e identidade visual da plataforma **FACCO**.

Todas as telas e componentes desenvolvidos posteriormente devem seguir estas especificações.

Nenhuma nova tela deve introduzir arbitrariamente:

* novas cores;
* novas tipografias;
* novos espaçamentos;
* novos border-radius;
* novos padrões de componentes;
* novos estilos de botão;
* novos padrões de navegação.

Quando uma necessidade não estiver contemplada neste documento, deve-se **estender o Design System de maneira consistente**, e não criar uma solução visual isolada.

---

# 1. IDENTIDADE VISUAL

## 1.1 Personalidade da Marca

A FACCO possui a personalidade de um:

> **Atleta Urbano & Tecnológico**

A marca deve transmitir:

* dinamismo;
* precisão;
* confiança;
* energia;
* praticidade;
* modernidade;
* eficiência;
* profissionalismo.

A FACCO deve parecer uma plataforma esportiva tecnológica, e não simplesmente um sistema administrativo para reservas.

---

## 1.2 Atributos Essenciais

### Praticidade

O usuário deve conseguir:

**encontrar → escolher → reservar**

com o mínimo possível de etapas.

A interface deve respeitar o tempo do usuário.

### Confiança

O usuário deve sempre compreender:

* qual quadra está escolhendo;
* qual modalidade;
* qual data;
* qual horário;
* qual preço;
* quais taxas;
* qual política de cancelamento;
* qual status da reserva.

### Energia esportiva

A interface deve possuir personalidade esportiva sem depender de:

* neon;
* excesso de verde;
* efeitos exagerados;
* estética gamer.

### Precisão

Informações relacionadas a:

* horário;
* disponibilidade;
* preço;
* localização;
* status

devem possuir hierarquia visual clara.

### Profissionalismo

A experiência deve parecer um produto comercial real, desenvolvido por uma equipe profissional de produto e engenharia.

---

# 2. ANTI-PATTERNS VISUAIS

A FACCO **não deve parecer**:

### Infantil

Evitar:

* ilustrações cartunescas;
* fontes infantis;
* excesso de formas arredondadas;
* cores excessivamente saturadas.

### Gamer / Neon

Evitar:

* RGB;
* glow exagerado;
* verde-limão fluorescente;
* magenta neon;
* fundos pretos absolutos.

### Corporativa

Evitar:

* estética de ERP;
* interfaces excessivamente burocráticas;
* tabelas sem hierarquia;
* excesso de cinza.

### Brutalista esportiva

Evitar:

* tipografia exageradamente pesada;
* excesso de caixa alta;
* estética agressiva;
* texturas de "academia hardcore".

### Dashboard genérico

Evitar:

* dezenas de cards sem propósito;
* gráficos apenas para preencher espaço;
* grids de métricas sem contexto;
* aparência de template administrativo.

---

# 3. DIREÇÃO ARTÍSTICA

## 3.1 Conceito

### Athletic Precision

A identidade visual combina:

* superfícies neutras;
* bordas finas;
* tipografia precisa;
* verde como cor de ação;
* imagens esportivas;
* detalhes técnicos;
* espaços negativos generosos.

**Glassmorphism não é a identidade principal da FACCO.**

Ele será utilizado apenas como recurso complementar.

---

## 3.2 Superfícies

A interface possuirá quatro níveis.

### Level 0 — Background

Light:

`#F8FAFC`

Dark:

`#0B0F17`

### Level 1 — Surface

Cards, formulários e containers:

`#FFFFFF`

### Level 2 — Elevated

Dropdowns, popovers e elementos flutuantes.

Utilizam:

* surface;
* borda;
* sombra suave.

### Level 3 — Overlay

Modais e Bottom Sheets.

Utilizam:

* superfície elevada;
* overlay;
* blur opcional.

---

## 3.3 Glassmorphism

Glass deve ser utilizado **com moderação**.

Aplicações permitidas:

* Header sticky;
* menus flutuantes;
* Bottom Sheets;
* overlays;
* elementos sobre imagens.

Não utilizar glass como padrão para todos os cards.

O objetivo é preservar:

> **clareza > efeito visual**

---

# 4. ELEMENTOS DECORATIVOS

A interface pode utilizar discretamente:

### Linhas técnicas de quadra

Linhas inspiradas em:

* tênis;
* basquete;
* futsal;
* vôlei.

Opacidade:

**3–5%**

Devem funcionar como elemento de identidade e não como informação.

Nunca devem competir com conteúdo.

---

# 5. SISTEMA DE CORES

## 5.1 Cores Principais

| Token                  | Valor     | Uso              |
| ---------------------- | --------- | ---------------- |
| `color-primary`        | `#10B981` | Ações principais |
| `color-primary-hover`  | `#059669` | Hover            |
| `color-primary-active` | `#047857` | Pressed          |
| `color-primary-light`  | `#ECFDF5` | Background suave |

---

## 5.2 Secondary

| Token                   | Valor     |
| ----------------------- | --------- |
| `color-secondary`       | `#0F172A` |
| `color-secondary-hover` | `#1E293B` |
| `color-secondary-light` | `#F1F5F9` |

---

## 5.3 Background

| Token                  | Valor     |
| ---------------------- | --------- |
| `background-main`      | `#F8FAFC` |
| `background-secondary` | `#F1F5F9` |

---

## 5.4 Surface

| Token              | Valor     |
| ------------------ | --------- |
| `surface-default`  | `#FFFFFF` |
| `surface-elevated` | `#FFFFFF` |

---

## 5.5 Texto

| Token            | Valor     |
| ---------------- | --------- |
| `text-primary`   | `#0F172A` |
| `text-secondary` | `#475569` |
| `text-muted`     | `#64748B` |
| `text-disabled`  | `#94A3B8` |

> `text-muted` deve ser suficientemente contrastante para qualquer texto essencial. Placeholders não devem ser utilizados para transmitir informação necessária.

---

# 6. CORES SEMÂNTICAS

| Estado  | Principal | Surface   |
| ------- | --------- | --------- |
| Success | `#10B981` | `#ECFDF5` |
| Warning | `#F59E0B` | `#FEF3C7` |
| Error   | `#EF4444` | `#FEF2F2` |
| Info    | `#3B82F6` | `#EFF6FF` |
| Holding | `#8B5CF6` | `#F5F3FF` |

### Regra importante

Cores semânticas **não são decorativas**.

Devem representar estados ou informações relevantes.

---

# 7. REGRAS DE USO DE CORES

A regra visual aproximada é:

**60% — neutros**
**30% — estrutura e texto**
**10% — acentos**

A cor primária deve ser reservada para:

* CTA principal;
* horário selecionado;
* seleção ativa;
* indicador de progresso;
* estados positivos relevantes.

Não utilizar verde em grandes áreas apenas para "deixar bonito".

---

## 7.1 Regra de cores por componente

Em vez de limitar rigidamente todos os componentes a três cores, utilizar:

> **Um componente deve possuir no máximo uma cor de ação dominante, além das cores semânticas necessárias para representar estados distintos.**

Exemplo válido:

* verde → disponível;
* amarelo → alta demanda;
* vermelho → erro.

---

# 8. TIPOGRAFIA

## 8.1 Fontes

### Headings

**Plus Jakarta Sans**

### Interface / Body

**Inter**

### Números

Inter ou Plus Jakarta Sans com:

```css
font-variant-numeric: tabular-nums;
```

---

# 9. ESCALA TIPOGRÁFICA

| Token      | Size | Line Height | Weight |
| ---------- | ---: | ----------: | -----: |
| Display    | 44px |        52px |    800 |
| H1         | 32px |        40px |    700 |
| H2         | 24px |        32px |    700 |
| H3         | 20px |        28px |    600 |
| H4         | 16px |        24px |    600 |
| Body Large | 18px |        28px |    400 |
| Body       | 14px |        20px |    400 |
| Body Small | 12px |        16px |    400 |
| Caption    | 11px |        14px |    600 |
| Label      | 13px |        18px |    600 |
| Button     | 14px |        20px |    600 |

---

# 10. REGRAS DE TEXTO

A FACCO utiliza linguagem:

**direta + amigável + objetiva + esportiva**

Evitar textos burocráticos.

### Evitar

> Operação realizada com sucesso.

### Preferir

> Agendamento confirmado.

### Evitar

> Não foi possível processar a solicitação.

### Preferir

> Não conseguimos confirmar seu agendamento.

---

## 10.1 Capitalização

Utilizar:

* Sentence case para títulos;
* Sentence case para botões;
* Sentence case para mensagens.

Evitar excesso de:

`CAIXA ALTA`

---

# 11. PREÇOS

Exemplo:

**R$ 120** `/hora`

O valor deve ser o elemento visual dominante.

Taxas e informações complementares ficam em tamanho menor.

---

# 12. HORÁRIOS

Formato padrão:

**19:00 – 20:00**

Sempre utilizar formato 24h.

Horários devem utilizar números tabulares.

---

# 13. GRID

## Desktop

12 colunas.

`gap: 24px`

## Tablet

8 colunas.

`gap: 16px`

## Mobile

4 colunas.

`gap: 12px`

---

# 14. CONTAINER

Desktop:

**max-width: 1280px**

O conteúdo deve permanecer centralizado.

Em telas muito grandes, não expandir indefinidamente o conteúdo.

---

# 15. BREAKPOINTS

Utilizar breakpoints estruturais:

| Breakpoint |     Valor |
| ---------- | --------: |
| Mobile     | `< 640px` |
| Small      |   `640px` |
| Tablet     |   `768px` |
| Desktop    |  `1024px` |
| Large      |  `1280px` |
| XL         |  `1536px` |

### Regra

Não criar regras específicas para cada tamanho de celular.

Por exemplo, evitar:

> "Em 390px fazer X e em 430px fazer Y."

O layout deve ser **fluido entre breakpoints**.

---

# 16. ESPAÇAMENTO

Escala oficial:

| Token      | Valor |
| ---------- | ----: |
| `space-1`  |   4px |
| `space-2`  |   8px |
| `space-3`  |  12px |
| `space-4`  |  16px |
| `space-5`  |  20px |
| `space-6`  |  24px |
| `space-8`  |  32px |
| `space-10` |  40px |
| `space-12` |  48px |
| `space-16` |  64px |
| `space-20` |  80px |

Valores fora da escala devem ser evitados.

---

# 17. BORDER RADIUS

| Token |  Valor | Uso                |
| ----- | -----: | ------------------ |
| xs    |    4px | Elementos pequenos |
| sm    |    6px | Slots              |
| md    |    8px | Inputs / Buttons   |
| lg    |   12px | Cards              |
| xl    |   16px | Modais / Sheets    |
| full  | 9999px | Badges / Avatares  |

A FACCO deve evitar excesso de elementos extremamente arredondados.

---

# 18. SOMBRAS

A profundidade deve ser discreta.

| Token           | Uso                  |
| --------------- | -------------------- |
| `shadow-none`   | Elementos planos     |
| `shadow-subtle` | Cards                |
| `shadow-sm`     | Hover                |
| `shadow-md`     | Elementos flutuantes |
| `shadow-lg`     | Modais               |

Sombras nunca devem substituir hierarquia visual.

---

# 19. ÍCONES

Biblioteca:

**Lucide React**

Stroke:

`1.75px – 2px`

Tamanhos:

* 16px — inline;
* 20px — interface;
* 24px — destaque;
* 32/40px — estados vazios e sucesso.

Ícone + texto:

`gap: 8px`

---

# 20. IMAGENS

## Proporções

| Contexto | Ratio |
| -------- | ----- |
| Hero     | 16:9  |
| Card     | 4:3   |
| Avatar   | 1:1   |

`object-fit: cover`

---

## Overlay

Quando houver texto sobre imagem:

utilizar gradiente de proteção.

O gradiente deve existir **somente quando necessário**.

Não aplicar automaticamente em imagens sem conteúdo sobreposto.

---

# 21. COMPONENTES FUNDAMENTAIS

O Design System deverá possuir componentes reutilizáveis para:

### Navigation

* Header
* Desktop Navigation
* Mobile Navigation
* Breadcrumb
* Bottom Navigation

### Actions

* Button
* Icon Button
* FAB

### Forms

* Input
* Search
* Select
* Date Picker
* Time Picker
* Checkbox
* Radio
* Switch
* Textarea

### Content

* Card
* Badge
* Tag
* Avatar
* Tooltip
* Divider

### Feedback

* Toast
* Alert
* Modal
* Drawer
* Bottom Sheet
* Skeleton
* Empty State
* Error State

### Data

* Table
* List
* Pagination

---

# 22. COMPONENTES ESPECÍFICOS DA FACCO

A aplicação terá componentes próprios para o domínio.

### Court Card

Responsável por apresentar uma quadra.

Deve conter, quando disponível:

* imagem;
* modalidade;
* nome;
* localização;
* características;
* avaliação;
* preço;
* favorito;
* CTA.

---

### Sport Category

Representa uma modalidade esportiva.

Exemplos:

* Futebol
* Futsal
* Tênis
* Beach Tennis
* Padel
* Basquete
* Vôlei

---

### Court Availability

Representa a disponibilidade da quadra.

---

### Time Slot

Representa um período agendável.

---

### Booking Summary

Resumo da reserva.

Deve mostrar:

* quadra;
* modalidade;
* data;
* horário;
* preço;
* taxas;
* total.

---

### Booking Status

Representação visual do estado da reserva.

---

### Price Display

Componente especializado para preços.

---

# 23. TIME SLOT

O Time Slot é um dos componentes mais importantes da FACCO.

Desktop:

altura mínima:

**56px**

Mobile:

altura mínima:

**56px**

Área clicável:

mínimo:

**44 × 44px**

---

## 23.1 Conteúdo

Um slot pode apresentar:

```text
19:00 – 20:00

R$ 140

Disponível
```

---

# 24. ESTADOS DE DISPONIBILIDADE

## Disponível

* Surface: branco
* Border: default
* Cursor: pointer

---

## Selecionado

* Background: primary
* Texto: branco
* Check
* Estado claramente distinguível

---

## Ocupado

* Surface neutra
* Texto secundário
* Lock
* "Reservado"

---

## Manutenção

* padrão visual de manutenção;
* ícone de ferramenta;
* "Manutenção".

---

## Passado

* baixa ênfase;
* "Encerrado";
* não interativo.

---

## Holding

* roxo;
* Timer;
* "Reservando...".

---

## Alta demanda

* amarelo;
* Flame;
* "Alta procura".

---

## Promoção

* verde suave;
* Tag;
* preço anterior + atual.

---

# 25. MULTI-SLOT SELECTION

Quando o usuário puder reservar múltiplos horários consecutivos:

### Regras

Os slots selecionados devem formar visualmente **um único intervalo contínuo**.

Exemplo:

```text
19:00–20:00  ✓
20:00–21:00  ✓
21:00–22:00  ✓
```

A interface deve deixar evidente que o usuário está reservando:

**19:00 → 22:00**

Se slots não consecutivos forem permitidos, cada intervalo deverá continuar visualmente independente.

O resumo deve atualizar imediatamente:

```text
3 horas
R$ 420
```

---

# 26. FLUXO DE AGENDAMENTO

Fluxo padrão:

```text
Explorar
   ↓
Quadra
   ↓
Data
   ↓
Horário
   ↓
Resumo
   ↓
Pagamento
   ↓
Confirmação
```

O fluxo deve possuir o menor número de etapas possível.

---

# 27. RESUMO STICKY

Desktop:

card lateral sticky.

Mobile:

barra inferior fixa ou Bottom Sheet.

O usuário nunca deve perder:

* quadra selecionada;
* data;
* horário;
* preço;
* próxima ação.

---

# 28. HOLDING / RESERVA TEMPORÁRIA

Quando o backend implementar retenção temporária:

o frontend deve mostrar:

```text
Horário reservado temporariamente

07:42
```

O contador deve ser visualmente claro.

Quando expirar:

> Este horário não está mais reservado para você.

O usuário deve poder retornar à seleção de horários.

---

# 29. ESTADOS DOS COMPONENTES

Todo componente interativo deve considerar:

1. Default
2. Hover
3. Focus
4. Active
5. Selected
6. Disabled
7. Loading
8. Error
9. Success

Nem todo componente precisa necessariamente **renderizar todos** esses estados, mas todos devem ter comportamento definido quando aplicável.

---

# 30. ESTADOS DE PÁGINA

Além dos estados dos componentes, cada tela deve considerar estados globais.

## Loading

Utilizar Skeleton sempre que possível.

Evitar spinner central como única resposta durante carregamentos longos.

---

## Empty

Exemplo:

> Nenhuma quadra encontrada.

Sempre fornecer:

* explicação;
* ação recomendada.

---

## Error

Exemplo:

> Não conseguimos carregar as quadras.

CTA:

**Tentar novamente**

---

## No Results

Quando filtros não retornarem resultados:

> Nenhuma quadra corresponde aos filtros selecionados.

CTA:

**Limpar filtros**

---

## Offline / Network Error

Quando apropriado:

> Verifique sua conexão e tente novamente.

---

# 31. ESTADOS DO FLUXO DE AGENDAMENTO

O fluxo deve prever:

* horário disponível;
* horário selecionado;
* horário expirado;
* conflito de reserva;
* pagamento pendente;
* pagamento aprovado;
* pagamento recusado;
* reserva confirmada;
* reserva cancelada.

Nenhum desses estados deve depender exclusivamente de cor.

---

# 32. RESPONSIVIDADE

A interface deve ser verdadeiramente responsiva.

Não simplesmente:

> desktop menor.

O layout deve ser reorganizado de acordo com o contexto.

---

## Mobile

### Cards

Uma coluna.

### Filtros

Scroll horizontal ou Bottom Sheet.

### Horários

Grid adaptável.

### Checkout

Bottom action bar.

### Modal

Bottom Sheet / Drawer quando apropriado.

### Tabelas

Transformar em cards.

---

## Desktop

### Cards

Grid de múltiplas colunas.

### Filtros

Sidebar ou toolbar.

### Checkout

Resumo lateral sticky.

### Modais

Centralizados.

---

# 33. MOBILE-FIRST

Touch targets:

**mínimo 44 × 44px**

Ideal:

**48 × 48px**

Ações importantes devem permanecer próximas da zona de alcance do polegar.

Não utilizar hover como única forma de revelar informação.

---

# 34. NAVEGAÇÃO MOBILE

Bottom Navigation pode conter:

1. Explorar
2. Agendamentos
3. Favoritos
4. Perfil

Porém, essa estrutura é uma **regra de produto**, não um requisito absoluto.

Se métricas futuras mostrarem que Favoritos possui pouca relevância, a navegação poderá ser revisada sem quebrar o Design System.

---

# 35. MICROINTERAÇÕES

## Fast

`150ms`

Usado para:

* hover;
* cor;
* pequenos estados.

## Normal

`250ms`

Usado para:

* dropdown;
* seleção;
* expansão.

## Slow

`350ms`

Usado para:

* modal;
* Bottom Sheet;
* transições maiores.

---

## 35.1 Motion Principles

Preferir:

* opacity;
* transform;
* color;
* shadow.

Evitar animações que provoquem layout shift desnecessário.

---

# 36. REDUCED MOTION

Quando o usuário possuir:

```css
prefers-reduced-motion: reduce
```

as animações devem ser reduzidas ou removidas.

A funcionalidade nunca deve depender da animação.

---

# 37. ACESSIBILIDADE

Objetivo:

> **WCAG 2.2 Level AA**

---

## Contraste

Texto normal:

**mínimo 4.5:1**

Texto grande:

**mínimo 3:1**

---

## Keyboard

Todos os elementos interativos devem funcionar através de teclado.

---

## Focus

Todo elemento navegável deve possuir estado de foco claramente visível.

---

## Cor

Nenhuma informação importante deve depender somente de cor.

Sempre que necessário:

**Cor + Texto + Ícone**

---

# 38. DARK MODE

A FACCO possuirá suporte a Dark Mode.

## Background

`#0B0F17`

## Surface

`#1E293B`

## Elevated

`#334155`

## Text Primary

`#F8FAFC`

## Text Secondary

`#94A3B8`

## Border

`#334155`

## Primary

`#34D399`

Dark Mode não deve ser implementado simplesmente invertendo as cores do Light Mode.

---

# 39. CONTENT DESIGN

A linguagem da FACCO deve ser:

> **Direta, humana e objetiva.**

## Botões

Preferir:

* Reservar
* Ver horários
* Continuar
* Confirmar reserva
* Cancelar reserva

Evitar:

* Prosseguir para a próxima etapa
* Executar operação
* Submeter formulário

---

# 40. INFORMATION ARCHITECTURE

A estrutura inicial recomendada é:

```text
FACCO
│
├── Explorar
│   ├── Busca
│   ├── Modalidades
│   ├── Filtros
│   ├── Quadras
│   └── Detalhes da quadra
│
├── Agendamentos
│   ├── Próximos
│   ├── Histórico
│   └── Detalhes
│
├── Favoritos
│
└── Perfil
    ├── Dados
    ├── Preferências
    └── Configurações
```

Essa arquitetura pode evoluir conforme o produto.

---

# 41. Z-INDEX

O sistema terá camadas oficiais:

| Token          | Valor | Uso               |
| -------------- | ----: | ----------------- |
| `z-base`       |     0 | Conteúdo          |
| `z-sticky`     |    10 | Elementos sticky  |
| `z-header`     |    20 | Header            |
| `z-bottom-nav` |    30 | Mobile navigation |
| `z-dropdown`   |    40 | Dropdown          |
| `z-overlay`    |    50 | Overlay           |
| `z-modal`      |    60 | Modal             |
| `z-toast`      |    70 | Toast             |

Nenhum componente deve inventar um `z-index` arbitrário sem necessidade.

---

# 42. NEVER BREAK THESE RULES

Estas são as regras mais importantes do sistema.

### 1.

**Nunca utilizar cores fora dos tokens oficiais sem justificar a extensão do Design System.**

### 2.

**Nunca criar um novo estilo de botão quando uma variante existente resolver o problema.**

### 3.

**Nunca indicar disponibilidade somente por cor.**

### 4.

**Nunca esconder preço, data, horário ou quadra selecionada durante o processo de reserva.**

### 5.

**Nunca utilizar glassmorphism apenas como decoração.**

### 6.

**Nunca utilizar border-radius fora da escala oficial.**

### 7.

**Nunca utilizar tipografia diferente das fontes oficiais.**

### 8.

**Nunca criar breakpoints específicos para um dispositivo sem necessidade real.**

### 9.

**Nunca criar um componente visualmente diferente de outro componente equivalente sem justificativa.**

### 10.

**Nunca criar uma tela sem estados de loading, empty e error quando esses estados forem aplicáveis.**

### 11.

**Nunca depender exclusivamente de cor para comunicar estado.**

### 12.

**Nunca permitir overflow horizontal acidental.**

### 13.

**Nunca sacrificar legibilidade em favor de estética.**

### 14.

**Nunca criar animações que prejudiquem a navegação ou acessibilidade.**

### 15.

**Nunca adicionar elementos apenas para preencher espaço vazio.**

---

# 43. DESIGN TOKENS

Os tokens oficiais são:

```json
{
  "name": "FACCO Design Tokens",
  "version": "2.0.0",

  "color": {
    "primary": "#10B981",
    "primaryHover": "#059669",
    "primaryActive": "#047857",
    "primaryLight": "#ECFDF5",

    "secondary": "#0F172A",
    "secondaryHover": "#1E293B",
    "secondaryLight": "#F1F5F9",

    "background": "#F8FAFC",
    "backgroundSecondary": "#F1F5F9",

    "surface": "#FFFFFF",
    "surfaceElevated": "#FFFFFF",

    "textPrimary": "#0F172A",
    "textSecondary": "#475569",
    "textMuted": "#64748B",
    "textDisabled": "#94A3B8",

    "success": "#10B981",
    "successSurface": "#ECFDF5",

    "warning": "#F59E0B",
    "warningSurface": "#FEF3C7",

    "error": "#EF4444",
    "errorSurface": "#FEF2F2",

    "info": "#3B82F6",
    "infoSurface": "#EFF6FF",

    "holding": "#8B5CF6",
    "holdingSurface": "#F5F3FF",

    "border": "#E2E8F0",
    "borderStrong": "#CBD5E1",
    "borderSubtle": "#F1F5F9"
  },

  "dark": {
    "background": "#0B0F17",
    "surface": "#1E293B",
    "surfaceElevated": "#334155",
    "textPrimary": "#F8FAFC",
    "textSecondary": "#94A3B8",
    "border": "#334155",
    "primary": "#34D399"
  },

  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
    "20": "80px"
  },

  "radius": {
    "xs": "4px",
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },

  "typography": {
    "heading": "Plus Jakarta Sans",
    "body": "Inter"
  },

  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  },

  "motion": {
    "fast": "150ms",
    "normal": "250ms",
    "slow": "350ms"
  },

  "zIndex": {
    "base": 0,
    "sticky": 10,
    "header": 20,
    "bottomNav": 30,
    "dropdown": 40,
    "overlay": 50,
    "modal": 60,
    "toast": 70
  }
}
```

---

# 44. REFERÊNCIAS VISUAIS

As referências servem apenas como **benchmark**, não como inspiração para copiar interfaces.

### Strava

Aprender:

* energia esportiva;
* hierarquia de métricas;
* sensação de atividade.

Não copiar:

* identidade visual;
* laranja;
* estrutura de feed.

### ClassPass

Aprender:

* descoberta;
* filtros;
* seleção de horários.

Não copiar:

* estrutura de negócio;
* interface literalmente.

### Airbnb

Aprender:

* qualidade dos cards;
* fotografia;
* localização;
* avaliação.

Não copiar:

* fluxo de reserva;
* arquitetura de informações.

### Linear

Aprender:

* precisão;
* tipografia;
* estados;
* bordas.

Não copiar:

* estética dark corporativa.

---

# 45. PRINCÍPIOS DA FACCO

A constituição visual da FACCO:

### 1. Clareza antes da decoração

O usuário deve entender a interface antes de admirá-la.

### 2. Respeite o tempo do atleta

Menos etapas e menos fricção.

### 3. Disponibilidade deve ser inequívoca

O usuário nunca deve ficar em dúvida sobre um horário.

### 4. Mobile é prioridade

A experiência mobile não é uma versão reduzida do desktop.

### 5. Preço sem surpresas

O custo deve ser transparente.

### 6. Feedback em toda interação importante

A interface nunca deve parecer indiferente a uma ação do usuário.

### 7. Densidade adaptativa

Pouca informação durante descoberta; precisão durante seleção.

### 8. Acessibilidade é parte do design

Não é uma etapa posterior.

### 9. Imagens devem vender a experiência

Mas nunca comprometer a informação.

### 10. Consistência acima da criatividade isolada

Uma boa ideia que quebra o sistema não é uma boa solução.

### 11. Funcionalidade antes de decoração

Todo elemento visual deve possuir propósito.

### 12. Uma única verdade visual

Todas as telas da FACCO devem parecer parte do mesmo produto.

---

# 46. REGRA PARA O DESENVOLVIMENTO DAS TELAS

A partir deste documento, cada nova tela deverá ser desenvolvida seguindo esta sequência:

```text
1. Identificar objetivo da tela
        ↓
2. Identificar fluxo do usuário
        ↓
3. Reutilizar componentes existentes
        ↓
4. Aplicar Design Tokens
        ↓
5. Definir estados
        ↓
6. Adaptar para mobile
        ↓
7. Implementar
        ↓
8. Auditar visualmente
        ↓
9. Auditar UX
        ↓
10. Auditar acessibilidade
```

Nenhuma tela deve ser considerada pronta apenas porque "funciona".

Ela deve também:

* parecer FACCO;
* funcionar em mobile;
* possuir estados;
* possuir hierarquia;
* respeitar os tokens;
* ser acessível;
* ser consistente com as demais telas.

---

---

# 48. DEFINIÇÃO DE "PRONTO"

Uma tela somente poderá ser considerada finalizada quando:

* [ ] Segue os tokens FACCO
* [ ] Utiliza os componentes oficiais
* [ ] Possui hierarquia visual clara
* [ ] Funciona em mobile
* [ ] Funciona em desktop
* [ ] Não possui overflow
* [ ] Possui loading quando necessário
* [ ] Possui empty state quando necessário
* [ ] Possui error state quando necessário
* [ ] Possui feedback de interação
* [ ] Possui estados de focus
* [ ] Possui contraste adequado
* [ ] Não depende somente de cor
* [ ] Não introduz padrões visuais arbitrários
* [ ] Mantém consistência com as telas existentes

---
