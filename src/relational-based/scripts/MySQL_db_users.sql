USE chat;

-- ### USER ###

-- Create application user
CREATE USER IF NOT EXISTS 'chat_user'@'%' IDENTIFIED BY 'password';
-- Grant EXECUTE privilege on stored procedures
GRANT EXECUTE ON PROCEDURE `chat`.`check_upload_exceeds_total_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`check_upload_exceeds_single_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`check_channels_exceeds_total_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`check_users_exceeds_total_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`check_user_in_room_with_role_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`check_user_by_channel_uuid_in_room_with_role_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_user_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_user_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_user_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_user_avatar_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_room_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_room_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_room_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`join_room_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_room_user_role_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`leave_room_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_room_file_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_room_invite_link_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_room_invite_link_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_room_invite_link_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_channel_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_channel_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_channel_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_channel_message_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_channel_message_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_channel_message_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_channel_message_upload_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_channel_webhook_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_channel_webhook_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_channel_webhook_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_webhook_message_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`edit_room_setting_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`set_user_email_verification_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_user_password_reset_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_user_password_reset_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`update_user_status_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`create_user_login_proc` TO 'chat_user'@'%';
GRANT EXECUTE ON PROCEDURE `chat`.`delete_user_login_proc` TO 'chat_user'@'%';

-- Grant SELECT privilege on views only
GRANT SELECT ON `chat`.`user_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_user_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_user_role_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_category_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_file_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_file_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_avatar_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_audit_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_audit_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`room_invite_link_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_audit_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_audit_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_message_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_message_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_webhook_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_webhook_message_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_webhook_message_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_status_state_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_email_verification_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_password_reset_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_status_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_login_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`user_login_type_view` TO 'chat_user'@'%';
-- Flush privileges to apply changes
FLUSH PRIVILEGES;



-- Create a user with full database admin privileges
CREATE USER IF NOT EXISTS 'chat_admin'@'%' IDENTIFIED BY 'password';
-- Grant all privileges on chat database
GRANT ALL PRIVILEGES ON chat.* TO 'chat_admin'@'%';
-- Flush privileges to apply changes
FLUSH PRIVILEGES;


-- Create a user with read-only privileges
CREATE USER IF NOT EXISTS 'chat_guest'@'%' IDENTIFIED BY 'password';
-- Grant SELECT privilege on views only
GRANT SELECT ON `chat`.`user_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_user_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_user_role_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_category_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_file_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_file_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_avatar_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_audit_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_audit_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`room_invite_link_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_audit_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_audit_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_message_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_message_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_message_upload_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_message_upload_type_view` TO 'chat_user'@'%';
GRANT SELECT ON `chat`.`channel_webhook_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_webhook_message_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`channel_webhook_message_type_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_status_state_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_email_verification_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_password_reset_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_status_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_login_view` TO 'chat_guest'@'%';
GRANT SELECT ON `chat`.`user_login_type_view` TO 'chat_guest'@'%';
-- Flush privileges to apply changes
FLUSH PRIVILEGES;


-- Create a user with restricted reading privileges, which will be unable to see some data
CREATE USER IF NOT EXISTS 'chat_restricted'@'%' IDENTIFIED BY 'password';
-- Grant SELECT privilege on views only
GRANT SELECT ON `chat`.`room_audit_view` TO 'chat_restricted'@'%';
GRANT SELECT ON `chat`.`room_audit_type_view` TO 'chat_restricted'@'%';
GRANT SELECT ON `chat`.`channel_audit_view` TO 'chat_restricted'@'%';
GRANT SELECT ON `chat`.`channel_audit_type_view` TO 'chat_restricted'@'%';
-- Flush privileges to apply changes
FLUSH PRIVILEGES;
