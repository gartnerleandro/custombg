import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Configuración --- 
const STABILITY_API_KEY = "sk-8B51gSlx0eONaHAqmFBqPPENW7piMTi4uGKkcJchpf3HgcLv";
const STABILITY_API_HOST = 'https://api.stability.ai';
const STABILITY_API_ENDPOINT = `${STABILITY_API_HOST}/v2beta/stable-image/generate/ultra`;
const HISTORY_STORAGE_KEY = '@ImageGenHistory:prompts'; // Clave para AsyncStorage
const MAX_HISTORY_LENGTH = 50; // Máximo de prompts a guardar

console.log("Stability API Key:", STABILITY_API_KEY ? 'Loaded (length: ' + STABILITY_API_KEY.length + ')' : 'Not Loaded or Empty');

// --- Función Helper para guardar historial ---
const savePromptToHistory = async (promptToSave: string) => {
  if (!promptToSave) return;
  try {
    const existingHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    let history: string[] = existingHistory ? JSON.parse(existingHistory) : [];

    // Evitar duplicados (añadir al principio)
    history = history.filter(p => p !== promptToSave);
    history.unshift(promptToSave);

    // Limitar tamaño del historial
    if (history.length > MAX_HISTORY_LENGTH) {
      history = history.slice(0, MAX_HISTORY_LENGTH);
    }

    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    console.log("Prompt guardado en historial:", promptToSave);
  } catch (e) {
    console.error("Error guardando prompt en historial:", e);
  }
};
// --- Fin Helper ---

