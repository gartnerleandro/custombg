import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

const HISTORY_STORAGE_KEY = '@ImageGenHistory:prompts';

export default function HistoryScreen() {
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
          if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
          } else {
            setHistory([]); // Si no hay nada, inicializa como vacío
          }
        } catch (e) {
          console.error("Error cargando historial:", e);
          setError("Could not load history.");
          setHistory([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadHistory();

      // Opcional: podrías devolver una función de limpieza si fuera necesario
      // return () => console.log("History screen unfocused");
    }, []) // El array vacío asegura que se ejecute solo al montar/enfocar inicialmente
  );

  const handleCopyToClipboard = async (prompt: string) => {
    await Clipboard.setStringAsync(prompt);
    // Puedes usar una librería de Toast/Snackbar para feedback menos intrusivo
    Alert.alert("Copied!", `"${prompt}" copied to clipboard.`);
  };

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity onPress={() => handleCopyToClipboard(item)}>
      <ThemedView style={styles.historyItem}>
        <ThemedText style={styles.historyText} numberOfLines={2} ellipsizeMode="tail">
          {item}
        </ThemedText>
        <Ionicons name="copy-outline" size={20} color={Colors.dark.textSecondary} />
      </ThemedView>
    </TouchableOpacity>
  );

  const handleClearHistory = async () => {
      Alert.alert(
          "Clear History",
          "Are you sure you want to delete all prompt history? This cannot be undone.",
          [
              {
                  text: "Cancel",
                  style: "cancel"
              },
              {
                  text: "Clear All",
                  onPress: async () => {
                      try {
                          await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
                          setHistory([]); // Limpiar estado local
                          Alert.alert("Success", "History cleared.");
                      } catch (e) {
                          console.error("Error clearing history:", e);
                          Alert.alert("Error", "Could not clear history.");
                      }
                  },
                  style: "destructive",
              },
          ]
      );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.dark.tint} />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screenContainer}>
      <View style={styles.headerContainer}>
          <ThemedText type="title">Prompt History</ThemedText>
          {history.length > 0 && (
             <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
                 <Ionicons name="trash-outline" size={24} color={Colors.dark.textSecondary} />
             </TouchableOpacity>
          )}
      </View>

      {history.length === 0 ? (
        <View style={styles.centeredContainer}> // Reutilizar contenedor centrado
            <Ionicons name="archive-outline" size={50} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.emptyText}>No history yet.</ThemedText>
            <ThemedText style={styles.emptySubText}>Prompts you generate will appear here.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Más padding superior para el título
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  clearButton: {
      padding: 5, // Área táctil más grande
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    color: Colors.dark.tint,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    color: Colors.dark.textSecondary,
  },
  emptySubText: {
      marginTop: 5,
      fontSize: 14,
      color: Colors.dark.tabIconDefault, // Aún más tenue
      textAlign: 'center',
  },
  listContentContainer: {
    paddingHorizontal: 0, // Sin padding horizontal en la lista misma
    paddingBottom: 80, // Espacio al final para que no choque con la tab bar
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    // borderBottomWidth: 1, // Usar ItemSeparatorComponent en su lugar
    // borderBottomColor: Colors.dark.surface,
    backgroundColor: Colors.dark.background, // Asegurar fondo
  },
  historyText: {
    fontSize: 16,
    flex: 1, // Permitir que ocupe espacio
    marginRight: 10, // Espacio antes del icono
    color: Colors.dark.text, // Color de texto principal
  },
  separator: {
      height: 1,
      backgroundColor: Colors.dark.surface,
      marginHorizontal: 20, // Alinear con el padding del item
  }
});
