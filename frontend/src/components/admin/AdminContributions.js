import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminContributions.css';

const API_URL = 'https://skillhub-backend-97uq.onrender.com/api';

// Add a local storage utility for contributions
const localContributionStorage = {
  saveApprovedContribution: (contribution) => {
    try {
      // Get existing approved contributions
      const existingData = localStorage.getItem('approvedContributions');
      let approvedContributions = existingData ? JSON.parse(existingData) : [];
      
      // Add new contribution with approval metadata
      const approvedContribution = {
        ...contribution,
        approvedAt: new Date().toISOString(),
        status: 'Approved',
        _localApproval: true
      };
      
      // Add to array and save back to localStorage
      approvedContributions.push(approvedContribution);
      localStorage.setItem('approvedContributions', JSON.stringify(approvedContributions));
      
      console.log('Saved contribution to browser localStorage as fallback');
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  getApprovedContributions: () => {
    try {
      const data = localStorage.getItem('approvedContributions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error retrieving from localStorage:', error);
      return [];
    }
  }
};

// Configure axios with retry logic
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000 // 60 seconds for all requests by default
});

// Add retry logic for network errors
axiosInstance.interceptors.response.use(null, async (error) => {
  const config = error.config;
  
  // Set maximum retry count
  if (!config || !config.retry) {
    config.retry = 3;
    config.retryDelay = 1000;
    config.retryCount = 0;
  }
  
  // If we still have retries left
  if (config.retryCount < config.retry) {
    config.retryCount += 1;
    console.log(`Retrying request (${config.retryCount}/${config.retry}): ${config.url}`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    
    // Increase delay for next retry (exponential backoff)
    config.retryDelay *= 2;
    
    // Retry the request
    return axiosInstance(config);
  }
  
  // No more retries, propagate the error
  return Promise.reject(error);
});

// Enhanced request interceptor for logging
axiosInstance.interceptors.request.use(config => {
  console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
  return config;
}, error => {
  console.error('Request setup error:', error);
  return Promise.reject(error);
});

// Custom spinner component to avoid React rendering issues
const Spinner = () => (
  <div className="spinner">
    <div className="spinner-inner"></div>
  </div>
);

// Add a new component to display locally approved contributions
const LocallyApprovedContributions = () => {
  const [localApprovals, setLocalApprovals] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Load locally approved contributions from localStorage
    const approvals = localContributionStorage.getApprovedContributions();
    setLocalApprovals(approvals);
  }, []);
  
  if (localApprovals.length === 0) {
    return null;
  }
  
  return (
    <div className="locally-approved-section">
      <div className="local-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
          Browser-Saved Approvals ({localApprovals.length})
        </h3>
        <p className="local-hint">These contributions were approved but saved only in your browser due to server issues</p>
      </div>
      
      {isExpanded && (
        <div className="local-approvals-list">
          {localApprovals.map((approval, index) => (
            <div key={index} className="local-approval-item">
              <div className="approval-header">
                <div className="approval-type">{approval.type}</div>
                <div className="approval-date">{new Date(approval.approvedAt).toLocaleString()}</div>
              </div>
              
              <div className="approval-content">
                <h4>
                  {approval.type === 'Skill' ? approval.data.skillName : 
                   approval.type === 'Tool' ? approval.data.toolName : 'Item'}
                </h4>
                <div className="approval-details">
                  <div><strong>Category:</strong> {approval.data.category}</div>
                  <div><strong>Contributor:</strong> {approval.contributorEmail}</div>
                  {approval.data.description && (
                    <div className="approval-description">
                      <strong>Description:</strong> {approval.data.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="local-actions">
            <button 
              className="export-local-btn"
              onClick={() => {
                // Create JSON file for download
                const dataStr = JSON.stringify(localApprovals, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                // Create download link and click it
                const exportFileDefaultName = `local-approvals-${new Date().toISOString().split('T')[0]}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              Export to JSON
            </button>
            
            <button
              className="clear-local-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all locally saved approvals? This cannot be undone.')) {
                  localStorage.removeItem('approvedContributions');
                  setLocalApprovals([]);
                }
              }}
            >
              Clear Saved Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add a utility for downloadable files
const fileDownloader = {
  downloadAsJson: (data, filename) => {
    try {
      // Create a pretty-printed JSON string
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contribution-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to download file:', error);
      return false;
    }
  },
  
  downloadAsCSV: (data, headers, filename) => {
    try {
      // Create CSV header row
      let csvContent = headers.join(',') + '\n';
      
      // Add data row
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      };
      
      // Add each row of data
      csvContent += Object.values(data).map(escapeCSV).join(',');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contribution-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to download CSV file:', error);
      return false;
    }
  },
  
  downloadAsExcel: (data, headers, filename) => {
    try {
      // Create Excel XML content
      let xmlContent = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
      xmlContent += '<Worksheet ss:Name="Contributions"><Table>';
      
      // Add header row
      xmlContent += '<Row>';
      headers.forEach(header => {
        xmlContent += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
      });
      xmlContent += '</Row>';
      
      // Add data row
      xmlContent += '<Row>';
      Object.values(data).forEach(value => {
        const cellValue = value === null || value === undefined ? '' : String(value);
        xmlContent += `<Cell><Data ss:Type="String">${cellValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
      });
      xmlContent += '</Row>';
      
      // Close tags
      xmlContent += '</Table></Worksheet></Workbook>';
      
      // Create and download the file
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contribution-${Date.now()}.xls`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to download Excel file:', error);
      return false;
    }
  }
};

// Add the ViewDetailsButton component definition at the top, before AdminContributions
const ViewDetailsButton = ({ contribution }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Function to format the data object nicely
  const formatData = (data) => {
    if (!data) return null;
    
    // Create items based on contribution type
    let items = [];
    
    if (contribution.type === 'Skill') {
      items = [
        { label: "Skill Name", value: data.skillName },
        { label: "Category", value: data.category },
        { label: "Description", value: data.description },
        { label: "Learning Resources", value: data.learningResources },
        { label: "Recommended Courses", value: data.recommendedCourses },
        { label: "Required Knowledge", value: data.requiredKnowledge },
        { label: "Related Skills", value: data.relatedSkills },
        { label: "Typical Applications", value: data.typicalApplications },
        { label: "Career Paths", value: data.careerPaths },
        { label: "Industry Relevance", value: data.industryRelevance }
      ];
    } else if (contribution.type === 'Tool') {
      items = [
        { label: "Tool Name", value: data.toolName },
        { label: "Category", value: data.category },
        { label: "Description", value: data.description },
        { label: "Primary Use Cases", value: data.primaryUseCases },
        { label: "Integration Points", value: data.integrationPoints },
        { label: "Learning Curve", value: data.learningCurve },
        { label: "Alternatives", value: data.alternatives },
        { label: "Getting Started Resources", value: data.gettingStartedResources }
      ];
    }
    
    // Filter out empty values and return formatted items
    return items.filter(item => item.value);
  };
  
  const formattedItems = formatData(contribution.data);
  
  return (
    <div className="view-details-container">
      <button 
        className="view-details-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? "Hide Details" : "View Full Details"}
      </button>
      
      {showDetails && formattedItems && (
        <div className="full-details-panel">
          <h4>Complete Submission Details</h4>
          
          <div className="details-list">
            {formattedItems.map((item, index) => (
              <div key={index} className="detail-item">
                <div className="detail-label">{item.label}:</div>
                <div className="detail-value">{item.value}</div>
              </div>
            ))}
            
            <div className="detail-item">
              <div className="detail-label">Submission Date:</div>
              <div className="detail-value">
                {new Date(contribution.createdAt).toLocaleString()}
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-label">Contribution ID:</div>
              <div className="detail-value">{contribution._id}</div>
            </div>
          </div>
          
          {/* Show raw data for debugging */}
          <div className="raw-data-container">
            <details>
              <summary>Raw Submission Data (JSON)</summary>
              <pre className="raw-json">
                {JSON.stringify(contribution, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [csvLink, setCsvLink] = useState('');
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    lastChecked: Date.now()
  });
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({ isOnline: true, lastChecked: Date.now() });
      console.log('Network connection restored');
    };
    
    const handleOffline = () => {
      setNetworkStatus({ isOnline: false, lastChecked: Date.now() });
      console.log('Network connection lost');
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check server connectivity every 30 seconds
    const intervalId = setInterval(() => {
      // Simple HEAD request to check server connectivity
      fetch(`${API_URL}/health`, { method: 'HEAD' })
        .then(() => {
          setNetworkStatus({ isOnline: true, lastChecked: Date.now() });
        })
        .catch(() => {
          // Only set offline if we're currently showing as online
          // to avoid too many state updates
          if (networkStatus.isOnline) {
            setNetworkStatus({ isOnline: false, lastChecked: Date.now() });
          }
        });
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [networkStatus.isOnline]);
  
  // Network status indicator component
  const NetworkStatusIndicator = () => {
    const timeAgo = Math.round((Date.now() - networkStatus.lastChecked) / 1000);
    
    return (
      <div className={`network-status ${networkStatus.isOnline ? 'online' : 'offline'}`}>
        <span className="status-icon"></span>
        {networkStatus.isOnline 
          ? `Server connection active (checked ${timeAgo}s ago)` 
          : `Server connection unavailable (${timeAgo}s ago) - Local backup active`}
      </div>
    );
  };

  const refreshContributions = () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    setCsvLink('');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setError('No admin authorization token found. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Fetch pending contributions using axiosInstance instead of axios
        const response = await axiosInstance.get(`/contributions/pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.data && response.data.data.contributions) {
          setContributions(response.data.data.contributions);
          
          // Initialize review notes state
          const notesObj = {};
          response.data.data.contributions.forEach(contrib => {
            notesObj[contrib._id] = '';
          });
          setReviewNotes(notesObj);
        } else {
          setContributions([]);
          console.error('Unexpected API response format:', response.data);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching contributions:', err);
        setError('Failed to load contributions. Make sure you have admin privileges.');
        setIsLoading(false);
      }
    };

    fetchContributions();
  }, [refreshTrigger]);

  const handleNotesChange = (id, value) => {
    setReviewNotes({
      ...reviewNotes,
      [id]: value
    });
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(prev => ({...prev, [id]: true}));
      setError(null);
      setSuccessMessage('');
      
      // Find the contribution to approve in our local state
      const contributionToApprove = contributions.find(c => c._id === id);
      if (!contributionToApprove) {
        setError('Could not find the contribution data to approve');
        setActionLoading(prev => ({...prev, [id]: false}));
        return;
      }

      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('No admin authorization token found. Please log in again.');
        setActionLoading(prev => ({...prev, [id]: false}));
        return;
      }
      
      console.log(`Initiating approval for contribution ${id}`);
      
      // If we know we're offline, skip the server request completely
      if (!networkStatus.isOnline) {
        console.log('Network is offline - proceeding directly to local fallback');
        throw new Error('Network is offline');
      }
      
      try {
        // Extended timeout for local file operations
        axiosInstance.defaults.timeout = 60000; // 60 seconds
        
        // Simpler request - no Google Sheets, only local storage
        const response = await axiosInstance.patch(`/contributions/review/${id}`, {
        status: 'Approved',
          reviewerNotes: reviewNotes[id] || ''
      }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      });
      
      console.log('Server response:', response.data);
      
        // Check if there was a success
        if (response.data && response.data.status === 'success') {
          let message = 'Contribution approved successfully!';
          
          // Add details about where data was saved
          if (response.data.data) {
            const { jsonSaved, csvSaved, localSaved, filePath } = response.data.data;
            
            const savedLocations = [];
            if (jsonSaved) savedLocations.push('JSON file');
            if (csvSaved) savedLocations.push('CSV file');
            if (localSaved) savedLocations.push('local storage');
            
            if (savedLocations.length > 0) {
              message += ` Data was saved to: ${savedLocations.join(', ')}.`;
            }
            
            // Show file path if available
            if (filePath) {
              message += ` File location: ${filePath}`;
                }
            
            // Show any warnings
            if (response.data.data.warning) {
              console.warn('Warning from server:', response.data.data.warning);
            }
          }
          
          setSuccessMessage(message);
          setContributions(contributions.filter(contrib => contrib._id !== id));
          
          // Refresh to get any new pending contributions
          setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
          }, 1000);
        } else {
          throw new Error('Unexpected response format from server');
        }
      } catch (serverError) {
        console.error('Server approval failed, creating downloadable files instead:', serverError);
        
        // Update network status if this was a network error
        if (serverError.code === 'ERR_NETWORK' || serverError.message.includes('Network Error')) {
          setNetworkStatus({ isOnline: false, lastChecked: Date.now() });
        }
        
        // Create an approved version of the contribution with metadata
        const approvedContribution = {
          ...contributionToApprove,
          approvedAt: new Date().toISOString(),
          status: 'Approved',
          locallyApproved: true,
          reviewNotes: reviewNotes[id] || ''
        };
        
        // Save to localStorage still as backup
        localContributionStorage.saveApprovedContribution(approvedContribution);
        
        // Generate file name with contribution type and name
        let fileName = 'approved-contribution';
        if (contributionToApprove.type === 'Skill' && contributionToApprove.data.skillName) {
          fileName = `approved-skill-${contributionToApprove.data.skillName.replace(/\s+/g, '-').toLowerCase()}`;
        } else if (contributionToApprove.type === 'Tool' && contributionToApprove.data.toolName) {
          fileName = `approved-tool-${contributionToApprove.data.toolName.replace(/\s+/g, '-').toLowerCase()}`;
        }
        fileName += `-${new Date().toISOString().split('T')[0]}`;
        
        // Download as JSON file
        const jsonDownloaded = fileDownloader.downloadAsJson(
          approvedContribution, 
          `${fileName}.json`
        );
        
        // Try CSV download too for easier import
        let csvDownloaded = false;
        let excelDownloaded = false;
        try {
          // Define headers based on contribution type
          let headers, data;
          
          if (contributionToApprove.type === 'Skill') {
            headers = ['ID', 'Name', 'Category', 'Description', 'Learning Resources', 'Contributor Email', 'Approved Date'];
            data = {
              ID: approvedContribution._id || `SKILL_${Date.now()}`,
              Name: approvedContribution.data.skillName || '',
              Category: approvedContribution.data.category || '',
              Description: approvedContribution.data.description || '',
              'Learning Resources': approvedContribution.data.learningResources || '',
              'Contributor Email': approvedContribution.contributorEmail || '',
              'Approved Date': approvedContribution.approvedAt
            };
          } else if (contributionToApprove.type === 'Tool') {
            headers = ['ID', 'Name', 'Category', 'Description', 'Primary Use Cases', 'Contributor Email', 'Approved Date'];
            data = {
              ID: approvedContribution._id || `TOOL_${Date.now()}`,
              Name: approvedContribution.data.toolName || '',
              Category: approvedContribution.data.category || '',
              Description: approvedContribution.data.description || '',
              'Primary Use Cases': approvedContribution.data.primaryUseCases || '',
              'Contributor Email': approvedContribution.contributorEmail || '',
              'Approved Date': approvedContribution.approvedAt
            };
          }
          
          if (headers && data) {
            // CSV download
            csvDownloaded = fileDownloader.downloadAsCSV(
              data,
              headers,
              `${fileName}.csv`
            );
            
            // Excel download
            excelDownloaded = fileDownloader.downloadAsExcel(
              data,
              headers,
              `${fileName}.xls`
            );
          }
        } catch (exportError) {
          console.warn('Failed to create export files:', exportError);
        }
        
        // Show success message for file downloads
        if (jsonDownloaded) {
          let downloadFormats = 'JSON';
          if (csvDownloaded) downloadFormats += ' and CSV';
          if (excelDownloaded) downloadFormats += csvDownloaded ? ' and Excel' : ' and Excel';
          
          let offlineMessage = networkStatus.isOnline ? '' : ' (Server connection unavailable)';
          
          setSuccessMessage(
            `Contribution approved! Files have been downloaded to your computer (${downloadFormats}).${offlineMessage} ` +
            'The data has also been saved in your browser as a backup.'
          );
          setContributions(contributions.filter(contrib => contrib._id !== id));
        } else {
          throw new Error('Failed to create downloadable files');
        }
      }
    } catch (err) {
      console.error('Error approving contribution:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      } else if (err.request) {
        console.error('No response received. Request:', err.request);
      } else {
        console.error('Error setting up request:', err.message);
      }
      
      // More helpful error message
      let errorMessage = 'Failed to approve contribution: ';
      
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. The server might be busy or the file operations are taking too long.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setActionLoading(prev => ({...prev, [id]: false}));
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(prev => ({...prev, [id]: true}));
      setError(null);
      setSuccessMessage('');
      
      // Find the contribution to reject in our local state
      const contributionToReject = contributions.find(c => c._id === id);
      if (!contributionToReject) {
        setError('Could not find the contribution data to reject');
        setActionLoading(prev => ({...prev, [id]: false}));
        return;
      }
      
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('No admin authorization token found. Please log in again.');
        setActionLoading(prev => ({...prev, [id]: false}));
        return;
      }
      
      console.log(`Initiating rejection for contribution ${id}`);
      
      // If we know we're offline, skip the server request completely
      if (!networkStatus.isOnline) {
        console.log('Network is offline - proceeding with local rejection');
        
        // Just remove from the UI since rejection doesn't need to be stored
        setSuccessMessage('Contribution rejected successfully (offline mode).');
        setContributions(contributions.filter(contrib => contrib._id !== id));
        setActionLoading(prev => ({...prev, [id]: false}));
        return;
      }
      
      try {
        // Use axiosInstance for retry and better error handling
        const response = await axiosInstance.patch(`/contributions/review/${id}`, {
        status: 'Rejected',
          reviewerNotes: reviewNotes[id] || ''
      }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      });
        
        console.log('Server response for rejection:', response.data);
      
      setSuccessMessage('Contribution rejected successfully!');
      
        // Remove from local state
        setContributions(contributions.filter(contrib => contrib._id !== id));
        
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 1000);
      } catch (serverError) {
        console.error('Server rejection failed, handling locally:', serverError);
        
        // Update network status if this was a network error
        if (serverError.code === 'ERR_NETWORK' || serverError.message.includes('Network Error')) {
          setNetworkStatus({ isOnline: false, lastChecked: Date.now() });
        }
        
        // For rejections, we don't need to save anything locally - just remove from UI
        setSuccessMessage('Contribution rejected locally. Server will be updated when connection is restored.');
        
        // Remove from local UI regardless of server error
      setContributions(contributions.filter(contrib => contrib._id !== id));
      }
    } catch (err) {
      console.error('Error rejecting contribution:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      } else if (err.request) {
        console.error('No response received. Request:', err.request);
      } else {
        console.error('Error setting up request:', err.message);
      }
      
      // More helpful error message
      let errorMessage = 'Failed to reject contribution: ';
      
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. The server might be busy.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setActionLoading(prev => ({...prev, [id]: false}));
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <Spinner />
        <p>Loading contributions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Error</h3>
        <p>{error}</p>
        <div className="error-details">
          <p className="error-hint">
            This might be a temporary network issue. Please try again in a few moments.
          </p>
        </div>
        <button onClick={refreshContributions}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-contributions">
      <div className="admin-section-header">
        <div className="header-left">
          <h2>Pending Contributions</h2>
          <p>Review and manage user contributions</p>
        </div>
        <div className="header-right">
          <button 
            className="refresh-btn" 
            onClick={refreshContributions}
            disabled={loading}
          >
            {loading ? <Spinner /> : "Refresh"}
          </button>
        </div>
      </div>
      
      {successMessage && (
        <div className="success-message">
          <div className="success-content">
            <p>{successMessage}</p>
            {csvLink && (
              <div 
                className="csv-link-container" 
                dangerouslySetInnerHTML={{ __html: csvLink }}
              />
            )}
          </div>
          <button 
            onClick={() => {
              setSuccessMessage('');
              setCsvLink('');
            }} 
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}

      {/* Add the locally approved contributions component */}
      <LocallyApprovedContributions />

      {/* Add the network status indicator component */}
      <NetworkStatusIndicator />

      {contributions.length === 0 ? (
        <div className="no-contributions">
          <h3>No pending contributions</h3>
          <p>All contributions have been reviewed. Check back later for new submissions.</p>
        </div>
      ) : (
        <div className="contributions-list">
          {contributions.map((contribution) => (
            <div key={contribution._id} className="contribution-card">
              <div className="contribution-header">
                <div className="contribution-type-badge">
                  {contribution.type}
                </div>
                <div className="contribution-date">
                  {new Date(contribution.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="contribution-content">
                <div className="contribution-details">
                  <h3>
                    {contribution.type === 'Skill' ? contribution.data.skillName : 
                     contribution.type === 'Tool' ? contribution.data.toolName : 
                     'Contribution'}
                  </h3>
                  
                  <div className="contribution-meta">
                    {contribution.type === 'Skill' && (
                      <div className="meta-item">
                        <span className="meta-label">Category:</span> 
                        {contribution.data.category}
                      </div>
                    )}
                    {contribution.type === 'Tool' && (
                      <div className="meta-item">
                        <span className="meta-label">Category:</span>
                        {contribution.data.category}
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Contributor:</span>
                      {contribution.contributorEmail}
                    </div>
                  </div>
                  
                  <div className="contribution-description">
                    {contribution.type === 'Skill' && contribution.data.description ? 
                      contribution.data.description : 
                     contribution.type === 'Tool' && contribution.data.description ? 
                      contribution.data.description : 
                     "Additional data available"}
                  </div>
                  
                  {/* Add View Details button */}
                  <ViewDetailsButton contribution={contribution} />
                </div>
              </div>
              
              <div className="review-section">
                <textarea
                  className="review-notes"
                  placeholder="Add review notes (optional)"
                  value={reviewNotes[contribution._id] || ""}
                  onChange={(e) => handleNotesChange(contribution._id, e.target.value)}
                ></textarea>
                
                <div className="review-actions">
                  <button 
                    className="reject-btn"
                    onClick={() => handleReject(contribution._id)}
                    disabled={actionLoading[contribution._id]}
                  >
                    {actionLoading[contribution._id] ? <Spinner /> : "Reject"}
                  </button>
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(contribution._id)}
                    disabled={actionLoading[contribution._id]}
                  >
                    {actionLoading[contribution._id] ? <Spinner /> : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContributions; 