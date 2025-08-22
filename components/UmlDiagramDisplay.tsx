import React, { useState, useMemo, useEffect } from 'react';
import pako from 'pako';
import CodeBlock from './CodeBlock';

interface UmlDiagramDisplayProps {
  plantUmlCode: string;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const UmlDiagramDisplay: React.FC<UmlDiagramDisplayProps> = ({ plantUmlCode }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cleanedPlantUmlCode = useMemo(() => {
    // Defensively remove any existing tags from the AI response, then wrap it cleanly.
    let code = plantUmlCode.trim();
    if (code.startsWith('@startuml')) {
      code = code.substring('@startuml'.length);
    }
    if (code.endsWith('@enduml')) {
      code = code.substring(0, code.length - '@enduml'.length);
    }
    return `@startuml\n${code.trim()}\n@enduml`;
  }, [plantUmlCode]);

  const umlImageUrl = useMemo(() => {
    if (!cleanedPlantUmlCode) return '';
    try {
        // Use TextEncoder to get a UTF-8 Uint8Array, which is more robust for pako.
        const textEncoder = new TextEncoder();
        const utf8Bytes = textEncoder.encode(cleanedPlantUmlCode);
        
        const deflated = pako.deflate(utf8Bytes);
        
        // Convert the deflated bytes to a URL-safe Base64 string.
        let binaryString = '';
        for (let i = 0; i < deflated.length; i++) {
            binaryString += String.fromCharCode(deflated[i]);
        }
        const encoded = btoa(binaryString)
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
        
        return `https://kroki.io/plantuml/svg/${encoded}`;
    } catch(e) {
        console.error("Failed to encode PlantUML for Kroki", e);
        setError("Failed to encode the diagram code. It may contain invalid characters.");
        return "";
    }
  }, [cleanedPlantUmlCode]);

  useEffect(() => {
    if (activeTab !== 'visual') return;

    if (!umlImageUrl) {
        setError('Could not generate diagram. The PlantUML code might be invalid.');
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setSvgContent(null);
    setError(null);

    const fetchDiagram = async () => {
        try {
            const response = await fetch(umlImageUrl);
            const responseText = await response.text();
            
            if (!response.ok) {
                // Try to extract a meaningful error from Kroki's response
                const errorMatch = responseText.match(/<pre>([\s\S]*?)<\/pre>/);
                const errorMessage = errorMatch ? errorMatch[1].trim() : `Diagram service returned status ${response.status}`;
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('image/svg+xml')) {
                throw new Error('Invalid response from diagram service. Expected SVG.');
            }
            
            setSvgContent(responseText);
        } catch (e) {
            console.error("Failed to fetch UML diagram:", e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching the diagram.');
        } finally {
            setIsLoading(false);
        }
    };

    fetchDiagram();
  }, [umlImageUrl, activeTab]);

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uml-diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TabButton: React.FC<{ tabName: 'visual' | 'code'; children: React.ReactNode }> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
        activeTab === tabName
          ? 'bg-gray-800 border-b-2 border-primary text-white'
          : 'text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {children}
    </button>
  );

  const renderVisualContent = () => {
    if (isLoading) {
      return <p className="text-gray-400">Loading diagram...</p>;
    }
    if (error) {
      return (
        <div className="text-center p-4">
            <p className="text-red-400 font-semibold">Could not display diagram.</p>
            <p className="text-gray-400 text-sm mt-2">The AI-generated PlantUML code might contain a syntax error.</p>
            <p className="text-gray-500 text-xs mt-1">You can check the raw syntax in the "Code" tab or try regenerating the plan.</p>
            <details className="mt-2 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">Show Technical Error</summary>
                <pre className="text-gray-600 text-xs mt-1 p-2 bg-gray-900 rounded whitespace-pre-wrap break-words">{error}</pre>
            </details>
        </div>
      );
    }
    if (svgContent) {
      // Convert the SVG string to a Base64 data URL. This is more compatible
      // with html2canvas than dangerouslySetInnerHTML. The unescape/encodeURIComponent
      // combo is a trick to handle UTF-8 characters correctly with btoa.
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      return <img src={svgDataUrl} alt="UML Diagram" className="max-w-full h-auto" />;
    }
    return <p className="text-gray-500">No diagram to display.</p>;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="flex justify-between items-center border-b border-gray-700 px-4">
        <div>
          <TabButton tabName="visual">Visual</TabButton>
          <TabButton tabName="code">Code</TabButton>
        </div>
        {activeTab === 'visual' && svgContent && !isLoading && !error && (
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 transition-colors"
                aria-label="Download SVG"
            >
                <DownloadIcon className="w-4 h-4" />
                Download SVG
            </button>
        )}
      </div>
      <div className="p-4">
        {activeTab === 'visual' ? (
          <div className="flex justify-center items-center bg-white rounded p-4 min-h-[200px] overflow-auto">
            {renderVisualContent()}
          </div>
        ) : (
          <CodeBlock code={plantUmlCode} />
        )}
      </div>
    </div>
  );
};

export default UmlDiagramDisplay;