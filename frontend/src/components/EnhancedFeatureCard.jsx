import { useState } from "react";

export default function EnhancedFeatureCard({ icon, title, description, features = [] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 transition-all duration-300 hover:bg-slate-700/40 hover:scale-105 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900/50 border border-slate-700/60 group-hover:border-cyan-500/30 transition-colors">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Feature list */}
        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li 
                key={index}
                className={`flex items-center gap-2 text-xs text-slate-500 transition-all duration-300 ${
                  isHovered ? 'text-slate-400 translate-x-1' : ''
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Hover indicator */}
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
    </div>
  );
}
