# Hostel Match App — User Stories (MVP Rolê-First - Detailed)

Este documento descreve em nível funcional todas as histórias do MVP.
Não há decisões de UI aqui, apenas comportamento do sistema.

---

# EPIC 1 — AUTENTICAÇÃO

## US-01 — Cadastro de usuário

Descrição:
Como usuário quero criar uma conta para poder usar o app.

Fluxo:
1. Usuário informa email e senha
2. Sistema valida formato do email
3. Sistema valida senha (mín. 6 caracteres)
4. Sistema cria usuário
5. Sistema autentica automaticamente

Regras:
- Email deve ser único
- Senha deve ser criptografada
- Não permitir cadastro duplicado

Erros:
- Email inválido
- Senha fraca
- Email já existente
- Falha de rede

Estados:
- Loading
- Success
- Error

---

## US-02 — Login

Descrição:
Como usuário quero acessar minha conta existente.

Fluxo:
1. Usuário informa email e senha
2. Sistema autentica
3. Sistema redireciona para home

Regras:
- Bloquear após 5 tentativas falhas
- Manter sessão persistente

Erros:
- Credenciais inválidas
- Conta bloqueada

---

## US-03 — Logout

Descrição:
Como usuário quero sair da conta.

Fluxo:
- Limpar sessão local
- Redirecionar para login

---

# EPIC 2 — PERFIL

## US-04 — Criar perfil

Descrição:
Como usuário quero criar meu perfil público.

Campos obrigatórios:
- Nome
- Foto
- Bio
- Nacionalidade
- Idiomas

Regras:
- Foto obrigatória
- Bio máx 150 caracteres
- Idiomas mínimo 1

Estados:
- Incompleto
- Completo

---

## US-05 — Editar perfil

Descrição:
Usuário pode alterar qualquer campo.

Regras:
- Atualização em tempo real
- Cache local atualizado

---

# EPIC 3 — ROLÊS (CORE)

## US-06 — Criar rolê

Descrição:
Usuário cria uma atividade.

Campos:
- Título (obrigatório)
- Categoria (obrigatório)
- Tipo: agora/agendado
- Data/hora
- Local (lat/lng)
- Limite de pessoas (mín 2, máx 10)

Regras:
- Criador já entra automaticamente
- Não permitir data passada
- Limite inclui criador

Estados:
- Ativo
- Lotado
- Cancelado
- Concluído

---

## US-07 — Feed de rolês

Descrição:
Usuário vê rolês disponíveis.

Ordenação:
- Rolês "agora" primeiro
- Depois por proximidade
- Depois por data

Regras:
- Não mostrar rolês lotados
- Não mostrar rolês passados
- Não mostrar rolês cancelados

---

## US-08 — Entrar em rolê

Descrição:
Usuário entra em rolê existente.

Regras:
- Não permitir se lotado
- Não permitir duplicidade
- Atualizar contador

Estados:
- Pendente
- Confirmado

Erros:
- Rolê cheio
- Rolê cancelado
- Rolê expirado

---

## US-09 — Sair de rolê

Descrição:
Usuário remove participação.

Regras:
- Se criador sair → rolê cancelado
- Atualizar participantes

---

# EPIC 4 — CHAT

## US-10 — Chat do rolê

Descrição:
Chat em grupo para participantes.

Regras:
- Apenas participantes
- Mensagens ordenadas por timestamp
- Nome + foto

Estados:
- Enviado
- Entregue
- Falha

---

# EPIC 5 — LOCALIZAÇÃO

## US-11 — Distância

Descrição:
Mostrar distância aproximada.

Regras:
- Usar GPS
- Se usuário negar → ocultar distância

---

# EPIC 6 — NOTIFICAÇÕES

## US-12 — Notificação de entrada

Evento:
- Novo participante

Canal:
- Push

---

## US-13 — Notificação de início

Evento:
- 1h antes do rolê

Regras:
- Enviar apenas para confirmados

---

# EPIC 7 — SEGURANÇA

## US-14 — Reportar usuário

Motivos:
- Spam
- Assédio
- Fake
- Outro

Regras:
- Criar ticket de moderação

---

## US-15 — Bloquear usuário

Regras:
- Não aparece mais
- Não pode entrar no mesmo rolê

---

# REGRAS GLOBAIS DO MVP

## Rate Limit
- Máx 10 rolês criados por dia por usuário

## Dados
- Todo rolê tem:
  - ID único
  - Criador
  - Lista participantes
  - Status

## Logs
- Criar logs de erro
- Criar logs de eventos

## Performance
- Feed deve carregar < 2s
- Chat < 500ms

---

# Definição de Pronto (DoD)

Uma história só é considerada pronta se:
- Todos critérios de aceite atendidos
- Testada em device real
- Sem erros críticos
- Persistência funcionando
