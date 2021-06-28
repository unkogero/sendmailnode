const nodemailer = require("nodemailer");
const aws = require('aws-sdk')

let response;

const credentials = {
    region: 'ap-northeast-1'
};
const ssm = new aws.SSM(credentials);
const s3 = new aws.S3(credentials);

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        await main();

        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

// The message tags that you want to apply to the email.
var tag0 = "key0=value0";
var tag1 = "key1=value1";

async function main(){

    console.log('main start');

    const ssmRequest = {
        Names: ['/dev/smtp/smtppass','/dev/smtp/smtpuser'],
        WithDecryption: true
    };
    const ssmData = await ssm.getParameters(ssmRequest).promise();

    // If you're using Amazon SES in a region other than US West (Oregon),
    // replace email-smtp.us-west-2.amazonaws.com with the Amazon SES SMTP
    // endpoint in the appropriate AWS Region.
    const smtpEndpoint = "email-smtp.ap-northeast-1.amazonaws.com";
    // The port to use when connecting to the SMTP server.
    const port = 587;

    // Replace sender@example.com with your "From" address.
    // This address must be verified with Amazon SES.
    const senderAddress = "sender@example.com";

    // Replace recipient@example.com with a "To" address. If your account
    // is still in the sandbox, this address must be verified. To specify
    // multiple addresses, separate each address with a comma.
    var toAddresses = "recipient@example.com";
    // var toAddresses = "bounce@simulator.amazonses.com";

    // CC and BCC addresses. If your account is in the sandbox, these
    // addresses have to be verified. To specify multiple addresses, separate
    // each address with a comma.
    // var ccAddresses = "xxx";
    // var bccAddresses = "yyy";

    // Replace smtp_username with your Amazon SES SMTP user name.
    const smtpUsername = ssmData.Parameters[1].Value;
 
    // Replace smtp_password with your Amazon SES SMTP password.
    const smtpPassword = ssmData.Parameters[0].Value;
 
    // (Optional) the name of a configuration set to use for this message.
    var configurationSet = "myconfigset";

    // The subject line of the email
    var subject = "Amazon SES test (Nodemailer)";

    // The email body for recipients with non-HTML email clients.
    var body_text = `Amazon SES Test (Nodemailer)
    ---------------------------------
    This email was sent through the Amazon SES SMTP interface using Nodemailer.
    `;

    // The body of the email for recipients whose email clients support HTML content.
    var body_html = `<html>
    <head></head>
    <body>
    <h1>Amazon SES Test (Nodemailer)</h1>
    <p>This email was sent with <a href='https://aws.amazon.com/ses/'>Amazon SES</a>
            using <a href='https://nodemailer.com'>Nodemailer</a> for Node.js.</p>
    </body>
    </html>`;

    // Create the SMTP transport.
    let transporter = nodemailer.createTransport({
      host: smtpEndpoint,
      port: port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword
      }
    });

    const params = {
      Bucket: 'email-template-pug',
      // Key: 'index.pug',
      Key: 'mail.html',
    };
    var template = await s3.getObject(params).promise();
    var templatehtml = template.Body.toString();

    body_html = templatehtml.replace('#email', 'aaa@bbb.com').replace('#username', 'testuser');

    // Specify the fields in the email.
    let mailOptions = {
      from: senderAddress,
      to: toAddresses,
      subject: subject,
      // cc: ccAddresses,
      //bcc: bccAddresses,
      text: body_text,
      html: body_html,
      // Custom headers for configuration set and message tags.
      headers: {
        'X-SES-CONFIGURATION-SET': configurationSet,
        'X-SES-MESSAGE-TAGS': tag0,
        'X-SES-MESSAGE-TAGS': tag1
      }
    };
    console.log('before sendmail');
    // Send the email.
    let info = await transporter.sendMail(mailOptions)
  
    console.log("Message sent! Message ID: ", info.messageId);
  }

