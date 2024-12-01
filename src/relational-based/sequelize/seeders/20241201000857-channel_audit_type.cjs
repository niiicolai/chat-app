'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('channelaudittype', data.channel_audit_types, {});
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('channelaudit', null, {});
      await queryInterface.bulkDelete('channelaudittype', null, {});
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
