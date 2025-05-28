const User = require('../models/User');

// Update user profile with enhanced fields
exports.updateUserProfile = async (req, res) => {
  try {
    const {
      existingSkills,
      targetRole,
      profilePicture,
      bio,
      location,
      website,
      linkedIn,
      github,
      twitter,
      experience,
      careerGoals,
      availability,
      preferredWorkType,
      salaryRange,
      profileVisibility,
      emailNotifications,
      skillUpdateNotifications,
      marketingEmails
    } = req.body;
    
    const userId = req.user.userId; // From auth middleware
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Update basic profile fields
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (targetRole !== undefined) user.targetRole = targetRole;
    
    // Update social links
    if (website !== undefined) user.website = website;
    if (linkedIn !== undefined) user.linkedIn = linkedIn;
    if (github !== undefined) user.github = github;
    if (twitter !== undefined) user.twitter = twitter;
    
    // Update career information
    if (experience !== undefined) user.experience = experience;
    if (careerGoals !== undefined) user.careerGoals = careerGoals;
    if (availability !== undefined) user.availability = availability;
    if (preferredWorkType !== undefined) user.preferredWorkType = preferredWorkType;
    if (salaryRange !== undefined) user.salaryRange = salaryRange;
    
    // Update privacy and notification settings
    if (profileVisibility !== undefined) user.profileVisibility = profileVisibility;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (skillUpdateNotifications !== undefined) user.skillUpdateNotifications = skillUpdateNotifications;
    if (marketingEmails !== undefined) user.marketingEmails = marketingEmails;
    
    // Update skills with enhanced structure
    if (existingSkills) {
      user.existingSkills = existingSkills.map(skill => ({
        skillName: skill.skillName,
        proficiency: skill.proficiency || 'Beginner',
        category: skill.category || 'Technical',
        status: skill.status || 'Not Started',
        startDate: skill.startDate || null,
        completionDate: skill.completionDate || null,
        notes: skill.notes || '',
        dateAdded: skill.dateAdded || new Date()
      }));
    }
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update skill progress
exports.updateSkillProgress = async (req, res) => {
  try {
    const { skillName, proficiency, status, notes } = req.body;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Find the skill in user's existing skills
    const skillIndex = user.existingSkills.findIndex(
      skill => skill.skillName.toLowerCase() === skillName.toLowerCase()
    );
    
    if (skillIndex === -1) {
      // Skill not found, add new skill
      user.existingSkills.push({
        skillName,
        proficiency: proficiency || 'Beginner',
        status: status || 'Not Started',
        startDate: new Date(),
        notes: notes || ''
      });
    } else {
      // Update existing skill
      if (proficiency) {
        user.existingSkills[skillIndex].proficiency = proficiency;
      }
      
      if (status) {
        user.existingSkills[skillIndex].status = status;
        
        // Update dates based on status
        if (status === 'In Progress' && !user.existingSkills[skillIndex].startDate) {
          user.existingSkills[skillIndex].startDate = new Date();
        } else if (status === 'Completed') {
          user.existingSkills[skillIndex].completionDate = new Date();
        }
      }
      
      if (notes) {
        user.existingSkills[skillIndex].notes = notes;
      }
    }
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        skill: user.existingSkills.find(
          skill => skill.skillName.toLowerCase() === skillName.toLowerCase()
        )
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
}; 