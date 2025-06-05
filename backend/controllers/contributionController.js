const Contribution = require('../models/Contribution');
const Admin = require('../models/Admin');
const geminiService = require('../services/geminiService');
const sheetsUpdateService = require('../services/sheetsUpdateService');
const nodemailer = require('nodemailer');

// Create email transporter (commented out since we need actual credentials)
/*
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
*/

// Submit a contribution
exports.submitContribution = async (req, res) => {
  try {
    const { type, data, email } = req.body;
    
    // Log the received contribution for debugging
    console.log('Received contribution:', type);
    console.log('Data:', data);
    console.log('Email:', email);
    
    if (!type || !data || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid email format'
      });
    }
    
    // Create a copy of the data object to avoid modifying the original
    const processedData = { ...data };
    
    // Enhanced description with Gemini if keywords are provided
    if (type === 'Skill' && processedData.descriptionKeywords) {
      try {
        if (process.env.GEMINI_API_KEY) {
          processedData.learningResources = await geminiService.enhanceSkillDescription(
            processedData.descriptionKeywords,
            processedData.skillName,
            processedData.category
          );
          console.log('Successfully enhanced skill description with Gemini');
        } else {
          // No Gemini API key, fallback to using keywords directly
          processedData.learningResources = processedData.descriptionKeywords;
          console.log('Gemini API Key not available - using keywords as is');
        }
      } catch (error) {
        console.error('Gemini enhancement error:', error);
        // Use descriptionKeywords as fallback
        processedData.learningResources = processedData.descriptionKeywords;
      }
      // Remove from data as it's processed
      delete processedData.descriptionKeywords;
    } else if (type === 'Tool' && processedData.descriptionKeywords) {
      try {
        if (process.env.GEMINI_API_KEY) {
          processedData.primaryUseCases = await geminiService.enhanceToolDescription(
            processedData.descriptionKeywords,
            processedData.toolName,
            processedData.category
          );
          console.log('Successfully enhanced tool description with Gemini');
        } else {
          // No Gemini API key, fallback to using keywords directly
          processedData.primaryUseCases = processedData.descriptionKeywords;
          console.log('Gemini API Key not available - using keywords as is');
        }
      } catch (error) {
        console.error('Gemini enhancement error:', error);
        // Use descriptionKeywords as fallback
        processedData.primaryUseCases = processedData.descriptionKeywords;
      }
      // Remove from data as it's processed
      delete processedData.descriptionKeywords;
    }
    
    // Create new contribution
    const contribution = new Contribution({
      type,
      data: processedData,
      contributorEmail: email
    });
    
    await contribution.save();
    
    // Notify admins (commented out until email functionality is set up)
    /*
    const admins = await Admin.find();
    if (admins.length > 0) {
      const adminEmails = admins.map(admin => admin.email);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmails.join(','),
        subject: `New ${type} Contribution Submitted`,
        text: `A new ${type} has been submitted for review.\n\nContributor: ${email}\n\nPlease login to the admin panel to review the submission.`,
        html: `<h3>New ${type} Contribution</h3>
               <p>A new ${type} has been submitted for review.</p>
               <p><strong>Contributor:</strong> ${email}</p>
               <p>Please login to the admin panel to review the submission.</p>`
      };
      
      transporter.sendMail(mailOptions);
    }
    */
    
    res.status(201).json({
      status: 'success',
      message: 'Contribution submitted successfully',
      data: {
        contributionId: contribution._id
      }
    });
  } catch (error) {
    console.error('Contribution submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit contribution',
      error: error.message
    });
  }
};

// Admin: Get all pending contributions
exports.getPendingContributions = async (req, res) => {
  try {
    // Verify admin
    const adminId = req.admin.adminId;
    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied'
      });
    }
    
    const pendingContributions = await Contribution.find({ status: 'Pending' })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: pendingContributions.length,
      data: {
        contributions: pendingContributions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending contributions',
      error: error.message
    });
  }
};

