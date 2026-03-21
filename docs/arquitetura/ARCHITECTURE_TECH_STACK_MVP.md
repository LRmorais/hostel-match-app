# ARCHITECTURE_TECH_STACK_MVP.md
> Arquitetura inicial (Tech Stack) para o MVP Rolê-First  
> Objetivo: listar tecnologias e responsabilidades de cada componente, usando serviços gratuitos/free tier.

---

## 0) Princípios do MVP (Rolê-First)
- Construir **o mínimo funcional** para criar/entrar em rolês e conversar.
- Priorizar **tecnologias com free tier** e baixo overhead operacional.
- Evitar dependências complexas (algoritmo de match, verificação de hospedagem, geosearch avançado) no MVP.
- Garantir caminho claro de evolução (V2+).

---

## 1) Visão Geral da Arquitetura
O MVP será um app mobile (React Native) com backend serverless (Firebase) e push notifications.

**Componentes principais:**
1. Mobile App: React Native + Expo
2. Autenticação: Firebase Authentication
3. Banco de dados (realtime): Cloud Firestore
4. Armazenamento de mídia: Appwrite Storage
5. Notificações Push: Firebase Cloud Messaging (FCM) + Expo Notifications
6. Funções serverless (mínimo): Cloud Functions (somente quando necessário)
7. Observabilidade/Crash: Firebase Crashlytics (opcional no MVP)
8. Analytics: Firebase Analytics (opcional no MVP)

---

## 2) Mobile App (Frontend)

### 2.1 Stack
- **React Native**
- **Expo** (para facilitar build, push e permissões)
- Navegação: **Expo Router** (ou React Navigation)
- UI: componentização própria (MVP) + libs leves
- Estado: **Zustand** (recomendado) ou Redux Toolkit (opcional)

### 2.2 Responsabilidades
- Fluxo de onboarding (login + perfil)
- CRUD de rolês (criar, listar, entrar, sair)
- Chat do rolê (realtime listeners)
- Permissões de localização
- Notificações locais (ex.: “rolê começa em 1 hora”)
- Bloqueio/report (UI + envio de report)

### 2.3 Bibliotecas recomendadas
- Firebase SDK (RN / modular) - para Auth e Firestore
- Appwrite SDK - para Storage de arquivos
- Expo Notifications
- Expo Location
- Date/time: date-fns (ou equivalente)
- Validação: zod (opcional)

---

## 3) Backend Serverless (Firebase)

### 3.1 Firebase Authentication
**Uso:**
- Cadastro/Login via Email/Senha (MVP)
- (Opcional) Login via Google/Apple

**Responsabilidades:**
- Identidade do usuário
- Tokens de sessão
- Controle de acesso via Security Rules (auth.uid)

---

### 3.2 Banco de dados: Cloud Firestore
**Uso:**
- Dados do usuário (perfil)
- Dados dos rolês (events)
- Participantes
- Mensagens (chat do rolê)
- Reports
- Notificações in-app (opcional)

**Características necessárias do Firestore para o MVP:**
- Realtime listeners para chat e updates de rolê
- Queries simples por janela de tempo (ex.: próximos 24h)
- Paginação básica (limit + startAfter)

---

### 3.3 Armazenamento: Appwrite Storage
**Uso:**
- Fotos de perfil
- (Opcional) imagens no chat (pode ficar fora no MVP inicial)

**Responsabilidades:**
- Upload/download de arquivos
- Controle de acesso por permissões do Appwrite
- URLs públicas para visualização das imagens

**Integração:**
- URLs dos arquivos são armazenadas no Firestore
- Arquivos físicos ficam no Appwrite Storage
- Autenticação e dados no Firebase, mídia no Appwrite

---

---

