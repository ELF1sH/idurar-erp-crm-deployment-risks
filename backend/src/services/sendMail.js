const Nodemailer = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');
const circuitBreaker = require('@/utils/emailCircuitBreaker');
const logger = require("@/utils/logger");
const {metrics} = require("@/utils/metrics/emailMetrics");
const sleep = require("@/utils/sleep");
const randomIntFromInterval = require("@/utils/randomIntFromInterval");

const sendMailImpl = async ({ email, name, subject, link, type, htmlContent }) => {
    let endTimer;

    // [METRICS] Incrementing request in progress
    metrics.emailInProgress.inc(1);

    try {
        // [METRICS] Starting timer
        endTimer = metrics.emailDuration.startTimer();

        const transport = Nodemailer.createTransport(
            MailtrapTransport({
                token: process.env.MAILTRAP_TOKEN || 'aee38359c7eb0868230308c65d872439',
            })
        );

        const sender = {
            address: process.env.IDURAR_APP_EMAIL || "hello@demomailtrap.co",
            name: "Custom IDURAR App",
        };

        logger.info('[sendMail.js] Sending invoice mail');
        logger.debug('[sendMail.js] Sending invoice mail', {
            from: sender,
            to: email,
            subject,
            html: htmlContent,
            category: type,
        });

        const info = await transport.sendMail({
            from: sender,
            to: email,
            subject,
            html: htmlContent,
            category: type,
        });

        // const info = {
        //     some_mock_data: 'MOCK DATA',
        //     random: Math.random(),
        // }
        // await sleep(randomIntFromInterval(500, 2000));

        logger.info('[sendMail.js] Invoice mail has been successfully sent');
        logger.debug('[sendMail.js] Invoice mail has been successfully sent', {
            info,
        });

        // [METRICS] Incrementing counter
        metrics.emailCounter.inc(1);

        const requestSize = Buffer.byteLength(JSON.stringify({
            from: sender,
            to: email,
            subject,
            html: htmlContent,
            category: type,
        }));

        // [METRICS] Saving request size
        metrics.emailRequestSize.observe(requestSize);

        const responseSize = Buffer.byteLength(JSON.stringify(info));
        // [METRICS] Saving response size
        metrics.emailResponseSize.observe(responseSize);

        // [METRICS] Finishing timer
        endTimer();

        // [METRICS] Decreasing request in progress
        metrics.emailInProgress.dec(1);

        metrics.emailBusinessMetric.inc({
            outcome: 'success'
        })

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
        logger.error('[sendMail.js] Invoice mail has not been sent', {
            error,
        })

        // [METRICS] Finishing timer
        endTimer();

        // [METRICS] Decreasing request in progress
        metrics.emailInProgress.dec(1);

        metrics.emailBusinessMetric.inc({
            outcome: 'fail'
        })

        metrics.emailErrors.inc({
            error_type: error.name || 'UnknownError',
        })

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