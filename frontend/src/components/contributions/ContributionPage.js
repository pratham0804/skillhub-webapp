import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Fade,
  Slide,
  Zoom,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Code as CodeIcon,
  Build as BuildIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import SkillContributionForm from './SkillContributionForm';
import ToolContributionForm from './ToolContributionForm';
import './ContributionPage.css';

// Import the contribution image - updated to use new image
let contributionImage;
try {
  contributionImage = require('../../assets/images/3046755_32621.jpg');
} catch (error) {
  // Fallback to existing images if the specific one isn't found
  try {
    contributionImage = require('../../assets/images/Multi-device targeting-amico.png');
  } catch (fallbackError) {
    contributionImage = require('../../assets/images/5911565_2953998.jpg');
  }
}

// Advanced animations
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-5px) rotate(0deg); }
  75% { transform: translateY(-15px) rotate(-1deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(79, 70, 229, 0.4), 0 0 40px rgba(79, 70, 229, 0.2), 0 0 60px rgba(79, 70, 229, 0.1);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(79, 70, 229, 0.6), 0 0 60px rgba(79, 70, 229, 0.4), 0 0 90px rgba(79, 70, 229, 0.2);
    transform: scale(1.02);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const bounceIn = keyframes`
  0% { 
    opacity: 0;
    transform: scale(0.3) translateY(100px);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05) translateY(-10px);
  }
  70% { 
    transform: scale(0.9) translateY(0px);
  }
  100% { 
    opacity: 1;
    transform: scale(1) translateY(0px);
  }
`;

const slideInFromLeft = keyframes`
  0% { 
    opacity: 0;
    transform: translateX(-100px);
  }
  100% { 
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInFromRight = keyframes`
  0% { 
    opacity: 0;
    transform: translateX(100px);
  }
  100% { 
    opacity: 1;
    transform: translateX(0);
  }
`;

// Styled components with advanced animations
const HeroContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '60vh',
  display: 'flex',
  alignItems: 'center',
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}08 0%, 
    ${theme.palette.secondary.main}08 50%,
    ${theme.palette.primary.main}05 100%)`,
  borderRadius: '20px',
  margin: '40px 0 20px 0',
  overflow: 'hidden',
}));

const AnimatedImage = styled('img')(({ theme, removeBackground = true }) => ({
  width: '100%',
  maxWidth: '500px',
  height: 'auto',
  borderRadius: '20px',
  animation: `${floatAnimation} 6s ease-in-out infinite`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  filter: removeBackground 
    ? 'drop-shadow(0 20px 40px rgba(79, 70, 229, 0.3)) contrast(1.2) brightness(0.92)'
    : 'drop-shadow(0 20px 40px rgba(79, 70, 229, 0.3))',
  position: 'relative',
  zIndex: 2,
  // Background removal techniques
  mixBlendMode: removeBackground ? 'multiply' : 'normal',
  background: 'transparent',
  // Remove white/light backgrounds with CSS masking
  ...(removeBackground && {
    WebkitMask: 'radial-gradient(ellipse 80% 70% at center, black 65%, transparent 85%)',
    mask: 'radial-gradient(ellipse 80% 70% at center, black 65%, transparent 85%)',
  }),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: removeBackground 
      ? 'radial-gradient(circle, transparent 50%, rgba(255,255,255,0.05) 100%)'
      : 'transparent',
    borderRadius: '20px',
    zIndex: -1,
  },
  '&:hover': {
    transform: 'scale(1.05) translateY(-10px)',
    filter: removeBackground
      ? 'drop-shadow(0 30px 60px rgba(79, 70, 229, 0.5)) contrast(1.1) brightness(1.05) saturate(1.1)'
      : 'drop-shadow(0 30px 60px rgba(79, 70, 229, 0.5)) contrast(1.1) brightness(1.05)',
    animation: `${pulseGlow} 2s ease-in-out infinite`,
    mixBlendMode: 'normal', // Always normal on hover for full visibility
    WebkitMask: 'none', // Remove mask on hover
    mask: 'none',
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '8px',
  margin: '40px 0',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  '& .MuiTabs-indicator': {
    height: '100%',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    zIndex: 1,
    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',
    color: theme.palette.text.secondary,
    borderRadius: '12px',
    zIndex: 2,
    position: 'relative',
    minHeight: '56px',
    margin: '4px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      color: theme.palette.primary.main,
    },
    '&.Mui-selected': {
      color: 'white',
      fontWeight: 700,
    }
  }
}));

