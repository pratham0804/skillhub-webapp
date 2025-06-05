import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Fade,
  Slide,
  Zoom,
  Alert,
  CircularProgress,
  Backdrop,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Rating
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Work as WorkIcon,
  LocationOn as LocationOnIcon,
  Language as LanguageIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';

// Custom theme with modern styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
      light: '#6366f1',
      dark: '#3730a3',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// Styled components for enhanced UI
const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
  },
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
}));

const GradientBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 'inherit',
  },
}));

const SkillChip = styled(Chip)(({ theme, level }) => {
  const colors = {
    Beginner: { bg: '#e0e7ff', color: '#4338ca' },      // Indigo theme
    Intermediate: { bg: '#dbeafe', color: '#2563eb' },  // Blue theme
    Advanced: { bg: '#d1fae5', color: '#059669' },      // Emerald theme
    Expert: { bg: '#ede9fe', color: '#7c3aed' },        // Purple theme
  };
  
  return {
    backgroundColor: colors[level]?.bg || '#f3f4f6',
    color: colors[level]?.color || '#6b7280',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  };
});

// Skeleton Loading Component
const DuplicateSkeletonCard = ({ height = 120 }) => (
  <Box
    sx={{
      height,
      borderRadius: '12px',
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      '@keyframes skeleton-loading': {
        '0%': { backgroundPosition: '200% 0' },
        '100%': { backgroundPosition: '-200% 0' }
      }
    }}
  />
);

const SkeletonProfile = () => (
  <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
    {/* Skeleton Cover & Header */}
    <Box sx={{ mb: 4 }}>
      <DuplicateSkeletonCard height={240} />
      <Box sx={{ 
        p: 4, 
        mt: -2, 
        borderRadius: '12px', 
        background: 'white',
        border: '1px solid #e2e8f0'
      }}>
        <Grid container spacing={4} alignItems="center" sx={{ pl: 20 }}>
          <Grid item xs>
            <SkeletonCard height={32} />
            <Box sx={{ mt: 2 }}>
              <SkeletonCard height={24} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <SkeletonCard height={16} />
            </Box>
          </Grid>
          <Grid item>
            <SkeletonCard height={48} />
          </Grid>
        </Grid>
      </Box>
    </Box>

    {/* Skeleton Tabs */}
    <SkeletonCard height={64} />

    {/* Skeleton Content */}
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <SkeletonCard height={200} />
          <Box sx={{ mt: 3 }}>
            <SkeletonCard height={150} />
          </Box>
        </Grid>
        <Grid item xs={12} lg={4}>
          <SkeletonCard height={180} />
          <Box sx={{ mt: 3 }}>
            <SkeletonCard height={120} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  </Container>
);

// Enhanced Styled Components with better animations
const PulseButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    transition: 'all 0.5s ease',
    transform: 'translate(-50%, -50%)',
  },
  '&:hover::before': {
    width: '300px',
    height: '300px',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const FloatingCard = styled(AnimatedCard)(({ theme }) => ({
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  transformOrigin: 'center',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '& .floating-content': {
      transform: 'translateY(-2px)',
    },
  },
}));

const GlowingChip = styled(Chip)(({ theme, glowcolor }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  backgroundColor: `${glowcolor}15`,
  color: glowcolor,
  border: `1px solid ${glowcolor}30`,
  fontWeight: 500,
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    backgroundColor: `${glowcolor}25`,
    border: `1px solid ${glowcolor}60`,
    boxShadow: `0 8px 25px ${glowcolor}40, 0 0 0 1px ${glowcolor}20`,
    color: glowcolor,
    '& .MuiChip-deleteIcon': {
      color: `${glowcolor}`,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        color: theme.palette.error.main,
      }
    }
  },
  '& .MuiChip-deleteIcon': {
    color: `${glowcolor}80`,
    transition: 'all 0.2s ease',
    '&:hover': {
      color: theme.palette.error.main,
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '50%'
    }
  }
}));

const EnhancedSkillChip = styled(Chip)(({ theme, skillcolor, proficiency }) => {
  const proficiencyColors = {
    Beginner: { bg: '#e0e7ff', color: '#4338ca', border: '#6366f1' },      // Indigo theme
    Intermediate: { bg: '#dbeafe', color: '#2563eb', border: '#3b82f6' },  // Blue theme  
    Advanced: { bg: '#d1fae5', color: '#059669', border: '#10b981' },      // Emerald theme
    Expert: { bg: '#ede9fe', color: '#7c3aed', border: '#8b5cf6' },        // Purple theme
  };
  
  const colors = proficiencyColors[proficiency] || proficiencyColors.Intermediate;
  
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}30`,
    fontWeight: 500,
    fontSize: '14px',
    height: 40,
    px: 2,
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&::after': {
      content: `"${proficiency}"`,
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.border,
      color: 'white',
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '8px',
      lineHeight: 1,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    '&:hover': {
      transform: 'translateY(-3px) scale(1.02)',
      backgroundColor: colors.color,
      color: 'white',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 8px 25px ${colors.border}40, 0 0 0 1px ${colors.border}20`,
      '&::after': {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: colors.color,
      },
      '& .MuiChip-deleteIcon': {
        color: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        '&:hover': {
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          color: '#fff',
        }
      }
    },
    '& .MuiChip-deleteIcon': {
      color: `${colors.border}80`,
      transition: 'all 0.2s ease',
      '&:hover': {
        color: theme.palette.error.main,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: '50%'
      }
    }
  };
});

// Skeleton Loading Component
const SkeletonCard = ({ height = 120 }) => (
  <Box
    sx={{
      height,
      borderRadius: '12px',
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      '@keyframes skeleton-loading': {
        '0%': { backgroundPosition: '200% 0' },
        '100%': { backgroundPosition: '-200% 0' }
      }
    }}
  />
);

const UserProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstTime = location.state?.isFirstTime;
  
  const [user, setUser] = useState({
    username: '',
    email: '',
    targetRole: '',
    existingSkills: [],
    profilePicture: '',
    bio: '',
    location: '',
    website: '',
    linkedIn: '',
    github: '',
    twitter: '',
    experience: '',
    careerGoals: '',
    availability: 'Available',
    preferredWorkType: 'Full-time',
    salaryRange: '',
    profileVisibility: 'Public',
    emailNotifications: true,
    skillUpdateNotifications: true,
    marketingEmails: false
  });
  
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({});
  const [newSkill, setNewSkill] = useState({
    skillName: '',
    proficiency: 'Beginner',
    category: 'Technical'
  });
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [editingExtractedSkill, setEditingExtractedSkill] = useState(null);
  const [editingExtractedIndex, setEditingExtractedIndex] = useState(-1);

  // Configuration data
  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const skillCategories = ['Technical', 'Soft Skills', 'Tools', 'Frameworks', 'Languages', 'Methodologies'];
  const experienceLevels = ['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years'];
  const workTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote Only', 'Hybrid'];
  const availabilityOptions = ['Available', 'Open to Opportunities', 'Not Looking', 'Busy'];

  const achievements = [
    { id: 1, title: 'Skills Master', description: 'Added 10+ skills to profile', icon: '🏆', unlocked: true },
    { id: 2, title: 'Goal Setter', description: 'Set career goals', icon: '🎯', unlocked: true },
    { id: 3, title: 'Community Contributor', description: 'Contributed to skill database', icon: '🤝', unlocked: false },
    { id: 4, title: 'Resume Optimizer', description: 'Uploaded and analyzed resume', icon: '📄', unlocked: false }
  ];

  // Tab configuration
  const tabs = [
    { label: 'Overview', icon: <WorkIcon /> },
    { label: 'Skills', icon: <CodeIcon /> },
    { label: 'Preferences', icon: <TuneIcon /> },
    { label: 'Achievements', icon: <TrophyIcon /> }
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.status === 'success') {
          const userData = response.data.data.user;
          const mergedUser = { ...user, ...userData };
          setUser(mergedUser);
          setFormData(mergedUser);
          
          if (!isFirstTime && !checkProfileCompletion(mergedUser)) {
            setError('Please complete your profile to access all features.');
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile. Please try again later.');
        
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, isFirstTime]);

  const checkProfileCompletion = (userData) => {
    const requiredFields = ['username', 'targetRole', 'location', 'experience', 'bio'];
    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillInputChange = (e) => {
    const { name, value } = e.target;
    
    if (editingExtractedSkill) {
      // If editing an extracted skill
      setEditingExtractedSkill(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // If adding a new skill
      setNewSkill(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddSkill = () => {
    // If editing an extracted skill, save it
    if (editingExtractedSkill) {
      handleSaveEditedExtractedSkill();
      return;
    }
    
    // Otherwise, add a new skill
    if (!newSkill.skillName.trim()) return;
    
    const skillExists = formData.existingSkills.some(
      skill => skill.skillName.toLowerCase() === newSkill.skillName.toLowerCase()
    );
    
    if (skillExists) {
      setError('This skill is already in your list.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      existingSkills: [
        ...prev.existingSkills,
        {
          skillName: newSkill.skillName,
          proficiency: newSkill.proficiency,
          category: newSkill.category,
          status: 'Not Started',
          startDate: null,
          completionDate: null,
          notes: '',
          dateAdded: new Date()
        }
      ]
    }));

    setNewSkill({
      skillName: '',
      proficiency: 'Beginner',
      category: 'Technical'
    });
    
    setShowSkillDialog(false);
    setError(null);
  };

  const handleRemoveSkill = (index) => {
    const updatedSkills = [...formData.existingSkills];
    updatedSkills.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      existingSkills: updatedSkills
    }));
  };

  const handleDeleteSkill = (skillName) => {
    const updatedSkills = formData.existingSkills.filter(skill => skill.skillName !== skillName);
    setFormData(prev => ({
      ...prev,
      existingSkills: updatedSkills
    }));
    
    // Also update the user state if we're not in edit mode
    if (!editMode) {
      setUser(prev => ({
        ...prev,
        existingSkills: updatedSkills
      }));
    }
    
    setSuccess(`Removed "${skillName}" from your skills.`);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Transform formData to match backend expectations
      const dataToSend = {
        ...formData,
        existingSkills: formData.existingSkills.map(skill => ({
          skillName: skill.skillName,
          proficiency: skill.proficiency || 'Beginner',
          category: skill.category || 'Technical',
          status: skill.status || 'Not Started',
          startDate: skill.startDate || null,
          completionDate: skill.completionDate || null,
          notes: skill.notes || '',
          dateAdded: skill.dateAdded || new Date()
        }))
      };
      
      console.log('Sending data to backend:', JSON.stringify(dataToSend, null, 2));
      
      const response = await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setUser(formData);
        setEditMode(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Response data:', err.response?.data);
      setError(`Failed to update profile: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setEditMode(false);
    setError(null);
  };

  const getSkillStats = () => {
    const skills = user.existingSkills;
    const total = skills.length;
    const byLevel = skills.reduce((acc, skill) => {
      acc[skill.proficiency] = (acc[skill.proficiency] || 0) + 1;
      return acc;
    }, {});
    
    return { total, byLevel };
  };

  const getProfileCompletion = () => {
    const fields = ['username', 'targetRole', 'bio', 'location', 'experience'];
    const completed = fields.filter(field => user[field] && user[field].trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  // Helper functions for enhanced skills section
  const getCategoryColor = (categoryName) => {
    const colors = {
      'Technical': '#3b82f6',
      'Frameworks': '#10b981', 
      'Tools': '#f59e0b',
      'Languages': '#ef4444',
      'Soft Skills': '#8b5cf6',
      'Methodologies': '#06b6d4'
    };
    return colors[categoryName] || '#64748b';
  };

  const getProficiencyColor = (proficiency) => {
    const colors = {
      'Beginner': 'warning',
      'Intermediate': 'info', 
      'Advanced': 'success',
      'Expert': 'secondary'
    };
    return colors[proficiency] || 'default';
  };

  const getProficiencyPercentage = (proficiency) => {
    const percentages = {
      'Beginner': 25,
      'Intermediate': 50,
      'Advanced': 75, 
      'Expert': 100
    };
    return percentages[proficiency] || 0;
  };

  const calculateCategoryAverage = (skills) => {
    if (!skills.length) return 0;
    const total = skills.reduce((sum, skill) => sum + getProficiencyPercentage(skill.proficiency), 0);
    return Math.round(total / skills.length);
  };

  const categorizedSkills = useMemo(() => {
    if (!user.existingSkills) return [];
    
    const categories = {};
    user.existingSkills.forEach(skill => {
      const category = skill.category || 'Technical';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(skill);
    });

    return Object.entries(categories).map(([name, skills]) => ({
      name,
      skills: skills.sort((a, b) => getProficiencyPercentage(b.proficiency) - getProficiencyPercentage(a.proficiency))
    }));
  }, [user.existingSkills]);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Enhanced file validation
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      if (file.size > maxSize) {
        setError('File size too large. Please upload a file smaller than 5MB.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  const handleResumeAnalysis = async () => {
    if (!resumeFile) {
      setError('Please select a resume file first.');
      return;
    }

    setExtractionLoading(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('resume', resumeFile);

      const token = localStorage.getItem('token');
      // Use existing resume upload endpoint
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/resume/upload`, formDataUpload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds for AI processing
      });

      if (response.data.status === 'success') {
        // Extract skills from the resume analysis response
        const resumeData = response.data.data.resume;
        
        let skillsToExtract = [];
        
        // Get extracted skills from resume (simplified - no recommendations)
        if (resumeData && resumeData.extractedSkills) {
          skillsToExtract = resumeData.extractedSkills.map(skill => ({
            name: skill.skillName,
            proficiency: skill.confidenceScore > 0.8 ? 'Expert' : 
                        skill.confidenceScore > 0.6 ? 'Advanced' : 
                        skill.confidenceScore > 0.4 ? 'Intermediate' : 'Beginner',
            category: detectSkillCategory(skill.skillName),
            confidence: Math.round(skill.confidenceScore * 100),
            context: `Found in resume`
          }));
        }
        
        // Remove duplicates and filter out skills already in profile
        const existingSkillNames = formData.existingSkills.map(s => s.skillName.toLowerCase());
        const uniqueSkills = skillsToExtract.filter((skill, index, self) => 
          self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase()) === index &&
          !existingSkillNames.includes(skill.name.toLowerCase())
        );
        
        setExtractedSkills(uniqueSkills);
        
        if (uniqueSkills.length > 0) {
          setSuccess(`Found ${uniqueSkills.length} new skills in your resume! Review and add them to your profile.`);
        } else {
          setError('No new skills found in the resume. All extracted skills are already in your profile.');
        }
      }
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError('Failed to analyze resume. Please try again or add skills manually.');
    } finally {
      setExtractionLoading(false);
    }
  };

  const handleAddExtractedSkills = (selectedSkills) => {
    // Convert extracted skills to the format expected by the profile
    const newSkills = selectedSkills.map(skill => ({
      skillName: skill.name,
      proficiency: skill.proficiency || 'Intermediate',
      category: detectSkillCategory(skill.name) || skill.category || 'Technical',
      status: 'Not Started',
      startDate: null,
      completionDate: null,
      notes: '',
      dateAdded: new Date()
    }));

    setFormData(prev => ({
      ...prev,
      existingSkills: [...prev.existingSkills, ...newSkills]
    }));

    setExtractedSkills([]);
    setShowResumeDialog(false);
    setResumeFile(null);
    
    // Enhanced success message with skill details
    const skillNames = selectedSkills.map(s => s.name).join(', ');
    const truncatedNames = skillNames.length > 100 ? skillNames.substring(0, 100) + '...' : skillNames;
    setSuccess(`🎉 Successfully added ${selectedSkills.length} skills: ${truncatedNames}`);
    
    // Auto clear success message after 5 seconds
    setTimeout(() => setSuccess(false), 5000);
  };

  // Handle editing extracted skills
  const handleEditExtractedSkill = (skill, index) => {
    setEditingExtractedSkill({
      skillName: skill.name,
      proficiency: skill.proficiency || 'Intermediate',
      category: detectSkillCategory(skill.name) || skill.category || 'Technical'
    });
    setEditingExtractedIndex(index);
    setShowSkillDialog(true);
  };

  const handleSaveEditedExtractedSkill = () => {
    if (!editingExtractedSkill.skillName.trim()) return;
    
    const updatedExtractedSkills = [...extractedSkills];
    updatedExtractedSkills[editingExtractedIndex] = {
      ...updatedExtractedSkills[editingExtractedIndex],
      name: editingExtractedSkill.skillName,
      proficiency: editingExtractedSkill.proficiency,
      category: editingExtractedSkill.category
    };
    
    setExtractedSkills(updatedExtractedSkills);
    setEditingExtractedSkill(null);
    setEditingExtractedIndex(-1);
    setShowSkillDialog(false);
    setSuccess(`✏️ Updated skill: ${editingExtractedSkill.skillName}`);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCancelEditExtractedSkill = () => {
    setEditingExtractedSkill(null);
    setEditingExtractedIndex(-1);
    setShowSkillDialog(false);
  };

  // Helper function to detect skill category based on skill name
  const detectSkillCategory = (skillName) => {
    const skill = skillName.toLowerCase();
    
    // Programming languages
    if (['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript'].some(lang => skill.includes(lang))) {
      return 'Languages';
    }
    
    // Frameworks
    if (['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'next.js', 'nuxt'].some(fw => skill.includes(fw))) {
      return 'Frameworks';
    }
    
    // Tools
    if (['git', 'docker', 'kubernetes', 'jenkins', 'webpack', 'babel', 'npm', 'yarn', 'maven', 'gradle'].some(tool => skill.includes(tool))) {
      return 'Tools';
    }
    
    // Methodologies
    if (['agile', 'scrum', 'devops', 'ci/cd', 'tdd', 'bdd', 'test-driven', 'microservices'].some(method => skill.includes(method))) {
      return 'Methodologies';
    }
    
    // Soft skills
    if (['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'management'].some(soft => skill.includes(soft))) {
      return 'Soft Skills';
    }
    
    // Default to Technical
    return 'Technical';
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 10 }}>
          <SkeletonProfile />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 10 }}>
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: 4,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          {/* Success/Error Messages */}
          <Slide direction="down" in={success || !!error} mountOnEnter unmountOnExit>
            <Box sx={{ mb: 3 }}>
              {success && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Profile updated successfully! 🎉
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Slide>
      
      {/* Profile Header */}
          <Fade in timeout={1000}>
            <Box sx={{ mb: 4 }}>
              {/* Profile Header Section - Template Style */}
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  width: '100%',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' }
                }}>
                  {/* Profile Info Section */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Profile Picture */}
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={user.profilePicture}
                        sx={{ 
                          width: 128,
                          height: 128,
                          bgcolor: 'primary.main',
                          fontSize: '2.5rem',
                          fontWeight: 'bold',
                          border: '3px solid white',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {user.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      {editMode && (
                        <IconButton
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            bgcolor: 'primary.main',
                            color: 'white',
                            width: 36,
                            height: 36,
                            '&:hover': { bgcolor: 'primary.dark' },
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                          size="small"
                        >
                          <PhotoCameraIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {/* Profile Text Info */}
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      {/* Name */}
                      <Typography sx={{
                        color: '#111418',
                        fontSize: '22px',
                        fontWeight: 'bold',
                        lineHeight: 'tight',
                        letterSpacing: '-0.015em',
                        mb: 0.5
                      }}>
                        {user.username || 'Welcome!'}
                      </Typography>
                      
                      {/* Title/Role */}
                      <Typography sx={{
                        color: '#60758a',
                        fontSize: '16px',
                        fontWeight: 'normal',
                        lineHeight: 'normal',
                        mb: 0.5
                      }}>
                        {user.targetRole || 'Set your target role'} 
                        {user.targetRole && ' | Passionate about building scalable applications'}
                      </Typography>
                      
                      {/* Location */}
                      <Typography sx={{
                        color: '#60758a',
                        fontSize: '16px',
                        fontWeight: 'normal',
                        lineHeight: 'normal'
                      }}>
                        {user.location || 'Location not set'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Edit Profile Button */}
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      if (editMode) {
                        handleSubmit(e);
                      } else {
                        setEditMode(true);
                        setFormData(user); // Initialize form data with current user data
                      }
                    }}
                    disabled={loading}
                    sx={{
                      minWidth: 84,
                      height: 40,
                      px: 2,
                      bgcolor: '#f0f2f5',
                      color: '#111418',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      letterSpacing: '0.015em',
                      textTransform: 'none',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      width: { xs: '100%', sm: 'auto' },
                      maxWidth: { xs: '480px', sm: 'auto' },
                      '&:hover': {
                        bgcolor: '#e5e7eb',
                        boxShadow: 'none'
                      },
                      '&:active': {
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {editMode ? (
                      loading ? <CircularProgress size={16} color="inherit" /> : 'Save Profile'
                    ) : (
                      'Edit Profile'
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Fade>

          {/* Navigation Tabs */}
          <Fade in timeout={1200}>
            <Paper 
              sx={{ 
                mb: 4,
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '2px solid #e2e8f0',
                borderRadius: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <Container maxWidth="lg">
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#64748b',
                      textTransform: 'none',
                      py: 2,
                      px: 3,
                      minHeight: 64,
                      transition: 'all 0.2s ease',
                      borderBottom: '3px solid transparent',
                      '&:hover': {
                        color: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.04)',
                      },
                      '&.Mui-selected': {
                        color: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderBottomColor: '#3b82f6',
                        fontWeight: 600,
                      }
                    },
                    '& .MuiTabs-indicator': {
                      display: 'none' // Hide default indicator since we're using border-bottom
                    }
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      icon={React.cloneElement(tab.icon, { 
                        sx: { 
                          fontSize: 24,
                          mb: 0.5,
                          color: activeTab === index ? '#3b82f6' : '#64748b'
                        } 
                      })}
                      label={tab.label}
                      iconPosition="top"
                      sx={{
                        '& .MuiSvgIcon-root': {
                          transition: 'color 0.2s ease'
                        }
                      }}
                    />
                  ))}
                </Tabs>
              </Container>
            </Paper>
          </Fade>

      {/* Tab Content */}
          <Box>
        {/* Overview Tab */}
            {activeTab === 0 && (
              <Slide direction="left" in timeout={600}>
                <Box>
            {editMode ? (
                  // Edit Mode - Keep existing comprehensive form
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                      {/* Personal Information Section */}
                      <Grid item xs={12}>
                        <AnimatedCard sx={{ 
                          background: 'white',
                          borderRadius: '12px',
                          padding: 3,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontSize: '18px',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <WorkIcon color="primary" />
                                Personal Information
                              </Typography>
                            </Box>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Username"
                          name="username"
                                  value={formData.username || ''}
                          onChange={handleInputChange}
                          disabled
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Email"
                          name="email"
                                  value={formData.email || ''}
                          onChange={handleInputChange}
                          disabled
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Target Role"
                          name="targetRole"
                          value={formData.targetRole || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., Full Stack Developer"
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Location"
                                  name="location"
                                  value={formData.location || ''}
                                  onChange={handleInputChange}
                                  placeholder="e.g., San Francisco, CA"
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={4}
                                  label="Bio"
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself, your experience, and career aspirations..."
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>

                      {/* Social Links Section */}
                      <Grid item xs={12}>
                        <AnimatedCard sx={{ 
                          background: 'white',
                          borderRadius: '12px',
                          padding: 3,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontSize: '18px',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <LanguageIcon color="primary" />
                                Social Links
                              </Typography>
                            </Box>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Website"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          placeholder="https://yourwebsite.com"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: <LanguageIcon sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="LinkedIn"
                          name="linkedIn"
                          value={formData.linkedIn || ''}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/username"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="GitHub"
                          name="github"
                          value={formData.github || ''}
                          onChange={handleInputChange}
                          placeholder="https://github.com/username"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: <GitHubIcon sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Twitter"
                          name="twitter"
                          value={formData.twitter || ''}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/username"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: <TwitterIcon sx={{ mr: 1, color: 'action.active' }} />
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>

                      {/* Career Information Section */}
                      <Grid item xs={12}>
                        <AnimatedCard sx={{ 
                          background: 'white',
                          borderRadius: '12px',
                          padding: 3,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontSize: '18px',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <BusinessIcon color="primary" />
                                Career Information
                              </Typography>
                            </Box>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth variant="outlined">
                                  <InputLabel>Experience Level</InputLabel>
                                  <Select
                          name="experience"
                          value={formData.experience || ''}
                          onChange={handleInputChange}
                                    label="Experience Level"
                                    sx={{
                                      borderRadius: '8px',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }}
                                  >
                          {experienceLevels.map(level => (
                                      <MenuItem key={level} value={level}>{level}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth variant="outlined">
                                  <InputLabel>Preferred Work Type</InputLabel>
                                  <Select
                          name="preferredWorkType"
                          value={formData.preferredWorkType || ''}
                          onChange={handleInputChange}
                                    label="Preferred Work Type"
                                    sx={{
                                      borderRadius: '8px',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }}
                        >
                          {workTypes.map(type => (
                                      <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <FormControl fullWidth variant="outlined">
                                  <InputLabel>Availability</InputLabel>
                                  <Select
                          name="availability"
                          value={formData.availability || ''}
                          onChange={handleInputChange}
                                    label="Availability"
                                    sx={{
                                      borderRadius: '8px',
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }}
                        >
                          {availabilityOptions.map(option => (
                                      <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Salary Range"
                          name="salaryRange"
                          value={formData.salaryRange || ''}
                  onChange={handleInputChange}
                          placeholder="e.g., $80k - $120k"
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  label="Career Goals"
                        name="careerGoals"
                        value={formData.careerGoals || ''}
                        onChange={handleInputChange}
                        placeholder="Describe your short and long-term career goals..."
                                  variant="outlined"
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      '& fieldset': {
                                        borderColor: '#e2e8f0',
                                        borderWidth: '2px'
                                      },
                                      '&:hover fieldset': {
                                        borderColor: '#3b82f6'
                                      },
                                      '&.Mui-focused fieldset': {
                                        borderColor: '#3b82f6',
                                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                      }
                                    }
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </AnimatedCard>
                      </Grid>

                      {/* Action Buttons */}
                      <Grid item xs={12}>
                        <Paper 
                          sx={{ 
                            p: 3, 
                            display: 'flex', 
                            gap: 2, 
                            justifyContent: 'flex-end',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            size="large"
                            sx={{ 
                              px: 3,
                              py: 1.5,
                              borderColor: '#e2e8f0',
                              color: '#64748b',
                              borderRadius: '8px',
                              '&:hover': {
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.04)'
                              }
                            }}
                          >
                            Cancel Changes
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={loading}
                            size="large"
                            sx={{ 
                              minWidth: 150,
                              px: 3,
                              py: 1.5,
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              borderRadius: '8px',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                              }
                            }}
                          >
                            {loading ? <CircularProgress size={20} /> : 'Save Profile'}
                          </Button>
                        </Paper>
                      </Grid>
                    </Grid>
              </form>
            ) : (
                  // View Mode - Clean template-inspired layout
                  <Container maxWidth="lg" disableGutters>
                    {/* About Section */}
                    <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#111418',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          letterSpacing: '-0.015em',
                          lineHeight: 'tight',
                          mb: 1.5
                        }}
                      >
                        About
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#111418',
                          fontSize: '16px',
                          fontWeight: 'normal',
                          lineHeight: 'normal',
                          pb: 1.5,
                          pt: 0.5
                        }}
                      >
                        {user.bio || 'No bio available. Click edit to add information about yourself, your experience, and career aspirations.'}
                      </Typography>
                    </Box>

                    {/* Experience Section */}
                    {user.experience && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Experience
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          p: 2,
                          display: 'grid',
                          gridTemplateColumns: '20% 1fr',
                          gap: 3
                        }}>
                          {/* Current Role */}
                          <Box sx={{ 
                            gridColumn: 'span 2',
                            display: 'grid',
                            gridTemplateColumns: 'subgrid',
                            borderTop: '1px solid #dbe0e6',
                            py: 2.5
                          }}>
                            <Typography sx={{ 
                              color: '#60758a',
                              fontSize: '14px',
                              fontWeight: 'normal',
                              lineHeight: 'normal'
                            }}>
                              Experience Level
                            </Typography>
                            <Typography sx={{ 
                              color: '#111418',
                              fontSize: '14px',
                              fontWeight: 'normal',
                              lineHeight: 'normal'
                            }}>
                              {user.experience}
                            </Typography>
                          </Box>

                          {user.targetRole && (
                            <Box sx={{ 
                              gridColumn: 'span 2',
                              display: 'grid',
                              gridTemplateColumns: 'subgrid',
                              borderTop: '1px solid #dbe0e6',
                              py: 2.5
                            }}>
                              <Typography sx={{ 
                                color: '#60758a',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                Target Role
                              </Typography>
                              <Typography sx={{ 
                                color: '#111418',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                {user.targetRole}
                              </Typography>
                            </Box>
                          )}

                          {user.preferredWorkType && (
                            <Box sx={{ 
                              gridColumn: 'span 2',
                              display: 'grid',
                              gridTemplateColumns: 'subgrid',
                              borderTop: '1px solid #dbe0e6',
                              py: 2.5
                            }}>
                              <Typography sx={{ 
                                color: '#60758a',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                Work Type
                              </Typography>
                              <Typography sx={{ 
                                color: '#111418',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                {user.preferredWorkType}
                              </Typography>
                            </Box>
                          )}

                          {user.location && (
                            <Box sx={{ 
                              gridColumn: 'span 2',
                              display: 'grid',
                              gridTemplateColumns: 'subgrid',
                              borderTop: '1px solid #dbe0e6',
                              py: 2.5
                            }}>
                              <Typography sx={{ 
                                color: '#60758a',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                Location
                              </Typography>
                              <Typography sx={{ 
                                color: '#111418',
                                fontSize: '14px',
                                fontWeight: 'normal',
                                lineHeight: 'normal'
                              }}>
                                {user.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </>
                    )}

                    {/* Skills Section */}
                    {user.existingSkills && user.existingSkills.length > 0 && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Skills
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex',
                          gap: 1.5,
                          p: 1.5,
                          flexWrap: 'wrap',
                          pr: 2
                        }}>
                          {user.existingSkills.map((skill, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                height: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                borderRadius: '8px',
                                backgroundColor: '#f0f2f5',
                                pl: 2,
                                pr: 2
                              }}
                            >
                              <Typography sx={{
                                color: '#111418',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 'normal'
                              }}>
                                {skill.skillName}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}

                    {/* Career Goals Section */}
                    {user.careerGoals && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Career Goals
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#111418',
                              fontSize: '16px',
                              fontWeight: 'normal',
                              lineHeight: 'normal',
                              pb: 1.5,
                              pt: 0.5
                            }}
                          >
                            {user.careerGoals}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {/* Availability Section */}
                    {user.availability && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Availability
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#111418',
                              fontSize: '16px',
                              fontWeight: 'normal',
                              lineHeight: 'normal',
                              pb: 1.5,
                              pt: 0.5
                            }}
                          >
                            {user.availability}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {/* Preferred Work Type Section */}
                    {user.preferredWorkType && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Preferred Work Type
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#111418',
                              fontSize: '16px',
                              fontWeight: 'normal',
                              lineHeight: 'normal',
                              pb: 1.5,
                              pt: 0.5
                            }}
                          >
                            {user.preferredWorkType}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {/* Salary Range Section */}
                    {user.salaryRange && (
                      <>
                        <Box sx={{ px: 2, pb: 1.5, pt: 2.5 }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: '#111418',
                              fontSize: '22px',
                              fontWeight: 'bold',
                              letterSpacing: '-0.015em',
                              lineHeight: 'tight',
                              mb: 1.5
                            }}
                          >
                            Salary Range
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#111418',
                              fontSize: '16px',
                              fontWeight: 'normal',
                              lineHeight: 'normal',
                              pb: 1.5,
                              pt: 0.5
                            }}
                          >
                            {user.salaryRange}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Container>
                )}
                </Box>
              </Slide>
        )}

        {/* Skills Tab */}
            {activeTab === 1 && (
              <Slide direction="left" in timeout={600}>
                <Box>
                  {/* Skills Header with Actions */}
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center" 
                    mb={4}
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 0 }
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    >
                      Skills Management
                    </Typography>
                    
                    <Box display="flex" gap={2} alignItems="center">
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowSkillDialog(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          borderRadius: '8px',
                          px: 3,
                          py: 1,
                          fontWeight: 500,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                          }
                        }}
                      >
                        Add Skill
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setShowResumeDialog(true)}
                        sx={{
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          borderRadius: '8px',
                          px: 3,
                          py: 1,
                          fontWeight: 500,
                          '&:hover': {
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(59, 130, 246, 0.04)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        Extract from Resume
                      </Button>
                      
                      <Tooltip title="Filter & Sort">
                        <IconButton
                          sx={{
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: 'grey.50' }
                          }}
                        >
                          <TuneIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Skills Overview Stats */}
                  <Fade in timeout={800}>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={6} sm={3}>
                        <AnimatedCard sx={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          textAlign: 'center',
                          p: 3,
                          borderRadius: '12px',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                          }
                        }}>
                          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            {getSkillStats().total}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Skills
                          </Typography>
                        </AnimatedCard>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <AnimatedCard sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          textAlign: 'center',
                          p: 3,
                          borderRadius: '12px',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                          }
                        }}>
                          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            {user.existingSkills?.filter(s => ['Advanced', 'Expert'].includes(s.proficiency)).length || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Advanced+
                          </Typography>
                        </AnimatedCard>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <AnimatedCard sx={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          textAlign: 'center',
                          p: 3,
                          borderRadius: '12px',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
                          }
                        }}>
                          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            {categorizedSkills.length}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Categories
                          </Typography>
                        </AnimatedCard>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <AnimatedCard sx={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white',
                          textAlign: 'center',
                          p: 3,
                          borderRadius: '12px',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
                          }
                        }}>
                          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            {Math.round(getProfileCompletion())}%
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Profile
                          </Typography>
                        </AnimatedCard>
                      </Grid>
                    </Grid>
                  </Fade>

                  {/* Skills by Category */}
                  {user.existingSkills && user.existingSkills.length > 0 ? (
                    <Fade in timeout={1000}>
                      <Box>
                        {categorizedSkills.map((category, categoryIndex) => (
                          <AnimatedCard 
                            key={categoryIndex}
                            sx={{ 
                              mb: 4,
                              background: 'white',
                              borderRadius: '12px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              border: '1px solid #e2e8f0',
                              borderLeft: `4px solid ${getCategoryColor(category.name)}`,
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 4 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      bgcolor: getCategoryColor(category.name)
                                    }}
                                  />
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      fontSize: '18px',
                                      fontWeight: 600,
                                      color: '#1e293b'
                                    }}
                                  >
                                    {category.name}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={`${category.skills.length} skills`}
                                    sx={{ 
                                      bgcolor: 'grey.100',
                                      color: 'text.secondary',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </Box>

                              <Box display="flex" flexWrap="wrap" gap={2}>
                                {category.skills.map((skill, skillIndex) => (
                                  <EnhancedSkillChip
                                    key={skillIndex}
                                    label={skill.skillName}
                                    proficiency={skill.proficiency}
                                    skillcolor={getCategoryColor(category.name)}
                                    onDelete={() => handleDeleteSkill(skill.skillName)}
                                    deleteIcon={
                                      <DeleteIcon 
                                        sx={{ 
                                          fontSize: '18px',
                                          transition: 'all 0.2s ease'
                                        }} 
                                      />
                                    }
                                  />
                                ))}
                              </Box>
                            </CardContent>
                          </AnimatedCard>
                        ))}
                      </Box>
                    </Fade>
                  ) : (
                    // Empty State
                    <Fade in timeout={600}>
                      <AnimatedCard sx={{ 
                        textAlign: 'center', 
                        py: 8,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px'
                      }}>
                        <CardContent>
                          <CodeIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                          <Typography variant="h5" gutterBottom color="text.secondary">
                            No Skills Added Yet
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Start building your skill profile by adding your first skill!
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setShowSkillDialog(true)}
                            sx={{
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              px: 4,
                              py: 1.5,
                              borderRadius: '8px'
                            }}
                          >
                            Add Your First Skill
                          </Button>
                        </CardContent>
                      </AnimatedCard>
                    </Fade>
                  )}
                </Box>
              </Slide>
            )}

        {/* Preferences Tab */}
            {activeTab === 2 && (
              <Slide direction="left" in timeout={600}>
                <Box>
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 4
                    }}
                  >
                    Account Preferences
                  </Typography>

                  <Grid container spacing={4}>
                    {/* Career Preferences Section */}
                    <Grid item xs={12}>
                      <AnimatedCard sx={{ 
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3
                            }}
                          >
                            <WorkIcon color="primary" />
                            Career Preferences
                          </Typography>
                          
                          <Grid container spacing={4}>
                            {/* Job Preferences */}
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                background: '#f8fafc'
                              }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                                  Job Preferences
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
                                  <FormControl fullWidth>
                                    <InputLabel>Preferred Work Type</InputLabel>
                                    <Select
                                      name="preferredWorkType"
                                      value={formData.preferredWorkType || ''}
                                      onChange={handleInputChange}
                                      disabled={!editMode}
                                      sx={{
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#e2e8f0'
                                        }
                                      }}
                                    >
                                      {workTypes.map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  
                                  <FormControl fullWidth>
                                    <InputLabel>Experience Level</InputLabel>
                                    <Select
                                      name="experience"
                                      value={formData.experience || ''}
                                      onChange={handleInputChange}
                                      disabled={!editMode}
                                      sx={{
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#e2e8f0'
                                        }
                                      }}
                                    >
                                      {experienceLevels.map(level => (
                                        <MenuItem key={level} value={level}>{level}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <FormControl fullWidth>
                                    <InputLabel>Availability</InputLabel>
                                    <Select
                                      name="availability"
                                      value={formData.availability || ''}
                                      onChange={handleInputChange}
                                      disabled={!editMode}
                                      sx={{
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#e2e8f0'
                                        }
                                      }}
                                    >
                                      {availabilityOptions.map(option => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Salary & Compensation */}
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                background: '#f8fafc'
                              }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                                  Salary & Compensation
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
                                  <TextField
                                    fullWidth
                                    label="Salary Range"
                                    name="salaryRange"
                                    value={formData.salaryRange || ''}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    placeholder="e.g., $80k - $120k"
                                    variant="outlined"
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px'
                                      }
                                    }}
                                  />
                                  
                                  <TextField
                                    fullWidth
                                    label="Preferred Location"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    placeholder="e.g., San Francisco, CA"
                                    variant="outlined"
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px'
                                      }
                                    }}
                                  />

                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.showSalaryRange || false}
                                        onChange={handleInputChange}
                                        name="showSalaryRange"
                                        disabled={!editMode}
                                        color="primary"
                                      />
                                    }
                                    label="Show salary range publicly"
                                    sx={{ color: 'text.secondary' }}
                                  />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>

                    {/* Privacy Settings Section */}
                    <Grid item xs={12}>
                      <AnimatedCard sx={{ 
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3
                            }}
                          >
                            <VisibilityIcon color="primary" />
                            Privacy Settings
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}>
                                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                  Profile Visibility
                                </Typography>
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                  <Select
                                    value={formData.profileVisibility || 'Public'}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      profileVisibility: e.target.value
                                    }))}
                                    disabled={!editMode}
                                    size="small"
                                    sx={{ borderRadius: '8px' }}
                                  >
                                    <MenuItem value="Public">🌍 Public</MenuItem>
                                    <MenuItem value="Limited">👥 Limited</MenuItem>
                                    <MenuItem value="Private">🔒 Private</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}>
                                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                  Contact Info
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={formData.showContactInfo || false}
                                      onChange={handleInputChange}
                                      name="showContactInfo"
                                      disabled={!editMode}
                                      color="primary"
                                    />
                                  }
                                  label="Visible"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}>
                                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                  Skills Portfolio
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={formData.showSkills !== false}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        showSkills: e.target.checked
                                      }))}
                                      disabled={!editMode}
                                      color="primary"
                                    />
                                  }
                                  label="Visible"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>

                    {/* Notification Settings Section */}
                    <Grid item xs={12}>
                      <AnimatedCard sx={{ 
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3
                            }}
                          >
                            <TuneIcon color="primary" />
                            Notification Settings
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    📧 Email Notifications
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    General updates and news
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={formData.emailNotifications || false}
                                  onChange={handleInputChange}
                                  name="emailNotifications"
                                  disabled={!editMode}
                                  color="primary"
                                />
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    🎯 Skill Reminders
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Practice and update reminders
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={formData.skillUpdateNotifications || false}
                                  onChange={handleInputChange}
                                  name="skillUpdateNotifications"
                                  disabled={!editMode}
                                  color="primary"
                                />
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                              <Box sx={{ 
                                p: 3,
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    📈 Marketing Emails
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Promotional content
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={formData.marketingEmails || false}
                                  onChange={handleInputChange}
                                  name="marketingEmails"
                                  disabled={!editMode}
                                  color="primary"
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>
                  </Grid>
                </Box>
              </Slide>
            )}

        {/* Achievements Tab */}
            {activeTab === 3 && (
              <Slide direction="left" in timeout={600}>
                <Box>
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 4
                    }}
                  >
                    Achievements & Progress
                  </Typography>

                  {/* Progress Overview */}
                  <Fade in timeout={800}>
                    <AnimatedCard sx={{ 
                      mb: 4,
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#1e293b',
                            mb: 3
                          }}
                        >
                          Progress Overview
                        </Typography>
                        
                        <Grid container spacing={4}>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 3,
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white'
                            }}>
                              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                                {getSkillStats().total}
                              </Typography>
                              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                Total Skills
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 3,
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white'
                            }}>
                              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                                {user.existingSkills?.filter(s => ['Advanced', 'Expert'].includes(s.proficiency)).length || 0}
                              </Typography>
                              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                Skills Mastered
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 3,
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white'
                            }}>
                              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                                {Math.round(getProfileCompletion())}%
                              </Typography>
                              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                Profile Completion
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </AnimatedCard>
                  </Fade>

                  {/* Skill Badges */}
                  <Fade in timeout={1000}>
                    <AnimatedCard sx={{ 
                      mb: 4,
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#1e293b',
                            mb: 3
                          }}
                        >
                          Skill Badges
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* JavaScript Master Badge */}
                          {user.existingSkills?.some(s => s.skillName.toLowerCase().includes('javascript') && s.proficiency === 'Expert') && (
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ 
                                textAlign: 'center',
                                p: 3,
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                }
                              }}>
                                <Typography variant="h2" sx={{ mb: 1 }}>🏆</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d97706' }}>
                                  JavaScript Master
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          {/* React Expert Badge */}
                          {user.existingSkills?.some(s => s.skillName.toLowerCase().includes('react') && ['Advanced', 'Expert'].includes(s.proficiency)) && (
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ 
                                textAlign: 'center',
                                p: 3,
                                border: '1px solid #3b82f6',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }
                              }}>
                                <Typography variant="h2" sx={{ mb: 1 }}>🥇</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2563eb' }}>
                                  React Expert
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          {/* Node.js Intermediate Badge */}
                          {user.existingSkills?.some(s => s.skillName.toLowerCase().includes('node') && s.proficiency === 'Intermediate') && (
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ 
                                textAlign: 'center',
                                p: 3,
                                border: '1px solid #10b981',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }
                              }}>
                                <Typography variant="h2" sx={{ mb: 1 }}>🥈</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#059669' }}>
                                  Node.js Intermediate
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          {/* Python Beginner Badge */}
                          {user.existingSkills?.some(s => s.skillName.toLowerCase().includes('python') && s.proficiency === 'Beginner') && (
                            <Grid item xs={6} sm={3}>
                              <Box sx={{ 
                                textAlign: 'center',
                                p: 3,
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                }
                              }}>
                                <Typography variant="h2" sx={{ mb: 1 }}>🥉</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#dc2626' }}>
                                  Python Beginner
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </AnimatedCard>
                  </Fade>

                  {/* Learning Streak */}
                  <Fade in timeout={1200}>
                    <AnimatedCard sx={{ 
                      mb: 4,
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#1e293b',
                            mb: 3
                          }}
                        >
                          Learning Streak
                        </Typography>
                        
                        <Grid container spacing={4}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 4,
                              border: '1px solid #f59e0b',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                            }}>
                              <Typography variant="h2" sx={{ mb: 2 }}>🔥</Typography>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706', mb: 1 }}>
                                {Math.floor(Math.random() * 20) + 5} days
                              </Typography>
                              <Typography variant="body1" color="text.secondary">
                                Current Streak
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 4,
                              border: '1px solid #8b5cf6',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)'
                            }}>
                              <Typography variant="h2" sx={{ mb: 2 }}>🏅</Typography>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: '#7c3aed', mb: 1 }}>
                                {Math.floor(Math.random() * 30) + 20} days
                              </Typography>
                              <Typography variant="body1" color="text.secondary">
                                Longest Streak
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </AnimatedCard>
                  </Fade>

                  {/* Achievement Cards */}
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 3
                    }}
                  >
                    Achievement Gallery
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {achievements.map((achievement, index) => (
                      <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                        <Zoom in timeout={300 + index * 100}>
                          <AnimatedCard
                            sx={{
                              opacity: achievement.unlocked ? 1 : 0.6,
                              filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                              background: achievement.unlocked 
                                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                                : 'white',
                              border: achievement.unlocked 
                                ? '2px solid #10b981' 
                                : '1px solid #e2e8f0',
                              '&:hover': {
                                transform: achievement.unlocked ? 'translateY(-4px)' : 'translateY(-2px)',
                                boxShadow: achievement.unlocked 
                                  ? '0 8px 25px rgba(16, 185, 129, 0.2)' 
                                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 3, textAlign: 'center' }}>
                              <Typography variant="h2" sx={{ mb: 2 }}>
                                {achievement.icon}
                              </Typography>
                              <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{ 
                                  fontWeight: 600,
                                  color: achievement.unlocked ? '#1e293b' : 'text.secondary'
                                }}
                              >
                                {achievement.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {achievement.description}
                              </Typography>
                              {achievement.unlocked ? (
                                <Chip
                                  label="✓ Unlocked!"
                                  color="success"
                                  size="small"
                                  sx={{ 
                                    fontWeight: 500,
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white'
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="🔒 Locked"
                                  variant="outlined"
                                  size="small"
                                  sx={{ color: 'text.secondary' }}
                                />
                              )}
                            </CardContent>
                          </AnimatedCard>
                        </Zoom>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Slide>
            )}
          </Box>
        </Container>

        {/* Add Skill Dialog */}
        <Dialog 
          open={showSkillDialog} 
          onClose={() => setShowSkillDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {editingExtractedSkill ? 'Edit Extracted Skill' : 'Add New Skill'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {editingExtractedSkill 
                ? 'Modify the skill details before adding to your profile' 
                : 'Add a skill to your professional portfolio'
              }
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skill Name"
                  name="skillName"
                  value={editingExtractedSkill ? editingExtractedSkill.skillName : newSkill.skillName}
                  onChange={handleSkillInputChange}
                  variant="outlined"
                  placeholder="e.g., JavaScript, React, Python"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={editingExtractedSkill ? editingExtractedSkill.category : newSkill.category}
                    onChange={handleSkillInputChange}
                    label="Category"
                    sx={{
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    {skillCategories.map(category => (
                      <MenuItem key={category} value={category}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getCategoryColor(category)
                            }}
                          />
                          {category}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Proficiency Level</InputLabel>
                  <Select
                    name="proficiency"
                    value={editingExtractedSkill ? editingExtractedSkill.proficiency : newSkill.proficiency}
                    onChange={handleSkillInputChange}
                    label="Proficiency Level"
                    sx={{
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    {proficiencyLevels.map(level => (
                      <MenuItem key={level} value={level}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            size="small"
                            label={level}
                            color={getProficiencyColor(level)}
                            sx={{ fontWeight: 500, fontSize: '12px' }}
                          />
                          <Typography variant="body2">
                            {level === 'Beginner' && '🌱 Just starting out'}
                            {level === 'Intermediate' && '📈 Getting comfortable'}
                            {level === 'Advanced' && '💪 Highly proficient'}
                            {level === 'Expert' && '🏆 Master level'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Skill Preview */}
              {((editingExtractedSkill && editingExtractedSkill.skillName) || (!editingExtractedSkill && newSkill.skillName)) && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 3,
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                      {editingExtractedSkill ? 'Updated Preview' : 'Preview'}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <Chip
                        label={editingExtractedSkill ? editingExtractedSkill.skillName : newSkill.skillName}
                        sx={{
                          backgroundColor: `${getCategoryColor(editingExtractedSkill ? editingExtractedSkill.category : newSkill.category)}15`,
                          color: getCategoryColor(editingExtractedSkill ? editingExtractedSkill.category : newSkill.category),
                          border: `1px solid ${getCategoryColor(editingExtractedSkill ? editingExtractedSkill.category : newSkill.category)}30`,
                          fontWeight: 500,
                          fontSize: '14px',
                          height: 40,
                          px: 2,
                          position: 'relative',
                          '&::after': {
                            content: `"${editingExtractedSkill ? editingExtractedSkill.proficiency : newSkill.proficiency}"`,
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            backgroundColor: getCategoryColor(editingExtractedSkill ? editingExtractedSkill.category : newSkill.category),
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '8px',
                            lineHeight: 1
                          }
                        }}
                      />
                      <Chip
                        size="small"
                        label={editingExtractedSkill ? editingExtractedSkill.category : newSkill.category}
                        variant="outlined"
                        sx={{ borderColor: getCategoryColor(editingExtractedSkill ? editingExtractedSkill.category : newSkill.category) }}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <Button 
              onClick={() => {
                if (editingExtractedSkill) {
                  handleCancelEditExtractedSkill();
                } else {
                  setShowSkillDialog(false);
                  setNewSkill({
                    skillName: '',
                    proficiency: 'Beginner',
                    category: 'Technical'
                  });
                }
              }}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: '8px',
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddSkill}
              disabled={editingExtractedSkill 
                ? !editingExtractedSkill.skillName.trim() 
                : !newSkill.skillName.trim()
              }
              sx={{
                px: 4,
                py: 1,
                borderRadius: '8px',
                background: editingExtractedSkill 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                fontWeight: 500,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: editingExtractedSkill 
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                    : '0 4px 12px rgba(59, 130, 246, 0.3)'
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8'
                }
              }}
            >
              {editingExtractedSkill ? 'Save Changes' : 'Add Skill'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resume Upload Dialog */}
        <Dialog 
          open={showResumeDialog} 
          onClose={() => setShowResumeDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Extract Skills from Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Upload your resume and we'll automatically extract your skills
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {!extractedSkills.length ? (
              <Box>
                {/* File Upload Section */}
                <Box sx={{ 
                  p: 4,
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  textAlign: 'center',
                  mb: 3,
                  background: resumeFile ? 'rgba(59, 130, 246, 0.04)' : '#f8fafc',
                  borderColor: resumeFile ? '#3b82f6' : '#cbd5e1'
                }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      sx={{
                        mb: 2,
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        '&:hover': {
                          borderColor: '#2563eb',
                          backgroundColor: 'rgba(59, 130, 246, 0.04)'
                        }
                      }}
                    >
                      {resumeFile ? 'Change File' : 'Choose Resume File'}
                    </Button>
                  </label>
                  
                  {resumeFile ? (
                    <Box>
                      <Typography variant="body1" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                        ✓ {resumeFile.name}
                      </Typography>
                      <Box display="flex" justifyContent="center" gap={2} mb={2}>
                        <Chip 
                          size="small" 
                          label={`${(resumeFile.size / 1024 / 1024).toFixed(2)} MB`} 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Chip 
                          size="small" 
                          label={resumeFile.type.includes('pdf') ? 'PDF' : 
                                resumeFile.type.includes('word') ? 'Word' : 
                                resumeFile.type.includes('text') ? 'Text' : 'Document'} 
                          color="secondary" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      {extractionLoading && (
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress sx={{ borderRadius: '4px', height: 6 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            AI is analyzing your resume... This may take up to 60 seconds.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        Drag and drop your resume or click to browse
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Supports PDF, DOC, DOCX, and TXT files (Max 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Instructions */}
                <Box sx={{ 
                  p: 3,
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    🤖 AI-Powered Resume Analysis
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Upload your resume and our AI will extract technical and soft skills
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Skills are automatically categorized (Languages, Frameworks, Tools, etc.)
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Proficiency levels are assigned based on context and confidence
                    </Typography>
                    <Typography component="li" variant="body2" color="text.secondary">
                      Review and edit extracted skills before adding them to your profile
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                      💡 Pro Tip: Make sure your resume includes specific technologies, tools, and skills you've worked with for best results!
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              /* Extracted Skills Preview */
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  🎉 Found {extractedSkills.length} skills in your resume!
                </Typography>
                
                <Grid container spacing={2}>
                  {extractedSkills.map((skill, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box sx={{
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        position: 'relative',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          '& .skill-actions': {
                            opacity: 1
                          }
                        },
                        transition: 'all 0.2s ease'
                      }}>
                        {/* Skill Actions */}
                        <Box 
                          className="skill-actions"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s ease'
                          }}
                        >
                          <Tooltip title="Edit skill">
                            <IconButton
                              size="small"
                              onClick={() => handleEditExtractedSkill(skill, index)}
                              sx={{
                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                width: 28,
                                height: 28,
                                '&:hover': {
                                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove skill">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updatedSkills = extractedSkills.filter((_, i) => i !== index);
                                setExtractedSkills(updatedSkills);
                                setSuccess(`Removed "${skill.name}" from extracted skills.`);
                                setTimeout(() => setSuccess(false), 3000);
                              }}
                              sx={{
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                width: 28,
                                height: 28,
                                '&:hover': {
                                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pr: 8 }}>
                          {skill.name}
                        </Typography>
                        <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                          <Chip 
                            size="small" 
                            label={detectSkillCategory(skill.name) || skill.category || 'Technical'} 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            size="small" 
                            label={skill.proficiency || 'Intermediate'} 
                            color="secondary"
                          />
                          {skill.confidence && (
                            <Chip 
                              size="small" 
                              label={`${skill.confidence}% confidence`} 
                              color={skill.confidence > 80 ? 'success' : skill.confidence > 60 ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {skill.context && (
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {skill.context}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    💡 <strong>Edit Skills:</strong> Click the edit icon on any skill to modify its details before adding to your profile.
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <Button 
              onClick={() => {
                setShowResumeDialog(false);
                setExtractedSkills([]);
                setResumeFile(null);
              }}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: '8px',
                color: '#64748b',
                '&:hover': {
                  backgroundColor: 'rgba(100, 116, 139, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            
            {!extractedSkills.length ? (
              <Button 
                variant="contained" 
                onClick={handleResumeAnalysis}
                disabled={!resumeFile || extractionLoading}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  fontWeight: 500,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  }
                }}
              >
                {extractionLoading ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Analyzing...
                  </>
                ) : (
                  'Extract Skills'
                )}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={() => handleAddExtractedSkills(extractedSkills)}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  fontWeight: 500,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }
                }}
              >
                Add All Skills ({extractedSkills.length})
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default UserProfile; 