import React, { useState, useEffect } from 'react';
import './SkillResources.css';
import { useAuth } from '../../contexts/AuthContext';

const SkillResources = ({ skillName, isVisible = true, onToggle = () => {} }) => {
  const [resources, setResources] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { api } = useAuth();

  useEffect(() => {
    if (skillName && !fetchAttempted) {
      fetchResources();
    }
  }, [skillName]);

  const fetchResources = async () => {
    if (!skillName) return;
    
    setLoading(true);
    setError(null);
    setFetchAttempted(true);

    try {
      console.log(`Fetching resources for skill: ${skillName}`);
      
      // Use the enhanced API endpoint
      const response = await api.get(`/learning/skill/${encodeURIComponent(skillName)}`);
      console.log('Enhanced API response:', response.data);

      if (response.data && response.data.success) {
        const { data, groupedData: grouped } = response.data;
        
        setResources(data || []);
        setGroupedData(grouped || {});
        
        console.log(`Successfully loaded ${data?.length || 0} resources for ${skillName}`);
        console.log('Grouped data:', grouped);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch resources');
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load resources');
      setResources([]);
      setGroupedData({});
    } finally {
      setLoading(false);
    }
  };

  const getTabResources = () => {
    switch (activeTab) {
      case 'youtube':
        return groupedData.youtube || [];
      case 'coursera':
        return groupedData.coursera || [];
      case 'all':
      default:
        return resources;
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'youtube':
        return groupedData.youtube?.length || 0;
      case 'coursera':
        return groupedData.coursera?.length || 0;
      case 'all':
      default:
        return resources.length;
    }
  };

  const getResourceUrl = (resource) => {
    // Try all possible URL fields
    const url = resource.url || resource.videoUrl || resource.courseUrl || resource.link;
    
    // For YouTube videos, ensure we have a proper URL
    if ((resource.source === 'YouTube' || resource.platform === 'YouTube') && resource.videoId) {
      return `https://www.youtube.com/watch?v=${resource.videoId}`;
    }
    
    // For YouTube videos with URL containing video ID
    if (url && url.includes('youtube.com')) {
      return url;
    }
    
    // For documentation links
    if (resource.type === 'documentation' && url) {
      return url;
    }
    
    return url;
  };

  const handleCardClick = (e, resource) => {
    // Prevent click if user is selecting text
    if (window.getSelection().toString()) {
      return;
    }
    
    // Get the resource URL
    const url = getResourceUrl(resource);
    console.log('Clicking resource:', resource);
    console.log('URL to open:', url);
    
    if (!url) {
      console.warn('Resource has no valid URL:', resource);
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      console.error('Invalid URL format:', url);
      return;
    }

    // Track resource click (optional)
    try {
      api.post('/learning/track-click', {
        resourceId: resource.id || resource.videoId,
        skillName,
        platform: resource.source || resource.platform,
        url
      }).catch(err => console.warn('Failed to track click:', err));
    } catch (err) {
      // Non-blocking error
      console.warn('Failed to track resource click:', err);
    }

    // Open URL in new tab with security best practices
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardKeyPress = (e, resource) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e, resource);
    }
  };

  const renderResource = (resource, index) => {
    const isYouTube = resource.source === 'YouTube' || resource.platform === 'YouTube';
    const isCoursera = resource.source === 'Coursera' || resource.platform === 'Coursera';
    const url = getResourceUrl(resource);
    const hasUrl = !!url;

    return (
      <div 
        key={index} 
        className={`resource-card ${hasUrl ? 'has-url' : 'no-url'}`}
        onClick={(e) => handleCardClick(e, resource)}
        onKeyPress={(e) => handleCardKeyPress(e, resource)}
        role="button"
        tabIndex={0}
        aria-label={`Open ${resource.title} ${hasUrl ? 'resource' : '(no link available)'}`}
      >
        <div className="resource-header">
          <img 
            src={resource.thumbnail || '/default-thumbnail.png'} 
            alt={`Thumbnail for ${resource.title}`}
            className="resource-thumbnail"
            onError={(e) => {
              e.target.src = '/default-thumbnail.png';
              e.target.alt = 'Default thumbnail';
            }}
          />
          <div className="resource-info">
            <h4 className="resource-title">
              {resource.title}
              {hasUrl && (
                <span className="external-link-icon" title="Opens in new tab">
                  ↗
                </span>
              )}
            </h4>
            <p className="resource-author">
              by {resource.author || resource.channelTitle || 'Unknown'}
            </p>
            <div className="resource-platform">
              <span className={`platform-badge ${isYouTube ? 'youtube' : isCoursera ? 'coursera' : 'generic'}`}>
                {resource.source || resource.platform || 'Resource'}
              </span>
              {resource.type && (
                <span className="resource-type">{resource.type}</span>
              )}
            </div>
          </div>
        </div>
        
        <p className="resource-description">
          {resource.description}
        </p>
        
        <div className="resource-metadata">
          {isYouTube && (
            <div className="youtube-metadata">
              {resource.formattedViews && (
                <span className="metadata-item">
                  👁 {resource.formattedViews}
                </span>
              )}
              {resource.formattedDuration && (
                <span className="metadata-item">
                  ⏱ {resource.formattedDuration}
                </span>
              )}
            </div>
          )}
          
          {isCoursera && (
            <div className="coursera-metadata">
              {resource.workload && (
                <span className="metadata-item">
                  📚 {resource.workload}
                </span>
              )}
              {resource.relevanceScore && (
                <span className="metadata-item">
                  🎯 {Math.round(resource.relevanceScore)}%
                </span>
              )}
            </div>
          )}
          
          {resource.qualityScore && (
            <div className="quality-score">
              <span className="score-label">Quality Score:</span>
              <span className="score-value">{resource.qualityScore.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return null;
  }

  const tabResources = getTabResources();

  return (
    <div className="skill-resources">
      <div className="resources-header">
        <h3>Learning Resources for {skillName}</h3>
        <button 
          className="close-button" 
          onClick={onToggle}
          aria-label="Close resources"
        >
          ×
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding the best learning resources for {skillName}...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p className="error-message">⚠ {error}</p>
          <button 
            className="retry-button" 
            onClick={() => {
              setFetchAttempted(false);
              fetchResources();
            }}
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {!loading && !error && resources.length > 0 && (
        <>
          {/* Tab Navigation */}
          <div className="resource-tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Resources ({getTabCount('all')})
            </button>
            {groupedData.youtube?.length > 0 && (
              <button
                className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`}
                onClick={() => setActiveTab('youtube')}
              >
                YouTube ({getTabCount('youtube')})
              </button>
            )}
            {groupedData.coursera?.length > 0 && (
              <button
                className={`tab-button ${activeTab === 'coursera' ? 'active' : ''}`}
                onClick={() => setActiveTab('coursera')}
              >
                Coursera ({getTabCount('coursera')})
              </button>
            )}
          </div>

          {/* Resources Grid */}
          <div className="resources-grid">
            {tabResources.length > 0 ? (
              tabResources.map((resource, index) => renderResource(resource, index))
            ) : (
              <div className="no-resources-message">
                <p>No {activeTab === 'all' ? '' : activeTab} resources found for this filter.</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="resources-summary">
            <p>
              Showing {tabResources.length} of {resources.length} total resources
              {groupedData.total && ` • ${groupedData.total} resources from multiple platforms`}
            </p>
          </div>
        </>
      )}

      {!loading && !error && resources.length === 0 && fetchAttempted && (
        <div className="no-resources-state">
          <p>No learning resources found for "{skillName}".</p>
          <p>Try searching for a related skill or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default SkillResources;