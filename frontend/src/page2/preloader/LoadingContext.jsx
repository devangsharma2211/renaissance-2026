import { createContext, useContext, useState, useEffect } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const navEntry = performance.getEntriesByType("navigation")[0];
    // Only show preloader on a fresh navigation
    if (navEntry?.type === "navigate") {
      setIsLoading(true);
    }
    // REMOVED: The setTimeout timer that forced the home page to show
  }, []);

  return (
    // Pass setIsLoading so the Preloader can call it when the video ends
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);