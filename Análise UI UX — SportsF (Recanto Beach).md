Análise UI/UX — SportsF (Recanto Beach) 

# Análise UI/UX — SportsF (Recanto Beach) 

Nov 16, 2026 · @wsdef 

## Resumo executivo 

O SportsF tem uma base visual limpa e um fluxo de reserva público curto (quadra → data → horário → WhatsApp), mas perde qualidade em três frentes: a área de gestão no mobile gasta cerca de 1/3 da tela com barras de filtro e esconde ações por overflow; há inconsistências de dados entre telas (ocupação, horários passados, status de pagamento); e a acessibilidade/semântica é praticamente nula (sem botões, links, títulos ou alt reais). 

As 5 correções de maior impacto: (1) corrigir botões cortados e o cabeçalho fixo gigante da gestão; (2) trocar o "+" do topo de "Novo Complexo" para "Novo Agendamento"; (3) ocultar/desabilitar horários já passados na Agenda do Dia; (4) tornar telefone e endereço clicáveis e enriquecer a mensagem de WhatsApp; (5) subir os campos de formulário para 16px (evita zoom automático no iPhone). 

**Como foi testado:** navegação real em viewport de 390×844 (iPhone 12–14), com checagem complementar em ~975px (desktop/tablet). Site público: home do complexo, lista de quadras, horários, seleção múltipla, compartilhar, WhatsApp (interceptado, nada foi enviado). Gestão (após seu login): Faturamento, Agenda do Dia, Agendamentos, Horários Fixos, Quadras, menu ⋮, "+", modal de novo agendamento. Nenhum dado foi salvo ou alterado. 

## O que está bem e deve ser mantido 

- **Paleta coesa:** o vinho (bordô) como cor de marca, fundos cinza-claro e cards brancos dão identidade e bom contraste para texto principal. 

- **Fluxo público curto:** do card da quadra ao WhatsApp são 3 toques. Sem cadastro obrigatório — ótimo para conversão. 

- **Barra inferior fixa com resumo** (qtd. de horários, total em R$, "Limpar") só aparece quando há seleção. Padrão moderno de carrinho; manter. 

- **Seletor de datas em pílulas** com "HOJE/AMANHÃ", e o ponto sob a data que já tem seleção. 

- **Horários agrupados por período** (Manhã/Tarde/Noite) com contagem de disponíveis e preço visível em cada slot, incluindo a tarifa noturna (R$ 60). 

- **Card "Informações"** com preços, sinal e política de falta logo no topo: transparência que reduz dúvidas no WhatsApp. 

Page 1 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

- **Modal de novo agendamento pré-preenchido** (quadra, data, início/fim e valor estimado) ao tocar num horário livre na gestão. 

- **Dashboard com 4 KPIs claros** (Recebido, Quadras, Preço médio, Ocupação) e desempenho por quadra. 

- **Agendamentos com busca + filtros por status, pagamento e quadra** e contadores nos chips. 

**Sem rolagem horizontal da página** em 390px e feedback de "Link copiado" ao compartilhar. 

## Site público (atleta) — problemas e melhorias 

### Home do complexo 

1. **Telefone e endereço não são clicáveis** (testado: tocar não faz nada). No celular, o usuário espera ligar ou abrir o mapa. _Melhoria:_ telefone como `tel:+5555991342669` , endereço abrindo Google Maps/Waze, e um botão "Como chegar". **Alta.** 

2. **"Aberto hoje" sem horário.** O selo não diz até quando. _Melhoria:_ "Aberto · até 23:30" e tocar mostra os horários da semana. **Média.** 

3. **Card "Informações" denso e com jargão.** "Fixo: 2 horários — 1º 50% + 50% • 2º 100% antecipado" não se entende de primeira; emojis variam de estilo por sistema. _Melhoria:_ 3 linhas resumidas (Preço · Sinal · Cancelamento) com ícones do mesmo set (Lucide) e "Ver regras completas" expandindo o resto. **Média.** 

