'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('room', data.rooms.map(room => {
        return {
          uuid: room.uuid,
          name: room.name,
          description: room.description,
          room_category_name: room.room_category_name,
        };
      }), {});
      await queryInterface.bulkInsert('roominvitelink', data.rooms.map(room => {
        return {
          uuid: room.room_invite_link.uuid,
          room_uuid: room.uuid,
          ...(room.room_invite_link.expired_at && { expired_at: room.room_invite_link.expired_at }),
        };
      }), {});
      await queryInterface.bulkInsert('roomuser', data.rooms.flatMap(room => {
        return room.room_users.map(room_user => {
          return {
            uuid: room_user.uuid,
            user_uuid: room_user.user_uuid,
            room_user_role_name: room_user.room_user_role_name,
            room_uuid: room.uuid,
          };
        });
      }), {});
      await queryInterface.bulkInsert('roomfile', data.rooms.flatMap(room => {
        return room.room_files.map(room_file => {
          return {
            uuid: room_file.uuid,
            src: room_file.src,
            size: room_file.size,
            room_file_type_name: room_file.room_file_type_name,
            room_uuid: room.uuid,
          };
        });
      }), {});
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
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
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
