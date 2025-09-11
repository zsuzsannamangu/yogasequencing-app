# SendGrid Setup Guide

This guide will help you set up SendGrid for the contact form functionality.

## Prerequisites

1. A SendGrid account (you mentioned you already have one)
2. A verified sender email address in SendGrid

## Setup Steps

### 1. Get Your SendGrid API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** > **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access** and give it the following permissions:
   - **Mail Send**: Full Access
5. Copy the generated API key (you won't be able to see it again)

### 2. Verify a Sender Email

1. In SendGrid dashboard, go to **Settings** > **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the required information:
   - **From Name**: Your app name (e.g., "MoveMosaic")
   - **From Email**: The email address you want to send from (e.g., noreply@yourdomain.com)
   - **Reply To**: Your actual email address
4. Click **Verify**
5. Check your email and click the verification link

### 3. Configure Environment Variables

Add these variables to your `.env` file in the backend directory:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TO_EMAIL=contact@yourdomain.com
```

Replace:
- `your-sendgrid-api-key-here` with your actual API key
- `noreply@yourdomain.com` with your verified sender email
- `contact@yourdomain.com` with the email where you want to receive contact form submissions

### 4. Install Dependencies

Make sure to install the SendGrid dependency:

```bash
pip install sendgrid==6.11.0
```

Or if you're using the requirements.txt:

```bash
pip install -r requirements.txt
```

### 5. Test the Contact Form

1. Start your backend server: `uvicorn app.main:app --reload`
2. Start your frontend: `npm run dev`
3. Navigate to the homepage and scroll to the contact section
4. Fill out and submit the contact form
5. Check the email address specified in `SENDGRID_TO_EMAIL` for the contact form submission

## Troubleshooting

### Common Issues

1. **"Unauthorized" error**: Check that your API key is correct and has the right permissions
2. **"Forbidden" error**: Make sure your sender email is verified in SendGrid
3. **"Bad Request" error**: Check that all required fields are filled in the contact form

### Testing Without SendGrid

If you want to test the form without setting up SendGrid immediately, you can temporarily modify the email service to log the contact form data instead of sending emails.

## Features

The contact form now includes:

- ✅ Form validation (required fields)
- ✅ Loading states during submission
- ✅ Success/error feedback messages
- ✅ Form reset after successful submission
- ✅ Responsive design
- ✅ Email formatting with HTML and plain text versions

The contact form will send emails with:
- Contact person's name and email
- Phone number (if provided)
- Their message
- Formatted nicely in both HTML and plain text
