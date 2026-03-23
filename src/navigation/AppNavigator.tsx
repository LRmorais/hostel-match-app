import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OnboardingProfileScreen from '../screens/OnboardingProfileScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventParticipantsScreen from '../screens/EventParticipantsScreen';
import EventChatScreen from '../screens/EventChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ManageEventScreen from '../screens/ManageEventScreen';
import ReportUserScreen from '../screens/ReportUserScreen';
import ReportEventScreen from '../screens/ReportEventScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import { TabNavigator } from './TabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { loading, isAuthenticated, hasCompleteProfile } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : !hasCompleteProfile ? (
          <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
        ) : (
          <>
            {/* Tab Navigator como tela principal */}
            <Stack.Screen name="MainTabs" component={TabNavigator} />

            {/* Telas de stack (sobre as tabs) */}
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="EventParticipants" component={EventParticipantsScreen} />
            <Stack.Screen name="EventChat" component={EventChatScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ManageEvent" component={ManageEventScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ReportUser" component={ReportUserScreen} />
            <Stack.Screen name="ReportEvent" component={ReportEventScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
