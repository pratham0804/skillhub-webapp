const axios = require('axios');
require('dotenv').config();
const courseraService = require('./courseraService');

/**
 * YouTube Resources Service
 * Fetches learning resources from YouTube based on skills and target roles
 */

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Debug YouTube API key (silent in production)
if (process.env.NODE_ENV === 'development') {
  console.log('YouTube API Key configured:', !!YOUTUBE_API_KEY);
}

// Mock data for development (in a real app, these would come from a database or API)
const roleBasedCourses = {
  'Frontend Developer': [
    {
      title: 'Complete Front-End Web Development Course',
      url: 'https://www.youtube.com/playlist?list=PL0Zuz27SZ-6Pk-QJIdGd1tGZEzy9RTgtj',
      thumbnail: 'https://i.ytimg.com/vi/QA0XpGhiz5w/hqdefault.jpg',
      author: 'Dave Gray',
      description: 'Learn HTML, CSS, JavaScript, React, and more to become a frontend developer.'
    },
    {
      title: 'React JS Course for Beginners',
      url: 'https://www.youtube.com/watch?v=RVFAyFWO4go',
      thumbnail: 'https://i.ytimg.com/vi/RVFAyFWO4go/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn React from scratch in this comprehensive guide for beginners.'
    },
    {
      title: 'CSS Complete Course',
      url: 'https://www.youtube.com/watch?v=n4R2E7O-Ngo',
      thumbnail: 'https://i.ytimg.com/vi/n4R2E7O-Ngo/hqdefault.jpg',
      author: 'Dave Gray',
      description: 'Master CSS with this complete course - from basics to advanced.'
    }
  ],
  'Backend Developer': [
    {
      title: 'Node.js and Express.js - Full Course',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      thumbnail: 'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn Node.js and Express from scratch.'
    },
    {
      title: 'MongoDB Complete Course',
      url: 'https://www.youtube.com/watch?v=c2M-rlkkT5o',
      thumbnail: 'https://i.ytimg.com/vi/c2M-rlkkT5o/hqdefault.jpg',
      author: 'Bogdan Stashchuk',
      description: 'Learn MongoDB database from scratch.'
    },
    {
      title: 'API Development with Node.js',
      url: 'https://www.youtube.com/watch?v=rltfdjcXjmk',
      thumbnail: 'https://i.ytimg.com/vi/rltfdjcXjmk/hqdefault.jpg',
      author: 'Academind',
      description: 'Build RESTful APIs with Node.js, Express and MongoDB.'
    }
  ],
  'Full Stack Developer': [
    {
      title: 'MERN Stack Course',
      url: 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
      thumbnail: 'https://i.ytimg.com/vi/7CqJlxBYj-M/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn to build a complete app with the MERN stack.'
    },
    {
      title: 'Full Stack Development Tutorial',
      url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
      thumbnail: 'https://i.ytimg.com/vi/nu_pCVPKzTk/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'Full Stack React & Django Application Tutorial.'
    },
    {
      title: 'JavaScript Full Course',
      url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
      thumbnail: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn JavaScript from basics to advanced concepts.'
    }
  ],
  'Data Scientist': [
    {
      title: 'Python for Data Science Full Course',
      url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI',
      thumbnail: 'https://i.ytimg.com/vi/LHBE6Q9XlzI/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn Python for Data Science from scratch.'
    },
    {
      title: 'Data Science Full Course',
      url: 'https://www.youtube.com/watch?v=ua-CiDNNj30',
      thumbnail: 'https://i.ytimg.com/vi/ua-CiDNNj30/hqdefault.jpg',
      author: 'Edureka',
      description: 'Complete data science training from basic to advanced concepts.'
    },
    {
      title: 'Machine Learning Course for Beginners',
      url: 'https://www.youtube.com/watch?v=NWONeJKn6kc',
      thumbnail: 'https://i.ytimg.com/vi/NWONeJKn6kc/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn machine learning fundamentals with Python.'
    }
  ],
  'DevOps Engineer': [
    {
      title: 'DevOps Engineering Course',
      url: 'https://www.youtube.com/watch?v=j5Zsa_eOXeY',
      thumbnail: 'https://i.ytimg.com/vi/j5Zsa_eOXeY/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn DevOps engineering concepts and tools.'
    },
    {
      title: 'Docker and Kubernetes Tutorial',
      url: 'https://www.youtube.com/watch?v=bhBSlnQcq2k',
      thumbnail: 'https://i.ytimg.com/vi/bhBSlnQcq2k/hqdefault.jpg',
      author: 'Amigoscode',
      description: 'Learn Docker and Kubernetes from scratch.'
    },
    {
      title: 'Jenkins CI/CD Pipeline Tutorial',
      url: 'https://www.youtube.com/watch?v=7KCS70sCoK0',
      thumbnail: 'https://i.ytimg.com/vi/7KCS70sCoK0/hqdefault.jpg',
      author: 'TechWorld with Nana',
      description: 'Learn how to set up CI/CD pipelines with Jenkins.'
    }
  ]
};

