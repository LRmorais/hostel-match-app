# Hostel Match App

Um aplicativo social de matchmaking para viajantes hospedados em acomodações temporárias.

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Expo CLI
- Conta no Firebase

### Setup inicial

1. **Clone e instale dependências:**
```bash
cd hostel_match_app
npm install
```

2. **Configure o Firebase:**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Habilite Authentication (Email/Password)
   - Crie um banco Firestore
   - Habilite Storage
   - Baixe o arquivo de configuração
   - Substitua as credenciais em `src/services/firebase.ts`

3. **Execute o projeto:**
```bash
npx expo start
```

4. **Para testar no dispositivo:**
   - Instale o app Expo Go no seu dispositivo
   - Escaneie o QR code

## 📱 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
├── contexts/         # Contextos React (Auth, etc)
├── hooks/           # Custom hooks
├── navigation/      # Configuração de navegação
├── screens/         # Telas do aplicativo
├── services/        # Serviços (Firebase, APIs)
├── types/           # Tipos TypeScript
└── utils/           # Funções utilitárias
```

## 🔧 Tecnologias

- **Frontend:** React Native + Expo
- **Navegação:** React Navigation 6
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Linguagem:** TypeScript
- **State Management:** React Context

## 📋 Funcionalidades do MVP

### ✅ Fase 1 - Setup + Infraestrutura (CONCLUÍDO)
- [x] Configuração do projeto React Native + Expo
- [x] Integração com Firebase
- [x] Estrutura de navegação
- [x] Contexto de autenticação
- [x] Tipos TypeScript
- [x] Configuração de permissões

### 🔄 Próximas fases
- [ ] **Fase 2:** Autenticação (Login/Cadastro)
- [ ] **Fase 3:** Onboarding de Perfil
- [ ] **Fase 4:** Home - Feed de Rolês
- [ ] **Fase 5:** Criar Rolê
- [ ] **Fase 6:** Detalhe do Rolê + Participantes
- [ ] **Fase 7:** Chat do Rolê
- [ ] **Fase 8:** Notificações
- [ ] **Fase 9:** Segurança (report/block)

## 🔧 Configuração do Firebase

### Firestore Collections Structure:
```
users/
  {uid}/
    - email: string
    - displayName: string
    - photoURL: string
    - nationality: string
    - languages: string[]
    - bio: string
    - profileStatus: 'incomplete' | 'complete'
    - createdAt: timestamp
    - updatedAt: timestamp

events/
  {eventId}/
    - title: string
    - category: string
    - creatorId: string
    - startAt: timestamp
    - location: object
    - capacity: number
    - participantCount: number
    - status: 'active' | 'cancelled' | 'full'
    
    participants/
      {userId}/
        - role: 'creator' | 'participant'
        - joinedAt: timestamp
    
    messages/
      {messageId}/
        - senderId: string
        - message: string
        - createdAt: timestamp
```

## 🚀 Scripts disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Roda no emulador Android
- `npm run ios` - Roda no simulador iOS
- `npm run web` - Roda na web

## 📖 Documentação adicional

Consulte a pasta `/docs` para documentação completa:
- [Especificação do Produto](docs/PRODUCT_MASTER_SPEC.md)
- [Fluxo de Desenvolvimento](docs/arquitetura/DEVELOPMENT_FLOW_BY_SCREENS_MVP.md)
- [Arquitetura Técnica](docs/arquitetura/ARCHITECTURE_TECH_STACK_MVP.md)

## 🤝 Como contribuir

1. Siga o fluxo de desenvolvimento por telas documentado
2. Implemente testes para funcionalidades críticas
3. Mantenha o TypeScript strict
4. Documente mudanças na arquitetura

---

**Status:** 🟢 Infraestrutura configurada - Pronto para desenvolvimento das features!