4. **Filtro inútil.** "Todas" e "Vôlei • Futevôlei" retornam as mesmas 4 quadras. _Melhoria:_ esconder o filtro quando houver uma só categoria, ou filtrar por algo que diferencia (Coberta / Ao ar livre). **Média.** 

5. **Compartilhar só copia o link** e o toast empurra a página ~30px para baixo. _Melhoria:_ usar `navigator.share` no mobile (abre WhatsApp/Instagram nativo) e toast flutuante sobre o conteúdo. **Baixa.** 

6. **Hero corta o logo** ("Beach Sports e Lazer" cortado no desktop) e a foto do logo não mostra o espaço. _Melhoria:_ foto real do complexo no hero + logo em avatar sobreposto. **Baixa.** 

7. **Sem rodapé / contato final.** A página termina no último card. _Melhoria:_ bloco com mapa, Instagram, horário e WhatsApp. **Baixa.** 

### Lista de quadras 

1. **Foto da "Quadra externa 3" quase preta** (foto noturna). Parece erro de carregamento. _Melhoria:_ trocar a foto; no sistema, validar brilho ou permitir recorte/ajuste no upload. **Média.** 

Page 2 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

2. **Cards muito altos (~370px) e repetitivos.** Cada card repete as tags Vôlei/Futevôlei (já no hero) e "Areia" (todas iguais), além de chevron + botão com a mesma ação. Só cabe 1 quadra por tela. _Melhoria:_ card compacto (foto 16:9 menor, nome, Coberta/Ar livre, "a partir de R$ 60" e "7 horários livres hoje"). Mostrar disponibilidade já na lista é o maior ganho. **Alta.** 

3. **Cards encostam na borda da tela** (0px de margem) enquanto o resto da página usa 16px. _Melhoria:_ margem lateral de 16px consistente. **Média.** 

### Tela de horários 

1. **Sem URL própria.** A tela de horários não muda a URL; o "voltar" do Android/gesto do iPhone pode sair do site, e não dá para compartilhar o link de uma quadra. Ao voltar, a lista volta ao topo. _Melhoria:_ rota `/quadra/<slug>?data=AAAA-MM-DD` e preservar a rolagem. **Alta.** 

2. **Ao trocar de data, a barra inferior some** mesmo com horários selecionados em outro dia (só fica um pontinho). O usuário perde o "carrinho". _Melhoria:_ manter a barra visível com "3 horários em 2 dias". **Alta.** 

3. **Mensagem de WhatsApp pobre.** Hoje: "...agendar a quadra Quadra externa 4 para o dia 16/11/2026, às 20:30 - 21:30, 22:30 - 23:30." Falta nome, total, sinal; "quadra Quadra" duplicado; só envia horários de um dia. _Melhoria:_ pedir o nome antes (1 campo, lembrado no aparelho) e montar: "Olá! Sou _João_ . Quero reservar a _Quadra externa 4_ — seg 16/11: 20:30–21:30 e 22:30–23:30. Total R$ 137 (sinal R$ 68,50)." **Alta.** 

4. **Legenda mostra "Indisponível" mas horários ocupados não aparecem** (são omitidos). _Melhoria:_ exibir ocupados em cinza (contexto de lotação) ou remover o item da legenda. **Média.** 

5. **Faixas de período não batem com os slots:** "Noite (18:00–23:00)" contém 22:30–23:30; "Tarde (12:00–18:00)" contém 17:30–18:30. Manhã e Tarde usam o mesmo ícone de sol. _Melhoria:_ rótulos sem intervalo ("Manhã", "Tarde", "Noite") e ícone distinto (nascer do sol / sol / lua). **Baixa.** 

6. **Slot selecionado muda de altura** (layout desloca ~4px). _Melhoria:_ mesma altura nos dois estados. **Baixa.** 

7. **Botão "Agendar via WhatsApp" usa ícone de check.** _Melhoria:_ ícone do WhatsApp ou seta, e texto "Enviar pedido no WhatsApp" (deixa claro que não é confirmação imediata). **Baixa.** 

