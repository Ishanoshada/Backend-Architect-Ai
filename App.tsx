import React, { useState, useCallback, useEffect } from 'react';
import { generateBackendPlan } from './services/geminiService';
import { BackendPlan } from './types';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import CodeBlock from './components/CodeBlock';

const GENERATION_LIMIT = 20;

// Cookie helper functions
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};


const App: React.FC = () => {
  const [appIdea, setAppIdea] = useState<string>('');
  const [techStack, setTechStack] = useState<string>('');
  const [architectureChoice, setArchitectureChoice] = useState<string>('');
  const [databaseType, setDatabaseType] = useState<string>('');
  const [keyFeatures, setKeyFeatures] = useState<string>('');
  const [appComplexity, setAppComplexity] = useState<string>('Standard (MVP)');
  const [backendPlan, setBackendPlan] = useState<BackendPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [streamingResponse, setStreamingResponse] = useState<string>('');

  useEffect(() => {
    // Load generation count from cookie on initial render
    try {
      const savedCount = getCookie('generationCount');
      if (savedCount) {
        const count = parseInt(savedCount, 10);
        if (!isNaN(count)) {
            setGenerationCount(count);
        }
      }
    } catch (e) {
      console.error("Could not read from cookie", e);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generationCount >= GENERATION_LIMIT) {
        setError('You have reached your generation limit.');
        return;
    }
      
    if (!appIdea.trim()) {
      setError('Please enter your application idea.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBackendPlan(null);
    setStreamingResponse('');

    try {
        window.location.hash = '';
    } catch(e) {
        console.warn('Could not clear URL hash. This is expected in some sandboxed environments.', e);
    }

    try {
      const onChunk = (text: string) => {
        setStreamingResponse(prev => prev + text);
      };

      const plan = await generateBackendPlan(appIdea, techStack, architectureChoice, databaseType, keyFeatures, appComplexity, onChunk);
      setBackendPlan(plan);
      
      const newCount = generationCount + 1;
      setGenerationCount(newCount);
      try {
        setCookie('generationCount', newCount.toString(), 1); // Expires in 1 day
      } catch (e) {
        console.error("Could not write to cookie", e);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate backend plan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [appIdea, techStack, architectureChoice, databaseType, keyFeatures, appComplexity, generationCount]);

  const Header: React.FC = () => (
    <header className="w-full text-center py-8">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-200 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
        Backend Architect AI
      </h1>
      <p className="text-gray-400 text-base md:text-lg">
        From Idea to Deployable Backend Plan. Generate schemas, APIs, and starter code in seconds.
      </p>
    </header>
  );
  
  const Footer: React.FC = () => (
    <footer className="w-full text-center py-6 border-t border-gray-700">
        <p className="text-gray-500 text-sm">
            Created by <a href="https://ishanoshada.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ishan Oshada</a>. 
            View on <a href="https://github.com/ishanoshada" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>.
        </p>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Header />
        <InputForm
          appIdea={appIdea}
          setAppIdea={setAppIdea}
          techStack={techStack}
          setTechStack={setTechStack}
          architectureChoice={architectureChoice}
          setArchitectureChoice={setArchitectureChoice}
          databaseType={databaseType}
          setDatabaseType={setDatabaseType}
          keyFeatures={keyFeatures}
          setKeyFeatures={setKeyFeatures}
          appComplexity={appComplexity}
          setAppComplexity={setAppComplexity}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          generationCount={generationCount}
          generationLimit={GENERATION_LIMIT}
        />
        <div className="mt-12">
          {isLoading && (
            <>
              <Loader />
              {streamingResponse && (
                <div className="max-w-6xl mx-auto mt-8 animate-fade-in">
                  <h3 className="text-2xl font-bold mb-4 text-gray-400 text-center">AI Response Stream</h3>
                  <CodeBlock code={streamingResponse} />
                </div>
              )}
            </>
          )}
          {error && <ErrorMessage message={error} />}
          {!isLoading && backendPlan && (
            <ResultsDisplay
              plan={backendPlan}
              generationContext={{
                appIdea,
                techStack,
                architectureChoice,
                appComplexity,
                databaseModels: backendPlan.databaseModels || [],
                databaseType: backendPlan.database?.type || '',
              }}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;