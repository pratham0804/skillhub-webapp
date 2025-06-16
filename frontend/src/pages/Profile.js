import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { toast } from '../hooks/use-toast';
import { 
  User, 
  Mail, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  MapPin, 
  Camera, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Award, 
  Target, 
  Settings,
  Eye,
  EyeOff,
  Save,
  ChevronDown,
  ChevronRight,
  Trophy
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState({
    username: '',
    email: '',
    targetRole: '',
    bio: '',
    location: '',
    profilePicture: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    experienceLevel: '',
    preferredWorkType: '',
    availability: '',
    salaryRange: '',
    careerGoals: '',
    showSalaryPublic: false,
    profileVisibility: 'Public',
    showContactInfo: true,
    emailNotifications: true,
    skillUpdateNotifications: true,
    marketingEmails: false,
    showAchievementsPublic: true,
    existingSkills: []
  });

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newSkill, setNewSkill] = useState({
    skillName: '',
    proficiency: 'Beginner',
    category: 'Technical'
  });

  const fileInputRef = useRef(null);

  const proficiencyColors = {
    'Beginner': 'bg-blue-100 text-blue-800 border-blue-200',
    'Intermediate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Advanced': 'bg-green-100 text-green-800 border-green-200',
    'Expert': 'bg-purple-100 text-purple-800 border-purple-200'
  };

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
          
          // Ensure all existing skills have proper IDs
          if (userData.existingSkills && Array.isArray(userData.existingSkills)) {
            userData.existingSkills = userData.existingSkills.map((skill, index) => ({
              ...skill,
              id: skill.id || `legacy_skill_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
            }));
          }
          
          setUser(prev => ({ ...prev, ...userData }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`,
        user,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setEditMode(false);
        
        // Signal other components to refresh
        localStorage.setItem('profileUpdated', Date.now().toString());
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a skill name.",
        variant: "destructive"
      });
      return;
    }

    const skillExists = user.existingSkills.some(
      skill => skill.skillName.toLowerCase() === newSkill.skillName.toLowerCase()
    );
    
    if (skillExists) {
      toast({
        title: "Error",
        description: "This skill is already in your list.",
        variant: "destructive"
      });
      return;
    }

    const skill = {
      id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      skillName: newSkill.skillName,
      proficiency: newSkill.proficiency,
      category: newSkill.category,
      status: 'Not Started',
      startDate: '',
      completionDate: '',
      notes: '',
      dateAdded: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('token');
      const updatedSkills = [...user.existingSkills, skill];
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`,
        { ...user, existingSkills: updatedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setUser(prev => ({
          ...prev,
          existingSkills: updatedSkills
        }));

        setNewSkill({ skillName: '', proficiency: 'Beginner', category: 'Technical' });
        setShowSkillDialog(false);
        
        // Signal other components to refresh
        localStorage.setItem('profileUpdated', Date.now().toString());
        
        toast({
          title: "Skill Added",
          description: `${skill.skillName} has been added to your profile.`,
        });
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSkill = async (skillId) => {
    
    try {
      const token = localStorage.getItem('token');
      const skillToDelete = user.existingSkills.find(skill => skill.id === skillId);
      
      if (!skillToDelete) {
        toast({
          title: "Error",
          description: "Skill not found.",
          variant: "destructive"
        });
        return;
      }
      
      const updatedSkills = user.existingSkills.filter(skill => skill.id !== skillId);
      console.log('Skills after filtering:', updatedSkills.length, 'remaining out of', user.existingSkills.length);
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`,
        { ...user, existingSkills: updatedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setUser(prev => ({
          ...prev,
          existingSkills: updatedSkills
        }));
        
        // Signal other components to refresh
        localStorage.setItem('profileUpdated', Date.now().toString());
        
        toast({
          title: "Skill Removed",
          description: `${skillToDelete.skillName} has been removed from your profile.`,
        });
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      toast({
        title: "Error",
        description: "Failed to delete skill. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/resume/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        }
      );

      clearInterval(interval);
      setUploadProgress(100);

      if (response.data.status === 'success') {
        const extractedSkillsData = response.data.data.resume?.extractedSkills || 
                                   response.data.data.extractedSkills || [];
        

        
        const formattedSkills = extractedSkillsData.map((skill, index) => ({
          id: `extracted_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          skillName: skill.skillName || skill.name || skill,
          proficiency: skill.proficiency || 'Intermediate',
          category: skill.category || 'Technical',
          status: 'Not Started',
          startDate: '',
          completionDate: '',
          notes: 'Extracted from resume',
          dateAdded: new Date().toISOString()
        }));

        setExtractedSkills(formattedSkills);
        
        toast({
          title: "Resume Analyzed",
          description: `Found ${formattedSkills.length} skills in your resume.`,
        });
      }
    } catch (err) {
      console.error('Error uploading resume:', err);
      
      let errorMessage = "Failed to analyze resume. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 413) {
        errorMessage = "File too large. Please upload a file smaller than 5MB.";
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid file format. Please upload a PDF, DOC, DOCX, or TXT file.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const addExtractedSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const newSkills = extractedSkills.filter(extractedSkill => 
        !user.existingSkills.some(existingSkill => 
          existingSkill.skillName.toLowerCase() === extractedSkill.skillName.toLowerCase()
        )
      );

      const updatedSkills = [...user.existingSkills, ...newSkills];
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile`,
        { ...user, existingSkills: updatedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setUser(prev => ({
          ...prev,
          existingSkills: updatedSkills
        }));
        
        setExtractedSkills([]);
        setShowResumeDialog(false);
        
        // Signal other components to refresh
        localStorage.setItem('profileUpdated', Date.now().toString());
        
        toast({
          title: "Skills Added",
          description: `${newSkills.length} skills have been added to your profile.`,
        });
      }
    } catch (err) {
      console.error('Error adding extracted skills:', err);
      toast({
        title: "Error",
        description: "Failed to add skills. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getSkillsByCategory = () => {
    const categories = {};
    user.existingSkills.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill);
    });
    return categories;
  };

  const getProfileCompletion = () => {
    const fields = [
      user.targetRole, user.bio, user.location, user.experienceLevel,
      user.preferredWorkType, user.availability, user.careerGoals
    ];
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getAchievements = () => [
    {
      id: 'skills_master',
      title: 'Skills Master',
      description: 'Add 10+ skills to your profile',
      unlocked: user.existingSkills.length >= 10,
      progress: Math.min((user.existingSkills.length / 10) * 100, 100)
    },
    {
      id: 'goal_setter',
      title: 'Goal Setter',
      description: 'Set your career goals',
      unlocked: user.careerGoals.trim() !== '',
      progress: user.careerGoals.trim() !== '' ? 100 : 0
    },
    {
      id: 'profile_complete',
      title: 'Profile Complete',
      description: 'Complete your profile',
      unlocked: getProfileCompletion() >= 80,
      progress: getProfileCompletion()
    },
    {
      id: 'resume_optimizer',
      title: 'Resume Optimizer',
      description: 'Upload and analyze your resume',
      unlocked: false,
      progress: 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <Card className="mb-8 overflow-hidden bg-white shadow-lg">
              <div className="h-16 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
              <CardContent className="relative bg-white pb-6">
                <div className="flex flex-col items-center md:flex-row md:items-end gap-6 -mt-8 relative z-10">
                  <div className="relative flex flex-col items-center md:items-start">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg bg-white">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="text-2xl bg-indigo-600 text-white">
                        {user.username ? user.username.substring(0, 2).toUpperCase() : 'JD'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-white shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setUser(prev => ({ ...prev, profilePicture: url }));
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 bg-white rounded-lg p-4 shadow-sm text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{user.username || 'User'}</h1>
                        <p className="text-lg text-gray-600">{user.targetRole || 'Add your target role'}</p>
                        <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1">
                          <MapPin className="w-4 h-4" />
                          {user.location || 'Add your location'}
                        </p>
                      </div>
                      
                      <div className="flex gap-4 justify-center md:justify-end text-center">
                        <div className="bg-indigo-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-indigo-600">{user.existingSkills?.length || 0}</div>
                          <div className="text-sm text-gray-500">Skills</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-emerald-600">85%</div>
                          <div className="text-sm text-gray-500">Complete</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center md:justify-start gap-2">
                      <Button
                        variant={editMode ? "default" : "outline"}
                        onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
                        className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium px-4 py-2 rounded-md transition-colors duration-200"
                        style={{ visibility: 'visible', opacity: '1' }}
                      >
                        {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {editMode ? 'Save Profile' : 'Edit Profile'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg gap-2 p-2">
                    <TabsTrigger value="overview" className="flex items-center gap-2 mx-1">
                      <User className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2 mx-1">
                      <Target className="w-4 h-4" />
                      Skills
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2 mx-1">
                      <Settings className="w-4 h-4" />
                      Preferences
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="flex items-center gap-2 mx-1">
                      <Award className="w-4 h-4" />
                      Achievements
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 pb-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Personal Information */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={user.username}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              value={user.email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="targetRole">Target Role</Label>
                            <Input
                              id="targetRole"
                              value={user.targetRole}
                              onChange={(e) => setUser(prev => ({ ...prev, targetRole: e.target.value }))}
                              disabled={!editMode}
                              placeholder="e.g., Full Stack Developer"
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={user.location}
                              onChange={(e) => setUser(prev => ({ ...prev, location: e.target.value }))}
                              disabled={!editMode}
                              placeholder="e.g., San Francisco, CA"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={user.bio}
                            onChange={(e) => setUser(prev => ({ ...prev, bio: e.target.value }))}
                            disabled={!editMode}
                            placeholder="Tell us about yourself..."
                            rows={4}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Social Links */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Social Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="website" className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Website
                            </Label>
                            <Input
                              id="website"
                              value={user.website}
                              onChange={(e) => setUser(prev => ({ ...prev, website: e.target.value }))}
                              disabled={!editMode}
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="linkedin" className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </Label>
                            <Input
                              id="linkedin"
                              value={user.linkedin}
                              onChange={(e) => setUser(prev => ({ ...prev, linkedin: e.target.value }))}
                              disabled={!editMode}
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="github" className="flex items-center gap-2">
                              <Github className="w-4 h-4" />
                              GitHub
                            </Label>
                            <Input
                              id="github"
                              value={user.github}
                              onChange={(e) => setUser(prev => ({ ...prev, github: e.target.value }))}
                              disabled={!editMode}
                              placeholder="https://github.com/username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="twitter" className="flex items-center gap-2">
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </Label>
                            <Input
                              id="twitter"
                              value={user.twitter}
                              onChange={(e) => setUser(prev => ({ ...prev, twitter: e.target.value }))}
                              disabled={!editMode}
                              placeholder="https://twitter.com/username"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Career Information */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Career Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="experienceLevel">Experience Level</Label>
                            <Select
                              value={user.experienceLevel}
                              onValueChange={(value) => setUser(prev => ({ ...prev, experienceLevel: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select experience level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Entry Level">Entry Level</SelectItem>
                                <SelectItem value="1-2 years">1-2 years</SelectItem>
                                <SelectItem value="3-5 years">3-5 years</SelectItem>
                                <SelectItem value="5-10 years">5-10 years</SelectItem>
                                <SelectItem value="10+ years">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="preferredWorkType">Preferred Work Type</Label>
                            <Select
                              value={user.preferredWorkType}
                              onValueChange={(value) => setUser(prev => ({ ...prev, preferredWorkType: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select work type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Full-time">Full-time</SelectItem>
                                <SelectItem value="Part-time">Part-time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Freelance">Freelance</SelectItem>
                                <SelectItem value="Remote Only">Remote Only</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="availability">Availability</Label>
                            <Select
                              value={user.availability}
                              onValueChange={(value) => setUser(prev => ({ ...prev, availability: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select availability" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Open to Opportunities">Open to Opportunities</SelectItem>
                                <SelectItem value="Not Looking">Not Looking</SelectItem>
                                <SelectItem value="Busy">Busy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="salaryRange">Salary Range</Label>
                            <Input
                              id="salaryRange"
                              value={user.salaryRange}
                              onChange={(e) => setUser(prev => ({ ...prev, salaryRange: e.target.value }))}
                              disabled={!editMode}
                              placeholder="e.g., $80k - $120k"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="careerGoals">Career Goals</Label>
                          <Textarea
                            id="careerGoals"
                            value={user.careerGoals}
                            onChange={(e) => setUser(prev => ({ ...prev, careerGoals: e.target.value }))}
                            disabled={!editMode}
                            placeholder="Describe your career goals..."
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <Switch
                            id="showSalaryPublic"
                            checked={user.showSalaryPublic}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, showSalaryPublic: checked }))}
                            disabled={!editMode}
                            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-300"
                          />
                          <Label htmlFor="showSalaryPublic" className="text-sm font-medium text-gray-700 cursor-pointer">Show salary range publicly</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Skills Tab */}
                  <TabsContent value="skills" className="space-y-6 mt-6">
                    {/* Skills Dashboard */}
                    <Card className="bg-white">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Skills Dashboard</CardTitle>
                        <div className="flex gap-2">
                          <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="bg-white border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 font-medium px-4 py-2 shadow-sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Resume
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Resume for Skill Analysis</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {!isUploading && extractedSkills.length === 0 && (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-4">Upload your resume to extract skills automatically</p>
                                    <input
                                      type="file"
                                      accept=".txt,.pdf,.doc,.docx"
                                      onChange={handleFileUpload}
                                      className="hidden"
                                      id="resume-upload"
                                    />
                                    <Button asChild>
                                      <label htmlFor="resume-upload" className="cursor-pointer">
                                        Choose File
                                      </label>
                                    </Button>
                                  </div>
                                )}
                                
                                {isUploading && (
                                  <div className="space-y-4">
                                    <div className="text-center">
                                      <p className="text-gray-600 mb-2">Analyzing your resume...</p>
                                      <Progress value={uploadProgress} className="w-full" />
                                    </div>
                                  </div>
                                )}
                                
                                {extractedSkills.length > 0 && (
                                  <div className="space-y-4">
                                    <h3 className="font-semibold">Extracted Skills:</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {extractedSkills.map((skill) => (
                                        <div key={skill.id} className="flex items-center justify-between p-2 border rounded">
                                          <div>
                                            <span className="font-medium">{skill.skillName}</span>
                                            <Badge variant="secondary" className={`ml-2 ${proficiencyColors[skill.proficiency]}`}>
                                              {skill.proficiency}
                                            </Badge>
                                          </div>
                                          <Badge variant="outline">{skill.category}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                    <Button onClick={addExtractedSkills} className="w-full">
                                      Add All Skills to Profile
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Skill
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Skill</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="skillName">Skill Name</Label>
                                  <Input
                                    id="skillName"
                                    value={newSkill.skillName}
                                    onChange={(e) => setNewSkill(prev => ({ ...prev, skillName: e.target.value }))}
                                    placeholder="e.g., React, Python, Project Management"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="proficiency">Proficiency Level</Label>
                                  <Select
                                    value={newSkill.proficiency}
                                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, proficiency: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Beginner">Beginner</SelectItem>
                                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                                      <SelectItem value="Advanced">Advanced</SelectItem>
                                      <SelectItem value="Expert">Expert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="category">Category</Label>
                                  <Select
                                    value={newSkill.category}
                                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, category: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Technical">Technical</SelectItem>
                                      <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                                      <SelectItem value="Tools">Tools</SelectItem>
                                      <SelectItem value="Frameworks">Frameworks</SelectItem>
                                      <SelectItem value="Languages">Languages</SelectItem>
                                      <SelectItem value="Methodologies">Methodologies</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleAddSkill} className="w-full">
                                  Add Skill
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-indigo-50 rounded-lg">
                            <div className="text-2xl font-bold text-indigo-600">{user.existingSkills.length}</div>
                            <div className="text-sm text-gray-600">Total Skills</div>
                          </div>
                          <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-600">
                              {user.existingSkills.filter(s => s.proficiency === 'Expert' || s.proficiency === 'Advanced').length}
                            </div>
                            <div className="text-sm text-gray-600">Advanced+ Skills</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Object.keys(getSkillsByCategory()).length}
                            </div>
                            <div className="text-sm text-gray-600">Categories</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skills by Category */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Skills by Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.existingSkills.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No skills added yet. Start by adding your first skill!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(getSkillsByCategory()).map(([category, skills]) => (
                              <div key={category} className="border rounded-lg">
                                <div
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleCategory(category)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedCategories[category] ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <h3 className="font-semibold">{category}</h3>
                                    <Badge variant="secondary">{skills.length}</Badge>
                                  </div>
                                </div>
                                
                                {expandedCategories[category] && (
                                  <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {skills.map((skill) => (
                                        <div
                                          key={skill.id}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{skill.skillName}</span>
                                            <Badge variant="secondary" className={proficiencyColors[skill.proficiency]}>
                                              {skill.proficiency}
                                            </Badge>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteSkill(skill.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Preferences Tab */}
                  <TabsContent value="preferences" className="space-y-6 mt-6">
                    {/* Work Preferences */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Work Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="experienceLevel">Experience Level</Label>
                            <Select
                              value={user.experienceLevel}
                              onValueChange={(value) => setUser(prev => ({ ...prev, experienceLevel: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select experience level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Entry Level">Entry Level</SelectItem>
                                <SelectItem value="1-2 years">1-2 years</SelectItem>
                                <SelectItem value="3-5 years">3-5 years</SelectItem>
                                <SelectItem value="5-10 years">5-10 years</SelectItem>
                                <SelectItem value="10+ years">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="preferredWorkType">Preferred Work Type</Label>
                            <Select
                              value={user.preferredWorkType}
                              onValueChange={(value) => setUser(prev => ({ ...prev, preferredWorkType: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select work type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Full-time">Full-time</SelectItem>
                                <SelectItem value="Part-time">Part-time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Freelance">Freelance</SelectItem>
                                <SelectItem value="Remote Only">Remote Only</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="availability">Availability</Label>
                            <Select
                              value={user.availability}
                              onValueChange={(value) => setUser(prev => ({ ...prev, availability: value }))}
                              disabled={!editMode}
                            >
                              <SelectTrigger className="bg-white border-2 border-gray-300 hover:border-indigo-400 focus:border-indigo-500 min-h-[40px]">
                                <SelectValue placeholder="Select availability" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Open to Opportunities">Open to Opportunities</SelectItem>
                                <SelectItem value="Not Looking">Not Looking</SelectItem>
                                <SelectItem value="Busy">Busy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="salaryRange">Salary Range</Label>
                            <Input
                              id="salaryRange"
                              value={user.salaryRange}
                              onChange={(e) => setUser(prev => ({ ...prev, salaryRange: e.target.value }))}
                              disabled={!editMode}
                              placeholder="e.g., $80k - $120k"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <Switch
                            id="showSalaryPublic"
                            checked={user.showSalaryPublic}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, showSalaryPublic: checked }))}
                            disabled={!editMode}
                            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-300"
                          />
                          <Label htmlFor="showSalaryPublic" className="text-sm font-medium text-gray-700 cursor-pointer">Show salary range publicly</Label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Privacy Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="profileVisibility">Profile Visibility</Label>
                          <Select
                            value={user.profileVisibility}
                            onValueChange={(value) => setUser(prev => ({ ...prev, profileVisibility: value }))}
                            disabled={!editMode}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Public">🌍 Public</SelectItem>
                              <SelectItem value="Limited">👥 Limited</SelectItem>
                              <SelectItem value="Private">🔒 Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showContactInfo"
                            checked={user.showContactInfo}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, showContactInfo: checked }))}
                            disabled={!editMode}
                          />
                          <Label htmlFor="showContactInfo">Show contact information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showAchievementsPublic"
                            checked={user.showAchievementsPublic}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, showAchievementsPublic: checked }))}
                            disabled={!editMode}
                          />
                          <Label htmlFor="showAchievementsPublic">Show achievements publicly</Label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="emailNotifications"
                            checked={user.emailNotifications}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, emailNotifications: checked }))}
                            disabled={!editMode}
                          />
                          <Label htmlFor="emailNotifications">Email notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="skillUpdateNotifications"
                            checked={user.skillUpdateNotifications}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, skillUpdateNotifications: checked }))}
                            disabled={!editMode}
                          />
                          <Label htmlFor="skillUpdateNotifications">Skill update notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="marketingEmails"
                            checked={user.marketingEmails}
                            onCheckedChange={(checked) => setUser(prev => ({ ...prev, marketingEmails: checked }))}
                            disabled={!editMode}
                          />
                          <Label htmlFor="marketingEmails">Marketing emails</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Achievements Tab */}
                  <TabsContent value="achievements" className="space-y-6 mt-6">
                    {/* Profile Completion */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Profile Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-gray-500">{getProfileCompletion()}%</span>
                          </div>
                          <Progress value={getProfileCompletion()} className="w-full" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.targetRole ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Target Role</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.bio ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Bio</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.location ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.experienceLevel ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Experience Level</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.preferredWorkType ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Work Type</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.careerGoals ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-sm">Career Goals</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Achievements Grid */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Achievements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getAchievements().map((achievement) => (
                            <div
                              key={achievement.id}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                achievement.unlocked
                                  ? 'border-yellow-300 bg-yellow-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${
                                  achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
                                }`}>
                                  <Trophy className={`w-6 h-6 ${
                                    achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <h3 className={`font-semibold ${
                                    achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'
                                  }`}>
                                    {achievement.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {achievement.description}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span>Progress</span>
                                      <span>{Math.round(achievement.progress)}%</span>
                                    </div>
                                    <Progress value={achievement.progress} className="h-2" />
                                  </div>
                                  {achievement.unlocked && (
                                    <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                                      ✨ Unlocked
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skills Statistics */}
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Skills Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {user.existingSkills.filter(s => s.proficiency === 'Beginner').length}
                            </div>
                            <div className="text-sm text-gray-600">Beginner</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {user.existingSkills.filter(s => s.proficiency === 'Intermediate').length}
                            </div>
                            <div className="text-sm text-gray-600">Intermediate</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {user.existingSkills.filter(s => s.proficiency === 'Advanced').length}
                            </div>
                            <div className="text-sm text-gray-600">Advanced</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {user.existingSkills.filter(s => s.proficiency === 'Expert').length}
                            </div>
                            <div className="text-sm text-gray-600">Expert</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile; 