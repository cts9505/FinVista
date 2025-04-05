export const EMAIL_VERIFY_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Email Verify</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', sans-serif;
      background: #E5E5E5;
    }

    table, td {
      border-collapse: collapse;
    }

    .container {
      width: 100%;
      max-width: 500px;
      margin: 70px 0px;
      background-color: #ffffff;
    }

    .main-content {
      padding: 48px 30px 40px;
      color: #000000;
    }

    .button {
      width: 100%;
      background: #22D172;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      color: #fff;
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      border-radius: 7px;
    }

    @media only screen and (max-width: 480px) {
      .container {
        width: 80% !important;
      }

      .button {
        width: 50% !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F6FAFB">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding: 0 0 24px; font-size: 18px; line-height: 150%; font-weight: bold;">
                          Verify your email
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          You are just one step away to verify your account for this email: <span style="color: #4C83EE;">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px; font-size: 14px; line-height: 150%; font-weight: 700;">
                          Use below OTP to verify your account.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px;">
                          <p class="button" >{{otp}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          This OTP is valid for 5 min.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>

`

export const PASSWORD_RESET_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Password Reset</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Roboto', Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #FF5722;
      border-radius: 8px 8px 0 0;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 25px;
    }

    .highlight {
      color: #FF5722;
      font-weight: 500;
    }

    .otp-container {
      text-align: center;
      margin: 30px 0;
    }

    .otp-code {
      background-color: #F5F7FA;
      border: 1px dashed #CCCCCC;
      border-radius: 8px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #333333;
      padding: 15px 25px;
      display: inline-block;
    }

    .warning {
      font-size: 14px;
      color: #757575;
      background-color: #FFF8E1;
      border-left: 4px solid #FFC107;
      padding: 12px 15px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }

    .button {
      background: #FF5722;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #E64A19;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .title {
        font-size: 22px !important;
      }
      
      .otp-code {
        font-size: 24px !important;
        letter-spacing: 3px !important;
        padding: 12px 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="https://via.placeholder.com/160x50" alt="Company Logo" class="logo">
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="title">
                          Password Reset Request
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          Hello,
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          We received a request to reset the password for your account with the email address: <span class="highlight">{{email}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-weight: 500;">
                          Please use the one-time password (OTP) below to complete your password reset:
                        </td>
                      </tr>
                      <tr>
                        <td class="otp-container">
                          <div class="otp-code">{{otp}}</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="warning">
                          This OTP will expire in 5 minutes for security reasons. If you didn't request this password reset, please ignore this email or contact our support team.
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding: 15px 0 30px;">
                          <a href="http://yourdomain.com/reset-password" class="button">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          If you're having trouble with the reset process, please contact our support team at <span class="highlight">support@yourdomain.com</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          Regards,<br>
                          <span style="font-weight: 500;">Security Team at Your Company</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>This is an automated message, please do not reply to this email.</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                  <p style="margin-top: 15px; font-size: 11px;">
                    For security reasons, if you did not request this password reset, please secure your account by <a href="#" style="color: #FF5722; text-decoration: underline;">contacting us</a> immediately.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export const WELCOME_TEMPLATE =   `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Welcome to Our Service</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: "Roboto", Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #3F51B5;
      border-radius: 8px 8px 0 0;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #4CAF50;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #43A047;
    }

    .greeting {
      font-size: 22px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .highlight {
      color: #3F51B5;
      font-weight: 500;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .greeting {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="/api/placeholder/160/50" alt="Company Logo" class="logo">
                  <h2 style="margin-top: 15px; margin-bottom: 0;">Registration</h2>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="greeting">
                          Welcome, {{name}}!
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          Thank you for creating an account with us. We received a registration request for this email address: <span class="highlight">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-weight: 500;">
                          To ensure the security of your account and activate all features, please verify your email address.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0 30px; text-align: center;">
                          <a href="#" class="button">
                            Verify My Account
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          If you did not create this account, no action is required. The account will remain inactive and be automatically deleted after 7 days.
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          If you have any questions or need assistance, please contact our support team at <span class="highlight">support@yourcompany.com</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          Best regards,<br>
                          <span style="font-weight: 500;">The Team at Your Company</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                  <p style="margin-top: 15px; font-size: 11px;">
                    If you no longer wish to receive these emails, you can <a href="#" style="color: #9EA3B0; text-decoration: underline;">unsubscribe</a> at any time.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export const MESSAGE_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Message Email</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: "Open Sans", sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #22D172;
      border-radius: 8px 8px 0 0;
      color: white;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #22D172;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #1CB563;
    }

    .highlight {
      color: #22D172;
      font-weight: 500;
    }

    .message-box {
      background-color: #F5F7FA;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }

    .label {
      font-weight: bold;
      color: #555;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="/api/placeholder/160/50" alt="Company Logo" class="logo">
                  <h1 style="margin-top: 15px; margin-bottom: 0;">Message Received</h1>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding-bottom: 20px; font-size: 16px;">
                          We have received a message from:
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 24px; font-size: 16px;">
                          <span class="label">EMAIL:</span> <span class="highlight">{{email}}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div class="message-box">
                            <div style="margin-bottom: 10px;"><span class="label">MESSAGE:</span></div>
                            <div style="font-size: 16px; line-height: 1.5;">{{message}}</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          We will respond to this message as soon as possible.<br>
                          <span style="font-weight: 500;">The Support Team</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <p style="margin-top: 15px; font-size: 11px;">
                    This is an automated message notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export const GOOGLE_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Google Authentication</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: "Roboto", Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #4C83EE;
      border-radius: 8px 8px 0 0;
      color: white;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #4C83EE;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #3B6CD0;
    }

    .greeting {
      font-size: 22px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .highlight {
      color: #4C83EE;
      font-weight: 500;
    }

    .verification-box {
      background-color: #F0F7FF;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border-left: 4px solid #4C83EE;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .greeting {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="/api/placeholder/160/50" alt="Company Logo" class="logo">
                  <h1 style="margin-top: 15px; margin-bottom: 0;">Google Authentication</h1>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="greeting">
                          Welcome, {{name}}!
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          We received an account creation for this email: <span class="highlight">{{email}}</span> via Google Authentication.
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div class="verification-box">
                            <img src="/api/placeholder/60/60" alt="Verified" width="60" height="60">
                            <h2 style="margin-top: 15px; margin-bottom: 10px; color: #4C83EE;">Account Verified</h2>
                            <p style="margin: 0;">You don't need to verify your account as you signed in with Google.</p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          You now have full access to all features and services. If you did not create this account, please contact our support team immediately as someone may be using your Google account without permission.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 30px; text-align: center;">
                          <a href="#" class="button">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          Thank you for joining us,<br>
                          <span style="font-weight: 500;">The Team at Your Company</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="/api/placeholder/24/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

export const PAYMENT_EXPIRY_TEMPLATE = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Your Subscription is Expiring Soon</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Roboto', Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #FF5722;
      border-radius: 8px 8px 0 0;
      color: white;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #FF5722;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #E64A19;
    }

    .greeting {
      font-size: 22px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .highlight {
      color: #FF5722;
      font-weight: 500;
    }

    .countdown {
      background-color: #FFF3E0;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }

    .features-table {
      width: 100%;
      margin: 25px 0;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .features-table th {
      background-color: #F5F5F5;
      padding: 10px;
      text-align: left;
      font-weight: 500;
    }
    
    .features-table td {
      padding: 10px;
      border-top: 1px solid #EEEEEE;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .greeting {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="https://via.placeholder.com/160x50" alt="Company Logo" class="logo">
                  <h1 style="margin-top: 15px; margin-bottom: 0;">Subscription Expiring Soon</h1>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="greeting">
                          Hello {{name}},
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          We wanted to let you know that your <span class="highlight">{{subscriptionType}}</span> subscription is set to expire soon.
                        </td>
                      </tr>
                      <tr>
                        <td class="countdown">
                          <h3 style="margin-top:0; margin-bottom:10px; color:#FF5722;">Your Subscription Expires On:</h3>
                          <h2 style="margin-top:0; margin-bottom:0; font-size:24px;">{{subscriptionEndDate}}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          To ensure uninterrupted access to all premium features and services, we recommend renewing your subscription before the expiration date.
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table class="features-table">
                            <thead>
                              <tr>
                                <th>Benefits of Renewing:</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>✓ Uninterrupted access to all premium features</td>
                              </tr>
                              <tr>
                                <td>✓ Save your current preferences and settings</td>
                              </tr>
                              <tr>
                                <td>✓ Maintain access to historical data and reports</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 30px; text-align: center;">
                          <a href="https://yourwebsite.com/renew" class="button">
                            Renew My Subscription
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          If you have any questions or need assistance with your renewal, please contact our support team at <span class="highlight">support@yourcompany.com</span> or reply to this email.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: *20px; font-size: 15px;">
                          Thank you for your continued support,<br>
                          <span style="font-weight: 500;">The Team at Your Company</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                  <p style="margin-top: 15px; font-size: 11px;">
                    If you no longer wish to receive these emails, you can <a href="#" style="color: #9EA3B0; text-decoration: underline;">unsubscribe</a> at any time.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`

export const BILL_REMINDER_TEMPLATE = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Your Bill Payment is Due Soon</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Roboto', Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #4285F4;
      border-radius: 8px 8px 0 0;
      color: white;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #4285F4;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #3367D6;
    }

    .greeting {
      font-size: 22px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .highlight {
      color: #4285F4;
      font-weight: 500;
    }

    .countdown {
      background-color: #E8F0FE;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }

    .bill-details {
      width: 100%;
      margin: 25px 0;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #EEEEEE;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .bill-details th {
      background-color: #F5F5F5;
      padding: 12px;
      text-align: left;
      font-weight: 500;
    }
    
    .bill-details td {
      padding: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .greeting {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="https://via.placeholder.com/160x50" alt="Company Logo" class="logo">
                  <h1 style="margin-top: 15px; margin-bottom: 0;">Bill Payment Reminder</h1>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="greeting">
                          Hello {{name}},
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          This is a friendly reminder that your <span class="highlight">{{billType}}</span> bill is due for payment soon.
                        </td>
                      </tr>
                      <tr>
                        <td class="countdown">
                          <h3 style="margin-top:0; margin-bottom:10px; color:#4285F4;">Due Date:</h3>
                          <h2 style="margin-top:0; margin-bottom:0; font-size:24px;">{{dueDate}}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table class="bill-details">
                            <thead>
                              <tr>
                                <th colspan="2">Bill Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td width="40%"><strong>Bill Type:</strong></td>
                                <td>{{billType}}</td>
                              </tr>
                              <tr>
                                <td><strong>Amount Due:</strong></td>
                                <td>₹{{amount}}</td>
                              </tr>
                              <tr>
                                <td><strong>Description:</strong></td>
                                <td>{{description}}</td>
                              </tr>
                              <tr>
                                <td><strong>Recurrence:</strong></td>
                                <td>{{recurrence}}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          Please ensure timely payment to avoid any late fees or service disruptions.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 30px; text-align: center;">
                          <a href="https://yourwebsite.com/pay-bill/{{billId}}" class="button">
                            Pay Now
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          If you have already made the payment, please disregard this reminder. For any questions or assistance, contact our support team at <span class="highlight">support@yourcompany.com</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          Thank you,<br>
                          <span style="font-weight: 500;">The Bill Management Team</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                  <p style="margin-top: 15px; font-size: 11px;">
                    If you no longer wish to receive these emails, you can <a href="#" style="color: #9EA3B0; text-decoration: underline;">unsubscribe</a> at any time.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`

export const NEW_DEVICE_ALERT_TEMPLATE = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>New Device Login Alert</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Roboto', Arial, sans-serif;
      background: #F5F7FA;
      color: #333333;
      line-height: 1.6;
    }

    table, td {
      border-collapse: collapse;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .header {
      padding: 30px 0;
      text-align: center;
      background-color: #FF5252;
      border-radius: 8px 8px 0 0;
      color: white;
    }

    .logo {
      width: 160px;
      height: auto;
    }

    .main-content {
      padding: 40px 50px;
      color: #333333;
    }

    .footer {
      padding: 20px 50px;
      text-align: center;
      color: #9EA3B0;
      font-size: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .button {
      background: #FF5252;
      text-decoration: none;
      display: inline-block;
      padding: 14px 35px;
      color: #fff;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .button:hover {
      background: #E53935;
    }

    .greeting {
      font-size: 22px;
      font-weight: 500;
      color: #333333;
      margin-bottom: 20px;
    }

    .message {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .highlight {
      color: #FF5252;
      font-weight: 500;
    }

    .alert-box {
      background-color: #FFEBEE;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }

    .device-details {
      width: 100%;
      margin: 25px 0;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #EEEEEE;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .device-details th {
      background-color: #F5F5F5;
      padding: 12px;
      text-align: left;
      font-weight: 500;
    }
    
    .device-details td {
      padding: 12px;
      border-top: 1px solid #EEEEEE;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 95% !important;
        margin: 20px auto !important;
      }

      .main-content {
        padding: 30px 25px !important;
      }

      .footer {
        padding: 20px 25px !important;
      }
      
      .greeting {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F5F7FA">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  <img src="https://via.placeholder.com/160x50" alt="Company Logo" class="logo">
                  <h2 style="margin-top: 15px; margin-bottom: 0;">Security Alert</h2>
                </td>
              </tr>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td class="greeting">
                          Hello {{name}},
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          We detected a <span class="highlight">new device sign-in</span> to your account. If this was you, you can ignore this message. If not, please take immediate action to secure your account.
                        </td>
                      </tr>
                      <tr>
                        <td class="alert-box">
                          <h3 style="margin-top:0; margin-bottom:10px; color:#FF5252;">Login Time:</h3>
                          <h2 style="margin-top:0; margin-bottom:0; font-size:24px;">{{loginTime}}</h2>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table class="device-details">
                            <thead>
                              <tr>
                                <th colspan="2">Login Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td width="40%"><strong>Device:</strong></td>
                                <td>{{device}}</td>
                              </tr>
                              <tr>
                                <td><strong>Browser:</strong></td>
                                <td>{{browser}}</td>
                              </tr>
                              <tr>
                                <td><strong>IP Address:</strong></td>
                                <td>{{ipAddress}}</td>
                              </tr>
                              <tr>
                                <td><strong>Location:</strong></td>
                                <td>{{location}}</td>
                              </tr>
                              <tr>
                                <td><strong>Operating System:</strong></td>
                                <td>{{operatingSystem}}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="message">
                          <span class="highlight">Don't recognize this activity?</span> Your account security may be at risk. Please secure your account immediately by changing your password.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0 30px; text-align: center;">
                          <a href="https://yourwebsite.com/change-password" class="button">
                            Change Password Now
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                          <p style="margin-bottom: 10px;">Or</p>
                          <a href="https://yourwebsite.com/report-unauthorized-access" style="color: #FF5252; text-decoration: underline; font-weight: 500;">
                            Report Unauthorized Access
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="message" style="font-size: 14px;">
                          For additional security, we recommend enabling two-factor authentication for your account. If you need help securing your account, please contact our support team at <span class="highlight">support@yourcompany.com</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px; font-size: 15px;">
                          Thank you,<br>
                          <span style="font-weight: 500;">The Security Team</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; 2025 Your Company. All rights reserved.</p>
                  <p>123 Business Street, City, Country</p>
                  <div class="social-links">
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Facebook" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Twitter" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="LinkedIn" width="24" height="24">
                    </a>
                    <a href="#" class="social-icon">
                      <img src="https://via.placeholder.com/24" alt="Instagram" width="24" height="24">
                    </a>
                  </div>
                  <p style="margin-top: 15px; font-size: 11px;">
                    This is an automated security alert. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;