import React from 'react';

export const EditIcon = ({ size = 20, color = "currentColor", ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      d="M21.2799 6.40005L11.7399 15.94C10.7899 16.89 7.96987 17.33 7.33987 16.7C6.70987 16.07 7.13987 13.25 8.08987 12.3L17.6399 2.75002C17.8754 2.49308 18.1605 2.28654 18.4781 2.14284C18.7956 1.99914 19.139 1.92124 19.4875 1.9139C19.8359 1.90657 20.1823 1.96991 20.5056 2.10012C20.8289 2.23033 21.1225 2.42473 21.3686 2.67153C21.6147 2.91833 21.8083 3.21243 21.9376 3.53609C22.0669 3.85976 22.1294 4.20626 22.1211 4.55471C22.1128 4.90316 22.0339 5.24635 21.8894 5.5635C21.7448 5.88065 21.5375 6.16524 21.2799 6.40005V6.40005Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M11 4H6C4.93913 4 3.92178 4.42142 3.17163 5.17157C2.42149 5.92172 2 6.93913 2 8V18C2 19.0609 2.42149 20.0783 3.17163 20.8284C3.92178 21.5786 4.93913 22 6 22H17C19.21 22 20 20.2 20 18V13" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const DeleteIcon = ({ size = 20, color = "currentColor", ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M10 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 7H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path 
      d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const HeartIcon = ({ size = 20, filled = false, color = "currentColor", ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? color : "none"}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M8.55284 3.00012C7.93598 3.00012 7.23841 3.06514 6.57209 3.29224C2.55494 4.60387 1.26341 8.894 2.39877 12.43L2.40354 12.4448L2.40877 12.4595C3.03435 14.2174 4.04226 15.8127 5.35336 17.1249L5.36091 17.1324L5.36862 17.1398C7.23782 18.9323 9.27254 20.4953 11.4756 21.8515L11.9934 22.1703L12.5147 21.8573C14.7226 20.5315 16.7964 18.9254 18.6432 17.1474L18.649 17.1419L18.6547 17.1362C19.9771 15.8215 20.9851 14.2144 21.6015 12.4549L21.6066 12.4402L21.6113 12.4253C22.7251 8.89703 21.4401 4.60176 17.4507 3.30948C16.7976 3.09221 16.1236 3.00012 15.4648 3.00012C13.9828 3.00011 12.8858 3.62064 12.0004 4.25309C11.1219 3.62545 10.0176 3.00012 8.55284 3.00012Z" 
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 2}
    />
  </svg>
);
