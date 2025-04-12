/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryColor = '#6A5AE0'; // Un morado/azul vibrante como color principal
const darkBackground = '#121212'; // Fondo oscuro casi negro
const surfaceColor = '#1E1E1E'; // Color para superficies ligeramente más claras (ej. input)
const textPrimaryDark = '#FFFFFF';
const textSecondaryDark = '#B0B0B0'; // Gris claro para texto secundario oscuro
const iconDark = '#FFFFFF';
const tabIconDefaultDark = '#8A8A8A';

// Colores tema claro
const tintColorLight = '#0a7ea4';
const textPrimaryLight = '#11181C';
const textSecondaryLight = '#687076'; // Gris medio para texto secundario claro
const lightBackground = '#F5F5F5';
const lightSurface = '#FFFFFF';

export const Colors = {
  light: {
    text: textPrimaryLight,
    background: lightBackground,
    tint: tintColorLight,
    icon: textSecondaryLight, // Usar el mismo gris que el texto secundario
    tabIconDefault: textSecondaryLight,
    tabIconSelected: tintColorLight,
    primary: primaryColor,
    surface: lightSurface,
    textSecondary: textSecondaryLight // Propiedad añadida para light theme
  },
  dark: {
    text: textPrimaryDark,
    background: darkBackground,
    tint: primaryColor,
    icon: iconDark,
    tabIconDefault: tabIconDefaultDark,
    tabIconSelected: primaryColor,
    primary: primaryColor,
    surface: surfaceColor,
    textSecondary: textSecondaryDark // Propiedad existente para dark theme
  },
};
