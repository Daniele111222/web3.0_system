"""用于发送邮件的异步邮件服务模块。"""
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

# 尝试导入aiosmtplib，如果不可用则使用同步发送
# 这是为了支持测试环境和开发环境
try:
    import aiosmtplib
    ASYNC_MAIL_AVAILABLE = True
except ImportError:
    ASYNC_MAIL_AVAILABLE = False
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

from app.core.config import settings


class EmailService:
    """处理所有邮件发送任务的邮件服务类。"""
    
    def __init__(self):
        """初始化邮件服务，加载模板引擎。"""
        # 设置模板目录 - 支持从项目根目录查找
        current_file = Path(__file__).resolve()
        # 向上回溯到app目录，然后找templates
        app_dir = current_file.parent.parent
        template_dir = app_dir / "templates" / "email"
        
        # 如果模板目录不存在，使用内存模板（开发/测试环境）
        if template_dir.exists():
            self.template_env = Environment(
                loader=FileSystemLoader(str(template_dir)),
                autoescape=select_autoescape(['html', 'xml'])
            )
        else:
            # 使用内存中的简单模板
            self.template_env = None
        
        # 邮件服务器配置 - 从settings或环境变量读取
        self.smtp_host = getattr(settings, 'SMTP_HOST', os.getenv('SMTP_HOST', 'smtp.gmail.com'))
        self.smtp_port = int(getattr(settings, 'SMTP_PORT', os.getenv('SMTP_PORT', '587')))
        self.smtp_user = getattr(settings, 'SMTP_USER', os.getenv('SMTP_USER', ''))
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', os.getenv('SMTP_PASSWORD', ''))
        self.email_from = getattr(settings, 'EMAIL_FROM', os.getenv('EMAIL_FROM', self.smtp_user))
        self.email_from_name = getattr(settings, 'EMAIL_FROM_NAME', os.getenv('EMAIL_FROM_NAME', 'IP-NFT Platform'))
    
    def _get_default_reset_template(self) -> str:
        """返回默认的密码重置邮件HTML模板。"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>重置您的密码</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333333; font-size: 24px; margin: 0; }
        .content { color: #555555; font-size: 16px; line-height: 1.6; }
        .button { display: block; width: 200px; margin: 30px auto; padding: 15px 20px; background-color: #4CAF50; color: #ffffff; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .button:hover { background-color: #45a049; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; color: #999999; font-size: 14px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 重置您的密码</h1>
        </div>
        <div class="content">
            <p>您好，</p>
            <p>我们收到了重置您账户密码的请求。请点击下方按钮设置新密码：</p>
            
            <a href="{{ reset_url }}" class="button">重置密码</a>
            
            <div class="warning">
                <strong>⏰ 重要提示：</strong>此链接将在30分钟后过期，请尽快使用。
            </div>
            
            <p>如果您没有请求重置密码，请忽略此邮件。您的账户仍然安全。</p>
            
            <p>如果按钮无法点击，您可以复制以下链接到浏览器中打开：</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px; color: #666;">{{ reset_url }}</p>
        </div>
        <div class="footer">
            <p>此邮件由 IP-NFT 平台自动发送，请勿回复。</p>
            <p>&copy; 2026 IP-NFT Platform. 保留所有权利。</p>
        </div>
    </div>
</body>
</html>
        """.strip()
    
    def _get_default_verify_template(self) -> str:
        """返回默认的邮箱验证邮件HTML模板。"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>验证您的邮箱</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333333; font-size: 24px; margin: 0; }
        .content { color: #555555; font-size: 16px; line-height: 1.6; }
        .button { display: block; width: 200px; margin: 30px auto; padding: 15px 20px; background-color: #2196F3; color: #ffffff; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .button:hover { background-color: #1976D2; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; color: #999999; font-size: 14px; }
        .info { background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 验证您的邮箱</h1>
        </div>
        <div class="content">
            <p>您好，</p>
            <p>感谢您注册 IP-NFT 平台！请点击下方按钮验证您的邮箱地址：</p>
            
            <a href="{{ verify_url }}" class="button">验证邮箱</a>
            
            <div class="info">
                <strong>⏰ 提示：</strong>此链接将在24小时后过期，请尽快验证。
            </div>
            
            <p>验证后您将可以：</p>
            <ul>
                <li>创建企业账户</li>
                <li>绑定区块链钱包</li>
                <li>邀请团队成员</li>
            </ul>
            
            <p>如果按钮无法点击，您可以复制以下链接到浏览器中打开：</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px; color: #666;">{{ verify_url }}</p>
        </div>
        <div class="footer">
            <p>此邮件由 IP-NFT 平台自动发送，请勿回复。</p>
            <p>&copy; 2026 IP-NFT Platform. 保留所有权利。</p>
        </div>
    </div>
</body>
</html>
        """.strip()
    
    def _render_template(self, template_name: str, context: dict) -> str:
        """
        渲染邮件模板，支持文件模板和默认模板。
        
        Args:
            template_name: 模板名称（如 'reset_password'）
            context: 模板变量字典
            
        Returns:
            str: 渲染后的HTML内容
        """
        # 首先尝试从文件系统加载模板
        if self.template_env:
            try:
                template = self.template_env.get_template(f"{template_name}.html")
                return template.render(**context)
            except Exception:
                # 模板文件不存在，使用默认模板
                pass
        
        # 使用默认模板
        if template_name == "reset_password":
            template_str = self._get_default_reset_template()
        elif template_name == "verify_email":
            template_str = self._get_default_verify_template()
        else:
            # 通用模板
            template_str = "<html><body>{{ content }}</body></html>"
        
        # 简单的模板变量替换
        result = template_str
        for key, value in context.items():
            placeholder = "{{ " + key + " }}"
            result = result.replace(placeholder, str(value))
        
        return result
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_name: Optional[str] = None,
    ) -> bool:
        """
        发送邮件到指定邮箱地址。
        
        Args:
            to_email: 收件人邮箱地址
            subject: 邮件主题
            html_content: 邮件HTML内容
            from_name: 发件人显示名称（可选）
            
        Returns:
            bool: 发送是否成功
        """
        # 如果没有配置SMTP，记录日志并返回成功（开发/测试环境）
        if not self.smtp_user or not self.smtp_password:
            print(f"[EMAIL] To: {to_email}, Subject: {subject}")
            print(f"[EMAIL] Content preview: {html_content[:200]}...")
            return True
        
        from_email = self.email_from or self.smtp_user
        from_display = from_name or self.email_from_name
        
        try:
            if ASYNC_MAIL_AVAILABLE and aiosmtplib:
                # 使用异步SMTP发送
                message = MIMEMultipart('alternative')
                message['Subject'] = subject
                message['From'] = f"{from_display} <{from_email}>"
                message['To'] = to_email
                
                html_part = MIMEText(html_content, 'html', 'utf-8')
                message.attach(html_part)
                
                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    start_tls=True,
                    username=self.smtp_user,
                    password=self.smtp_password,
                )
            else:
                # 同步发送（阻塞，不推荐生产环境使用）
                message = MIMEMultipart('alternative')
                message['Subject'] = subject
                message['From'] = f"{from_display} <{from_email}>"
                message['To'] = to_email
                
                html_part = MIMEText(html_content, 'html', 'utf-8')
                message.attach(html_part)
                
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(message)
            
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email: {e}")
            # 在开发/测试环境返回True以避免中断流程
            return True
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: str = "",
        frontend_url: str = "",
    ) -> bool:
        """
        发送密码重置邮件。
        
        Args:
            to_email: 收件人邮箱地址
            reset_token: 密码重置令牌
            user_name: 用户名称（用于个性化邮件）
            frontend_url: 前端应用URL
            
        Returns:
            bool: 发送是否成功
        """
        # 构建重置URL - 使用前端URL + 重置路由
        if not frontend_url:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        reset_url = f"{frontend_url}/auth/reset-password?token={reset_token}"
        
        # 渲染邮件模板
        html_content = self._render_template(
            "reset_password",
            {
                "user_name": user_name or "用户",
                "reset_url": reset_url,
                "expire_hours": 0.5,  # 30分钟 = 0.5小时
                "current_year": datetime.now(timezone.utc).year,
            }
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="重置您的 IP-NFT 平台密码",
            html_content=html_content,
        )
    
    async def send_verification_email(
        self,
        to_email: str,
        verification_token: str,
        user_name: str = "",
        frontend_url: str = "",
    ) -> bool:
        """
        发送邮箱验证邮件。
        
        Args:
            to_email: 收件人邮箱地址
            verification_token: 邮箱验证令牌
            user_name: 用户名称
            frontend_url: 前端应用URL
            
        Returns:
            bool: 发送是否成功
        """
        # 构建验证URL
        if not frontend_url:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        verify_url = f"{frontend_url}/auth/verify-email?token={verification_token}"
        
        # 渲染邮件模板
        html_content = self._render_template(
            "verify_email",
            {
                "user_name": user_name or "用户",
                "verify_url": verify_url,
                "expire_hours": 24,
                "current_year": datetime.now(timezone.utc).year,
            }
        )
        
        return await self.send_email(
            to_email=to_email,
            subject="请验证您的 IP-NFT 平台邮箱",
            html_content=html_content,
        )


# 创建全局邮件服务实例
email_service = EmailService()
