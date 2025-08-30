import os
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Util:
    @staticmethod
    def send_email(data):
        """
        Send email with password reset link
        Args:
            data: {
                'subject': 'Email Subject',
                'body': 'Email Content',
                'to_email': 'recipient@example.com'
            }
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get credentials from environment
            sender = os.getenv('EMAIL_USER')
            password = os.getenv('EMAIL_PASS')
            recipient = data['to_email']

            if not all([sender, password, recipient]):
                raise ValueError("Missing required email credentials")

            # Create email message
            msg = EmailMessage()
            msg.set_content(data['body'])
            msg['Subject'] = data['subject']
            msg['From'] = sender
            msg['To'] = recipient

            # SSL Context configuration
            context = ssl.create_default_context()
            
            # For development: Bypass verification (remove in production)
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            # Send email
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(sender, password)
                server.send_message(msg)

            print(f"✅ Password reset email sent to {recipient}")
            return True

        except Exception as e:
            print(f"❌ Failed to send email to {recipient}: {str(e)}")
            return False