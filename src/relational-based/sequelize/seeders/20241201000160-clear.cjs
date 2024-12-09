'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('ChannelAudit', null, {});
      await queryInterface.bulkDelete('channelmessageupload', null, {});
      await queryInterface.bulkDelete('channelwebhookmessage', null, {});
      await queryInterface.bulkDelete('channelwebhook', null, {});
      await queryInterface.bulkDelete('channelmessage', null, {});
      await queryInterface.bulkDelete('channel', null, {});

      await queryInterface.bulkDelete('roomaudit', null, {});
      await queryInterface.bulkDelete('roomjoinsetting`', null, {});
      await queryInterface.bulkDelete('roomfilesetting', null, {});
      await queryInterface.bulkDelete('roomusersetting', null, {});
      await queryInterface.bulkDelete('roomchannelsetting', null, {});
      await queryInterface.bulkDelete('roomrulessetting', null, {});
      await queryInterface.bulkDelete('roomavatar', null, {});
      await queryInterface.bulkDelete('roominvitelink', null, {});
      await queryInterface.bulkDelete('roomuser', null, {});
      await queryInterface.bulkDelete('roomfile', null, {});     
      await queryInterface.bulkDelete('room', null, {});
      
      await queryInterface.bulkDelete('userpasswordreset', null, {});
      await queryInterface.bulkDelete('userlogin', null, {});
      await queryInterface.bulkDelete('useremailverification', null, {});
      await queryInterface.bulkDelete('userstatus', null, {});
      await queryInterface.bulkDelete('user', null, {});
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
