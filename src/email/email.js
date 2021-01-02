const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const messageEmail = (email, name, message) => {
  sgMail.send({
    to: "emboiko@gmail.com",
    from: email,
    subject: `Fridge-Magnets message from ${name}`,
    text: message
  });
}

module.exports = messageEmail;