## 3.5) Configuração Appwrite Storage
**Setup necessário:**
1. Criar projeto no Appwrite Console
2. Configurar bucket para armazenamento de imagens
3. Definir permissões adequadas para uploads
4. Configurar variáveis de ambiente:
   - `EXPO_PUBLIC_APPWRITE_ENDPOINT`
   - `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
   - `EXPO_PUBLIC_APPWRITE_STORAGE_ID`

**Vantagens da arquitetura híbrida (Firebase + Appwrite):**
- Firebase: Excelente para dados estruturados e realtime
- Appwrite: Foco em storage com APIs simples e free tier generoso
- Separação de responsabilidades clara

---

### 3.4 Push Notifications: Firebase Cloud Messaging + Expo
**Uso no MVP:**
- Notificar criador quando alguém entra no rolê
- Notificar participantes sobre mudanças (cancelamento/início)
- Notificação 1h antes pode ser **local** (no device) para reduzir backend

**Responsabilidades:**
- Entrega de push
- Tokens do dispositivo armazenados por usuário

---

### 3.6 Cloud Functions (mínimo necessário)
**Quando usar:**
- Enviar push quando houver evento sensível (ex.: novo participante)
- Atualização segura de contadores (`participantCount`) via transação/validação
- (Opcional) Limpeza/expiração simples

**Evitar no MVP:**
- Agendamentos complexos (Cloud Scheduler) se puder ser local no device
- Processos pesados (OCR, verificação de hospedagem, etc.)

---

## 4) Geolocalização (MVP pragmático)

### 4.1 Abordagem recomendada (MVP)
**Sem geosearch avançado**:
1. Buscar rolês por janela temporal (ex.: agora → +24h)
2. Filtrar por distância no client usando Haversine

**Motivo:**
- Simplicidade
- Sem dependências extras
- Adequado para baixo volume no início

### 4.2 Evolução (pós-MVP)
- Geohash + queries por prefixo
- Ou migrar busca para Algolia / PostGIS (Supabase) quando escalar

---

## 5) Notificações (estratégia MVP)

### 5.1 Push (FCM)
Eventos:
- Alguém entrou no seu rolê (criador)
- Rolê cancelado (participantes)

### 5.2 Notificação local (device)
Eventos:
- Lembrete 1h antes do rolê (agendado localmente quando o usuário entra no rolê)

**Motivo:**
- Evita scheduler e complexidade de backend
- Funciona bem no MVP

---

## 6) Segurança (MVP)

### 6.1 Firestore Security Rules (essenciais)
Objetivos:
- Escrita apenas por usuário autenticado
- Usuário só edita seu próprio perfil
- Somente participantes podem ler/escrever mensagens do chat do rolê
- Somente criador pode editar/cancelar rolê

**Nota:** Storage de arquivos é gerenciado pelo Appwrite com suas próprias permissões, não pelas Security Rules do Firebase.

### 6.2 Bloqueio e Report
- Bloquear: armazenado em coleção/subcoleção por usuário
- Report: coleção global (somente criação por usuário; leitura por admin no futuro)

---

## 7) Observabilidade (recomendado)
- **Crashlytics** (opcional, mas ajuda muito em beta)
- Logs simples no client (só para debug)
- Métricas básicas via Analytics (opcional)

---

## 8) CI/CD e Deploy (MVP)
- Expo EAS Build (free tier dependendo do plano/limites)
- Environments:
  - dev
  - staging (opcional)
  - prod

Config:
- `.env` para chaves não sensíveis
- Secrets no EAS / GitHub Secrets (se usar pipeline)

---

## 9) Estrutura de Projeto (sugestão)


---

## 10) Decisões do MVP (Trade-offs)
- Sem match/swipe no MVP
- Sem verificação de hospedagem no MVP
- Sem feed social global no MVP
- Geo: filtro no client (não geosearch avançado)
- Lembrete 1h: notificação local (não scheduler)

---

## 11) Roadmap técnico (pós-validação)
V2:
- Match + swipe
- Chat 1:1
- Melhoria de geolocalização (geohash)
- Perfis avançados + preferências

V3:
- Verificação de hospedagem (upload/OCR)
- Parcerias com hostels (painel simples)
- Eventos oficiais no app

V4:
- Monetização (premium/boost)
- Ads locais
- Feed social e grupos

---

## 12) Alternativa de Stack (se Firebase não for escolhido)
**Supabase (free tier)**
- Auth + Postgres
- Realtime
- Storage
- PostGIS para localização

Trade-off:
- Melhor para queries geográficas e relatórios
- Setup inicial mais complexo que Firebase
- Realtime e permissões exigem mais atenção

---

## 13) Resultado esperado do MVP
O sistema deve permitir que usuários:
- Se autentiquem
- Criem perfil simples
- Criem rolês
- Entrem/saiam de rolês
- Conversem no chat do rolê
- Recebam notificações básicas
- Reportem/bloqueiem usuários
- Encontrem pessoas na vida real (métrica central)

---