// Skill based courses
const skillBasedCourses = {
  'Java Core (JDK)': [
    {
      title: 'Java Programming Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=eIrMbAQSU34',
      thumbnail: 'https://i.ytimg.com/vi/eIrMbAQSU34/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Learn Java programming from scratch in this comprehensive guide.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 18,
      qualityIndicator: 'Highly Recommended',
      formattedViews: '5.2M',
      formattedLikes: '120K',
      formattedDuration: '2:30:45'
    },
    {
      title: 'Java Full Course 2024',
      url: 'https://www.youtube.com/watch?v=CFD9EFcNZTQ',
      thumbnail: 'https://i.ytimg.com/vi/CFD9EFcNZTQ/hqdefault.jpg',
      author: 'freeCodeCamp.org',
      description: 'Complete Java course covering core concepts, OOP, and advanced features.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 17,
      qualityIndicator: 'Highly Recommended',
      formattedViews: '1.8M',
      formattedLikes: '45K',
      formattedDuration: '12:00:00'
    },
    {
      title: 'Java Documentation',
      url: 'https://docs.oracle.com/en/java/',
      thumbnail: 'https://www.oracle.com/a/ocom/img/rc24/java-logo-vert-blk.png',
      author: 'Oracle',
      description: 'Official Java documentation with tutorials, API references, and best practices.',
      type: 'documentation',
      source: 'Documentation',
      qualityScore: 19,
      qualityIndicator: 'Highly Recommended'
    }
  ],
  'JavaScript': [
    {
      title: 'JavaScript Full Course for Beginners',
      url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
      thumbnail: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn JavaScript from scratch in this 3-hour comprehensive course.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 18,
      qualityIndicator: 'Highly Recommended',
      formattedViews: '2.1M',
      formattedLikes: '45K',
      formattedDuration: '3:12:36'
    },
    {
      title: 'JavaScript Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      thumbnail: 'https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'JavaScript basics for beginners: learn JavaScript fundamentals in 1 hour.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 16,
      qualityIndicator: 'Recommended',
      formattedViews: '3.5M',
      formattedLikes: '98K',
      formattedDuration: '1:00:15'
    },
    {
      title: 'JavaScript Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      thumbnail: 'https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png',
      author: 'MDN Web Docs',
      description: 'Official JavaScript documentation with guides, references, and examples.',
      type: 'documentation',
      source: 'Documentation',
      qualityScore: 19,
      qualityIndicator: 'Highly Recommended'
    }
  ],
  'React': [
    {
      title: 'React JS Course for Beginners',
      url: 'https://www.youtube.com/watch?v=RVFAyFWO4go',
      thumbnail: 'https://i.ytimg.com/vi/RVFAyFWO4go/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn React from scratch in this comprehensive guide for beginners.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 17,
      qualityIndicator: 'Highly Recommended',
      formattedViews: '1.8M',
      formattedLikes: '52K',
      formattedDuration: '11:55:23'
    },
    {
      title: 'React Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
      thumbnail: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Learn React fundamentals in this beginner-friendly tutorial.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 16,
      qualityIndicator: 'Recommended',
      formattedViews: '2.3M',
      formattedLikes: '74K',
      formattedDuration: '1:18:47'
    },
    {
      title: 'React Documentation',
      url: 'https://react.dev/',
      thumbnail: 'https://react.dev/images/og-home.png',
      author: 'React Team',
      description: 'Official React documentation with guides, API references, and examples.',
      type: 'documentation',
      source: 'Documentation',
      qualityScore: 19,
      qualityIndicator: 'Highly Recommended'
    }
  ],
  'Python': [
    {
      title: 'Python for Beginners - Full Course',
      url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
      thumbnail: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn Python - Full Course for Beginners',
      type: 'video',
      source: 'YouTube',
      qualityScore: 17,
      qualityIndicator: 'Highly Recommended',
      formattedViews: '14M',
      formattedLikes: '380K',
      formattedDuration: '4:26:52'
    },
    {
      title: 'Python Tutorial - Python Full Course for Beginners',
      url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
      thumbnail: 'https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Python tutorial for beginners - Learn Python for machine learning and web development.',
      type: 'video',
      source: 'YouTube',
      qualityScore: 16,
      qualityIndicator: 'Recommended',
      formattedViews: '10M',
      formattedLikes: '320K',
      formattedDuration: '6:14:07'
    },
    {
      title: 'Python Documentation',
      url: 'https://docs.python.org/3/',
      thumbnail: 'https://www.python.org/static/opengraph-icon-200x200.png',
      author: 'Python.org',
      description: 'Official Python documentation with tutorials, library references, and language syntax.',
      type: 'documentation'
    }
  ],
  'Node.js': [
    {
      title: 'Node.js and Express.js - Full Course',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      thumbnail: 'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn Node.js and Express from scratch in this 8-hour course.'
    },
    {
      title: 'Node.js Tutorial for Beginners: Learn Node in 1 Hour',
      url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
      thumbnail: 'https://i.ytimg.com/vi/TlB_eWDSMt4/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Node.js tutorial for beginners: Learn Node.js in 1 hour and start building your own web applications.'
    },
    {
      title: 'Node.js Documentation',
      url: 'https://nodejs.org/en/docs/',
      thumbnail: 'https://nodejs.org/static/images/logo-hexagon-card.png',
      author: 'Node.js',
      description: 'Official Node.js documentation with API references, guides, and tutorials.',
      type: 'documentation'
    }
  ],
  'AWS': [
    {
      title: 'AWS Certified Cloud Practitioner Training',
      url: 'https://www.youtube.com/watch?v=3hLmDS179YE',
      thumbnail: 'https://i.ytimg.com/vi/3hLmDS179YE/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Complete AWS Cloud Practitioner certification training course.'
    },
    {
      title: 'AWS Basics for Beginners',
      url: 'https://www.youtube.com/watch?v=ulprqHHWlng',
      thumbnail: 'https://i.ytimg.com/vi/ulprqHHWlng/hqdefault.jpg',
      author: 'TechWorld with Nana',
      description: 'Learn AWS basics and core services for beginners in this comprehensive guide.'
    },
    {
      title: 'AWS Documentation',
      url: 'https://docs.aws.amazon.com/',
      thumbnail: 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
      author: 'Amazon Web Services',
      description: 'Official AWS documentation with service guides, API references, and best practices.',
      type: 'documentation'
    }
  ],
  'Docker': [
    {
      title: 'Docker Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
      thumbnail: 'https://i.ytimg.com/vi/pTFZFxd4hOI/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Learn Docker in 2 hours - Docker tutorial for beginners and intermediate users.'
    },
    {
      title: 'Docker Crash Course for Absolute Beginners',
      url: 'https://www.youtube.com/watch?v=pg19Z8LL06w',
      thumbnail: 'https://i.ytimg.com/vi/pg19Z8LL06w/hqdefault.jpg',
      author: 'TechWorld with Nana',
      description: 'Docker crash course for beginners - learn everything you need to know about Docker.'
    },
    {
      title: 'Docker Documentation',
      url: 'https://docs.docker.com/',
      thumbnail: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png',
      author: 'Docker',
      description: 'Official Docker documentation with guides, references, and examples.',
      type: 'documentation'
    }
  ],
  'Machine Learning': [
    {
      title: 'Machine Learning for Everybody',
      url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
      thumbnail: 'https://i.ytimg.com/vi/i_LwzRVP7bg/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn machine learning concepts in a beginner-friendly way.'
    },
    {
      title: 'Machine Learning with Python',
      url: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
      thumbnail: 'https://i.ytimg.com/vi/7eh4d6sabA0/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Learn machine learning using Python and scikit-learn library.'
    },
    {
      title: 'Machine Learning Documentation',
      url: 'https://scikit-learn.org/stable/user_guide.html',
      thumbnail: 'https://scikit-learn.org/stable/_static/scikit-learn-logo-small.png',
      author: 'Scikit-learn',
      description: 'Scikit-learn machine learning library documentation with guides and tutorials.',
      type: 'documentation'
    }
  ],
  'CSS': [
    {
      title: 'CSS Crash Course For Absolute Beginners',
      url: 'https://www.youtube.com/watch?v=yfoY53QXEnI',
      thumbnail: 'https://i.ytimg.com/vi/yfoY53QXEnI/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'Learn CSS in this complete crash course for beginners.'
    },
    {
      title: 'CSS Tutorial - Zero to Hero (Complete Course)',
      url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
      thumbnail: 'https://i.ytimg.com/vi/1Rs2ND1ryYc/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Complete CSS course covering basics to advanced concepts like Flexbox and Grid.'
    },
    {
      title: 'CSS Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
      thumbnail: 'https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png',
      author: 'MDN Web Docs',
      description: 'Comprehensive CSS documentation with tutorials, references, and examples.',
      type: 'documentation'
    }
  ],
  'HTML': [
    {
      title: 'HTML Crash Course For Absolute Beginners',
      url: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
      thumbnail: 'https://i.ytimg.com/vi/UB1O30fR-EE/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'Learn HTML in this complete crash course for beginners.'
    },
    {
      title: 'HTML Full Course - Build a Website Tutorial',
      url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
      thumbnail: 'https://i.ytimg.com/vi/pQN-pnXPaVg/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn HTML5 and build a complete website in this comprehensive course.'
    },
    {
      title: 'HTML Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
      thumbnail: 'https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png',
      author: 'MDN Web Docs',
      description: 'Complete HTML documentation with elements reference, guides, and tutorials.',
      type: 'documentation'
    }
  ],
  'SQL': [
    {
      title: 'SQL Tutorial - Full Database Course for Beginners',
      url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
      thumbnail: 'https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg',
      author: 'freeCodeCamp',
      description: 'Learn SQL in this complete database course for beginners.'
    },
    {
      title: 'SQL Crash Course - Beginner to Intermediate',
      url: 'https://www.youtube.com/watch?v=nWeW3sCmD2k',
      thumbnail: 'https://i.ytimg.com/vi/nWeW3sCmD2k/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'SQL crash course covering basic to intermediate concepts for database management.'
    },
    {
      title: 'SQL Documentation',
      url: 'https://www.w3schools.com/sql/',
      thumbnail: 'https://www.w3schools.com/favicon.ico',
      author: 'W3Schools',
      description: 'Comprehensive SQL tutorial and reference with examples and exercises.',
      type: 'documentation'
    }
  ],
  'MongoDB': [
    {
      title: 'MongoDB Crash Course',
      url: 'https://www.youtube.com/watch?v=-56x56UppqQ',
      thumbnail: 'https://i.ytimg.com/vi/-56x56UppqQ/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'Learn MongoDB basics in this comprehensive crash course.'
    },
    {
      title: 'MongoDB Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
      thumbnail: 'https://i.ytimg.com/vi/ExcRbA7fy_A/hqdefault.jpg',
      author: 'Academind',
      description: 'Complete MongoDB tutorial covering all the fundamentals you need to know.'
    },
    {
      title: 'MongoDB Documentation',
      url: 'https://docs.mongodb.com/',
      thumbnail: 'https://webimages.mongodb.com/_com_assets/cms/kuyj3d95v5vbmm2fs-horizontal_white.svg?auto=format%252Ccompress',
      author: 'MongoDB',
      description: 'Official MongoDB documentation with guides, tutorials, and reference materials.',
      type: 'documentation'
    }
  ],
  'Git': [
    {
      title: 'Git and GitHub Crash Course For Beginners',
      url: 'https://www.youtube.com/watch?v=SWYqp7iY_Tc',
      thumbnail: 'https://i.ytimg.com/vi/SWYqp7iY_Tc/hqdefault.jpg',
      author: 'Traversy Media',
      description: 'Learn Git and GitHub in this essential crash course for beginners.'
    },
    {
      title: 'Git Tutorial for Beginners',
      url: 'https://www.youtube.com/watch?v=8JJ101D3knE',
      thumbnail: 'https://i.ytimg.com/vi/8JJ101D3knE/hqdefault.jpg',
      author: 'Programming with Mosh',
      description: 'Learn Git fundamentals in this comprehensive tutorial for beginners.'
    },
    {
      title: 'Git Documentation',
      url: 'https://git-scm.com/doc',
      thumbnail: 'https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png',
      author: 'Git',
      description: 'Official Git documentation including the reference manual and Pro Git book.',
      type: 'documentation'
    }
  ]
};

