const models = require('../../models');
const i18n = require('../../../shared/i18n');
const errors = require('@tryghost/errors');
const mega = require('../../services/mega');

const emailPreview = new mega.EmailPreview({
    apiVersion: 'canary'
});

module.exports = {
    docName: 'email_preview',

    read: {
        options: [
            'fields',
            'memberSegment'
        ],
        validation: {
            options: {
                fields: ['html', 'plaintext', 'subject']
            }
        },
        data: [
            'id',
            'status'
        ],
        permissions: true,
        async query(frame) {
            const options = Object.assign(frame.options, {formats: 'html,plaintext', withRelated: ['authors', 'posts_meta']});
            const data = Object.assign(frame.data, {status: 'all'});

            const model = await models.Post.findOne(data, options);

            if (!model) {
                throw new errors.NotFoundError({
                    message: i18n.t('errors.api.posts.postNotFound')
                });
            }

            return emailPreview.generateEmailContent(model, frame.options.memberSegment);
        }
    },
    sendTestEmail: {
        statusCode: 200,
        headers: {},
        options: [
            'id'
        ],
        validation: {
            options: {
                id: {
                    required: true
                }
            }
        },
        permissions: true,
        async query(frame) {
            const options = Object.assign(frame.options, {status: 'all'});
            let model = await models.Post.findOne(options, {withRelated: ['authors']});

            if (!model) {
                throw new errors.NotFoundError({
                    message: i18n.t('errors.api.posts.postNotFound')
                });
            }

            const {emails = [], memberSegment} = frame.data;
            return await mega.mega.sendTestEmail(model, emails, 'canary', memberSegment);
        }
    }
};
