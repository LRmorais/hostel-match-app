import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

type Category = 'food' | 'drinks' | 'outdoor' | 'culture' | 'party' | 'sports';
type TimingType = 'now' | 'scheduled';

interface CategoryOption {
  id: Category;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categories: CategoryOption[] = [
  { id: 'food', label: 'Comida', icon: 'restaurant', color: '#FF6B35' },
  { id: 'drinks', label: 'Drinks', icon: 'wine', color: '#9D4EDD' },
  { id: 'outdoor', label: 'Outdoor', icon: 'trail-sign', color: '#06A77D' },
  { id: 'culture', label: 'Cultura', icon: 'business', color: '#4895EF' },
  { id: 'party', label: 'Festa', icon: 'musical-notes', color: '#E63946' },
  { id: 'sports', label: 'Esportes', icon: 'football', color: '#F77F00' },
];

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [timingType, setTimingType] = useState<TimingType>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [description, setDescription] = useState('');

  const handleBack = () => {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateEvent();
    }
  };

  const handleCreateEvent = () => {
    console.log('Creating event:', {
      title,
      category,
      timingType,
      scheduledDate,
      scheduledTime,
      location,
      maxParticipants,
      description,
    });
    // TODO: Implement event creation logic
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return title.trim().length > 0;
      case 2:
        return category !== null;
      case 3:
        if (timingType === 'now') return true;
        return scheduledDate.length > 0 && scheduledTime.length > 0;
      case 4:
        return location.trim().length > 0;
      default:
        return false;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.progressBar,
            step <= currentStep && styles.progressBarActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Qual é o rolê?</Text>
      <Text style={styles.stepSubtitle}>Dê um nome chamativo</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="Ex: Pizza na praia, Trilha no morro..."
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
        multiline
        maxLength={100}
      />

      <View style={styles.tipContainer}>
        <Ionicons name="bulb" size={20} color="#FF6B35" />
        <Text style={styles.tipText}>
          <Text style={styles.tipLabel}>Dica:</Text> Seja específico! "Pizza napoletana no Braz" atrai mais que apenas "Pizza"
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Que tipo de rolê?</Text>
      <Text style={styles.stepSubtitle}>Escolha uma categoria</Text>

      <View style={styles.categoriesGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryCard,
              category === cat.id && styles.categoryCardActive,
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <View
              style={[
                styles.categoryButton,
                { backgroundColor: cat.color },
              ]}
            >
              <Ionicons name={cat.icon} size={24} color="#fff" />
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quando?</Text>
      <Text style={styles.stepSubtitle}>Defina o horário</Text>

      <View style={styles.timingOptions}>
        <TouchableOpacity
          style={[
            styles.timingCard,
            timingType === 'now' && styles.timingCardActive,
          ]}
          onPress={() => setTimingType('now')}
        >
          <Ionicons
            name="time"
            size={32}
            color={timingType === 'now' ? '#FF6B35' : '#333'}
          />
          <Text
            style={[
              styles.timingTitle,
              timingType === 'now' && styles.timingTitleActive,
            ]}
          >
            Agora
          </Text>
          <Text
            style={[
              styles.timingSubtitle,
              timingType === 'now' && styles.timingSubtitleActive,
            ]}
          >
            Começando já!
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timingCard,
            timingType === 'scheduled' && styles.timingCardActive,
          ]}
          onPress={() => setTimingType('scheduled')}
        >
          <Ionicons
            name="calendar"
            size={32}
            color={timingType === 'scheduled' ? '#FF6B35' : '#333'}
          />
          <Text
            style={[
              styles.timingTitle,
              timingType === 'scheduled' && styles.timingTitleActive,
            ]}
          >
            Agendar
          </Text>
          <Text
            style={[
              styles.timingSubtitle,
              timingType === 'scheduled' && styles.timingSubtitleActive,
            ]}
          >
            Para depois
          </Text>
        </TouchableOpacity>
      </View>

      {timingType === 'scheduled' && (
        <View style={styles.scheduledInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data</Text>
            <TextInput
              style={styles.dateTimeInput}
              placeholder="dd/mm/aaaa"
              placeholderTextColor="#999"
              value={scheduledDate}
              onChangeText={setScheduledDate}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Horário</Text>
            <TextInput
              style={styles.dateTimeInput}
              placeholder="--:--"
              placeholderTextColor="#999"
              value={scheduledTime}
              onChangeText={setScheduledTime}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Onde e quantos?</Text>
      <Text style={styles.stepSubtitle}>Local e limite de pessoas</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Local</Text>
        <TextInput
          style={styles.locationInput}
          placeholder="Nome do lugar ou endereço"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Máximo de participantes</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setMaxParticipants(Math.max(2, maxParticipants - 1))}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>

          <View style={styles.counterValue}>
            <Text style={styles.counterNumber}>{maxParticipants}</Text>
            <Text style={styles.counterLabel}>pessoas</Text>
          </View>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setMaxParticipants(Math.min(10, maxParticipants + 1))}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Descrição (opcional)</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Adicione mais detalhes sobre o rolê..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={300}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Rolê</Text>
        <View style={{ width: 28 }} />
      </View>

      {renderProgressBar()}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <Button
            title="Voltar"
            variant="outline"
            onPress={handleBack}
            style={styles.footerButton}
          />
        )}
        <Button
          title={currentStep === 4 ? 'Criar Rolê' : 'Continuar'}
          onPress={handleContinue}
          disabled={!canContinue()}
          style={currentStep === 1 ? styles.fullWidthButton : styles.footerButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#FF6B35',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  titleInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF4F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipLabel: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: 16,
    padding: 3,
    backgroundColor: '#F8F8F8',
  },
  categoryCardActive: {
    backgroundColor: '#FFF4F0',
    borderWidth: 2,
    borderColor: '#FF6B35',
    padding: 1,
  },
  categoryButton: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timingOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  timingCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timingCardActive: {
    backgroundColor: '#FFF4F0',
    borderColor: '#FF6B35',
  },
  timingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  timingTitleActive: {
    color: '#FF6B35',
  },
  timingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  timingSubtitleActive: {
    color: '#FF6B35',
  },
  scheduledInputs: {
    marginTop: 24,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateTimeInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  locationInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  counterValue: {
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  counterLabel: {
    fontSize: 14,
    color: '#666',
  },
  descriptionInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
  },
  fullWidthButton: {
    flex: 1,
  },
});

export default CreateEventScreen;
