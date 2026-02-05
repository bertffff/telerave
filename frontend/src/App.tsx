import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WebApp from '@twa-dev/sdk';
import { useAppStore } from './store/useAppStore';
import { authApi } from './api/client';
import { socketService } from './services/socket';

// Pages (будут созданы)
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import Room from './pages/Room';
import Loading from './components/UI/Loading';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { isAuthenticated, setAuth, token } = useAppStore();

  useEffect(() => {
    // Инициализация Telegram Web App
    WebApp.ready();
    WebApp.expand();

    // Установка темы
    document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', WebApp.themeParams.text_color || '#000000');

    // Аутентификация
    const authenticate = async () => {
      try {
        const initData = WebApp.initData;
        
        if (!initData) {
          console.error('No Telegram initData');
          return;
        }

        // Если уже есть токен, проверяем его валидность
        if (token) {
          try {
            await authApi.getCurrentUser();
            // Токен валиден, подключаем сокет
            socketService.connect(token);
            return;
          } catch (error) {
            // Токен невалиден, перелогиниваемся
            console.log('Token invalid, re-authenticating');
          }
        }

        // Аутентификация через Telegram
        const response = await authApi.telegramAuth(initData);
        setAuth(response.data.user, response.data.token);
        
        // Подключаем WebSocket
        socketService.connect(response.data.token);
      } catch (error) {
        console.error('Authentication error:', error);
        WebApp.showAlert('Authentication failed. Please try again.');
      }
    };

    authenticate();

    // Cleanup при размонтировании
    return () => {
      socketService.disconnect();
    };
  }, []);

  if (!isAuthenticated) {
    return <Loading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-telegram-bg text-telegram-text">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