/**
 * Fetch videos from YouTube API
 * @param {string} query - The search query
 * @param {boolean} isPrimaryQuery - Whether this is the primary query or a fallback
 * @returns {Promise<Array>} - Array of video results
 */
const fetchFromYouTubeAPI = async (query, isPrimaryQuery = true) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key is not configured');
    throw new Error('YouTube API key is not configured');
  }
  
  try {
    console.log(`Making YouTube API call for query: "${query}"`);
    
    // First fetch search results
    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: 15, // Fetch more results to filter for the best ones
        q: query,
        type: 'video',
        relevanceLanguage: 'en',
        key: YOUTUBE_API_KEY,
        // Balance between relevance and popularity
        order: isPrimaryQuery ? 'relevance' : 'viewCount'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`YouTube API search response received: ${response.data.items?.length || 0} results`);

    // Extract video IDs
    const videoIds = response.data.items.map(item => item.id.videoId);
    console.log(`Fetching details for ${videoIds.length} videos`);
    
    // Get detailed information about videos including statistics
    const videoDetailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics,snippet',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`YouTube API video details response received: ${videoDetailsResponse.data.items?.length || 0} videos`);

    // Format and enhance results with statistics
    const results = videoDetailsResponse.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail: item.snippet.thumbnails.medium.url,
      author: item.snippet.channelTitle,
      description: item.snippet.description,
      duration: item.contentDetails.duration,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      likeCount: parseInt(item.statistics.likeCount || '0', 10),
      commentCount: parseInt(item.statistics.commentCount || '0', 10),
      publishedAt: item.snippet.publishedAt,
      type: 'video',
      source: 'YouTube',
      // Add metadata for filtering
      isTutorial: isTutorialVideo(item.snippet.title, item.snippet.description),
      isComprehensive: isComprehensiveVideo(item.snippet.title, item.snippet.description),
      isRecent: isRecentVideo(item.snippet.publishedAt)
    }));

    // Filter results to prioritize quality educational content
    let filteredResults = results;
    
    // Try to get high-quality recent tutorials first
    const highQualityTutorials = results.filter(video => 
      video.isTutorial && 
      video.viewCount > 5000 &&
      (video.likeCount / (video.viewCount || 1)) > 0.01 // At least 1% like ratio
    );
    
    if (highQualityTutorials.length >= 3) {
      filteredResults = highQualityTutorials;
    } else {
      // If not enough high-quality tutorials, try any tutorials
      const allTutorials = results.filter(video => video.isTutorial);
      if (allTutorials.length >= 3) {
        filteredResults = allTutorials;
      }
    }

    // Calculate a relevance score for each video based on views, likes, and other factors
    filteredResults.forEach(video => {
      // Calculate engagement rate (likes to views ratio)
      const engagementRate = video.viewCount > 0 ? (video.likeCount / video.viewCount) : 0;
      
      // Calculate recency score (1.0 for recent videos, lower for older ones)
      const ageInDays = getVideoDaysAge(video.publishedAt);
      const recencyScore = Math.max(0, 1 - (ageInDays / 730)); // Higher for newer videos (2 years baseline)
      
      // Calculate a quality score balancing multiple factors
      video.qualityScore = (
        (Math.log10(video.viewCount + 1) * 0.35) +     // View count (logarithmic scale)
        (engagementRate * 100 * 0.35) +                // Engagement rate
        (Math.log10(video.commentCount + 1) * 0.15) +  // Comment count
        (recencyScore * 0.15)                          // Recency factor
      );
      
      // Apply multipliers based on content characteristics
      
      // Boost score for tutorials
      if (video.isTutorial) {
        video.qualityScore *= 1.2;
      }
      
      // Boost score for comprehensive content 
      if (video.isComprehensive) {
        video.qualityScore *= 1.25;
      }
      
      // Boost score for recent content (less than 1 year old)
      if (ageInDays < 365) {
        video.qualityScore *= 1.1;
      }
    });

    // Sort by quality score (highest first)
    filteredResults.sort((a, b) => b.qualityScore - a.qualityScore);

    // Return top 5 results
    const finalResults = filteredResults.slice(0, 5);
    console.log(`Returning ${finalResults.length} filtered YouTube results`);
    return finalResults;
  } catch (error) {
    console.error('Error fetching from YouTube API:', error.response?.data || error.message);
    // Return empty array on error so fallback can be used
    return [];
  }
};

