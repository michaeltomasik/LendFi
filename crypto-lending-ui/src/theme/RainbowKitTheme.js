import { darkTheme } from '@rainbow-me/rainbowkit';

// Create a custom theme for RainbowKit with cyberpunk styling
export const cyberpunkTheme = darkTheme({
  accentColor: '#00f5ff', // Glowing cyan for primary accent
  accentColorForeground: '#000',
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'small',
  colors: {
    modalBackground: 'rgba(0, 0, 0, 0.9)',
    modalBorder: '#00f5ff',
    modalText: '#f0f0f0',
    modalTextSecondary: 'rgba(255, 255, 255, 0.6)',
    actionButtonBorder: 'rgba(0, 245, 255, 0.4)',
    actionButtonBorderMobile: 'rgba(0, 245, 255, 0.4)',
    actionButtonSecondaryBackground: 'rgba(0, 0, 0, 0.7)',
    connectButtonBackground: 'rgba(0, 0, 0, 0.7)',
    connectButtonBackgroundError: 'rgba(255, 0, 0, 0.5)',
    connectButtonInnerBackground: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%)',
    connectButtonText: '#00f5ff',
    connectButtonTextError: '#FF494A',
    connectionIndicator: '#30cc8b',
    error: '#FF494A',
    generalBorder: 'rgba(0, 245, 255, 0.4)',
    generalBorderDim: 'rgba(0, 245, 255, 0.2)',
    menuItemBackground: 'rgba(0, 0, 0, 0.8)',
    profileAction: 'rgba(0, 0, 0, 0.8)',
    profileActionHover: 'rgba(0, 245, 255, 0.1)',
    profileForeground: 'rgba(0, 0, 0, 0.8)',
    selectedOptionBorder: 'rgba(0, 245, 255, 0.4)',
    standby: '#FFD641',
  },
});

export default cyberpunkTheme; 