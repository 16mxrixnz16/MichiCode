import React, { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Home from './pages/Home';
import MuteToggle from './components/MuteToggle';
import theme from './theme';
import { installMeowOnClicks } from './sound/meow';

function App() {
  // Cualquier clic en la página emite un maullido distinto
  useEffect(() => installMeowOnClicks(document), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <MuteToggle />
      <Home />
    </ThemeProvider>
  );
}

export default App;
