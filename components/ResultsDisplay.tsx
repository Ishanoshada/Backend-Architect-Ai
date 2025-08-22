import React, { useState, useRef, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { BackendPlan, DatabaseModel, ApiRoute, SecurityConsideration, GettingStartedPlan, DeploymentPlan, DevelopmentTooling } from '../types';
import { generateRouteCode } from '../services/geminiService';
import CodeBlock from './CodeBlock';
import ErrorMessage from './ErrorMessage';
import DownloadIcon from './icons/DownloadIcon';
import ImageIcon from './icons/ImageIcon';
import CodeIcon from './icons/CodeIcon';
import RefreshIcon from './icons/RefreshIcon';
import UmlDiagramDisplay from './UmlDiagramDisplay';
import FloatingNav from './FloatingNav';

interface GenerationContext {
  appIdea: string;
  techStack: string;
  architectureChoice: string;
  appComplexity: string;
  databaseModels: DatabaseModel[];
  databaseType: string;
}

interface ResultsDisplayProps {
  plan: BackendPlan;
  generationContext: GenerationContext;
}

const formatPlanAsText = (plan: BackendPlan): string => {
  let text = `Backend Plan\n====================\n\n`;

  if (plan.architecture) {
    text += `## Architecture: ${plan.architecture.name}\n\n`;
    text += `Reasoning:\n${plan.architecture.reasoning}\n\n`;
    text += `Key Components:\n`;
    plan.architecture.details?.forEach(d => text += `- ${d}\n`);
    text += '\n--------------------\n\n';
  }

  if (plan.database) {
    text += `## Database: ${plan.database.type}\n\n`;
    text += `Reasoning:\n${plan.database.reasoning}\n\n`;
    text += '--------------------\n\n';
  }

  if (plan.databaseModels?.length) {
    text += `## Database Models\n\n`;
    plan.databaseModels.forEach(model => {
      text += `### ${model.name}\n`;
      text += `${model.description}\n`;
      text += `Fields:\n`;
      model.fields?.forEach(f => text += `  - ${f.name} (${f.type}): ${f.description}\n`);
      text += '\n';
    });
    text += '--------------------\n\n';
  }

  if (plan.umlDiagram) {
      text += `## Database UML Diagram (PlantUML)\n\n`;
      text += `\`\`\`plantuml\n${plan.umlDiagram}\n\`\`\`\n\n`;
      text += '--------------------\n\n';
  }

  if (plan.apiRoutes?.length) {
    text += `## API Routes\n\n`;
    plan.apiRoutes.forEach(route => {
      text += `### ${route.method} ${route.path}\n`;
      text += `${route.description}\n`;
      if (route.requestBodyExample) {
        text += `Request Body Example:\n\`\`\`\n${route.requestBodyExample}\n\`\`\`\n`;
      }
      if (route.responseBodyExample) {
        text += `Response Body Example:\n\`\`\`\n${route.responseBodyExample}\n\`\`\`\n`;
      }
      text += '\n';
    });
    text += '--------------------\n\n';
  }

  if (plan.securityConsiderations?.length) {
      text += `## Security & Scalability\n\n`;
      plan.securityConsiderations.forEach(item => {
          text += `### ${item.name}\n`;
          text += `${item.description}\n\n`;
      });
      text += '--------------------\n\n';
  }
  
  if (plan.developmentTooling) {
    text += `## Development & Tooling\n\n`;
    text += `### Technology Rationale\n${plan.developmentTooling.techRationale}\n\n`;
    text += `### Recommended Libraries\n`;
    plan.developmentTooling.recommendedLibraries?.forEach(lib => {
        text += `- **${lib.name}**: ${lib.description}\n`;
    });
    text += `\n### Local Development Setup (docker-compose.yml)\n\`\`\`yaml\n${plan.developmentTooling.dockerCompose}\n\`\`\`\n\n`;
    text += '--------------------\n\n';
  }

  if (plan.deployment) {
    text += `## Deployment Suggestions\n\n`;
    text += `### Platform: ${plan.deployment.platform}\n`;
    text += `${plan.deployment.reasoning}\n\n`;
    text += `### Example Dockerfile\n\`\`\`dockerfile\n${plan.deployment.dockerfile}\n\`\`\`\n\n`;
    text += '--------------------\n\n';
  }

  if (plan.gettingStarted) {
      text += `## Getting Started Guide\n\n`;
      text += `${plan.gettingStarted.introduction}\n\n`;
      text += `### Setup Commands\n`;
      plan.gettingStarted.steps?.forEach(step => {
        text += `> ${step.command}\n`;
        text += `  ${step.description}\n\n`;
      });
      text += `### Suggested File Structure\n\`\`\`\n${plan.gettingStarted.fileStructure}\n\`\`\`\n\n`;
  }
  
  return text;
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ plan, generationContext }) => {
  const { architecture, database, databaseModels, apiRoutes, securityConsiderations, umlDiagram, gettingStarted, deployment, developmentTooling } = plan;
  const [isCapturing, setIsCapturing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const sections = useMemo(() => {
    const availableSections = [];
    if (plan.architecture) availableSections.push({ id: 'architecture', title: 'Architecture' });
    if (plan.database) availableSections.push({ id: 'database', title: 'Database' });
    if (plan.databaseModels?.length) availableSections.push({ id: 'database-models', title: 'DB Models' });
    if (plan.umlDiagram) availableSections.push({ id: 'uml-diagram', title: 'UML Diagram' });
    if (plan.apiRoutes?.length) availableSections.push({ id: 'api-routes', title: 'API Routes' });
    if (plan.securityConsiderations?.length) availableSections.push({ id: 'security-scalability', title: 'Security' });
    if (plan.developmentTooling) availableSections.push({ id: 'development-tooling', title: 'Tooling' });
    if (plan.deployment) availableSections.push({ id: 'deployment', title: 'Deployment' });
    if (plan.gettingStarted) availableSections.push({ id: 'getting-started', title: 'Getting Started' });
    return availableSections;
  }, [plan]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      }
    );

    const currentRefs = sectionRefs.current;
    Object.values(currentRefs).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(currentRefs).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [sections]);

  const handleDownloadTxt = () => {
    const textContent = formatPlanAsText(plan);
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backend-plan.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = () => {
    if (!resultsRef.current) return;
    setIsCapturing(true);
    html2canvas(resultsRef.current, {
        backgroundColor: '#121212',
        useCORS: true,
        scale: 2,
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'backend-plan.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error("Failed to capture image:", err);
        alert("Sorry, could not capture the image. See the console for details.");
    }).finally(() => {
        setIsCapturing(false);
    });
  };

  const buttonClass = "flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300";

  return (
    <div className="max-w-6xl mx-auto animate-fade-in relative">
       <FloatingNav sections={sections} activeSectionId={activeSectionId} />
       <div className="flex flex-wrap justify-end items-center gap-3 mb-8">
        <button onClick={handleDownloadTxt} className={buttonClass}>
          <DownloadIcon className="w-5 h-5" />
          Download TXT
        </button>
        <button onClick={handleDownloadImage} disabled={isCapturing} className={buttonClass}>
          <ImageIcon className="w-5 h-5" />
          {isCapturing ? 'Capturing...' : 'Download Image'}
        </button>
      </div>

      <div ref={resultsRef} className="space-y-12 bg-gray-900 p-0.5">
        {architecture && (
          <section id="architecture" ref={el => { sectionRefs.current['architecture'] = el; }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Architecture: {architecture.name}</h2>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
              <p className="text-gray-300 mb-4">{architecture.reasoning}</p>
              <h4 className="font-semibold text-gray-200 mb-2">Key Components:</h4>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                  {architecture.details?.map((detail, index) => (
                  <li key={index}>{detail}</li>
                  ))}
              </ul>
              </div>
          </section>
        )}

        {database && (
            <section id="database" ref={el => { sectionRefs.current['database'] = el; }}>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Database: {database.type}</h2>
                <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
                    <p className="text-gray-300">{database.reasoning}</p>
                </div>
            </section>
        )}

        {databaseModels && databaseModels.length > 0 && (
          <section id="database-models" ref={el => { sectionRefs.current['database-models'] = el; }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Database Models</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {databaseModels.map((model) => (
                  <DatabaseModelCard key={model.name} model={model} />
              ))}
              </div>
          </section>
        )}

        {umlDiagram && (
          <section id="uml-diagram" ref={el => { sectionRefs.current['uml-diagram'] = el; }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Database UML Diagram</h2>
              <UmlDiagramDisplay plantUmlCode={umlDiagram} />
          </section>
        )}

        {apiRoutes && apiRoutes.length > 0 && (
          <section id="api-routes" ref={el => { sectionRefs.current['api-routes'] = el; }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">API Routes</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-700">
                  {apiRoutes.map((route, index) => (
                    <ApiRouteItem key={index} route={route} generationContext={generationContext} />
                  ))}
              </div>
              </div>
          </section>
        )}
        
        {securityConsiderations && securityConsiderations.length > 0 && (
          <section id="security-scalability" ref={el => { sectionRefs.current['security-scalability'] = el; }}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Security & Scalability</h2>
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg space-y-4">
                  {securityConsiderations.map((item, index) => (
                      <SecurityConsiderationItem key={index} item={item} />
                  ))}
              </div>
          </section>
        )}

        {developmentTooling && (
           <section id="development-tooling" ref={el => { sectionRefs.current['development-tooling'] = el; }}>
                <DevelopmentToolingSection plan={developmentTooling} />
           </section>
        )}

        {deployment && (
          <section id="deployment" ref={el => { sectionRefs.current['deployment'] = el; }}>
            <DeploymentSection plan={deployment} />
          </section>
        )}

        {gettingStarted && (
          <section id="getting-started" ref={el => { sectionRefs.current['getting-started'] = el; }}>
            <GettingStartedSection plan={gettingStarted} />
          </section>
        )}
      </div>
    </div>
  );
};

const DatabaseModelCard: React.FC<{ model: DatabaseModel }> = ({ model }) => (
  <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg h-full flex flex-col">
    <h3 className="text-xl font-bold text-gray-200">{model.name}</h3>
    <p className="text-sm text-gray-400 mb-4 flex-shrink-0">{model.description}</p>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="py-2 pr-4">Field</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {model.fields?.map((field) => (
            <tr key={field.name}>
              <td className="py-2 pr-4 font-mono text-gray-300 whitespace-nowrap">{field.name}</td>
              <td className="py-2 pr-4 font-mono text-purple-300 whitespace-nowrap">{field.type}</td>
              <td className="py-2 text-gray-400">{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface ApiRouteItemProps {
  route: ApiRoute;
  generationContext: GenerationContext;
}

const ApiRouteItem: React.FC<ApiRouteItemProps> = ({ route, generationContext }) => {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCode = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedCode(null);
        try {
            const code = await generateRouteCode(generationContext, route);
            setGeneratedCode(code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const canGenerateCode = !!generationContext.techStack;

    const methodColors: { [key: string]: string } = {
        GET: 'text-green-400',
        POST: 'text-blue-400',
        PUT: 'text-yellow-400',
        PATCH: 'text-orange-400',
        DELETE: 'text-red-400',
    };

    const SmallButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; }> = ({ onClick, disabled, children }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 text-gray-200 font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-hover disabled:bg-gray-600/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
        >
            {children}
        </button>
    );

    return (
        <div className="p-6">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-2">
                <span className={`text-lg font-bold ${methodColors[route.method] || 'text-gray-400'}`}>
                    {route.method}
                </span>
                <span className="text-lg font-mono bg-gray-700 px-3 py-1 rounded break-all">{route.path}</span>
            </div>
            <p className="text-gray-400 md:ml-2">{route.description}</p>
            {route.requestBodyExample && (
                <div className="mt-4">
                    <h5 className="font-semibold text-gray-300 mb-1">Request Body / Code Example:</h5>
                    <CodeBlock code={route.requestBodyExample} />
                </div>
            )}
            {route.responseBodyExample && (
                <div className="mt-4">
                    <h5 className="font-semibold text-gray-300 mb-1">Response Body Example:</h5>
                    <CodeBlock code={route.responseBodyExample} />
                </div>
            )}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-700">
                {!generatedCode && !isGenerating && !error && (
                    <div title={!canGenerateCode ? "Select a Technology Stack to enable code generation." : ""}>
                        <SmallButton onClick={handleGenerateCode} disabled={!canGenerateCode || isGenerating}>
                            <CodeIcon className="w-4 h-4" />
                            {isGenerating ? 'Generating...' : 'Generate Implementation'}
                        </SmallButton>
                    </div>
                )}

                {isGenerating && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                        <span>Generating code...</span>
                    </div>
                )}
                
                {error && <ErrorMessage message={error} />}

                {generatedCode && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-semibold text-gray-300">Generated Code Implementation:</h5>
                             <SmallButton onClick={handleGenerateCode} disabled={isGenerating}>
                                <RefreshIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Regenerating...' : 'Regenerate'}
                            </SmallButton>
                        </div>
                        <CodeBlock code={generatedCode} />
                    </div>
                )}
            </div>
        </div>
    );
};

const SecurityConsiderationItem: React.FC<{item: SecurityConsideration}> = ({item}) => (
    <div>
        <h4 className="font-bold text-lg text-gray-200">{item.name}</h4>
        <p className="text-gray-400">{item.description}</p>
    </div>
);

const DevelopmentToolingSection: React.FC<{ plan: DevelopmentTooling }> = ({ plan }) => (
    <>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Development & Tooling</h2>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg space-y-6">
            <div>
                <h4 className="font-bold text-lg text-gray-200">Technology Rationale</h4>
                <p className="text-gray-400">{plan.techRationale}</p>
            </div>
            <div>
                <h4 className="font-bold text-lg text-gray-200 mb-2">Recommended Libraries</h4>
                <div className="space-y-3">
                    {plan.recommendedLibraries?.map(lib => (
                        <div key={lib.name}>
                            <p className="font-semibold text-gray-300">{lib.name}</p>
                            <p className="text-sm text-gray-500">{lib.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-lg text-gray-200 mb-2">Local Development Setup (docker-compose.yml)</h4>
                <CodeBlock code={plan.dockerCompose} />
            </div>
        </div>
    </>
);

const DeploymentSection: React.FC<{ plan: DeploymentPlan }> = ({ plan }) => (
    <>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Deployment Suggestions</h2>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg space-y-6">
            <div>
                <h4 className="font-bold text-lg text-gray-200">Recommended Platform</h4>
                <p className="text-gray-400"><span className="font-semibold text-gray-300">{plan.platform}</span> - {plan.reasoning}</p>
            </div>
            
            <div>
                <h4 className="font-bold text-lg text-gray-200 mb-2">Example Dockerfile</h4>
                <CodeBlock code={plan.dockerfile} />
            </div>
        </div>
    </>
);

const GettingStartedSection: React.FC<{ plan: GettingStartedPlan }> = ({ plan }) => (
    <>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Getting Started Guide</h2>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg space-y-6">
            <p className="text-gray-400">{plan.introduction}</p>
            
            <div>
                <h4 className="font-bold text-lg text-gray-200 mb-2">Setup Commands</h4>
                <div className="space-y-4">
                    {plan.steps?.map((step, index) => (
                        <div key={index}>
                            <CodeBlock code={step.command} />
                            <p className="text-sm text-gray-500 mt-1 pl-2">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="font-bold text-lg text-gray-200 mb-2">Suggested File Structure</h4>
                <CodeBlock code={plan.fileStructure} />
            </div>
        </div>
    </>
);


export default ResultsDisplay;