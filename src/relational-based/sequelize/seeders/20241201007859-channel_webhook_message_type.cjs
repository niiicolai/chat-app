'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('ChannelWebhookMessageType', data.channel_webhook_message_types, {});
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('ChannelWebhookMessageType', null, {});
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
