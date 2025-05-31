// Google Analytics configuration for SkillHub
export const GA_MEASUREMENT_ID = 'G-G4MFJ6N0RV'; // Your actual Measurement ID

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url, title) => {
  if (typeof window !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: title,
      page_location: url,
    });
  }
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user registration
export const trackUserRegistration = (method) => {
  trackEvent('sign_up', 'engagement', 'registration_method', method);
};

// Track skill test completion
export const trackSkillTest = (skillName, score) => {
  trackEvent('skill_test_completed', 'engagement', skillName, score);
};

// Track page engagement
export const trackEngagement = (engagementTime) => {
  trackEvent('page_engagement', 'engagement', 'time_on_page', engagementTime);
};

// Track button clicks
export const trackButtonClick = (buttonName, location) => {
  trackEvent('button_click', 'engagement', `${buttonName}_${location}`);
};

// Track feature usage
export const trackFeatureUsage = (featureName, action) => {
  trackEvent('feature_usage', 'engagement', featureName, action);
}; 