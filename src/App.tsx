import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { Home } from "@/pages/Home";
import { UploadPage } from "@/pages/Upload";
import { Me } from "@/pages/Me";
import { NotFound } from "@/pages/NotFound";
import { ThemeProvider } from "@/context/ThemeContext";

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import { sepolia } from "wagmi/chains"
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'ThesisHub',
  projectId: import.meta.env.VITE_WAGMI_PROJECT_ID,
  chains: [sepolia],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/me" element={<Me />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Sonner position="top-right" />
            </BrowserRouter>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </ThemeProvider>
);

export default App;