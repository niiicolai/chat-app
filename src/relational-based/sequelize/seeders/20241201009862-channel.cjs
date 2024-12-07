'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('channel', data.rooms.flatMap(room => {
        return room.channels.map(channel => {
          return {
            uuid: channel.uuid,
            name: channel.name,
            description: channel.description,
            channel_type_name: channel.channel_type_name,
            room_uuid: room.uuid,
          };
        });
      }), {});

      await queryInterface.bulkInsert('channelwebhook', data.rooms.flatMap(room => {
        return room.channels.map(channel => {
          if (channel.channel_webhook) {
            return {
              uuid: channel.channel_webhook.uuid,
              name: channel.channel_webhook.name,
              description: channel.channel_webhook.description,
              channel_uuid: channel.uuid,
            };
          }

          return null;
        }).filter(item => item !== null);
      }), {});

      await queryInterface.bulkInsert('channelmessage', data.rooms.flatMap(room => {
        return room.channels.flatMap(channel => {
          return channel.channel_messages.map(channelMessage => {
            return {
              uuid: channelMessage.uuid,
              body: channelMessage.body,
              channel_message_type_name: channelMessage.channel_message_type_name,
              channel_uuid: channel.uuid,
              ...(channelMessage.user_uuid && { user_uuid: channelMessage.user_uuid }),
            };
          });
        });
      }), {});

      await queryInterface.bulkInsert('channelmessageupload', data.rooms.flatMap(room => {
        return room.channels.flatMap(channel => {
          return channel.channel_messages.map(channelMessage => {
            if (channelMessage.channel_message_upload) {
              return {
                uuid: channelMessage.channel_message_upload.uuid,
                channel_message_upload_type_name: channelMessage.channel_message_upload.channel_message_upload_type_name,
                room_file_uuid: channelMessage.channel_message_upload.room_file_uuid,
                channel_message_uuid: channelMessage.uuid,
              };
            }

            return null;
          });
        }).filter(item => item !== null);
      }), {});

      await queryInterface.bulkInsert('channelwebhookmessage', data.rooms.flatMap(room => {
        return room.channels.flatMap(channel => {
          return channel.channel_messages.map(channelMessage => {
            if (channelMessage.channel_webhook_message) {
              return {
                uuid: channelMessage.channel_webhook_message.uuid,
                channel_webhook_message_type_name: channelMessage.channel_webhook_message.channel_webhook_message_type_name,
                body: channelMessage.channel_webhook_message.body,
                channel_webhook_uuid: channel.channel_webhook.uuid,
                channel_message_uuid: channelMessage.uuid,
              };
            }

            return null;
          }).filter(item => item !== null);
        });
      }), {});
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('channelmessageupload', null, {});
      await queryInterface.bulkDelete('channelwebhookmessage', null, {});
      await queryInterface.bulkDelete('channelwebhook', null, {});
      await queryInterface.bulkDelete('channelmessage', null, {});
      await queryInterface.bulkDelete('channel', null, {});

    } catch (error) {
      console.error('Error deleting data', error);
    }
  }
};
