import { Client, Account, Databases, Storage, ID } from 'appwrite';

// Appwrite config from environment variables
const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'your-project-id',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id',
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID || 'your-storage-bucket-id',
};

// Validate configuration in development
if (__DEV__ && appwriteConfig.projectId === 'your-project-id') {
  console.warn(
    '🚀 Appwrite não configurado!\n' +
    '1. Crie um projeto no Appwrite Console\n' +
    '2. Configure as variáveis de ambiente\n' +
    '3. Reinicie o servidor de desenvolvimento'
  );
}

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);


// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export config and utils
export const appwriteConfigValues = appwriteConfig;
export const generateId = () => ID.unique();

export default client;
