import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader, Star, Book, BarChart, MessageSquare, Target, Sparkles, TrendingUp, Heart, UserCheck, Smile, BookOpen, Zap, Lightbulb, Megaphone, Users, Globe, Briefcase, Feather, PenTool, Layers, Compass, Cloud, Handshake, Shield, Clock, DollarSign, Code, Flag, Eye, XCircle } from 'lucide-react';

const categoryIcons = {
  'Educational Content': <Book size={16} />,
  'Data-Driven Content': <BarChart size={16} />,
  'Engagement Content': <MessageSquare size={16} />,
  'Authority Content': <Target size={16} />,
  'Intrigue & Discovery': <Sparkles size={16} />,
  'Pain & Solution': <AlertCircle size={16} />,
  'Credibility & Trust': <Handshake size={16} />,
  'Challenge & Debate': <Shield size={16} />,
  'Expertise & Value': <Lightbulb size={16} />,
  'Learning & Guidance': <BookOpen size={16} />,
  'Market & Future': <TrendingUp size={16} />,
  'Personal Wellbeing': <Heart size={16} />,
  'Proof & Results': <BarChart size={16} />,
  'Formal & Expert': <UserCheck size={16} />,
  'Informal & Engaging': <Smile size={16} />,
  'Storytelling': <Feather size={16} />,
  'Emotional & Relatable': <Heart size={16} />,
  'Visionary': <Zap size={16} />,
  'Niche & Specific': <Compass size={16} />,
  'Core Business': <Briefcase size={16} />,
  'Status': <Clock size={16} />,
  'howTo': <Lightbulb size={16} />,
  'list': <Layers size={16} />,
  'toolReview': <Code size={16} />,
  'processFramework': <Flag size={16} />,
  'caseStudy': <Briefcase size={16} />,
  'trendAnalysis': <TrendingUp size={16} />,
  'industryInsights': <Globe size={16} />,
  'comparison': <BarChart size={16} />,
  'question': <MessageSquare size={16} />,
  'personalStory': <Feather size={16} />,
  'contrarian': <AlertCircle size={16} />,
  'behindScenes': <Eye size={16} />,
  'mythBusting': <XCircle size={16} />,
  'prediction': <Zap size={16} />,
  'motivational': <Heart size={16} />,
  'curiosityGap': <Sparkles size={16} />,
  'pas': <AlertCircle size={16} />,
  'socialProof': <Users size={16} />,
  'authority': <UserCheck size={16} />,
  'educational': <BookOpen size={16} />,
  'Technology': <Cloud size={16} />,
  'Leadership': <Briefcase size={16} />,
  'Human Resource': <Users size={16} />,
  'Health Tips': <Heart size={16} />,
  'Industry Trends': <TrendingUp size={16} />,
  'Case Studies': <BookOpen size={16} />,
  'casual-witty': <Smile size={16} />,
  'professional-authority': <UserCheck size={16} />,
  'approachable-expert': <Lightbulb size={16} />,
  'snap-snark': <MessageSquare size={16} />,
  'plain-talk-playbook': <BookOpen size={16} />,
  'anecdote-to-aha': <Feather size={16} />,
  'bias-buster': <Shield size={16} />,
  'open-heart-honest': <Heart size={16} />,
  'future-forward-glow': <Zap size={16} />,
  'money-with-meaning': <DollarSign size={16} />,
  'conversion-mode': <Megaphone size={16} />,
  'nerdy-fun-run': <Code size={16} />,
  'mission-voice': <Flag size={16} />,
};

const PerformanceBadge = ({ indicator, isTrending }) => {
  if (!indicator && !isTrending) return null;

  const baseClasses = "text-xs font-bold py-0.5 px-1.5 rounded-md border";
  let indicatorClasses = "";
  let indicatorLabel = "";

  switch (indicator) {
    case 'high':
      indicatorClasses = "badge-high";
      indicatorLabel = "Avg. 5k+ views";
      break;
    case 'medium':
      indicatorClasses = "badge-medium";
      indicatorLabel = "Avg. 2-5k views";
      break;
    case 'experimental':
      indicatorClasses = "badge-experimental";
      indicatorLabel = "New format";
      break;
    default:
      break;
  }

  return (
    <div className="flex items-center space-x-1">
      {indicator && (
        <span className={`${baseClasses} ${indicatorClasses}`}>
          {indicatorLabel}
        </span>
      )}
      {isTrending && (
        <span className={`${baseClasses} badge-trending flex items-center`}>
          <Sparkles size={12} className="mr-1" /> Trending
        </span>
      )}
    </div>
  );
};

const CompatibilityBadge = ({ status, reason }) => {
  if (!status || status === 'neutral') return null;

  const baseClasses = "text-xs font-bold py-0.5 px-1.5 rounded-md border ml-1";
  let statusClasses = "";
  let statusIcon = null;
  let statusLabel = "";

  switch (status) {
    case 'recommended':
      statusClasses = "badge-compatibility-recommended";
      statusIcon = <CheckCircle size={12} />;
      statusLabel = "Recommended";
      break;
    case 'caution':
      statusClasses = "badge-compatibility-caution";
      statusIcon = <AlertCircle size={12} />;
      statusLabel = "Caution";
      break;
    case 'not-recommended':
      statusClasses = "badge-compatibility-not-recommended";
      statusIcon = <XCircle size={12} />;
      statusLabel = "Not Recommended";
      break;
  }

  return (
    <div className="relative group">
      <span className={`${baseClasses} ${statusClasses} flex items-center`}>
        {statusIcon} {statusLabel}
      </span>
      {reason && (
        <div className="enhanced-dropdown-tooltip hidden group-hover:block">
          <p>{reason}</p>
        </div>
      )}
    </div>
  );
};

const EnhancedDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  compatibilityMap = {},
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const dropdownRef = useRef(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value || opt.id === value), [options, value]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setActiveFilters([]);
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredOptions = useMemo(() => {
    let filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (activeFilters.includes('high-performance')) {
      filtered = filtered.filter(opt => opt.performanceIndicator === 'high');
    }
    if (activeFilters.includes('trending')) {
      filtered = filtered.filter(opt => opt.isTrending);
    }
    if (activeFilters.includes('experimental')) {
      filtered = filtered.filter(opt => opt.performanceIndicator === 'experimental');
    }
    if (activeFilters.includes('recommended')) {
      filtered = filtered.filter(opt => compatibilityMap[opt.id]?.status === 'recommended');
    }

    const grouped = {};
    filtered.forEach(option => {
      if (!grouped[option.category]) {
        grouped[option.category] = [];
      }
      grouped[option.category].push(option);
    });
    return grouped;
  }, [options, searchTerm, activeFilters, compatibilityMap]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterTags = [
    { id: 'all', label: 'All', filter: '' },
    { id: 'high-performance', label: 'High Performance ✨', filter: 'high-performance' },
    { id: 'trending', label: 'Trending 🔥', filter: 'trending' },
    { id: 'experimental', label: 'Experimental 🧪', filter: 'experimental' },
    { id: 'recommended', label: 'Recommended ✅', filter: 'recommended' },
  ];

  return (
    <div className="enhanced-dropdown-container" ref={dropdownRef}>
      <label htmlFor={`dropdown-${label}`} className="neo-label">{label}</label>
      <button
        id={`dropdown-${label}`}
        type="button"
        className="neo-input flex items-center justify-between w-full"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={loading}
      >
        <span className="flex items-center">
          {selectedOption ? (
            <>
              {categoryIcons[selectedOption.id] && <span className="mr-2 text-gray-500">{categoryIcons[selectedOption.id]}</span>}
              {selectedOption.label}
              <CompatibilityBadge
                status={compatibilityMap[selectedOption.id]?.status}
                reason={compatibilityMap[selectedOption.id]?.reason}
              />
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="enhanced-dropdown-content">
          <div className="enhanced-dropdown-search">
            <input
              type="text"
              placeholder="Search options..."
              className="neo-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={`Search ${label} options`}
            />
          </div>
          <div className="enhanced-dropdown-filters">
            {filterTags.map(tag => (
              <button
                key={tag.id}
                className={`enhanced-dropdown-filter-tag ${activeFilters.includes(tag.filter) || (tag.id === 'all' && activeFilters.length === 0) ? 'active' : ''}`}
                onClick={() => tag.id === 'all' ? setActiveFilters([]) : handleFilterToggle(tag.filter)}
              >
                {tag.label}
              </button>
            ))}
          </div>
          {Object.keys(filteredOptions).length === 0 ? (
            <div className="p-3 text-center text-gray-500">No options found.</div>
          ) : (
            Object.entries(filteredOptions).map(([category, optionsInCat]) => (
              <div key={category}>
                <div className="enhanced-dropdown-category-header flex items-center space-x-2">
                  {categoryIcons[category] && <span className="text-gray-400">{categoryIcons[category]}</span>}
                  <span>{category}</span>
                </div>
                {optionsInCat.map(option => {
                  const optionId = option.id || option.value;
                  const isSelected = value === option.value || value === option.id;
                  return (
                    <div
                      key={optionId}
                      className={`enhanced-dropdown-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(option.value || option.id)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="enhanced-dropdown-option-content">
                        {isSelected && <CheckCircle size={16} className="mr-2 text-purple-electric" />}
                        <span className="flex-1">{option.label}</span>
                        <div className="enhanced-dropdown-option-badges">
                          <PerformanceBadge indicator={option.performanceIndicator} isTrending={option.isTrending} />
                          <CompatibilityBadge status={compatibilityMap[optionId]?.status} reason={compatibilityMap[optionId]?.reason} />
                        </div>
                      </div>
                      <div className="absolute hidden group-hover:block enhanced-dropdown-tooltip">
                        <h4 className="font-bold">{option.label}</h4>
                        <p className="mb-2">{option.description}</p>
                        <p className="font-semibold">💡 Example:</p>
                        <p className="italic mb-2">"{option.exampleSnippet}"</p>
                        <p className="font-semibold">✅ Best for:</p>
                        <ul className="list-disc list-inside ml-4">
                          {option.useCases && option.useCases.map((uc, i) => <li key={i}>{uc}</li>)}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      {loading && (
        <div className="recommendation-loading">
          <Loader size={24} className="animate-spin text-purple-electric" />
        </div>
      )}
    </div>
  );
};

export default EnhancedDropdown;