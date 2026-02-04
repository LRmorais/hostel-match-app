import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { LocationData } from '../types';

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export const useLocation = (autoRequest: boolean = false) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: false,
  });

  // Check initial permission status
  useEffect(() => {
    checkPermission();
  }, []);

  // Auto-request location if enabled
  useEffect(() => {
    if (autoRequest && state.hasPermission && !state.location && !state.loading) {
      getCurrentLocation();
    }
  }, [autoRequest, state.hasPermission]);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState(prev => ({
        ...prev,
        hasPermission: status === 'granted'
      }));
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';

      setState(prev => ({
        ...prev,
        hasPermission: granted,
        loading: false,
        error: granted ? null : 'Permissão de localização negada'
      }));

      return granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao solicitar permissão de localização'
      }));
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check permission first
      if (!state.hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        location: locationData,
        loading: false
      }));

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao obter localização atual'
      }));
      return null;
    }
  };

  const clearLocation = () => {
    setState(prev => ({ ...prev, location: null, error: null }));
  };

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    clearLocation,
    checkPermission,
  };
};
