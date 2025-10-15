import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GeometryApp from "./components/GeometryApp";
import "@fontsource/inter";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-screen bg-gray-100">
        <GeometryApp />
      </div>
    </QueryClientProvider>
  );
}

export default App;