const StatsCard = styled(Card)(({ theme, delay = 0 }) => ({
  background: `linear-gradient(135deg, 
    rgba(255,255,255,0.9) 0%, 
    rgba(255,255,255,0.7) 100%)`,
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '20px',
  padding: '24px',
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${bounceIn} 0.8s ease-out ${delay}s both`,
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(79, 70, 229, 0.2)',
    background: `linear-gradient(135deg, 
      rgba(255,255,255,1) 0%, 
      rgba(255,255,255,0.9) 100%)`,
  }
}));

const AnimatedTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  textAlign: 'center',
  marginBottom: '24px',
  animation: `${slideInFromLeft} 1s ease-out`,
  position: 'relative',
  // Updated to match the exact blue color from "Level Up Your" 
  color: '#3b82f6', // Same bright blue color as "Level Up Your"
  // Enhanced styling for better visibility
  textShadow: 'none',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100px',
    height: '4px',
    background: `linear-gradient(135deg, #4c1d95, #6d28d9)`,
    borderRadius: '2px',
    animation: `${slideInFromRight} 1s ease-out 0.5s both`,
  },
  // Gradient for the highlight span - exactly matching home page
  '& .highlight-gradient': {
    background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  }
}));

const FloatingIcon = styled(IconButton)(({ theme, delay = 0 }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white',
  width: '60px',
  height: '60px',
  margin: '8px',
  boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05) translateY(-2px)',
    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.4)',
    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  }
}));

const ContributionPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const stats = [
    { icon: <PeopleIcon />, count: '2,500+', label: 'Contributors', color: '#4f46e5' },
    { icon: <CodeIcon />, count: '15,000+', label: 'Skills Added', color: '#10b981' },
    { icon: <BuildIcon />, count: '3,200+', label: 'Tools Shared', color: '#f59e0b' },
    { icon: <TrophyIcon />, count: '500+', label: 'Achievements', color: '#ef4444' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, 
        ${theme.palette.background.default} 0%, 
        ${theme.palette.primary.main}05 50%,
        ${theme.palette.secondary.main}05 100%)`,
      py: 6,
      pt: 8
    }}>
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Fade in={isVisible} timeout={1000}>
          <HeroContainer>
            <Container maxWidth="lg">
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 500px' },
                gap: 6,
                alignItems: 'center',
                py: 6
              }}>
                {/* Left Content */}
                <Box>
                  <AnimatedTitle variant={isMobile ? 'h3' : 'h2'}>
                    Shape the Future of <span className="highlight-gradient">Tech Learning</span>
                  </AnimatedTitle>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 4, 
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      animation: `${slideInFromLeft} 1s ease-out 0.3s both`
                    }}
                  >
                    Join our global community of developers and contribute your knowledge to help millions 
                    of learners discover new skills and tools. Every contribution matters! 🚀
                  </Typography>

                  {/* Call to Action Chips */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexWrap: 'wrap',
                    animation: `${slideInFromLeft} 1s ease-out 0.9s both`
                  }}>
                    <Chip
                      icon={<SparkleIcon />}
                      label="Easy to Contribute"
                      color="primary"
                      variant="filled"
                      sx={{ 
                        px: 1,
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)',
                        }
                      }}
                    />
                    <Chip
                      icon={<TrendingUpIcon />}
                      label="Instant Impact"
                      color="secondary"
                      variant="filled"
                      sx={{ 
                        px: 1,
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Right Content - Animated Image */}
                <Zoom in={isVisible} timeout={1200}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <AnimatedImage
                      src={contributionImage}
                      alt="Community Contribution Illustration - People collaborating with technology"
                      className="community-image-clean image-background-removal"
                      removeBackground={true}
                      onError={(e) => {
                        console.log('Main image not found, falling back to existing image');
                        // Keep the image visible but show fallback
                        if (e.target.src.includes('3046755_32621.jpg')) {
                          console.log('📁 To see your custom image: Place 3046755_32621.jpg in frontend/src/assets/images/');
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ Image loaded successfully with background removal!');
                      }}
                    />
                  </Box>
                </Zoom>
              </Box>
            </Container>
          </HeroContainer>
        </Fade>



        {/* Tabs Section */}
        <Fade in={isVisible} timeout={2000}>
          <Paper 
            elevation={0}
            sx={{ 
              background: 'transparent',
              borderRadius: '24px',
              overflow: 'hidden'
            }}
          >
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              centered
              variant={isMobile ? "fullWidth" : "standard"}
            >
              <Tab 
                icon={<CodeIcon />} 
                label="Contribute a Skill" 
                iconPosition="start"
                sx={{ px: 4 }}
              />
              <Tab 
                icon={<BuildIcon />} 
                label="Contribute a Tool" 
                iconPosition="start"
                sx={{ px: 4 }}
              />
            </StyledTabs>

            {/* Tab Content with Smooth Transitions */}
            <Box sx={{ mt: 4 }}>
              <Slide 
                direction={activeTab === 0 ? "right" : "left"} 
                in={true} 
                timeout={500}
                key={activeTab}
              >
                <div>
                  {activeTab === 0 ? (
                    <SkillContributionForm />
                  ) : (
                    <ToolContributionForm />
                  )}
                </div>
              </Slide>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ContributionPage; 