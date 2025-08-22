import React, { useState, useEffect, useRef } from 'react';

interface Section {
  id: string;
  title: string;
}

interface FloatingNavProps {
  sections: Section[];
  activeSectionId: string | null;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ sections, activeSectionId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Show the nav only after scrolling past the input form area
      const resultsElement = document.getElementById('architecture');
      if (resultsElement && window.scrollY > resultsElement.offsetTop - 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Scroll active mobile tab into view
  useEffect(() => {
    if (activeSectionId && navRef.current && window.innerWidth < 1024) {
      const activeElement = navRef.current.querySelector(`[data-id="${activeSectionId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSectionId]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
        // The y-offset accounts for the sticky mobile nav height
        const yOffset = window.innerWidth < 1024 ? -60 : -20; 
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!isVisible || sections.length === 0) return null;

  const linkClasses = (id: string) =>
    `block px-4 py-2 rounded-md text-sm transition-all duration-200 whitespace-nowrap ${
      activeSectionId === id
        ? 'bg-primary text-white font-semibold scale-105'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;

  const NavLink: React.FC<{section: Section}> = ({section}) => (
    <a 
      href={`#${section.id}`} 
      data-id={section.id} 
      onClick={(e) => handleNavClick(e, section.id)}
      className={linkClasses(section.id)}
    >
      {section.title}
    </a>
  );


  return (
    <>
      {/* Desktop Navigation (Left Sidebar) */}
      <nav className="hidden lg:block fixed top-1/2 -translate-y-1/2 left-8 xl:left-16 z-50">
        <ul className="space-y-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-2 rounded-lg shadow-2xl">
          {sections.map(section => (
            <li key={section.id}>
              <NavLink section={section} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Navigation (Sticky Header) */}
      <nav ref={navRef} className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <ul className="flex items-center overflow-x-auto p-2 no-scrollbar">
          {sections.map(section => (
            <li key={section.id} className="flex-shrink-0 mx-1">
              <NavLink section={section} />
            </li>
          ))}
        </ul>
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      </nav>
    </>
  );
};

export default FloatingNav;