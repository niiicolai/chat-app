'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('Room', data.rooms.map(room => {
        return {
          uuid: room.uuid,
          name: room.name,
          description: room.description,
          room_category_name: room.room_category_name,
        };
      }), {});
      await queryInterface.bulkInsert('RoomInviteLink', data.rooms.map(room => {
        return {
          uuid: room.room_invite_link.uuid,
          room_uuid: room.uuid,
          ...(room.room_invite_link.expired_at && { expired_at: room.room_invite_link.expired_at }),
        };
      }), {});
      await queryInterface.bulkInsert('RoomUser', data.rooms.flatMap(room => {
        return room.room_users.map(room_user => {
          return {
            uuid: room_user.uuid,
            user_uuid: room_user.user_uuid,
            room_user_role_name: room_user.room_user_role_name,
            room_uuid: room.uuid,
          };
        });
      }), {});
      await queryInterface.bulkInsert('RoomFile', data.rooms.flatMap(room => {
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
      await queryInterface.bulkDelete('RoomAudit', null, {});
      await queryInterface.bulkDelete('RoomJoinSetting`', null, {});
      await queryInterface.bulkDelete('RoomFileSetting', null, {});
      await queryInterface.bulkDelete('RoomUserSetting', null, {});
      await queryInterface.bulkDelete('RoomChannelSetting', null, {});
      await queryInterface.bulkDelete('RoomRulesSetting', null, {});
      await queryInterface.bulkDelete('RoomAvatar', null, {});
      await queryInterface.bulkDelete('RoomInviteLink', null, {});
      await queryInterface.bulkDelete('RoomUser', null, {});
      await queryInterface.bulkDelete('RoomFile', null, {});     
      await queryInterface.bulkDelete('Room', null, {});
    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
