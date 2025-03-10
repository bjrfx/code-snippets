import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from "./App";
import './index.css'
import './styles/card-animations.css'
import './styles/ai-animations.css'

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);