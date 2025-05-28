import React, { useState, useEffect } from 'react';
import './AdminContributions.css';

// File download utility
const downloadFile = (data, fileName, type) => {
  // Create a blob with the data
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

// Utility to format contribution data for exporting
const formatExportData = (contributions) => {
  // Create a more structured format for export
  return contributions.map(contribution => {
    const { type, data, contributorEmail, approvedAt, reviewNotes } = contribution;
    
    // Common fields
    const formatted = {
      id: contribution._id,
      type,
      approvedAt,
      contributorEmail,
      reviewNotes: reviewNotes || '',
      locallyApproved: true
    };
    
    // Type-specific fields
    if (type === 'Skill') {
      formatted.name = data.skillName;
      formatted.category = data.category;
      formatted.description = data.description || '';
      formatted.learningResources = data.learningResources || '';
    } else if (type === 'Tool') {
      formatted.name = data.toolName;
      formatted.category = data.category;
      formatted.description = data.description || '';
      formatted.primaryUseCases = data.primaryUseCases || '';
    }
    
    return formatted;
  });
};

// Component for displaying and managing locally approved contributions
const LocallyApprovedContributions = () => {
  const [localApprovals, setLocalApprovals] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Load locally approved contributions from localStorage
  useEffect(() => {
    try {
      const data = localStorage.getItem('approvedContributions');
      const approvals = data ? JSON.parse(data) : [];
      setLocalApprovals(approvals);
    } catch (error) {
      console.error('Error loading local approvals:', error);
      setLocalApprovals([]);
    }
  }, []);
  
  // If no locally saved approvals, don't render anything
  if (localApprovals.length === 0) {
    return null;
  }
  
  // Export local approvals in various formats
  const handleExport = (format) => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const formattedData = formatExportData(localApprovals);
      
      switch (format) {
        case 'json':
          // Export as pretty-printed JSON
          const jsonData = JSON.stringify(formattedData, null, 2);
          downloadFile(jsonData, `approved-contributions-${timestamp}.json`, 'application/json');
          break;
          
        case 'csv':
          // Export as CSV
          // Create headers based on the fields
          const headers = ['id', 'type', 'name', 'category', 'description', 'contributorEmail', 'approvedAt'];
          
          // Create CSV content
          let csvContent = headers.join(',') + '\n';
          
          // Add each row
          formattedData.forEach(item => {
            const row = [
              item.id || '',
              item.type || '',
              item.name || '',
              item.category || '',
              item.description ? `"${item.description.replace(/"/g, '""')}"` : '',
              item.contributorEmail || '',
              item.approvedAt || ''
            ];
            csvContent += row.join(',') + '\n';
          });
          
          // Download the CSV file
          downloadFile(csvContent, `approved-contributions-${timestamp}.csv`, 'text/csv');
          break;
          
        case 'excel':
          // Export as Excel-compatible CSV with BOM for proper character encoding
          const excelCsvContent = '\uFEFF' + headers.join(',') + '\n' + 
            formattedData.map(item => {
              return [
                item.id || '',
                item.type || '',
                item.name || '',
                item.category || '',
                item.description ? `"${item.description.replace(/"/g, '""')}"` : '',
                item.contributorEmail || '',
                item.approvedAt || ''
              ].join(',');
            }).join('\n');
          
          downloadFile(excelCsvContent, `approved-contributions-${timestamp}.csv`, 'text/csv;charset=utf-8;');
          break;
          
        default:
          console.error('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Clear all locally saved approvals
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all locally saved approvals? This cannot be undone.')) {
      localStorage.removeItem('approvedContributions');
      setLocalApprovals([]);
    }
  };
  
  return (
    <div className="locally-approved-section">
      <div className="local-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>
          <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
          Browser-Saved Approvals ({localApprovals.length})
        </h3>
        <p className="local-hint">
          These contributions were approved but saved only in your browser due to server issues
        </p>
      </div>
      
      {isExpanded && (
        <div className="local-approvals-list">
          {localApprovals.map((approval, index) => (
            <div key={index} className="local-approval-item">
              <div className="approval-header">
                <div className="approval-type">{approval.type}</div>
                <div className="approval-date">
                  {approval.approvedAt ? new Date(approval.approvedAt).toLocaleString() : 'Unknown date'}
                </div>
              </div>
              
              <div className="approval-content">
                <h4>
                  {approval.type === 'Skill' && approval.data.skillName ? approval.data.skillName : 
                   approval.type === 'Tool' && approval.data.toolName ? approval.data.toolName : 
                   'Unnamed Contribution'}
                </h4>
                <div className="approval-details">
                  <div><strong>Category:</strong> {approval.data.category || 'Not specified'}</div>
                  <div><strong>Contributor:</strong> {approval.contributorEmail || 'Unknown'}</div>
                  
                  {approval.data.description && (
                    <div className="approval-description">
                      <strong>Description:</strong> {approval.data.description}
                    </div>
                  )}
                  
                  {/* Individual export button for this particular contribution */}
                  <button 
                    className="export-single-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Create file name based on contribution type and name
                      let fileName = 'contribution';
                      if (approval.type === 'Skill' && approval.data.skillName) {
                        fileName = `skill-${approval.data.skillName.replace(/\s+/g, '-').toLowerCase()}`;
                      } else if (approval.type === 'Tool' && approval.data.toolName) {
                        fileName = `tool-${approval.data.toolName.replace(/\s+/g, '-').toLowerCase()}`;
                      }
                      fileName += `-${new Date().toISOString().split('T')[0]}.json`;
                      
                      // Download this specific contribution
                      const jsonData = JSON.stringify(approval, null, 2);
                      downloadFile(jsonData, fileName, 'application/json');
                    }}
                  >
                    Export This Item
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="local-actions">
            <div className="export-options">
              <span className="export-label">Export all as:</span>
              <button 
                className="export-btn json-btn"
                disabled={isExporting}
                onClick={() => handleExport('json')}
              >
                JSON
              </button>
              <button 
                className="export-btn csv-btn"
                disabled={isExporting}
                onClick={() => handleExport('csv')}
              >
                CSV
              </button>
              <button 
                className="export-btn excel-btn"
                disabled={isExporting}
                onClick={() => handleExport('excel')}
              >
                Excel
              </button>
            </div>
            
            <button
              className="clear-local-btn"
              onClick={handleClearAll}
            >
              Clear All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocallyApprovedContributions; 