// Admin: Review a contribution
exports.reviewContribution = async (req, res) => {
  try {
    console.log('Review Contribution API called');
    const { contributionId } = req.params;
    const { status, reviewerNotes, prioritizeLocalSaving } = req.body;
    
    console.log(`Reviewing contribution ${contributionId} with status: ${status}`);
    console.log('Request body:', JSON.stringify(req.body));
    
    // Declare contribution variable outside try-catch so it's accessible throughout the function
    let contribution = null;
    
    // Update database first - this is the most important part
    try {
    // Verify admin
    const adminId = req.admin.adminId;
      console.log(`Admin ID: ${adminId}`);
      
    const admin = await Admin.findById(adminId);
    
    if (!admin) {
        console.log('Admin verification failed');
      return res.status(403).json({
        status: 'fail',
        message: 'Access denied'
      });
    }
    
      console.log('Admin verified, looking for contribution');
    contribution = await Contribution.findById(contributionId);
    
    if (!contribution) {
        console.log(`Contribution not found: ${contributionId}`);
      return res.status(404).json({
        status: 'fail',
        message: 'Contribution not found'
      });
    }
      
      console.log(`Found contribution: ${contribution._id}`);
    
    // Update contribution status
    contribution.status = status;
    if (reviewerNotes) {
      contribution.reviewerNotes = reviewerNotes;
    }
    contribution.updatedAt = new Date();
    
      await contribution.save();
      console.log(`Successfully updated contribution status to: ${status}`);
      
      // If this was a rejection, just return success now - no need to process files
      if (status === 'Rejected') {
        return res.status(200).json({
          status: 'success',
          message: 'Contribution rejected successfully',
          data: {
            contributionId,
            status
          }
        });
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update contribution status in database',
        error: dbError.message
      });
    }
    
    // For approved contributions, try to save to Google Sheets and local storage
    let dataUpdateResult = null;
    let exportError = null;
    
    // This part can fail without failing the whole request - we've already updated the database
    if (status === 'Approved') {
      console.log(`Contribution approved: ${contribution.type}`);
      
      try {
        // Set contributorEmail in the data object
        const dataWithEmail = { 
          ...contribution.data, 
          contributorEmail: contribution.contributorEmail 
        };
        
        // Try to save to Google Sheets and local storage
        try {
          if (contribution.type === 'Skill') {
            console.log('Adding skill to Google Sheets and local storage');
            dataUpdateResult = await sheetsUpdateService.addSkillToSheet(dataWithEmail);
            console.log('Skill save result:', dataUpdateResult);
          } else if (contribution.type === 'Tool') {
            console.log('Adding tool to Google Sheets and local storage');
            dataUpdateResult = await sheetsUpdateService.addToolToSheet(dataWithEmail);
            console.log('Tool save result:', dataUpdateResult);
          }
        } catch (saveError) {
          console.error('Error saving to Google Sheets and local storage:', saveError);
          exportError = saveError.message;
          
          // Don't fail the entire operation, the database was already updated
          dataUpdateResult = {
            success: true,
            error: saveError.message,
            googleSheetsSuccess: false,
            localSaved: false
          };
        }
      } catch (dataError) {
        console.error('Error processing contribution data:', dataError);
        exportError = dataError.message;
        
        // Don't fail the entire operation, the database was already updated
        dataUpdateResult = {
          success: true,
          error: dataError.message,
          localSaved: false,
          csvSaved: false
        };
      }
    }
    
    // Send response with detailed information
    console.log('Sending successful response');
    
    const responseData = {
      status: 'success',
      message: `Contribution ${status.toLowerCase()} successfully`,
      data: {
        contributionId,
        status,
        updatedAt: contribution.updatedAt
      }
    };
    
    // Add data from the update result if available
    if (dataUpdateResult) {
      responseData.data.googleSheetsSuccess = !!dataUpdateResult.googleSheetsSuccess;
      responseData.data.localSaved = !!dataUpdateResult.localSaved;
      responseData.data.filePath = dataUpdateResult.filePath;
      responseData.data.sheetInfo = dataUpdateResult.sheetInfo;
      
      // Update the message to include where data was saved
      if (dataUpdateResult.googleSheetsSuccess && dataUpdateResult.localSaved) {
        responseData.message += ' and data was saved to Google Sheets and local storage';
      } else if (dataUpdateResult.googleSheetsSuccess) {
        responseData.message += ' and data was saved to Google Sheets';
      } else if (dataUpdateResult.localSaved) {
        responseData.message += ' and data was saved to local storage';
      }
      
      // Add any warnings
      if (dataUpdateResult.warning || dataUpdateResult.error || exportError) {
        responseData.data.warning = dataUpdateResult.warning || dataUpdateResult.error || exportError;
      }
    }
    
    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Contribution review error:', error);
    console.error('Stack trace:', error.stack);
    
    // More detailed error handling
    const errorResponse = {
      status: 'error',
      message: 'Failed to review contribution',
      error: error.message
    };
    
    // Include more details in development mode
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
      errorResponse.code = error.code;
      
      if (error.name === 'ValidationError') {
        errorResponse.validationErrors = error.errors;
      }
    }
    
    res.status(500).json(errorResponse);
  }
};

// Get all contributions (for testing purposes)
exports.getAllContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: contributions.length,
      data: {
        contributions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch contributions',
      error: error.message
    });
  }
}; 