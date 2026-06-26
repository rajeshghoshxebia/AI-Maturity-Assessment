import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def _html_body(org_name: str, invitee_name: str | None, survey_url: str) -> str:
    greeting = f"Hi {invitee_name}," if invitee_name else "Hi,"
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#150027;padding:32px 40px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Xebia AI Maturity Assessment</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">{greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">
            You have been invited to participate in an <strong>AI Maturity Assessment</strong> for
            <strong>{org_name}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;">
            Your input will help us understand the organisation's current AI maturity level across
            key dimensions. The survey takes approximately 15–20 minutes to complete.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="{survey_url}"
               style="display:inline-block;background:#831B84;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 28px;border-radius:6px;">
              Take the Survey →
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
            Or copy this link into your browser:<br>
            <a href="{survey_url}" style="color:#831B84;">{survey_url}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Sent by Xebia AI Maturity Platform · This link is unique to you, please do not share it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_survey_invitation(
    to_email: str,
    to_name: str | None,
    org_name: str,
    survey_url: str,
) -> bool:
    subject = f"You're invited: AI Maturity Assessment for {org_name}"
    html = _html_body(org_name, to_name, survey_url)

    if settings.ACS_CONNECTION_STRING:
        try:
            from azure.communication.email import EmailClient
            client = EmailClient.from_connection_string(settings.ACS_CONNECTION_STRING)
            message = {
                "senderAddress": settings.ACS_SENDER_EMAIL,
                "recipients": {"to": [{"address": to_email, "displayName": to_name or to_email}]},
                "content": {"subject": subject, "html": html},
            }
            poller = client.begin_send(message)
            poller.result()
            logger.info("Email sent via ACS to %s", to_email)
            return True
        except Exception as exc:
            logger.error("ACS email failed for %s: %s", to_email, exc)
            return False
    else:
        # Dev mode — log the link so the developer can access the survey
        logger.info("=" * 60)
        logger.info("DEV MODE — Survey invitation (not sent)")
        logger.info("To:      %s", to_email)
        logger.info("Subject: %s", subject)
        logger.info("Link:    %s", survey_url)
        logger.info("=" * 60)
        return True  # treat as success in dev