export default function HomeScreen() {
  const [prompt, setPrompt] = useState('');
  const [lastSentPrompt, setLastSentPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [isApiKeyAvailable, setIsApiKeyAvailable] = useState(!!STABILITY_API_KEY);

  const colorScheme = useColorScheme() ?? 'dark';
  const currentColors = Colors[colorScheme];

  useEffect(() => {
    setIsApiKeyAvailable(!!STABILITY_API_KEY);
    if (!STABILITY_API_KEY) {
      console.error("Error: EXPO_PUBLIC_STABILITY_API_KEY no está configurada.");
    }
  }, []);

  const handleSendPrompt = async () => {
    const trimmedPrompt = prompt.trim();
    console.log("handleSendPrompt: Iniciado");
    setGeneratedImageUri(null);
    setLastSentPrompt(null);

    if (!trimmedPrompt) {
      Alert.alert("Input Required", "Please enter a prompt (in English).");
      return;
    }
    if (!isApiKeyAvailable) {
      Alert.alert("Configuration Required", "Stability AI API Key is not configured...");
      return;
    }

    setIsLoading(true);
    setLastSentPrompt(trimmedPrompt);
    setPrompt('');
    console.log("handleSendPrompt: isLoading=true");

    const formData = new FormData();
    formData.append('prompt', trimmedPrompt);
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', '9:16');
    let errorBodyForParsing = '';

    try {
      console.log(`Enviando a Stability AI...`);
      const response = await fetch(STABILITY_API_ENDPOINT, { /* ... fetch options ... */ 
         method: 'POST',
         headers: {
           Accept: 'application/json',
           Authorization: `Bearer ${STABILITY_API_KEY}`,
         },
         body: formData,
      });
      console.log(`Respuesta recibida, status: ${response.status}`);

      if (!response.ok) {
        try { errorBodyForParsing = await response.text(); } catch { errorBodyForParsing = 'Error body unreadable'; }
        throw new Error(`Stability AI Error: ${response.status}. Body: ${errorBodyForParsing}`);
      }

      const responseData = await response.json();
      const imageBase64 = responseData.image || responseData.artifacts?.[0]?.base64;
      if (!imageBase64) {
        throw new Error("Unexpected response format.");
      }

      const imageUri = `data:image/png;base64,${imageBase64}`;
      setGeneratedImageUri(imageUri);
      console.log("Imagen generada.");

      // --- Guardar en historial SOLO si fue exitoso ---
      await savePromptToHistory(trimmedPrompt);
      // -----------------------------------------------

    } catch (error: any) {
      console.error("Error en handleSendPrompt:", error);
      let errorMessage = `Image generation failed: ${error.message || error}`;
      let errorTitle = "Error";
      // ... (resto del manejo de errores específico como estaba antes)
      let parsedErrorBody = null;
      if (error.message && error.message.includes('Body:')) {
          try {
              const jsonString = error.message.substring(error.message.indexOf('Body:') + 'Body:'.length).trim();
              parsedErrorBody = JSON.parse(jsonString);
          } catch (parseError) { /* ignore */ }
      }
      if (parsedErrorBody?.name === 'invalid_language') {
            errorTitle = "Language Not Supported"; errorMessage = "The API only accepts prompts in English.";
      } else if (error.message?.includes('401')) {
          errorTitle = "Authentication Error"; errorMessage = `Invalid API Key (401). Check .env (${STABILITY_API_KEY?.length} chars).`;
      } else if (error.message?.includes('403')){
           errorTitle = "Permission/Quota Error"; errorMessage = `Permission denied or quota exceeded (403).`;
      } else if (error.message?.includes('400') || error.message?.includes('422')) {
          errorTitle = "Invalid Request"; errorMessage = `Invalid parameters (${error.message.includes('400') ? 400 : 422}). Check prompt. (${parsedErrorBody?.errors?.join(', ') || 'No details'})`;
      }

      Alert.alert(errorTitle, errorMessage);
      setGeneratedImageUri(null);
      setLastSentPrompt(null);
    } finally {
      setIsLoading(false);
      console.log("handleSendPrompt: Finalizado.");
    }
  };

  // --- JSX como estaba antes (sin cambios aquí) ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screenContainer, { backgroundColor: currentColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.resultsContainer}>
        {!lastSentPrompt && !generatedImageUri && !isLoading && (
          <ThemedText style={styles.placeholderText}>
            Enter a prompt below to generate an image.
          </ThemedText>
        )}
        {lastSentPrompt && (
          <View style={styles.promptBubbleContainer}>
            <ThemedView style={[styles.promptBubble, { backgroundColor: currentColors.primary }]}>
              <ThemedText style={styles.promptBubbleText}>{lastSentPrompt}</ThemedText>
            </ThemedView>
          </View>
        )}
        {isLoading && (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <ThemedText style={{ color: currentColors.textSecondary, marginTop: 10 }}>Generating image...</ThemedText>
            </View>
        )}
        {generatedImageUri && !isLoading && (
          <View style={styles.imageResultContainer}>
              <ThemedText style={{ color: currentColors.textSecondary, marginBottom: 15, textAlign: 'left', width: '90%' }}>
                  Here is your generated image:
              </ThemedText>
             <Image
               source={{ uri: generatedImageUri }}
               style={styles.generatedImage}
               resizeMode="contain"
             />
          </View>
        )}
        {!isApiKeyAvailable && (
            <View style={styles.apiKeyErrorContainer}>
                <Ionicons name="alert-circle-outline" size={24} color={Colors.dark.tint} />
                <ThemedText style={styles.apiKeyErrorText}>Stability API Key not configured. Please check your .env file.</ThemedText>
            </View>
        )}
      </ScrollView>
      <View style={[styles.inputContainer, { backgroundColor: currentColors.background, borderTopColor: currentColors.surface }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: currentColors.surface,
              color: currentColors.text,
              borderColor: currentColors.surface
            }
          ]}
          placeholder="Describe the image you want to create... (English)"
          placeholderTextColor={currentColors.textSecondary}
          value={prompt}
          onChangeText={setPrompt}
          editable={!isLoading && isApiKeyAvailable}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: currentColors.primary
            },
            (isLoading || !isApiKeyAvailable || !prompt.trim()) && styles.sendButtonDisabled
          ]}
          onPress={handleSendPrompt}
          disabled={isLoading || !isApiKeyAvailable || !prompt.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={currentColors.background} />
          ) : (
            <Ionicons name="send" size={20} color={currentColors.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Estilos como estaban antes (sin cambios aquí) ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  resultsContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  placeholderText: {
    textAlign: 'center',
    color: Colors.dark.textSecondary,
    fontSize: 16,
    marginTop: '40%',
  },
  promptBubbleContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 15,
  },
  promptBubble: {
      maxWidth: '80%',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
  },
  promptBubbleText: {
      color: '#FFFFFF',
      fontSize: 16,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
  },
  imageResultContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  generatedImage: {
    width: '40%', // Cambiado de '60%' a '40%'
    aspectRatio: 9 / 16,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 10,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  apiKeyErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 15,
    marginTop: 20,
  },
  apiKeyErrorText: {
      color: Colors.dark.tint,
      marginLeft: 10,
      flexShrink: 1,
  },
});
