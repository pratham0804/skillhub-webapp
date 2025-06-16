const youtubeService = require('../services/youtubeService');

/**
 * Get learning resources for a specific role
 * @param {Object} req - Express request object with targetRole parameter
 * @param {Object} res - Express response object
 */
const getResourcesForRole = async (req, res) => {
  try {
    const { targetRole } = req.params;
    
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target role is required'
      });
    }
    
    try {
      // Fetch resources for the specified role
      const resources = await youtubeService.getRecommendationsForRole(targetRole);
      
      if (!resources || resources.length === 0) {
        // Provide default resources if none found
        const defaultResources = await youtubeService.getRecommendationsForRole('Full Stack Developer');
        
        return res.status(200).json({
          success: true,
          message: `No specific resources found for ${targetRole}, showing general recommendations`,
          data: youtubeService.labelResourcesBySource(defaultResources)
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Resources for ${targetRole} retrieved successfully`,
        data: resources
      });
    } catch (error) {
      console.error(`Error fetching resources for role ${targetRole}:`, error);
      
      // Fallback to mock data
      const defaultResources = await youtubeService.getRecommendationsForRole('Full Stack Developer');
      
      return res.status(200).json({
        success: true,
        message: 'Using default resources due to an error',
        data: youtubeService.labelResourcesBySource(defaultResources)
      });
    }
  } catch (error) {
    console.error('Error in getResourcesForRole controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning resources',
      error: error.message
    });
  }
};

/**
 * Get learning resources for a specific skill
 * @param {Object} req - Express request object with skillName parameter
 * @param {Object} res - Express response object
 */
const getResourcesForSkill = async (req, res) => {
  try {
    const { skillName } = req.params;
    
    if (!skillName) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }
    
    try {
      console.log(`Fetching resources for skill: ${skillName}`);
      
      // Use accurate skill search term for better results
      const normalizedSkill = skillName.trim();
      
      // Fetch both YouTube and Coursera resources together using the enhanced method
      console.log(`Using enhanced getRecommendationsForSkill for: ${normalizedSkill}`);
      const resources = await youtubeService.getRecommendationsForSkill(normalizedSkill);
      
      if (!resources || resources.length === 0) {
        // Try fallback with more specific query
        const specificQuery = `${normalizedSkill} tutorial beginner learn`;
        console.log(`No resources found with basic query, trying specific query: "${specificQuery}"`);
        
        // Try again with YouTube search as fallback
        const fallbackResources = await youtubeService.searchYouTube(specificQuery);
        
        if (!fallbackResources || fallbackResources.length === 0) {
          // Return empty result instead of error to allow frontend to handle gracefully
          return res.status(200).json({
            success: true,
            message: `No learning resources found for ${skillName}`,
            data: [],
            groupedData: {
              youtube: [],
              coursera: [],
              documentation: []
            }
          });
        }
        
        // Label resources by source and return them
        const labeledResources = youtubeService.labelResourcesBySource(fallbackResources);
        const groupedFallback = {
          youtube: labeledResources.filter(r => r.source === 'YouTube' || r.source === 'youtube' || (!r.source && !r.type)),
          coursera: labeledResources.filter(r => r.source === 'Coursera' || r.source === 'coursera'),
          documentation: labeledResources.filter(r => r.source === 'Documentation' || r.source === 'documentation' || r.type === 'documentation')
        };
        
        return res.status(200).json({
          success: true,
          message: `Found resources for ${skillName} with specific query`,
          data: labeledResources,
          groupedData: groupedFallback
        });
      }
      
      // Group resources by source
      const groupedResources = {
        youtube: resources.filter(r => 
          r.source === 'YouTube' || 
          r.source === 'youtube' || 
          (r.url && r.url.includes('youtube.com')) ||
          (!r.source && !r.type)
        ),
        coursera: resources.filter(r => 
          r.source === 'Coursera' || 
          r.source === 'coursera' ||
          (r.url && r.url.includes('coursera.org'))
        ),
        documentation: resources.filter(r => 
          r.source === 'Documentation' || 
          r.source === 'documentation' || 
          r.type === 'documentation'
        )
      };
      
      console.log(`Found ${resources.length} total resources: ${groupedResources.youtube.length} YouTube, ${groupedResources.coursera.length} Coursera, ${groupedResources.documentation.length} Documentation`);
      
      return res.status(200).json({
        success: true,
        message: `Resources for ${skillName} retrieved successfully`,
        data: resources,
        groupedData: groupedResources
      });
    } catch (error) {
      console.error(`Error fetching resources for skill ${skillName}:`, error);
      
      // Return an error with empty data structure
      return res.status(500).json({
        success: false,
        message: `Failed to fetch resources for ${skillName}`,
        error: error.message,
        data: [],
        groupedData: {
          youtube: [],
          coursera: [],
          documentation: []
        }
      });
    }
  } catch (error) {
    console.error('Error in getResourcesForSkill controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch learning resources',
      error: error.message
    });
  }
};

/**
 * Search for learning resources
 * @param {Object} req - Express request object with q query parameter
 * @param {Object} res - Express response object
 */
const searchResources = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    try {
      // Search for resources across platforms
      const results = await youtubeService.searchYouTube(q);
      
      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No resources found for your search'
        });
      }
      
      // Group results by source
      const groupedResults = {
        youtube: results.filter(r => r.source === 'YouTube' || !r.source),
        coursera: results.filter(r => r.source === 'Coursera'),
        documentation: results.filter(r => r.source === 'Documentation' || r.type === 'documentation')
      };
      
      return res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: results,
        groupedData: groupedResults
      });
    } catch (error) {
      console.error(`Error searching resources for "${q}":`, error);
      
      // Fallback to JavaScript resources
      const defaultResources = await youtubeService.getRecommendationsForSkill('JavaScript');
      
      return res.status(200).json({
        success: true,
        message: 'Using default resources due to an error',
        data: youtubeService.labelResourcesBySource(defaultResources)
      });
    }
  } catch (error) {
    console.error('Error in searchResources controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search learning resources',
      error: error.message
    });
  }
};

module.exports = {
  getResourcesForRole,
  getResourcesForSkill,
  searchResources
}; 