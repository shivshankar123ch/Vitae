from app.utils.email import send_email

def notify_user(email, message):
    send_email(email, "Notification", message)