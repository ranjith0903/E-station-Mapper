// EmailJS Configuration
// Replace these values with your actual EmailJS credentials from your dashboard

export const EMAIL_CONFIG = {
  // Your EmailJS Service ID (found in EmailJS dashboard under Email Services)
  SERVICE_ID: 'service_uzt3hl6', // e.g., 'service_abc123'
  
  // Your EmailJS Template ID (found in EmailJS dashboard under Email Templates)
  TEMPLATE_ID: 'template_g2xzsws', // e.g., 'template_xyz789'
  
  // Your EmailJS Public Key (found in EmailJS dashboard under Account > API Keys)
  PUBLIC_KEY: 'c-40CfWOM-E759EsU' // e.g., 'user_abc123def456'
};

// EmailJS Template for Owner Notifications (New Booking Requests)
export const OWNER_EMAIL_CONFIG = {
  // Use the same service ID
  SERVICE_ID: 'service_uzt3hl6',
  
  // Create a new template for owner notifications
  TEMPLATE_ID: 'template_ihv8ta5', // Owner notification template ID
  
  // Use the same public key
  PUBLIC_KEY: 'c-40CfWOM-E759EsU'
};

// EmailJS Template Variables for User Confirmation
export const EMAIL_TEMPLATE_VARS = {
  to_email: '', // User's email address
  booking_id: '', // Booking ID
  station_name: '', // Station name
  booking_date: '', // Booking date
  booking_time: '', // Booking time slot
  amount: '', // Booking amount
  user_name: '' // User's name
};

// EmailJS Template Variables for Owner Notifications
export const OWNER_EMAIL_TEMPLATE_VARS = {
  to_email: '', // Owner's email address
  station_name: '', // Station name
  user_name: '', // User's name who made the booking
  booking_date: '', // Booking date
  booking_time: '', // Booking time slot
  amount: '', // Booking amount
  booking_id: '' // Booking ID
};

// Instructions:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Create an Email Service (connect your Gmail/Outlook)
// 3. Create an Email Template with the variables above
// 4. Get your Service ID, Template ID, and Public Key
// 5. Replace the placeholder values above with your actual credentials

// SETUP INSTRUCTIONS FOR OWNER NOTIFICATION TEMPLATE:
// 1. In EmailJS dashboard, go to "Email Templates"
// 2. Click "Create New Template"
// 3. Name it "Owner Notification" or similar
// 4. Use this template content:
/*
Subject: New Booking Request - {{station_name}}

Hi Station Owner,

You have received a new booking request for your charging station!

Booking Details:
- Station: {{station_name}}
- User: {{user_name}}
- Date: {{booking_date}}
- Time: {{booking_time}}
- Amount: ${{amount}}
- Booking ID: {{booking_id}}

Please log in to your dashboard to approve or reject this booking.

Thank you,
E-Station Mapper Team
*/
// 5. Save the template and copy the Template ID
// 6. Update the TEMPLATE_ID in OWNER_EMAIL_CONFIG above 