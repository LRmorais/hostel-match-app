# DEVELOPMENT_FLOW_BY_SCREENS_MVP.md
> Fluxo de desenvolvimento do MVP (Rolê-First) organizado por telas  
> Objetivo: guiar implementação no React Native + Expo + Firebase, tela por tela, com dependências e entregáveis.

---

## 0) Convenções e Premissas
- MVP inclui: Auth, Perfil simples, Rolês, Chat do rolê, Localização básica, Notificações básicas, Report/Block.
- Backend: Firebase Auth + Firestore + Storage + (mínimo) Functions.
- Geolocalização: filtro por distância no client (Haversine).
- Notificação “1h antes”: local no device (Expo Notifications).
- Push principal: “alguém entrou no seu rolê” (FCM).

---

## 1) Ordem Recomendada (Macro)
1. Setup + Infra + Navegação
2. Auth (Login/Cadastro) + Sessão
3. Onboarding de Perfil
4. Home (Feed de Rolês)
5. Criar Rolê
6. Detalhe do Rolê + Participantes (entrar/sair)
7. Chat do Rolê
8. Notificações (push + local)
9. Segurança (report + block)
10. Ajustes, Polimento, Beta

---

# 2) Telas do MVP (Screen-by-Screen)

## SCREEN 00 — Splash / Boot
**Objetivo:** preparar app, checar sessão e roteamento.

### Funcionalidades
- Inicializar Firebase
- Carregar sessão atual
- Redirecionar:
  - Não autenticado → Login
  - Autenticado e perfil incompleto → Onboarding Perfil
  - Autenticado e perfil completo → Home (Feed)

### Dependências
- Firebase Auth
- Leitura do documento `users/{uid}`

### Entregáveis
- Splash simples (loading)
- Router guard (auth + perfil)

---

## SCREEN 01 — Login
**Objetivo:** permitir usuário entrar.

### Inputs
- Email
- Senha

### Ações
- Login
- Navegar para Cadastro
- “Esqueci minha senha” (opcional no MVP)

### Estados
- Loading
- Error (mensagem clara)
- Success

### Dependências
- Firebase Auth (signInWithEmailAndPassword)

### Critérios de aceite
- Login com sucesso leva para Splash/Redirect
- Erros exibem mensagem (credenciais inválidas / rede)

---

## SCREEN 02 — Cadastro
**Objetivo:** criar conta.

### Inputs
- Email
- Senha
- Confirmar senha (recomendado)

### Regras
- Senha min 6
- Email válido
- Email único

### Dependências
- Firebase Auth (createUserWithEmailAndPassword)
- Criar doc inicial `users/{uid}` (profileStatus=incomplete)

### Entregáveis
- Tela de cadastro
- Persistir estado do usuário

---

## SCREEN 03 — Onboarding Perfil (Criar Perfil)
**Objetivo:** coletar perfil mínimo para usar o app.

### Campos obrigatórios
- Nome (displayName)
- Foto (upload Storage)
- Nacionalidade
- Idiomas (mín 1)
- Bio curta (<=150)

### Ações
- Selecionar foto (galeria/câmera)
- Salvar perfil

### Regras
- Só prossegue com todos os campos válidos
- Após salvar: `profileStatus=complete`

### Dependências
- Firebase Storage (upload foto)
- Firestore `users/{uid}`

### Entregáveis
- Tela com validação
- Upload imagem
- Persistência no Firestore

---

## SCREEN 04 — Home / Feed de Rolês
**Objetivo:** listar rolês disponíveis e permitir navegação core.

### Componentes do feed
- Card de rolê: título, categoria, data/hora, local (nome), distância (opcional), vagas restantes
- Filtros básicos (MVP):
  - Categoria
  - “Agora / Hoje / Próximos”
  - Distância (ex.: 2km, 5km, 10km)

### Ações
- Abrir rolê (Detalhe)
- Abrir Criar Rolê
- Abrir Perfil (menu)
- Pull to refresh

### Regras
- Não mostrar rolês:
  - cancelados
  - passados
  - lotados (opcional: mostrar como lotado)
- Ordenação:
  1) “Agora” primeiro
  2) Em seguida por startAt mais próximo
  3) Dentro disso, por distância (se disponível)

### Dependências
- Firestore query por janela de tempo (ex.: now → +24h/+48h)
- Location permission + Haversine para filtrar e ordenar
- Paginação (limit + startAfter) se necessário

### Entregáveis
- Lista com loading skeleton
- Empty state (“Nenhum rolê perto — crie um!”)
- Navegação para Detalhe/Criar

---

## SCREEN 05 — Criar Rolê
**Objetivo:** criar atividade e inserir criador automaticamente.

### Campos
- Título (obrigatório)
- Categoria (obrigatório)
- Tipo: Agora / Agendado
- Data/hora (se agendado)
- Local (nome + coordenadas)
- Limite pessoas (2–10)

### Regras
- Se “Agora”: startAt = now (ou now + 15min opcional)
- Se “Agendado”: startAt >= now + X minutos
- capacity inclui criador
- Ao criar:
  - `participantCount=1`
  - criar subdoc `participants/{creatorId}` com role=creator

