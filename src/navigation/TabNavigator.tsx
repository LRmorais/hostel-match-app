import React from 'react';
import { TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { TabParamList, RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator<TabParamList>();

// Tela vazia para o tab "Criar" (o press é interceptado)
const EmptyScreen = () => <View />;

export const TabNavigator: React.FC = () => {
  const stackNav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: styles.tabLabelStyle,
      }}
    >
      {/* Rolês */}
      <Tab.Screen
        name="Roles"
        component={HomeScreen}
        options={{
          title: 'Rolês',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Explorar */}
      <Tab.Screen
        name="Explorar"
        component={ExploreScreen}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Criar — botão customizado, sem tela */}
      <Tab.Screen
        name="Criar"
        component={EmptyScreen}
        options={{
          title: 'Criar',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.criarButton}
              onPress={() => stackNav.navigate('CreateEvent')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={26} color="#999" />
              <Text style={styles.criarLabel}>Criar</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Perfil */}
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => {
            if (user?.photoURL) {
              return (
                <Image
                  source={{ uri: user.photoURL }}
                  style={[styles.profileAvatar, focused && styles.profileAvatarFocused]}
                />
              );
            }
            return (
              <View style={[styles.profileAvatarPlaceholder, focused && styles.profileAvatarFocused]}>
                <Ionicons
                  name="person"
                  size={18}
                  color={focused ? '#FF6B35' : '#999'}
                />
              </View>
            );
          },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 82,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabLabelStyle: {
    fontSize: 11,
    fontWeight: '500',
  },
  criarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    gap: 4,
  },
  criarLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profileAvatarFocused: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profileAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