/**
 * Check if a video is likely a tutorial based on title and description
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {boolean} - Whether it's likely a tutorial
 */
const isTutorialVideo = (title, description) => {
  const tutorialKeywords = [
    'tutorial', 'learn', 'course', 'training', 'guide', 'how to',
    'beginner', 'introduction', 'crash course', 'lesson', 'lecture'
  ];
  
  const combinedText = (title + ' ' + description).toLowerCase();
  
  return tutorialKeywords.some(keyword => combinedText.includes(keyword));
};

/**
 * Check if a video is recent (less than 2 years old)
 * @param {string} publishedAt - ISO date string
 * @returns {boolean} - Whether it's a recent video
 */
const isRecentVideo = (publishedAt) => {
  const publishDate = new Date(publishedAt);
  const currentDate = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
  
  return publishDate > twoYearsAgo;
};

/**
 * Get age of video in days
 * @param {string} publishedAt - ISO date string
 * @returns {number} - Age in days
 */
const getVideoDaysAge = (publishedAt) => {
  const publishDate = new Date(publishedAt);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - publishDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a video appears to be comprehensive based on title and description
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {boolean} - Whether it's likely comprehensive
 */
const isComprehensiveVideo = (title, description) => {
  const comprehensiveKeywords = [
    'complete', 'comprehensive', 'full', 'in-depth', 'masterclass',
    'certification', 'from zero to hero', 'bootcamp', 'master'
  ];
  
  const combinedText = (title + ' ' + description).toLowerCase();
  
  return comprehensiveKeywords.some(keyword => combinedText.includes(keyword));
};

/**
 * Format statistics to be more readable
 * Enhances the resources with formatted statistics
 * @param {Array} resources - Array of resources
 * @returns {Array} - Enhanced resources with formatted statistics
 */
const enhanceResourcesWithFormattedStats = (resources) => {
  return resources.map(resource => {
    if (resource.viewCount) {
      // Format view count (e.g., 1,234,567 -> 1.2M)
      resource.formattedViews = formatNumber(resource.viewCount);
      
      // Format like count
      resource.formattedLikes = formatNumber(resource.likeCount);
      
      // Add quality indicator
      if (resource.qualityScore > 15) {
        resource.qualityIndicator = 'Highly Recommended';
      } else if (resource.qualityScore > 10) {
        resource.qualityIndicator = 'Recommended';
      } else if (resource.qualityScore > 5) {
        resource.qualityIndicator = 'Good Resource';
      }
      
      // Format duration from ISO 8601 format
      if (resource.duration) {
        resource.formattedDuration = formatDuration(resource.duration);
      }
    }
    return resource;
  });
};

/**
 * Format a number to a readable string with K, M, B suffixes
 * @param {number} num - The number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format ISO 8601 duration to readable format
 * @param {string} duration - ISO 8601 duration string
 * @returns {string} - Formatted duration
 */
const formatDuration = (duration) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get YouTube course recommendations based on target role
 * @param {string} targetRole - The user's target role
 * @returns {Array} - Array of course recommendations
 */
const getRecommendationsForRole = async (targetRole) => {
  try {
    // Initialize results array to hold role-based recommendations
    let recommendations = [];
    
    // Try to get real recommendations from YouTube API
    if (YOUTUBE_API_KEY) {
      // Craft a query that works well for role recommendations
      const query = `become a ${targetRole} career path`;
      
      // First try getting specific videos for this role
      const apiResults = await fetchFromYouTubeAPI(query, true);
      
      // If we got results from the API, add them to recommendations
      if (apiResults && apiResults.length > 0) {
        recommendations = recommendations.concat(
          enhanceResourcesWithFormattedStats(apiResults)
        );
      }
    }
    
    // Get Coursera courses for this role
    try {
      // Use a modified query to find better Coursera results
      const courseraQuery = `${targetRole} career path`;
      const courseraResults = await courseraService.searchCoursera(courseraQuery);
      
      if (courseraResults && courseraResults.length > 0) {
        recommendations = recommendations.concat(courseraResults);
      }
    } catch (courseraError) {
      console.error('Error fetching Coursera role recommendations:', courseraError);
      // Continue with what we have
    }
    
    // If we have enough recommendations, return them
    if (recommendations.length > 0) {
      return labelResourcesBySource(recommendations);
    }
    
    // If we don't have any recommendations, use role-based fallback
    console.log(`No API results found for role: ${targetRole}, using role-based fallback resources`);
    const fallbackRoleResources = roleBasedCourses[targetRole] || 
      getFallbackResources(`${targetRole} career path`, 5);
    return fallbackRoleResources;
    
  } catch (error) {
    console.error('Error getting role recommendations:', error);
    // Return role-based fallback resources when there's an error
    console.log(`Error occurred for role: ${targetRole}, using fallback resources`);
    const fallbackRoleResources = roleBasedCourses[targetRole] || 
      getFallbackResources(`${targetRole} career path`, 5);
    return fallbackRoleResources;
  }
};

/**
 * Get YouTube course recommendations based on skill
 * @param {string} skillName - The skill name
 * @returns {Array} - Array of course recommendations
 */
const getRecommendationsForSkill = async (skillName) => {
  try {
    // Initialize results array to hold combined recommendations
    let recommendations = [];
    
    // Extract keywords from skill name for better matching
    const normalizedSkill = skillName.toLowerCase().trim();
    const skillKeywords = normalizedSkill.split(/\s+/).filter(word => 
      word.length > 2 && !['and', 'for', 'the', 'with'].includes(word)
    );
    
    // Determine if this is a compound skill
    const isCompoundSkill = skillKeywords.length > 1;
    
    // Special handling for RESTful APIs
    const isRestApi = normalizedSkill.includes('rest') && normalizedSkill.includes('api');
    
    // Use specific queries based on skill
    let queryAttempts = [normalizedSkill];
    
    // Add tutorial-specific queries
    queryAttempts.push(`${normalizedSkill} tutorial`);
    queryAttempts.push(`learn ${normalizedSkill}`);
    
    // Special case for Git
    if (normalizedSkill.includes('git') || normalizedSkill.includes('version control')) {
      queryAttempts = [
        'git version control tutorial',
        'git basics',
        'github tutorial for beginners'
      ];
    }
    
    // Special case for RESTful APIs
    if (isRestApi) {
      queryAttempts = [
        'restful api tutorial',
        'rest api design',
        'api development best practices'
      ];
    }
    
    // Try to get YouTube recommendations first, then fallback to curated resources
  try {
    // Try to get real recommendations from YouTube API
    if (YOUTUBE_API_KEY) {
      console.log(`Attempting YouTube API calls for skill: ${skillName}`);
      
      // Try each query in the queryAttempts array
      for (const query of queryAttempts) {
        console.log(`Trying YouTube query: "${query}"`);
        const apiResults = await fetchFromYouTubeAPI(query, true);
        
        if (apiResults && apiResults.length > 0) {
          console.log(`YouTube API returned ${apiResults.length} results for "${query}"`);
          
          // Filter for relevance and add them to recommendations
          const relevantResults = apiResults.filter(resource => {
            const title = (resource.title || '').toLowerCase();
            const description = (resource.description || '').toLowerCase();
            const content = title + ' ' + description;
            
            // Special handling for REST APIs
            if (isRestApi) {
              return content.includes('rest') && content.includes('api');
            }
            
            // For compound skills, require all significant keywords to be present
            if (isCompoundSkill) {
              return skillKeywords.every(keyword => content.includes(keyword));
            }
            
            // For single keyword skills, just check if one keyword is included
            return skillKeywords.some(keyword => content.includes(keyword));
          });
          
          if (relevantResults.length > 0) {
            console.log(`Found ${relevantResults.length} relevant results from YouTube`);
            recommendations = recommendations.concat(
              enhanceResourcesWithFormattedStats(relevantResults)
            );
            break; // Stop on first successful query
          } else {
            console.log(`No relevant results found for "${query}", trying next query...`);
          }
        } else {
          console.log(`No results from YouTube API for "${query}"`);
        }
      }
      
      // If no YouTube results found, use fallback resources
      if (recommendations.length === 0) {
        console.log('No YouTube results found, using curated fallback resources');
        const skillResources = getFallbackResources(skillName, 3);
        if (skillResources && skillResources.length > 0) {
          recommendations = recommendations.concat(skillResources);
        }
      }
    } else {
      console.warn('YouTube API key not available, using curated resources');
      const skillResources = getFallbackResources(skillName, 5);
      if (skillResources && skillResources.length > 0) {
        recommendations = recommendations.concat(skillResources);
      }
    }
  } catch (youtubeError) {
    console.error('Error fetching YouTube recommendations:', youtubeError);
    // Fallback to curated resources on error
    console.log('Using fallback resources due to YouTube API error');
    const skillResources = getFallbackResources(skillName, 5);
    if (skillResources && skillResources.length > 0) {
      recommendations = recommendations.concat(skillResources);
    }
  }
    
    // Add Coursera courses to recommendations
    try {
      const courseraResults = await courseraService.getCoursesForSkill(skillName);
      
      if (courseraResults && courseraResults.length > 0) {
        // Apply relevance filtering to Coursera results
        const relevantCourseraResults = courseraResults.filter(resource => {
          const title = (resource.title || '').toLowerCase();
          const description = (resource.description || '').toLowerCase();
          
          // Check if the course content is relevant to the skill
          return skillKeywords.some(keyword => 
            title.includes(keyword) || description.includes(keyword)
          );
        });
        
        if (relevantCourseraResults.length > 0) {
          recommendations = recommendations.concat(relevantCourseraResults);
        }
      }
          } catch (courseraError) {
      console.error('Error fetching Coursera recommendations:', courseraError);
      // Continue with what we have
    }
    
    // If we don't have any recommendations at this point, use fallback resources
    if (recommendations.length === 0) {
      console.log(`No API results found for skill: ${skillName}, using fallback resources`);
      const fallbackResources = getFallbackResources(skillName, 5);
      recommendations = fallbackResources;
    }
    
    // Categorize and label resources by their source
    recommendations = labelResourcesBySource(recommendations);
    
    return recommendations;
  } catch (error) {
    console.error('Error getting skill recommendations:', error);
    // Return fallback resources when there's an error
    console.log(`Error occurred for skill: ${skillName}, using fallback resources`);
    return getFallbackResources(skillName, 5);
  }
};

/**
 * Label resources by their source (YouTube, Coursera, etc.)
 * @param {Array} resources - Array of learning resources
 * @returns {Array} - Array of labeled resources
 */
const labelResourcesBySource = (resources) => {
  return resources.map(resource => {
    // If source is already specified, keep it
    if (resource.source) {
      return resource;
    }
    
    // Otherwise determine source based on URL or other properties
    if (resource.url && resource.url.includes('youtube.com')) {
      return { ...resource, source: 'YouTube' };
    } else if (resource.url && resource.url.includes('coursera.org')) {
      return { ...resource, source: 'Coursera' };
    } else if (resource.type === 'documentation') {
      return { ...resource, source: 'Documentation' };
    } else {
      return { ...resource, source: 'web' };
    }
  });
};

/**
 * Generate dynamic resources for skills not in our predefined list
 * @param {string} skillName - The skill name
 * @returns {Array} - Array of generated resources
 */
const generateDynamicResources = (skillName) => {
  // Return empty array instead of generating dynamic resources
  return [];
};

/**
 * Search for learning resources across multiple platforms
 * @param {string} query - The search query 
 * @returns {Promise<Array>} - Array of search results
 */
const searchYouTube = async (query, maxResults = 10) => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API Key not configured, returning fallback resources');
      return getFallbackResources(query, maxResults);
    }

    console.log(`Searching YouTube for: "${query}" with maxResults: ${maxResults}`);

    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults,
        order: 'relevance',
        key: YOUTUBE_API_KEY
      },
      timeout: 10000
    });

    console.log(`YouTube search returned ${response.data.items?.length || 0} results`);

    if (!response.data.items || response.data.items.length === 0) {
      console.warn('No YouTube results found, returning fallback resources');
      return getFallbackResources(query, maxResults);
    }

    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    
    const videoDetailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: 'statistics,contentDetails',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    return response.data.items.map((item, index) => {
      const videoDetails = videoDetailsResponse.data.items[index];
      const statistics = videoDetails?.statistics || {};
      const contentDetails = videoDetails?.contentDetails || {};

      return {
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        description: item.snippet.description,
        author: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        type: 'video',
        source: 'YouTube',
        viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : 0,
        likeCount: statistics.likeCount ? parseInt(statistics.likeCount) : 0,
        duration: contentDetails.duration ? parseDuration(contentDetails.duration) : '',
        formattedViews: formatViewCount(statistics.viewCount),
        formattedLikes: formatViewCount(statistics.likeCount),
        formattedDuration: contentDetails.duration ? formatDuration(contentDetails.duration) : '',
        qualityIndicator: determineQualityIndicator(statistics)
      };
    });

  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    console.warn('Falling back to curated resources due to API error');
    return getFallbackResources(query, maxResults);
  }
};

