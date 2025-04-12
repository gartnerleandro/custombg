import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importar Ionicons

import { HapticTab } from '@/components/HapticTab';
// import { IconSymbol } from '@/components/ui/IconSymbol'; // Ya no se usa
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(20, 20, 20, 0.85)',
            borderTopColor: 'rgba(80, 80, 80, 0.3)',
          },
          default: {
            backgroundColor: Colors.dark.background,
            borderTopColor: Colors.dark.surface,
          },
        }),
        tabBarLabelStyle: {
            // Opcional: ajustar fuente o tamaño
            // fontSize: 10,
        }
      }}>
      <Tabs.Screen
        name="index" // Corresponde a app/(tabs)/index.tsx
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        // Cambiar el nombre del archivo de ruta
        name="history" // Corresponde a app/(tabs)/history.tsx
        options={{
          title: 'History', // El título ya estaba bien
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'} // El icono ya estaba bien
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
