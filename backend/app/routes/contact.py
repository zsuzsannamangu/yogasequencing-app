from fastapi import APIRouter, HTTPException, status
from app.schemas import ContactForm
from app.services.email_service import email_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/contact")
async def send_contact_email(contact_data: ContactForm):
    """
    Send a contact form email using SendGrid
    """
    try:
        # Send the email using the email service
        result = await email_service.send_contact_email(
            first_name=contact_data.first_name,
            last_name=contact_data.last_name,
            email=contact_data.email,
            phone=contact_data.phone,
            message=contact_data.message
        )
        
        if result["success"]:
            return {
                "message": "Contact form submitted successfully",
                "success": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
            
    except Exception as e:
        logger.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