8. **Seletor de datas sem indicação de mês/limite:** 14 dias numa fila; trocar de mês não fica óbvio. _Melhoria:_ botão de calendário ao fim da fila. **Baixa.** 

Page 3 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

## Gestão (admin) — problemas e melhorias 

### Login 

1. **Campos com fonte de 14px** — no iPhone, qualquer input abaixo de 16px faz a tela dar zoom ao focar. Vale para todos os formulários do sistema. _Melhoria:_ `font-size: 16px` em inputs. **Alta.** 

2. **Sem** **`<form>` :** Enter no teclado e gerenciadores de senha funcionam pior. **Média.** 

3. **Erro genérico no topo** ("Por favor, informe seu e-mail") sem destacar o campo e deslocando o layout. _Melhoria:_ borda vermelha + mensagem sob o campo. **Média.** 

4. **Texto voltado ao atleta na rota de gestão** ("agendar quadras e partidas", "Cadastrese") e botão voltar solto no meio da tela. **Baixa.** 

### Estrutura geral (cabeçalho e navegação) 

1. **Cabeçalho fixo ocupa ~290px de 844px (34% da tela)** em Agendamentos: título + abas + busca + 3 linhas de chips com rolagem horizontal. Na Agenda do Dia são 5 faixas empilhadas (abas, datas, quadras, ações, legenda). Sobra pouco para o conteúdo. _Melhoria:_ manter fixo só título + abas; filtros num botão "Filtros (2)" que abre bottom sheet; legenda num ícone "?". **Alta.** 

2. **5 abas em rolagem horizontal** com setas sobrepostas ao texto ("‹ d Dia" cortado) e a aba ativa some da vista ao rolar. _Melhoria:_ bottom navigation com 4–5 ícones (Agenda, Reservas, Fixos, Quadras, Relatórios) — padrão de apps de gestão mobile, alcançável com o polegar. **Alta.** 

3. **Aba inicial é Faturamento.** O uso diário do gestor é ver/encaixar horários. _Melhoria:_ abrir em Agenda do Dia. **Média.** 

4. **O "+" vermelho do topo cria um novo Complexo** (ação rara, que já existe no menu ⋮). A ação mais comum (novo agendamento) fica escondida numa linha de botões. _Melhoria:_ "+" = Novo agendamento (de preferência FAB no canto inferior direito). **Alta.** 

5. **Menu ⋮ mistura destrutivo com rotina:** "Excluir Complexo" fica entre "Editar" e "Acessos", sem separador. _Melhoria:_ mover Excluir para dentro de Editar Complexo (zona de perigo) com confirmação digitando o nome; separadores entre grupos. **Média.** 

6. **Título do complexo truncado** ("Recanto Beach Sports E..."). **Baixa.** 

Page 4 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

### Faturamento & Métricas 

1. **Ocupação 0% (0 de 64)** enquanto a Agenda mostra 3 horários fixos só na Quadra Barranko e o site público já não oferece vários slots. Fixos e horários passados não entram na conta — o número passa uma leitura errada. _Melhoria:_ contar fixos como ocupados e mostrar "ocupados / restantes". **Alta.** 

2. **Formato monetário inconsistente:** "R$ 0,00" e "A receber: R$ 0.00" no mesmo card. _Melhoria:_ `Intl.NumberFormat('pt-BR')` em todo lugar. **Média.** 

3. **Barra de progresso vazia** em "Origem dos Agendamentos" e cards de 0 sem estado vazio. _Melhoria:_ estado vazio ("Nenhuma reserva hoje") e comparativo com o dia/semana anterior. **Baixa.** 

### Agenda do Dia 

1. **Horários já passados aparecem como "Livre"** (às 16h, 10:30–15:30 seguem verdes e clicáveis). Risco de agendar no passado; o site público já os oculta. _Melhoria:_ slots passados em cinza, sem ação, e uma linha "agora". **Alta.** 

