from app.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Check if SendGrid is configured
        self.sendgrid_configured = bool(settings.sendgrid_api_key and settings.sendgrid_from_email and settings.sendgrid_to_email)
        
        if self.sendgrid_configured:
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail
                self.SendGridAPIClient = SendGridAPIClient
                self.Mail = Mail
                self.sg = SendGridAPIClient(api_key=settings.sendgrid_api_key)
                self.from_email = settings.sendgrid_from_email
                self.to_email = settings.sendgrid_to_email
            except ImportError:
                logger.warning("SendGrid not available, using development mode")
                self.sendgrid_configured = False

    async def send_contact_email(self, first_name: str, last_name: str, email: str, phone: str, message: str):
        """
        Send a contact form email using SendGrid (or log in development)
        """
        try:
            if self.sendgrid_configured:
                # Production: Send actual email
                return await self._send_real_email(first_name, last_name, email, phone, message)
            else:
                # Development: Log the contact form data
                return await self._log_contact_data(first_name, last_name, email, phone, message)
                
        except Exception as e:
            logger.error(f"Error processing contact form: {str(e)}")
            return {"success": False, "message": "Internal server error"}

    async def _send_real_email(self, first_name: str, last_name: str, email: str, phone: str, message: str):
        """Send actual email via SendGrid"""
        # Create the email content
        subject = f"New Contact Form Submission from {first_name} {last_name}"
        
        # HTML content for the email
        html_content = f"""
        <html>
        <body>
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {first_name} {last_name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Phone:</strong> {phone or 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>{message}</p>
        </body>
        </html>
        """
        
        # Plain text content
        text_content = f"""
        New Contact Form Submission
        
        Name: {first_name} {last_name}
        Email: {email}
        Phone: {phone or 'Not provided'}
        Message: {message}
        """
        
        # Create the email
        mail = self.Mail(
            from_email=self.from_email,
            to_emails=self.to_email,
            subject=subject,
            html_content=html_content,
            plain_text_content=text_content
        )
        
        # Send the email
        response = self.sg.send(mail)
        
        if response.status_code == 202:
            logger.info(f"Contact email sent successfully for {email}")
            return {"success": True, "message": "Email sent successfully"}
        else:
            logger.error(f"SendGrid error: {response.status_code} - {response.body}")
            return {"success": False, "message": "Failed to send email"}

    async def _log_contact_data(self, first_name: str, last_name: str, email: str, phone: str, message: str):
        """Log contact form data in development mode"""
        logger.info("=== CONTACT FORM SUBMISSION (DEVELOPMENT MODE) ===")
        logger.info(f"Name: {first_name} {last_name}")
        logger.info(f"Email: {email}")
        logger.info(f"Phone: {phone or 'Not provided'}")
        logger.info(f"Message: {message}")
        logger.info("================================================")
        
        return {"success": True, "message": "Contact form received (development mode)"}

# Create a global instance
email_service = EmailService()
