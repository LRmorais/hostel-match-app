# APPWRITE_STORAGE_SETUP.md
> Guia de configuração do Appwrite Storage para o projeto Hostel Match

---

## 📋 Visão Geral

O projeto utiliza **Appwrite Storage** para armazenamento de arquivos (fotos de perfil, imagens, etc.) em vez do Firebase Storage. Esta decisão foi tomada para:

- Aproveitar o free tier generoso do Appwrite para storage
- Separar responsabilidades: Firebase para dados/auth, Appwrite para arquivos
- APIs mais simples para upload/download de arquivos
- Melhor controle de permissões de arquivos

---

## 🚀 Setup Inicial

### 1. **Criar Projeto no Appwrite**
1. Acesse [cloud.appwrite.io](https://cloud.appwrite.io)
2. Crie uma conta e faça login
3. Clique em "Create Project"
4. Nomeie o projeto (ex: "hostel-match-storage")
5. Anote o **Project ID** gerado

### 2. **Configurar Storage Bucket**
1. No Appwrite Console, vá para **Storage**
2. Clique em **Create Bucket**
3. Configure o bucket:
   - **Name**: `hostel-match-images`
   - **Bucket ID**: (deixe auto-gerar ou use `hostel-images`)
   - **Maximum file size**: `5MB` (adequado para fotos de perfil)
   - **Allowed file extensions**: `jpg,jpeg,png,webp`
   - **Antivirus**: Ativado (recomendado)
   - **Encryption**: Ativado (recomendado)

### 3. **Configurar Permissões**
1. Na aba **Settings** do bucket
2. Configure as **Permissions**:
   - **Create**: `users` (qualquer usuário autenticado pode criar)
   - **Read**: `any` (qualquer um pode visualizar - URLs públicas)
   - **Update**: `users` (usuários podem atualizar seus próprios arquivos)
   - **Delete**: `users` (usuários podem deletar seus próprios arquivos)

---

## 🔧 Configuração no Projeto

### **Variáveis de Ambiente**
Adicione no arquivo `.env`:

```env
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=seu-project-id-aqui
EXPO_PUBLIC_APPWRITE_STORAGE_ID=seu-bucket-id-aqui
```

### **Instalação das Dependências**
```bash
npm install appwrite
```

### **Configuração do SDK**
O projeto já possui a configuração em `src/services/appwrite.ts`:

```typescript
import { Client, Storage, Account, ID } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

export const storage = new Storage(client);
```

---

## 📱 Uso no Aplicativo

### **Hook de Upload**
O projeto utiliza o hook `useImageUpload` em `src/hooks/useImageUpload.ts` que:

1. Recebe uma URI local da imagem (do expo-image-picker)
2. Converte para formato adequado para o Appwrite
3. Faz upload para o bucket configurado
4. Retorna a URL pública do arquivo
5. A URL é então armazenada no Firestore (campo `photoURL`)

### **Fluxo Típico**
1. Usuário seleciona foto na galeria/câmera
2. `PhotoPicker` component gerencia a seleção
3. `useImageUpload` hook faz upload para Appwrite
4. URL retornada é salva no perfil do usuário (Firestore)
5. Imagem é exibida usando a URL pública do Appwrite

---

## 🔒 Segurança

### **Controle de Acesso**
- Upload: Apenas usuários autenticados
- Visualização: URLs públicas (para facilitar exibição)
- Modificação: Apenas o usuário que fez upload
- Exclusão: Apenas o usuário que fez upload

### **Validações**
- Tamanho máximo: 5MB
- Formatos permitidos: JPG, JPEG, PNG, WebP
- Antivírus ativado
- Validação no client-side antes do upload

---

## 🎯 Integração com Firebase

### **Fluxo Híbrido**
1. **Firebase**: Autenticação + dados estruturados (Firestore)
2. **Appwrite**: Armazenamento de arquivos
3. **Integração**: URLs dos arquivos salvos no Firestore

### **Vantagens desta Arquitetura**
- Free tiers de ambos os serviços
- Especialização: cada serviço faz o que faz de melhor
- Escalabilidade independente
- Menor vendor lock-in

---

## 🔧 Troubleshooting

### **Erro: "Project not found"**
- Verificar se `EXPO_PUBLIC_APPWRITE_PROJECT_ID` está correto
- Verificar se o projeto existe no Appwrite Console

### **Erro: "Bucket not found"**
- Verificar se `EXPO_PUBLIC_APPWRITE_STORAGE_ID` está correto
- Verificar se o bucket foi criado no Storage

### **Erro: "Insufficient permissions"**
- Verificar permissões do bucket
- Garantir que usuário está autenticado no momento do upload

### **Upload muito lento**
- Verificar tamanho da imagem (redimensionar se necessário)
- Verificar qualidade de compressão no expo-image-picker

---

## 📊 Monitoring

### **Métricas Importantes**
- Tamanho total de storage utilizado
- Número de uploads por dia
- Taxa de erro em uploads
- Largura de banda utilizada

### **Limites Free Tier**
- **Storage**: 2GB
- **Bandwidth**: 2GB/mês
- **Requests**: 10k/mês

---

## 🚀 Próximos Passos

### **Otimizações Futuras**
1. **Compressão automática** antes do upload
2. **Redimensionamento** para múltiplos tamanhos (thumbnail, full)
3. **CDN** para melhor performance global
4. **Backup automático** para arquivos importantes

### **Monitoramento**
1. Setup de alertas para limites de free tier
2. Analytics de uso de storage
3. Logs de erros em uploads

---

## ✅ Checklist de Setup

- [ ] Projeto criado no Appwrite Console
- [ ] Bucket de storage configurado
- [ ] Permissões adequadas definidas
- [ ] Variáveis de ambiente configuradas
- [ ] SDK instalado e configurado
- [ ] Hook de upload testado
- [ ] Integração com Firestore funcionando
- [ ] Validações de arquivo implementadas
- [ ] Tratamento de erros adequado

---