2. **Verde em tudo que está livre** chama atenção para o que não importa. O gestor quer ver o que está ocupado. _Melhoria:_ livre = branco com "+"; ocupado = cor forte com nome do cliente. **Média.** 

3. **Cores colidem:** Fixo e Bloqueado são ambos tons de vinho/vermelho, e a cor de marca também. Vermelho sugere erro. _Melhoria:_ Fixo = azul/roxo, Bloqueado = cinza listrado, App = verde-azulado. **Média.** 

4. **Horário fixo fora da grade:** Nathalia está cadastrada 19:00–20:30, mas a agenda marca 18:30–19:30 e 19:30–20:30 — o gestor não vê o horário real e perde 30min de quadra. _Melhoria:_ mostrar o horário real no card e/ou impedir fixos fora da grade. **Média.** 

5. **Linha de ações quebrada:** "Horários Fixos" cortado na borda e "Grade Matrix" sozinho na 2ª linha; no mobile, tocar em Grade Matrix não teve efeito visível. "Horários Fixos" repete a aba. Legenda também cortada ("Vi…"). _Melhoria:_ remover duplicatas, renomear "Grade Matrix" para "Visão em grade" e esconder no mobile se não funcionar. **Média.** 

### Modal Novo Agendamento 

1. **Ícones duplicados** em data/hora (ícone custom + ícone nativo do input). **Baixa.** 

2. **"Não pago" / "Valor total" não parecem um seletor:** "Valor total" com borda verde (parece ativo) e o texto diz "Ficará como NÃO PAGO". Falta a opção **Sinal 50%** , que é a regra do complexo. _Melhoria:_ controle segmentado “Não pago | Sinal 50% (R$ 38,50) | Total (R$ 77)”. **Alta.** 

Page 5 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

3. **"Bloquear Horário" no rodapé de um formulário de agendamento** — três botões apertados e um deles muda o propósito do form. _Melhoria:_ rodapé só com Cancelar + Confirmar; bloquear como ação separada no slot. **Média.** 

4. **Modal centralizado com rolagem interna.** _Melhoria:_ bottom sheet em tela cheia no mobile; placeholder de telefone com DDD local (55). **Baixa.** 

### Agendamentos 

1. **Botão "Cancelar" cortado para fora do card e da tela** na reserva ativa — ação importante inacessível/ambígua. _Melhoria:_ ações em linha própria, largura total, ou menu "⋯" no card. **Alta.** 

2. **Reservas canceladas mostram "NÃO PAGO" e "Falta R$ 160"** — parece dívida. _Melhoria:_ em canceladas, esconder status de pagamento e mostrar só "Cancelado" (ou "Reembolsado"). **Média.** 

3. **Ordenação pouco clara** (canceladas futuras no topo) e "Todos (128)" como padrão. _Melhoria:_ padrão = Futuros, agrupados por dia ("Hoje", "Amanhã", "Ter 24/11"). **Média.** 

4. **Linhas vazias "** 📞 **—"** ocupando espaço. _Melhoria:_ omitir campos vazios; telefone presente vira botão WhatsApp. **Baixa.** 

### Horários Fixos e Quadras 

1. **Chips de quadra quebram em 3 linhas aqui, mas rolam na horizontal nas outras abas** , e o botão "Novo" fica no meio deles. **Baixa.** 

2. **4 botões por card de fixo** com "Excluir" com o mesmo peso de "Editar". _Melhoria:_ "Gerenciar dias" como ação principal e o resto num "⋯". **Média.** 

3. **"Nova Quadra" desalinhado** da borda direita dos cards (16px). **Baixa.** 

## Consistência, acessibilidade e responsividade 