### Dependências
- Firestore create (event)
- Firestore create participant subdoc
- Location picking (pode ser simples no MVP: usar localização atual + texto livre)

### Entregáveis
- Form com validação
- Confirmação “Rolê criado”
- Redirecionar para Detalhe do rolê

---

## SCREEN 06 — Detalhe do Rolê
**Objetivo:** mostrar informações e permitir entrar/sair.

### Informações exibidas
- Título, categoria
- Criador (nome + foto)
- Data/hora
- Local (nome) + distância
- Status (ativo/lotado/cancelado)
- Participantes (preview)
- Botões:
  - Entrar (se não participante)
  - Sair (se participante não-criador)
  - Cancelar rolê (se criador)

### Regras
- Se lotado: bloquear entrada
- Se criador cancelar: status=cancelled e notificar participantes

### Dependências
- Firestore doc do evento (listener)
- Subcoleção participants (listener/consulta)
- Transactions p/ atualizar participantCount e status (ideal)

### Entregáveis
- Fluxo Enter/Leave
- Tratamento de estados (lotado/cancelado)
- Links para Chat do rolê

---

## SCREEN 07 — Participantes do Rolê (lista completa)
**Objetivo:** ver quem está no rolê.

### Conteúdo
- Lista de participantes com foto + nome + nacionalidade
- Ações (MVP):
  - Abrir perfil público (opcional)
  - Bloquear usuário (atalho)
  - Reportar usuário (atalho)

### Dependências
- Firestore `events/{id}/participants`
- Firestore `users/{id}` para dados básicos

### Entregáveis
- Lista paginada (se necessário)
- Bloquear/Reportar integrados

---

## SCREEN 08 — Chat do Rolê (Grupo)
**Objetivo:** comunicação entre participantes.

### Funcionalidades
- Enviar mensagem texto
- Ver mensagens em realtime
- Indicador de envio (pending/sent)
- Mensagem de sistema (opcional): “X entrou no rolê”

### Regras
- Só participantes podem acessar
- Se sair do rolê: perde acesso ao chat
- Mensagens ordenadas por createdAt

### Dependências
- Firestore subcoleção messages (listener)
- Security Rules para restringir acesso

### Entregáveis
- Tela chat funcional
- Comportamento offline básico (fila de envio opcional)

---

## SCREEN 09 — Perfil (Minha Conta)
**Objetivo:** usuário vê e edita perfil.

### Conteúdo
- Foto
- Nome
- Bio
- Nacionalidade
- Idiomas

### Ações
- Editar perfil
- Logout

### Dependências
- Firestore `users/{uid}`
- Storage para atualizar foto

### Entregáveis
- Tela de perfil + editar
- Logout funcionando

---

## SCREEN 10 — Configurações (mínimo)
**Objetivo:** ajustes essenciais.

### Itens (MVP)
- Notificações: liga/desliga (client-side)
- Localização: re-solicitar permissão / instruções
- Termos/Privacidade (placeholder)

### Entregáveis
- Toggle settings persistidos localmente

---

## SCREEN 11 — Reportar Usuário / Reportar Rolê
**Objetivo:** permitir denúncia.

### Inputs
- Tipo: usuário ou rolê
- Motivo: spam/assédio/fake/outro
- Descrição opcional

### Regras
- Um report por alvo por usuário em X horas (opcional)
- Criar doc em `reports`

### Dependências
- Firestore create `reports/{id}`

### Entregáveis
- Tela de report
- Confirmação de envio

---

## SCREEN 12 — Bloqueados (opcional no MVP)
**Objetivo:** lista de bloqueados e desbloquear.

### Dependências
- `users/{uid}/blocked`

### Entregáveis
- Lista + remover bloqueio

---

# 3) Permissões e Gatekeeping (transversal)

## Localização
- Pedir permissão na primeira vez que abrir Feed
- Se negar:
  - Feed funciona sem distância
  - Filtro por distância fica desabilitado

## Notificações
- Pedir permissão ao entrar no primeiro rolê (para lembrete)
- Se negar:
  - Sem lembrete local
  - Push ainda pode funcionar dependendo do setup

---

# 4) Checklist técnico por fase

## Fase A — Setup
- Expo project criado
- Firebase project criado
- Configuração env e build profiles
- Router + guards (auth/perfil)

## Fase B — Auth + Perfil
- Login, Cadastro, Logout
- Onboarding perfil mínimo
- Storage upload foto
- Firestore user doc

## Fase C — Rolês Core
- Criar rolê
- Feed (query + filtro client)
- Detalhe (enter/leave/cancel)
- Participantes

## Fase D — Chat
- Mensagens realtime
- Regras de acesso

## Fase E — Notificações
- Token push salvo
- Push de “entrou no rolê” (Function)
- Local schedule 1h antes (device)

## Fase F — Segurança
- Report
- Block
- Regras básicas de anti-abuso (opcional)

---

# 5) Definition of Done (DoD) por Tela
Uma tela é considerada pronta quando:
- Fluxo principal funciona do início ao fim
- Loading/error/empty states implementados
- Sem crash em device real
- Dados persistem corretamente no Firestore
- Regras de acesso respeitadas (Security Rules)

---
