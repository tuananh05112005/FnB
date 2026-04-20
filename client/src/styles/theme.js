import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#ff9800', // orange
    secondary: '#212529', // dark
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    glass: 'rgba(255, 255, 255, 0.15)',
    text: '#212529',
    warning: '#ffc107',
  },
  fonts: {
    main: `'Inter', sans-serif`,
  },
  transition: '0.3s ease',
};

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ${theme.fonts.main};
    background: ${theme.colors.background};
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  a { text-decoration: none; color: inherit; }
`;