**Consistência visual entre público e gestão.** A mesma quadra aparece com estilos diferentes: no público, selo "Coberta" escuro com ícone de escudo; na gestão, selo vinho com ícone de guarda-chuva — e o escudo vira ícone de "Areia". As tags Vôlei/Futevôlei são escuras de um lado e rosadas do outro; o ícone de esporte é um gráfico de pulso (genérico, também usado em "Acessos"). _Melhoria:_ um pequeno design system — tokens de cor por significado (livre, ocupado, fixo, bloqueado, pago, pendente, cancelado), um componente Badge e um mapa único de ícones. **Média.** 

**Hierarquia tipográfica.** Muitos textos de 11–12px em cinza (subtítulos de card, "Pago R$ 0,00 • Falta...", legenda), difíceis de ler ao sol — contexto real de quem está na quadra. _Melhoria:_ mínimo de 13–14px e cinza mais escuro (contraste ≥ 4,5:1). **Média.** 

Page 6 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

**Alvos de toque.** Chips de filtro têm 32px de altura e as setas de rolagem ~28px, abaixo dos 44px recomendados (Apple/WCAG). **Média.** 

**Acessibilidade e semântica (React Native Web).** Nenhum elemento interativo é `<button>` ou `<a>` (são `div` com clique), nenhuma das 5 imagens tem `alt` , não há nenhum título `h1/h2` , e o `<title>` da página é só "SportsF". Leitores de tela não anunciam botões, o Google não entende a página e links não abrem em nova aba nem permitem "copiar link". _Melhoria:_ usar `accessibilityRole="button" / "link" / "header"` , `href` reais, `alt` nas fotos e `<title>` /OG por complexo ("Recanto Beach – Reserve sua quadra") — melhora também a prévia ao compartilhar no WhatsApp. **Alta.** 

**Responsividade.** Em 390px não há rolagem horizontal da página (bom), mas há elementos cortados dentro de faixas (botão Cancelar, ações da agenda, legenda). Em ~975px o layout só estica: cards de quadra com 974px de largura e botão "Ver horários" de ponta a ponta. _Melhoria:_ `max-width` de ~1100px e grid de 2–3 colunas para quadras a partir de 768px; na gestão, sidebar no desktop. **Média.** 

## Backlog priorizado 

Ordem sugerida de execução: primeiro os itens de prioridade alta e esforço baixo (correções rápidas que destravam uso no celular), depois os redesenhos de navegação. Esforço é uma estimativa de front-end. 

|Prioridade|Melhoria|Área|Esforço|Benefício|
|---|---|---|---|---|
|Alta|Botão Cancelar cortado<br>/ ações fora do card|Gestão ·<br>Agendamentos|Baixo|Ação crítica volta a<br>ser acessível|
|Alta|Inputs com 16px (sem<br>zoom no iPhone)|Todo o sistema|Baixo|Formulários sem<br>"pulo" de tela|
|Alta|Ocultar/bloquear<br>horários passados|Gestão · Agenda|Baixo|Evita agendamento<br>no passado|
|Alta|"+" do topo = Novo<br>agendamento (FAB)|Gestão · Geral|Baixo|Ação mais frequente<br>a 1 toque|
|Alta|Telefone e endereço<br>clicáveis|Público · Home|Baixo|Contato e rota a 1<br>toque|
|Alta|Mensagem de<br>WhatsApp com nome,<br>total e sinal|Público ·<br>Horários|Baixo|Menos ida e volta no<br>atendimento|



Page 7 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

