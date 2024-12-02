'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const data = (await import('../../../seed_data.js')).default;

    try {
      await queryInterface.bulkInsert('user', data.users.map(user => {
        return {
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          avatar_src: user.avatar_src,
        };
      }), {});
      await queryInterface.bulkInsert('userlogin', data.users.flatMap(user => {
        return user.user_logins.map(user_login => {
          return {
            uuid: user_login.uuid,
            user_login_type_name: user_login.user_login_type,
            user_uuid: user.uuid,
            ...(user_login.password && { password: user_login.password }),
            ...(user_login.third_party_id && { third_party_id: user_login.third_party_id }),
          };
        });
      }
      ), {});
      await queryInterface.bulkInsert('userpasswordreset', data.users.flatMap(user => {
        return user.user_password_resets.map(user_password_reset => {
          return {
            uuid: user_password_reset.uuid,
            user_uuid: user.uuid,
            expires_at: user_password_reset.expires_at,
          };
        });
      }), {});

      // ensure the users are verified
      await Promise.all(data.users.map(user => {
        return queryInterface.sequelize.query('CALL set_user_email_verification_proc(:user_uuid, :user_is_verified)', {
          replacements: {
            user_uuid: user.uuid,
            user_is_verified: true,
          },
        });
      }));
    } catch (error) {
      console.error('Error inserting data', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
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
