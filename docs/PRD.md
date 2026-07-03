1. Visão geral do produto
   Produto:
   Surf Performance & Board AI – SaaS que analisa vídeos e imagens de surf para dar feedback técnico de performance e entender o design de pranchas (incluindo “prancha mágica” e compatibilidade com o surfista).

Problema que resolve:
Surfistas filmam sessions e têm pranchas que funcionam bem, mas não conseguem traduzir isso em aprendizado contínuo nem em especificação técnica clara para compra de novas pranchas ou pedido para shaper.

Proposta de valor:

Feedback técnico estruturado sobre surf a partir de vídeo.

Ficha técnica da prancha mágica e comparação com novas pranchas.

Tudo via IA, em um fluxo simples de upload e resposta.

2. Objetivos do MVP
   Permitir que um usuário autenticado:

Faça upload de vídeos/links/imagens e receba uma análise de performance.

Cadastre uma prancha mágica com fotos e dados básicos e receba ficha técnica.

Envie imagens de outra prancha e receba análise de compatibilidade com seu perfil e com a prancha mágica.

Construir uma base técnica sólida:

Next.js + Supabase com auth, storage e RLS funcionando.

Camada de IA isolada em endpoints/server actions para facilitar evolução futura.

3. Personas
   Surfista intermediário solo (principal)

Já surfa com frequência, filma sessions ou tem fotos, entende noções básicas de prancha.

Dor: quer evoluir técnica e fazer escolhas melhores de prancha, sem depender sempre de coach presencial.

Coach/Shaper (secundário, futuro)

Usa a ferramenta para organizar feedback para alunos e clientes, e como referência de especificação de prancha.

4. Escopo funcional do MVP
   4.1 Autenticação e conta (Supabase Auth)
   Requisitos:

Usuário consegue:

Criar conta com e-mail e senha (Supabase Auth).

Fazer login/logout.

Ver seu perfil básico (nome, nível de surf, localização).

Guardar no perfil:

Nível de surf (iniciante, intermediário, avançado).

Peso, altura (para análise de prancha).

Tipo de onda mais frequente (beach break, point, etc.).

Prioridade: P0 (essencial).

4.2 Módulo de análise de performance de surf (vídeo / imagens / link)
User story principal:
“Como surfista, quero enviar um vídeo curto ou imagens da minha surf session para receber um feedback técnico sobre minha performance.”

Requisitos:

Upload:

Usuário pode:

Subir arquivo de vídeo (com limite de tamanho) ou imagens (frames da session).

Informar link de vídeo (YouTube, Instagram, etc.), opcional.

Adicionar contexto: tipo de onda, foco da análise (velocidade, manobras, consistência).

Processamento:

Sistema registra o media item (tipo: vídeo, imagem, link) em media_items.

Um job/server action dispara a análise via IA:

Extrai frames chave (para vídeo) ou usa as imagens diretamente.

Aplica prompt de coach de surf com checklist: entrada na onda, postura, linha na parede, manobras, erros, sugestões de treino.

Resultado:

Registro em analyses com:

Tipo: performance.

Texto estruturado com:

Resumo da sessão.

Pontos fortes.

Pontos de melhoria.

3 prioridades de treino.

Usuário visualiza análise em uma tela de detalhes, associada ao media item.

Prioridade: P0.

Fora de escopo MVP:

Download de relatório em PDF.

Comparação lado a lado de duas sessões diferentes.

4.3 Módulo “Minha Prancha Mágica”
User story principal:
“Como surfista, quero cadastrar minha prancha mágica para ter uma ficha técnica detalhada e usar como referência futura.”

Requisitos:

Cadastro:

Usuário pode:

Subir imagens da prancha (deck, fundo, rails, rabeta, bico).

Informar medidas que souber (tamanho, largura, espessura, litragem).

Preencher campos de sensação:

Como ela anda em mar pequeno/grande.

Pontos fortes e fracos que ele sente.

Processamento:

IA gera uma ficha técnica:

Classifica shape (tipo de prancha).

Descreve rails (box/refinados), fundo (flat, concave etc.), rabeta, rocker.

Relaciona isso com perfil do surfista (altura, peso, nível, ondas).

Resultado:

Registro em boards com flag is_magic = true.

Tela de detalhes da prancha mágica:

Ficha técnica em texto.

Resumo: “Por que ela funciona tão bem para você”.

Prioridade: P0 (faz parte do core de diferenciação).

4.4 Módulo “Essa prancha combina comigo?”
User story principal:
“Como surfista, quero enviar imagens de uma prancha que estou considerando para saber se ela combina comigo e com minha prancha mágica.”

Requisitos:

Entrada:

Usuário pode:

Subir imagens de uma prancha (fotos de anúncio, loja, etc.).

Informar, se tiver, medidas anunciadas.

Select da prancha mágica como referência (se houver).

Processamento:

IA:

Descreve características visíveis da prancha nova (shape, rails, fundo, rabeta, rocker aproximado).

Compara com:

Perfil do surfista (peso, altura, nível, ondas).

Prancha mágica selecionada (se existir).

Gera parecer:

Em quais condições essa prancha deve funcionar bem.

Onde ela se distancia da prancha mágica (mais performance, mais perdoável, etc.).

Resultado:

Registro em analyses com tipo board_match.

Tela de resultado com:

Texto principal (veredito).

Lista de prós e contras.

Prioridade: P1 (valor alto, mas pode vir logo após performance + prancha mágica).

5. Requisitos não funcionais
   Tecnologia:

Frontend: Next.js (App Router).

Backend: Supabase (Auth, Postgres, Storage, possivelmente Edge Functions).

IA: integração com modelo de linguagem/visão via API, isolada em camada própria.

Segurança:

RLS em todas as tabelas para garantir que cada usuário só vê seus dados.

Armazenar chaves e credenciais em env, não no código.

Performance e limites:

Limite de tamanho para upload de vídeo (MVP).

Tarefas de análise podem ser assíncronas (status “processing” → “done”).

UX:

Interface simples, mobile-friendly.

Textos em português, termos técnicos de surf, mas com explicação clara.

6. Métricas de sucesso do MVP
   Número de usuários que completam:

Pelo menos 1 análise de performance.

Pelo menos 1 cadastro de prancha mágica.

Taxa de retorno:

Quantos usuários fazem 2+ análises de performance em semanas diferentes (sinal de hábito).

Qualitativo:

Feedback dos primeiros surfistas sobre se as análises fazem sentido e ajudam em decisões de compra/shape.