|Prioridade|Melhoria|Área|Esforço|Benefício|
|---|---|---|---|---|
|Alta|Pagamento: Não pago /<br>Sinal 50% / Total|Gestão · Modal|Baixo|Reflete a regra real<br>do complexo|
|Alta|Ocupação contando<br>fixos e passados|Gestão ·<br>Métricas|Médio|Métrica confiável<br>para decisão|
|Alta|Manter "carrinho" ao<br>trocar de data|Público ·<br>Horários|Médio|Seleção em vários<br>dias sem perda|
|Alta|URL própria por<br>quadra/data + voltar<br>nativo|Público|Médio|Voltar não sai do<br>site; link<br>compartilhável|
|Alta|Disponibilidade e "a<br>partir de" no card da<br>quadra|Público · Lista|Médio|Usuário escolhe sem<br>abrir cada quadra|
|Alta|Cabeçalho enxuto +<br>filtros em bottom sheet|Gestão · Geral|Médio|+30% de tela útil|
|Alta|Bottom navigation no<br>lugar das abas roladas|Gestão · Geral|Médio|Navegação visível e<br>ao alcance do<br>polegar|
|Alta|Semântica: roles, href,<br>alt, title/OG|Todo o sistema|Médio|Acessibilidade, SEO<br>e prévia no<br>WhatsApp|
|Média|Cores por significado<br>(fixo ≠ bloqueado ≠<br>marca)|Gestão · Agenda|Baixo|Leitura da agenda<br>num relance|
|Média|Formato R$ único (pt-<br>BR)|Gestão|Baixo|Credibilidade dos<br>números|
|Média|Canceladas sem "Não<br>pago/Falta"|Gestão ·<br>Agendamentos|Baixo|Evita leitura de<br>dívida falsa|
|Média|Padrão "Futuros"<br>agrupado por dia|Gestão ·<br>Agendamentos|Baixo|Lista útil logo ao<br>abrir|
|Média|Abrir gestão em<br>Agenda do Dia|Gestão|Baixo|Menos toques no<br>uso diário|
|Média|Excluir Complexo fora<br>do menu rápido|Gestão · Menu|Baixo|Evita exclusão<br>acidental|



Page 8 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

|Prioridade|Melhoria|Área|Esforço|Benefício|
|---|---|---|---|---|
|Média|Filtro de quadras útil<br>(Coberta/Ar livre)|Público · Lista|Baixo|Filtro passa a filtrar|
|Média|"Aberto até HH:MM"|Público · Home|Baixo|Informação<br>completa|
|Média|Card Informações<br>resumido + expandir|Público · Home|Baixo|Regras entendidas<br>de primeira|
|Média|Margem de 16px nos<br>cards / foto da externa 3|Público · Lista|Baixo|Acabamento e<br>confiança|
|Média|Ocupados visíveis em<br>cinza (ou tirar da<br>legenda)|Público ·<br>Horários|Baixo|Legenda coerente|
|Média|Fixos fora da grade de<br>30 min|Gestão · Agenda|Médio|Horário real visível|
|Média|Design system: badges,<br>ícones, tokens|Todo o sistema|Médio|Consistência público<br>↔gestão|
|Média|Texto ≥ 13px e contraste<br>≥ 4,5:1; alvos 44px|Todo o sistema|Médio|Legibilidade ao sol e<br>toque preciso|
|Média|Grid e max-width no<br>desktop/tablet|Todo o sistema|Médio|Layout aproveita<br>telas maiores|
|Baixa|navigator.share e toast<br>flutuante|Público · Home|Baixo|Compartilhar nativo|
|Baixa|Rótulos e ícones de<br>período|Público ·<br>Horários|Baixo|Coerência|
|Baixa|Slot selecionado sem<br>mudar altura|Público ·<br>Horários|Baixo|Sem salto visual|
|Baixa|Ícone/texto do botão<br>WhatsApp|Público ·<br>Horários|Baixo|Expectativa correta|
|Baixa|Hero com foto real,<br>rodapé com mapa|Público · Home|Baixo|Apresentação do<br>espaço|
|Baixa|Login: erro no campo,<br>texto de gestor|Gestão · Login|Baixo|Clareza|



Page 9 of 10 

Análise UI/UX — SportsF (Recanto Beach) 

|Prioridade|Melhoria|Área|Esforço|Benefício|
|---|---|---|---|---|
|Baixa|Ícones duplicados e<br>modal como bottom<br>sheet|Gestão · Modal|Baixo|Acabamento mobile|
|Baixa|Chips e botão "Novo"|Gestão ·|Baixo|Consistência|
||padronizados|Fixos/Quadras|||



Page 10 of 10 

