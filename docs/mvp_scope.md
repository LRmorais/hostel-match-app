# Hostel Match App — MVP Scope (Rolê-First) 🚀

## Objetivo do MVP
Validar se viajantes querem:
- Criar atividades espontâneas (rolês)
- Entrar em rolês de outros viajantes
- Usar um app para se encontrar na vida real durante a viagem

Métrica principal de sucesso (North Star):
> Número de rolês realizados por dia.

---

# 1. Proposta do MVP

Versão inicial do produto:
> Um app onde viajantes podem criar e entrar em rolês em tempo real.

Sem swipe.
Sem match.
Sem algoritmo.
Sem complexidade.

Só:
- Pessoas
- Atividades
- Encontros reais

---

# 2. Público Inicial

Early adopters:
- Mochileiros
- Viajantes solo
- Hostels
- Cidades mochileiras:
    - Rio de Janeiro
    - Buenos Aires
    - Lisboa
    - Barcelona
    - CDMX

---

# 3. Funcionalidades do MVP (ENTRAM)

## Autenticação
- Login com email ou Google
- Logout

## Perfil (simples)
- Nome
- Foto
- Nacionalidade
- Idiomas
- Bio curta

## Rolês (CORE)
- Criar rolê
    - Título
    - Categoria
    - Agora ou agendado
    - Data/hora
    - Local
    - Limite de pessoas
- Feed de rolês
    - Ordenado por tempo e proximidade
- Entrar no rolê
- Sair do rolê
- Lista de participantes
- Chat do rolê

## Localização
- Mostrar rolês próximos
- Mostrar distância aproximada

## Notificações
- Novo rolê próximo
- Alguém entrou no seu rolê
- Rolê começando em 1h

## Segurança mínima
- Reportar usuário
- Bloquear usuário

---

# 4. Funcionalidades que NÃO entram

Tudo que não gera encontro real:

❌ Swipe  
❌ Match  
❌ Likes  
❌ Premium  
❌ Gamificação  
❌ Feed social  
❌ Ranking  
❌ Grupos  
❌ Parcerias  
❌ Verificação de hospedagem  
❌ Upload de documentos  
❌ OCR

---

# 5. Core Loop do MVP

1. Usuário baixa app
2. Cria perfil simples
3. Vê rolês próximos
4. Entra em um rolê
5. Encontra pessoas
6. Volta para usar de novo

Se isso funcionar → produto validado.

---

# 6. Stack Técnica (Free / Solo Dev)

## Frontend
- React Native + Expo

## Backend (escolha 1)
### Opção A — Firebase
- Firebase Auth
- Firestore
- Cloud Functions
- Firebase Push

### Opção B — Supabase
- Auth
- Postgres
- Realtime
- Edge Functions

## Chat
- Firestore realtime
- ou Supabase Realtime

## Mapa
- Google Maps free tier
- ou Mapbox

---

# 7. KPIs do MVP

Métricas para validar:

- Usuários ativos por dia
- Rolês criados por dia
- Pessoas por rolê
- Rolês concluídos
- Retenção 7 dias

North Star:
> Média de participantes por rolê.

---

# 8. Roadmap 30 dias

## Semana 1
- Setup projeto
- Auth
- Perfil
- Criar rolê

## Semana 2
- Feed de rolês
- Entrar/sair
- Lista de participantes

## Semana 3
- Chat do rolê
- Localização
- Notificações

## Semana 4
- Reports
- Deploy
- Beta real em 1 hostel

---

# 9. Regra de Ouro do MVP

Toda feature nova deve responder:

> Isso aumenta a chance de alguém sair de casa e encontrar outra pessoa?

Se não → fora do MVP.

---

# 10. Visão de Evolução (após validação)

Só depois de tração real:

V2:
- Swipe
- Match
- Likes

V3:
- Verificação de hospedagem
- Parcerias com hostels
- Eventos oficiais

V4:
- Premium
- Gamificação
- Ads
