# Google Sheets Table Formatting Settings Guide

## Overview
This guide explains how to set up your Google Sheets to automatically format new rows with proper borders and styling when data is added through the SkillHub admin panel.

## Current Automatic Formatting ✅
The system now automatically applies the following formatting to new rows:
- ✅ **Font**: Calibri, size 10
- ✅ **Background**: White background
- ✅ **Alignment**: Left-aligned text, middle vertical alignment
- ✅ **Text Wrapping**: Enabled for better readability
- ✅ **Sequential IDs**: Skills get SK001, SK002, etc. Tools get T001, T002, etc.
- ⚠️ **Borders**: Applied programmatically but may need manual adjustment (see below)

## ⚠️ IMPORTANT: Making Borders Visible

While the system applies borders automatically, Google Sheets sometimes doesn't render them immediately. To ensure all table lines are visible:

### Quick Fix for Borders:
1. **Select the entire data range** (including new rows)
2. **Click the borders icon** in the toolbar (looks like a grid)
3. **Choose "All borders"** from the dropdown
4. **OR** use the keyboard shortcut: `Ctrl+Shift+7` (Windows) or `Cmd+Shift+7` (Mac)

### Alternative Method:
1. Select your data range
2. Go to **Format** → **Borders**
3. Choose **All borders**
4. Select line style: **Solid line**
5. Click **Apply**

## Manual Google Sheets Settings (Recommended Enhancements)

### 1. Enable Table Filters
1. Select your data range (A1 to the last column with data)
2. Go to **Data** → **Create a filter**
3. This adds dropdown arrows to headers for easy sorting/filtering

### 2. Set Up Conditional Formatting (Optional)
1. Select your data range
2. Go to **Format** → **Conditional formatting**
3. Set up rules like:
   - **High demand skills**: Green background for "Demand Level" = "High"
   - **New contributions**: Light blue background for rows added today

### 3. Freeze Header Rows
1. Click on row 2 (first data row)
2. Go to **View** → **Freeze** → **1 row**
3. This keeps headers visible when scrolling

### 4. Auto-Resize Columns
1. Select all columns (click the column header intersection)
2. Right-click → **Resize columns A-Z**
3. Choose **Fit to data**

### 5. Enable Data Validation (Optional)
For consistency in data entry:
1. Select the "Category" column
2. Go to **Data** → **Data validation**
3. Set criteria to "List of items" with your predefined categories

## Spreadsheet Structure

### Skills Sheet: "Trending Skill Data"
- **SkillID**: Auto-generated (SK001, SK002, SK003...)
- **SkillName**: From contribution
- **Category**: From contribution
- **Demand Level**: Auto-set to "High"
- **Growth Rate**: Auto-set to "Growing"
- **Average Salary**: Auto-set to "$85,000"
- **Required Experience**: Auto-set to "1-3 years"
- **Learning Resources**: From contribution description
- **Related Skills**: Empty (can be filled manually)
- **Last Updated**: Current date
- **Contributor ID**: Email of contributor

### Tools Sheet: "Trending Tool Data"
- **ToolID**: Auto-generated (T001, T002, T003...)
- **ToolName**: From contribution
- **Category**: From contribution
- **Primary Use Cases**: From contribution description
- **Skill Level Required**: Auto-set to "Beginner to Intermediate"
- **Pricing Model**: Auto-set to "Freemium"
- **Integration Capabilities**: Auto-set to "Good"
- **Relevant Industries**: Auto-set to "Technology, Software Development"
- **Growth Trend**: Auto-set to "Growing"
- **Last Updated**: Current date
- **Contributor ID**: Email of contributor

## Troubleshooting

### Problem: Borders not visible ⚠️
**Solution**: 
1. Select the affected rows/range
2. Click borders icon → "All borders"
3. Or use Format → Borders → All borders

### Problem: Font not Calibri
**Solution**: The system now automatically sets Calibri font. If not working:
1. Check the backend console for formatting errors
2. Verify Google Sheets API permissions

### Problem: Text getting cut off
**Solution**: The system sets text wrapping automatically. If still cut off:
1. Select the column
2. Right-click → **Resize column**
3. Choose **Fit to data**

### Problem: IDs not sequential
**Solution**: The system now counts existing rows to generate proper sequential IDs. New entries will be:
- Skills: SK001, SK002, SK003...
- Tools: T001, T002, T003...

### Problem: No formatting on new rows
**Solution**: The system now automatically applies formatting. If issues persist:
1. Check that the Google Sheets API has proper permissions
2. Verify the service account has "Editor" access to the spreadsheet
3. Check the backend console for formatting errors

## Testing the New Features

Run the test script to verify everything works:
```bash
cd backend
node test-id-generation.js
```

This will:
1. Add a test skill with proper ID (SK###) and Calibri formatting
2. Add a test tool with proper ID (T###) and Calibri formatting
3. Show success message

**Note**: You can delete the test entries manually after verification.

## Benefits of These Settings

1. **Professional Appearance**: Consistent Calibri font and formatting
2. **Easy Navigation**: Frozen headers and filters
3. **Data Integrity**: Sequential IDs and validation
4. **Scalability**: Automatic formatting for unlimited new rows
5. **User-Friendly**: Clear visual structure for data review

## Quick Setup Checklist

After approving new contributions:
- [ ] New rows appear with Calibri font ✅ (automatic)
- [ ] Sequential IDs generated ✅ (automatic)  
- [ ] Apply borders manually if not visible (select range → borders icon → "All borders")
- [ ] Set up filters for the first time (Data → Create a filter)
- [ ] Freeze header row if needed (View → Freeze → 1 row)

## Support

If you encounter any issues:
1. Check the backend console for error messages
2. Verify Google Sheets API permissions
3. Ensure the spreadsheet is shared with the service account
4. Run the test script to diagnose problems 