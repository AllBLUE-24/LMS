"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  FC, 
  ReactNode 
} from 'react';
  import { Skeleton } from '@/components/ui/skeleton';

// --- MOCK IMPLEMENTATIONS ---
// These functions are placeholders for your actual vertical loading logic.
// They simulate fetching the vertical-specific configuration and components.
const getVerticalConfig = async () => {
  // In a real app, this would fetch data based on hostname, env vars, etc.
  console.log("Fetching vertical config...");
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  return {
    name: 'SalesVertical',
    config: {
      terminology: {
        lead: 'Student',
        leads: 'Students',
      },
    },
  };
};

const getVerticalComponents = async () => {
  // In a real app, this would dynamically import components.
  // e.g., await import('@verticals/sales/components');
  console.log("Fetching vertical components...");
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  // In a real implementation, you would return actual components
  // For example: const { Dashboard } = await import('@/verticals/sales/Dashboard');
  // return { Dashboard };
  return { Dashboard: () => null }; // Return a placeholder
};


// --- TYPE DEFINITIONS ---

/**
 * Defines the terminology used throughout the application for a specific vertical.
 * This allows for easy white-labeling of terms like "Lead" vs. "Opportunity".
 */
interface Terminology {
  lead: string;
  leads: string;
}

/**
 * Defines the main configuration for a vertical, including its specific terminology.
 */
export interface VerticalConfig {
  terminology: Terminology;
  // Add other vertical-specific config properties here
}

/**
 * Defines the structure for dynamically loaded components for a vertical.
 * Using React.FC ensures type safety for the components.
 */
interface VerticalComponents {
  Dashboard?: FC;
  // Add other dynamic components here (e.g., LeadDetailView?: FC)
}

/**
 * Defines the complete shape of the context value, combining the vertical's
 * name, its configuration, and its dynamically loaded components.
 */
interface VerticalContextType {
  name: string;
  config: VerticalConfig;
  components: VerticalComponents;
}

// --- REACT CONTEXT ---

/**
 * The React Context object. It's initialized with `null` and its type is
 * checked within the provider and consumer hook.
 */
const VerticalContext = createContext<VerticalContextType | null>(null);

/**
 * Custom hook to easily access the vertical's context.
 * It ensures the hook is used within a VerticalContextProvider and provides
 * a clean, simple API for components to consume context data.
 * @returns {VerticalContextType} The full context value.
 */
export const useVertical = (): VerticalContextType => {
  const context = useContext(VerticalContext);
  if (!context) {
    // This error is crucial for developers, as it prevents the context
    // from being used outside of its provider tree.
    throw new Error("useVertical must be used within a VerticalContextProvider");
  }
  return context;
};

// --- CONTEXT PROVIDER COMPONENT ---

interface VerticalProviderProps {
  children: ReactNode;
}

/**
 * The provider component that wraps the application.
 * It is responsible for:
 * 1. Fetching the vertical-specific configuration and components asynchronously.
 * 2. Handling loading and error states during the fetch process.
 * 3. Providing the fetched data to all children components via the VerticalContext.
 */
export const VerticalContextProvider: FC<VerticalProviderProps> = ({ children }) => {
  const [verticalData, setVerticalData] = useState<VerticalContextType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // This effect runs once when the component mounts to load all
    // necessary data for the selected vertical.
    const loadVerticalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch config and components in parallel for efficiency
        const [configData, components] = await Promise.all([
          getVerticalConfig(),
          getVerticalComponents(),
        ]);
        
        const { name, config } = configData;
        setVerticalData({ name, config, components });
      } catch (err) {
        console.error("Failed to load vertical data:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred while loading the data.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadVerticalData();
  }, []); // The empty dependency array ensures this effect runs only once.


// ... (rest of the file)

  // Render a loading state while data is being fetched.
  // This can be replaced with a more sophisticated global loading spinner.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  // Render an error state if the data fetching fails.
  // This provides clear feedback to the user or developer.
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="p-6 text-center text-red-700 bg-white border-2 border-red-200 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold">Error Loading Application</h2>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // If data is successfully loaded, provide it to the rest of the app.
  // The check for `verticalData` ensures we don't render children with a null context value.
  if (verticalData) {
    return (
      <VerticalContext.Provider value={verticalData}>
        {children}
      </VerticalContext.Provider>
    );
  }

  // Fallback case, though unlikely to be hit with the current logic.
  return null;
};
