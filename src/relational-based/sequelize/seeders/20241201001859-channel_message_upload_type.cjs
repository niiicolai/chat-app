'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('channelmessageuploadtype', data.channel_message_upload_types, {});
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('channelmessageuploadtype', null, {});
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