/**
 * Get fallback resources when YouTube API is not available
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Array} - Array of fallback learning resources
 */
const getFallbackResources = (query, maxResults = 10) => {
  const normalizedQuery = query.toLowerCase();
  
  // Comprehensive fallback resources organized by technology
  const fallbackResourcesDB = {
    javascript: [
      {
        title: "JavaScript Full Course for Beginners | Complete All-in-One Tutorial",
        url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
        author: "Dave Gray",
        description: "Learn modern JavaScript from the very beginning. This tutorial covers variables, functions, objects, classes, and more.",
        thumbnail: "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "2.1M+",
        formattedDuration: "8:22:03",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Learn JavaScript - Full Course for Beginners",
        url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
        author: "freeCodeCamp.org",
        description: "This complete 134-part JavaScript tutorial for beginners will teach you everything you need to know to get started with the JavaScript programming language.",
        thumbnail: "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "8.2M+",
        formattedDuration: "3:26:42",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "MDN Web Docs - JavaScript",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        author: "Mozilla",
        description: "Comprehensive JavaScript documentation and learning resources from Mozilla Developer Network.",
        thumbnail: "https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    python: [
      {
        title: "Python for Beginners - Full Course",
        url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        author: "freeCodeCamp",
        description: "Learn Python basics in this comprehensive course for beginners.",
        thumbnail: "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "4.5M+",
        formattedDuration: "4:26:51",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Python Tutorial - Python Full Course for Beginners",
        url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
        author: "Programming with Mosh",
        description: "Python tutorial for beginners - Learn Python for machine learning and web development.",
        thumbnail: "https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "23M+",
        formattedDuration: "6:14:07",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Python Documentation",
        url: "https://docs.python.org/3/",
        author: "Python.org",
        description: "Official Python documentation with tutorials, library references, and language syntax.",
        thumbnail: "https://www.python.org/static/opengraph-icon-200x200.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    react: [
      {
        title: "React Course - Beginner's Tutorial for React JavaScript Library",
        url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
        author: "freeCodeCamp.org",
        description: "Learn React JS in this full course for beginners. Work with components, props, state, hooks, and more.",
        thumbnail: "https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "5.8M+",
        formattedDuration: "11:55:27",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "React Documentation",
        url: "https://react.dev/",
        author: "React Team",
        description: "Official React documentation with guides, API reference, and interactive tutorials.",
        thumbnail: "https://react.dev/images/og-home.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    nodejs: [
      {
        title: "Node.js Tutorial for Beginners: Learn Node in 1 Hour",
        url: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
        author: "Programming with Mosh",
        description: "Node.js tutorial for beginners - Learn the basics of Node.js in this crash course.",
        thumbnail: "https://i.ytimg.com/vi/TlB_eWDSMt4/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "3.2M+",
        formattedDuration: "1:08:35",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Node.js Documentation",
        url: "https://nodejs.org/en/docs/",
        author: "Node.js Foundation",
        description: "Official Node.js documentation with API reference, guides, and best practices.",
        thumbnail: "https://nodejs.org/static/images/logo-hexagon-card.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    html: [
      {
        title: "HTML Full Course - Build a Website Tutorial",
        url: "https://www.youtube.com/watch?v=pQN-pnXPaVg",
        author: "freeCodeCamp.org",
        description: "Learn HTML in this complete course for beginners. Build a complete website from scratch.",
        thumbnail: "https://i.ytimg.com/vi/pQN-pnXPaVg/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "2.8M+",
        formattedDuration: "2:04:49",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "MDN Web Docs - HTML",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
        author: "Mozilla",
        description: "Comprehensive HTML documentation and learning resources.",
        thumbnail: "https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    css: [
      {
        title: "CSS Tutorial - Zero to Hero (Complete Course)",
        url: "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
        author: "freeCodeCamp.org",
        description: "Learn CSS from scratch in this complete course. Master layouts, animations, and responsive design.",
        thumbnail: "https://i.ytimg.com/vi/1Rs2ND1ryYc/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "1.9M+",
        formattedDuration: "11:29:54",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "MDN Web Docs - CSS",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
        author: "Mozilla",
        description: "Complete CSS documentation with guides, references, and examples.",
        thumbnail: "https://developer.mozilla.org/mdn-social-share.cd6c4a5a.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    java: [
      {
        title: "Java Programming Tutorial for Beginners",
        url: "https://www.youtube.com/watch?v=eIrMbAQSU34",
        author: "Programming with Mosh",
        description: "Learn Java programming from scratch in this comprehensive guide for beginners.",
        thumbnail: "https://i.ytimg.com/vi/eIrMbAQSU34/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "5.2M+",
        formattedDuration: "2:30:45",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Java Full Course 2024",
        url: "https://www.youtube.com/watch?v=CFD9EFcNZTQ",
        author: "freeCodeCamp.org",
        description: "Complete Java course covering core concepts, OOP, and advanced features.",
        thumbnail: "https://i.ytimg.com/vi/CFD9EFcNZTQ/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "1.8M+",
        formattedDuration: "12:00:00",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Oracle Java Documentation",
        url: "https://docs.oracle.com/en/java/",
        author: "Oracle",
        description: "Official Java documentation with tutorials, API references, and best practices.",
        thumbnail: "https://www.oracle.com/a/ocom/img/rc24/java-logo-vert-blk.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    git: [
      {
        title: "Git and GitHub for Beginners - Crash Course",
        url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
        author: "freeCodeCamp.org",
        description: "Learn Git and GitHub in this complete crash course for beginners.",
        thumbnail: "https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "2.1M+",
        formattedDuration: "1:08:47",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Git Tutorial for Beginners: Learn Git in 1 Hour",
        url: "https://www.youtube.com/watch?v=8JJ101D3knE",
        author: "Programming with Mosh",
        description: "Complete Git tutorial for beginners - master version control.",
        thumbnail: "https://i.ytimg.com/vi/8JJ101D3knE/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "3.4M+",
        formattedDuration: "1:09:13",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Git Documentation",
        url: "https://git-scm.com/docs",
        author: "Git Team",
        description: "Official Git documentation with commands, tutorials, and best practices.",
        thumbnail: "https://git-scm.com/images/logo@2x.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    sql: [
      {
        title: "SQL Tutorial - Full Database Course for Beginners",
        url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
        author: "freeCodeCamp.org",
        description: "Learn SQL and database management in this comprehensive course for beginners.",
        thumbnail: "https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "9.8M+",
        formattedDuration: "4:20:44",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "MySQL Tutorial for Beginners",
        url: "https://www.youtube.com/watch?v=7S_tz1z_5bA",
        author: "Programming with Mosh",
        description: "Learn MySQL database management from scratch.",
        thumbnail: "https://i.ytimg.com/vi/7S_tz1z_5bA/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "4.2M+",
        formattedDuration: "3:10:47",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "W3Schools SQL Tutorial",
        url: "https://www.w3schools.com/sql/",
        author: "W3Schools",
        description: "Comprehensive SQL tutorial with examples and exercises.",
        thumbnail: "https://www.w3schools.com/images/w3schools_logo_436_2.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    docker: [
      {
        title: "Docker Tutorial for Beginners - A Full DevOps Course",
        url: "https://www.youtube.com/watch?v=3c-iBn73dDE",
        author: "TechWorld with Nana",
        description: "Learn Docker from scratch in this comprehensive DevOps course.",
        thumbnail: "https://i.ytimg.com/vi/3c-iBn73dDE/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "5.1M+",
        formattedDuration: "2:31:58",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "Docker Documentation",
        url: "https://docs.docker.com/",
        author: "Docker Inc.",
        description: "Official Docker documentation with guides, references, and tutorials.",
        thumbnail: "https://docs.docker.com/assets/images/docs@2x.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ],
    mongodb: [
      {
        title: "MongoDB Complete Course",
        url: "https://www.youtube.com/watch?v=c2M-rlkkT5o",
        author: "Bogdan Stashchuk",
        description: "Learn MongoDB database from scratch with hands-on examples.",
        thumbnail: "https://i.ytimg.com/vi/c2M-rlkkT5o/hqdefault.jpg",
        type: "video",
        source: "YouTube",
        formattedViews: "1.2M+",
        formattedDuration: "8:44:49",
        qualityIndicator: "Highly Recommended"
      },
      {
        title: "MongoDB Documentation",
        url: "https://docs.mongodb.com/",
        author: "MongoDB Inc.",
        description: "Official MongoDB documentation with tutorials and API references.",
        thumbnail: "https://webassets.mongodb.com/_com_assets/cms/mongodb_logo1-76twgcu2dm.png",
        type: "documentation",
        source: "Documentation",
        qualityIndicator: "Essential"
      }
    ]
  };

  // Add more technologies as needed
  const defaultTech = [
    {
      title: "Complete Web Development Course - HTML, CSS, JavaScript",
      url: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
      author: "freeCodeCamp.org",
      description: "Learn web development from scratch with HTML, CSS, and JavaScript in this comprehensive course.",
      thumbnail: "https://i.ytimg.com/vi/nu_pCVPKzTk/hqdefault.jpg",
      type: "video",
      source: "YouTube",
      formattedViews: "1.8M+",
      formattedDuration: "4:11:05",
      qualityIndicator: "Recommended"
    },
    {
      title: "Programming Tutorial Documentation",
      url: "https://www.w3schools.com/",
      author: "W3Schools",
      description: "Free tutorials and references for web development technologies.",
      thumbnail: "https://www.w3schools.com/images/w3schools_logo_436_2.png",
      type: "documentation",
      source: "Documentation",
      qualityIndicator: "Helpful"
    }
  ];

  // Find matching resources based on query
  let matchedResources = [];
  
  // Check for specific technology matches (more flexible matching)
  for (const [tech, resources] of Object.entries(fallbackResourcesDB)) {
    // Check for partial matches and common variations
    const techVariations = [tech];
    
    // Add common variations
    if (tech === 'javascript') techVariations.push('js', 'ecmascript');
    if (tech === 'python') techVariations.push('py');
    if (tech === 'java') techVariations.push('java core', 'jdk');
    if (tech === 'nodejs') techVariations.push('node.js', 'node js', 'express');
    if (tech === 'react') techVariations.push('reactjs', 'react.js');
    if (tech === 'git') techVariations.push('github', 'version control');
    if (tech === 'sql') techVariations.push('mysql', 'postgresql', 'database');
    if (tech === 'mongodb') techVariations.push('mongo', 'nosql');
    
    // Check if query matches any variation
    const isMatch = techVariations.some(variation => 
      normalizedQuery.includes(variation) || 
      variation.includes(normalizedQuery) ||
      normalizedQuery.replace(/\s+/g, '').includes(variation.replace(/\s+/g, ''))
    );
    
    if (isMatch) {
      matchedResources = [...matchedResources, ...resources];
      break; // Return first match to avoid duplicates
    }
  }

  // If no specific matches found, use default
  if (matchedResources.length === 0) {
    // Try to provide relevant default based on context
    if (normalizedQuery.includes('web') || normalizedQuery.includes('frontend')) {
      matchedResources = [...fallbackResourcesDB.javascript, ...fallbackResourcesDB.html, ...fallbackResourcesDB.css].slice(0, 3);
    } else if (normalizedQuery.includes('backend') || normalizedQuery.includes('server')) {
      matchedResources = [...fallbackResourcesDB.nodejs, ...fallbackResourcesDB.python, ...fallbackResourcesDB.java].slice(0, 3);
    } else if (normalizedQuery.includes('database') || normalizedQuery.includes('data')) {
      matchedResources = [...fallbackResourcesDB.sql, ...fallbackResourcesDB.mongodb].slice(0, 3);
    } else {
      matchedResources = defaultTech;
    }
  }

  return matchedResources.slice(0, maxResults);
};

/**
 * Format view count for display
 * @param {string|number} viewCount - Raw view count
 * @returns {string} - Formatted view count
 */
const formatViewCount = (viewCount) => {
  if (!viewCount) return '';
  
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M+';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K+';
  }
  return count.toString();
};

/**
 * Parse ISO 8601 duration to readable format
 * @param {string} duration - ISO 8601 duration string
 * @returns {string} - Formatted duration
 */
const parseDuration = (duration) => {
  if (!duration) return '';
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';
  
  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
  const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Determine quality indicator based on statistics
 * @param {object} statistics - Video statistics
 * @returns {string} - Quality indicator
 */
const determineQualityIndicator = (statistics) => {
  if (!statistics || !statistics.viewCount) {
    return 'New';
  }
  
  const views = parseInt(statistics.viewCount);
  const likes = parseInt(statistics.likeCount || '0');
  
  const likeRatio = views > 0 ? (likes / views) : 0;
  
  if (views > 1000000 && likeRatio > 0.01) {
    return 'Highly Recommended';
  } else if (views > 100000 && likeRatio > 0.005) {
    return 'Recommended';
  } else if (views > 10000) {
    return 'Popular';
  } else {
    return 'New';
  }
};

module.exports = {
  getRecommendationsForRole,
  getRecommendationsForSkill,
  searchYouTube,
  labelResourcesBySource
}; 