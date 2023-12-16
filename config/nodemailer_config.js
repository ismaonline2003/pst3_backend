const nodemailer = require("nodemailer");
exports.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'pst3.e2.7001.t3.uptecms.2023@gmail.com',
      pass: '2d62sd62E2@',
      clientId: '',
      clientSecret: '',
      refreshToken: ''
    }
});

exports.email = 'pst3.e2.7001.t3.uptecms.2023@gmail.com';

exports.platform_name = 'AgroOnline UPTECMS';

exports.frontend_url = 'http://localhost:3000';

exports.platform_url = 'http://localhost:3001';