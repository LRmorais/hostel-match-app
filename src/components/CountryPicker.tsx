import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';

interface Country {
  name: string;
  code: string;
}

const COUNTRIES: Country[] = [
  { name: 'Brasil', code: 'BR' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Chile', code: 'CL' },
  { name: 'Colômbia', code: 'CO' },
  { name: 'Peru', code: 'PE' },
  { name: 'Uruguai', code: 'UY' },
  { name: 'Paraguai', code: 'PY' },
  { name: 'Bolívia', code: 'BO' },
  { name: 'Equador', code: 'EC' },
  { name: 'Venezuela', code: 'VE' },
  { name: 'Estados Unidos', code: 'US' },
  { name: 'Canadá', code: 'CA' },
  { name: 'México', code: 'MX' },
  { name: 'Reino Unido', code: 'GB' },
  { name: 'França', code: 'FR' },
  { name: 'Alemanha', code: 'DE' },
  { name: 'Espanha', code: 'ES' },
  { name: 'Itália', code: 'IT' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Holanda', code: 'NL' },
  { name: 'Suíça', code: 'CH' },
  { name: 'Áustria', code: 'AT' },
  { name: 'Bélgica', code: 'BE' },
  { name: 'Suécia', code: 'SE' },
  { name: 'Noruega', code: 'NO' },
  { name: 'Dinamarca', code: 'DK' },
  { name: 'Finlândia', code: 'FI' },
  { name: 'Austrália', code: 'AU' },
  { name: 'Nova Zelândia', code: 'NZ' },
  { name: 'Japão', code: 'JP' },
  { name: 'Coreia do Sul', code: 'KR' },
  { name: 'China', code: 'CN' },
  { name: 'Índia', code: 'IN' },
  { name: 'Tailândia', code: 'TH' },
  { name: 'Vietnã', code: 'VN' },
  { name: 'Singapura', code: 'SG' },
  { name: 'Filipinas', code: 'PH' },
  { name: 'Indonésia', code: 'ID' },
  { name: 'Malásia', code: 'MY' },
  { name: 'África do Sul', code: 'ZA' },
  { name: 'Egito', code: 'EG' },
  { name: 'Marrocos', code: 'MA' },
  { name: 'Israel', code: 'IL' },
  { name: 'Turquia', code: 'TR' },
  { name: 'Rússia', code: 'RU' },
  { name: 'Polônia', code: 'PL' },
  { name: 'República Tcheca', code: 'CZ' },
  { name: 'Hungria', code: 'HU' },
  { name: 'Grécia', code: 'GR' },
  { name: 'Croácia', code: 'HR' },
];

interface CountryPickerProps {
  visible: boolean;
  selectedCountry: string;
  onSelect: (country: string) => void;
  onClose: () => void;
}

const CountryPicker: React.FC<CountryPickerProps> = ({
  visible,
  selectedCountry,
  onSelect,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (countryName: string) => {
    onSelect(countryName);
    onClose();
    setSearchText('');
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry === item.name && styles.selectedCountryItem,
      ]}
      onPress={() => handleSelect(item.name)}
    >
      <Text
        style={[
          styles.countryText,
          selectedCountry === item.name && styles.selectedCountryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Selecione seu país</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar país..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={filteredCountries}
          renderItem={renderCountryItem}
          keyExtractor={(item) => item.code}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF6B35',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  list: {
    flex: 1,
  },
  countryItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCountryItem: {
    backgroundColor: '#fff5f0',
  },
  countryText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedCountryText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default CountryPicker;
