const Nodemailer = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');
const circuitBreaker = require('@/utils/emailCircuitBreaker');

const sendMailImpl = async ({ email, name, subject, link, type, htmlContent }) => {
    try {
        const transport = Nodemailer.createTransport(
            MailtrapTransport({
                token: process.env.MAILTRAP_TOKEN || 'aee38359c7eb0868230308c65d872439',
            })
        );

        const sender = {
            address: process.env.IDURAR_APP_EMAIL || "hello@demomailtrap.co",
            name: "Custom IDURAR App",
        };

        const info = await transport.sendMail({
            from: sender,
            to: email,
            subject,
            html: htmlContent,
            category: type,
        });

        return {
            message_ids: [info.messageId],
            meta: {
                email,
                subject,
                type,
            },
            status: 'success'
        };
    } catch (error) {
        throw new Error('Failed to send email: ' + error.message);
    }
};

const protectedSendMail = circuitBreaker(sendMailImpl);

const sendMail = async (params) => {
    try {
        return await protectedSendMail.fire(params);
    } catch (error) {
        throw error;
    }
};

module.exports = sendMail