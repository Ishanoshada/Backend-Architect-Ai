
import React from 'react';

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.044.588.05H11a2.25 2.25 0 012.25 2.25v.015c0 .324.067.642.19.928m-9.191-2.928c.195.025.39.044.588.05H11a2.25 2.25 0 002.25-2.25v-.015a2.25 2.25 0 00-2.25-2.25H7.805a2.25 2.25 0 00-2.25 2.25v.015c0 .324.067.642.19.928m7.874-2.186a2.25 2.25 0 100-2.186m0 2.186A2.25 2.25 0 0118 10.907v.015a2.25 2.25 0 01-2.25 2.25h-.015a2.25 2.25 0 01-2.25-2.25v-.015c0-.324.067-.642.19-.928"
    />
  </svg>
);

export default ShareIcon;
