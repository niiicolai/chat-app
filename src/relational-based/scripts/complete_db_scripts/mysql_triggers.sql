USE chat;

-- ### TRIGGERS ###

-- Trigger to delete all related rows when a user is deleted
DROP TRIGGER IF EXISTS user_before_delete;
DELIMITER //
CREATE TRIGGER user_before_delete
BEFORE DELETE ON User
FOR EACH ROW
BEGIN
    DELETE FROM RoomUser WHERE user_uuid = OLD.uuid;
    DELETE FROM ChannelMessage WHERE user_uuid = OLD.uuid;
    DELETE FROM UserEmailVerification WHERE user_uuid = OLD.uuid;
    DELETE FROM UserPasswordReset WHERE user_uuid = OLD.uuid;
    DELETE FROM UserStatus WHERE user_uuid = OLD.uuid;
    DELETE FROM UserLogin WHERE user_uuid = OLD.uuid;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS user_after_insert;
DELIMITER //
CREATE TRIGGER user_after_insert
AFTER INSERT ON User
FOR EACH ROW
BEGIN
    -- Insert UserEmailVerification
    INSERT INTO UserEmailVerification (uuid, user_uuid) VALUES (UUID(), NEW.uuid);
    -- Insert UserStatus
    INSERT INTO UserStatus (uuid, user_uuid, user_status_state_name, message) VALUES (UUID(), NEW.uuid, 'OFFLINE', 'No status message yet.');
END //
DELIMITER ;


-- Trigger to insert a new row into roomsetting when a new room is created
DROP TRIGGER IF EXISTS room_settings_after_insert_room;
DELIMITER //
CREATE TRIGGER room_settings_after_insert_room
AFTER INSERT ON Room
FOR EACH ROW
BEGIN
    INSERT INTO RoomFileSetting (uuid, room_uuid, total_files_bytes_allowed, single_file_bytes_allowed) VALUES (UUID(), NEW.uuid, 26214400, 5242880);
    INSERT INTO RoomJoinSetting (uuid, room_uuid, join_channel_uuid, join_message) VALUES (UUID(), NEW.uuid, NULL, '{name} entered the room!');
    INSERT INTO RoomRulesSetting (uuid, room_uuid, rules_text) VALUES (UUID(), NEW.uuid, 'No rules yet.');
    INSERT INTO RoomUserSetting (uuid, room_uuid, max_users) VALUES (UUID(), NEW.uuid, 25);
    INSERT INTO RoomChannelSetting (uuid, room_uuid, max_channels, message_days_to_live) VALUES (UUID(), NEW.uuid, 5, 30);
    INSERT INTO RoomAvatar (uuid, room_uuid, room_file_uuid) VALUES (UUID(), NEW.uuid, NULL);
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'name', NEW.name, 'description', NEW.description, 'room_category_name', NEW.room_category_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.uuid, 
        'ROOM_CREATED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room is edited
DROP TRIGGER IF EXISTS room_after_update;
DELIMITER //
CREATE TRIGGER room_after_update
AFTER UPDATE ON Room
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'name', NEW.name, 'description', NEW.description, 'room_category_name', NEW.room_category_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.uuid, 
        'ROOM_EDITED'
    );
END //
DELIMITER ;



-- Trigger to delete all related rows when a room is deleted
DROP TRIGGER IF EXISTS room_before_delete;
DELIMITER //
CREATE TRIGGER room_before_delete
BEFORE DELETE ON Room
FOR EACH ROW
BEGIN
    DELETE FROM RoomFileSetting WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomJoinSetting WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomRulesSetting WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomUserSetting WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomChannelSetting WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomInviteLink WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomUser WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomAvatar WHERE room_uuid = OLD.uuid;
    DELETE FROM RoomFile WHERE room_uuid = OLD.uuid;
    DELETE FROM Channel WHERE room_uuid = OLD.uuid;

    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'name', OLD.name, 'description', OLD.description, 'room_category_name', OLD.room_category_name, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.uuid, 
        'ROOM_DELETED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room join setting is edited
DROP TRIGGER IF EXISTS room_join_setting_after_update;
DELIMITER //
CREATE TRIGGER room_join_setting_after_update
AFTER UPDATE ON RoomJoinSetting
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'join_channel_uuid', NEW.join_channel_uuid, 'join_message', NEW.join_message, 'room_uuid', NEW.room_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'JOIN_SETTING_EDITED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room invite link is created
DROP TRIGGER IF EXISTS room_invite_link_after_insert;
DELIMITER //
CREATE TRIGGER room_invite_link_after_insert
AFTER INSERT ON RoomInviteLink
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'room_uuid', NEW.room_uuid, 'expires_at', NEW.expires_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'INVITE_LINK_CREATED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room invite link is edited
DROP TRIGGER IF EXISTS room_invite_link_after_update;
DELIMITER //
CREATE TRIGGER room_invite_link_after_update
AFTER UPDATE ON RoomInviteLink
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'room_uuid', NEW.room_uuid, 'expires_at', NEW.expires_at, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), 
        NEW.room_uuid, 
        'INVITE_LINK_EDITED'
    );
END //
DELIMITER ;



-- Trigger to delete all related rows when a room invite link is deleted
DROP TRIGGER IF EXISTS room_invite_link_before_delete;
DELIMITER //
CREATE TRIGGER room_invite_link_before_delete
BEFORE DELETE ON RoomInviteLink
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'room_uuid', OLD.room_uuid, 'expires_at', OLD.expires_at, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.room_uuid, 
        'INVITE_LINK_DELETED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room user is created
DROP TRIGGER IF EXISTS room_user_after_insert;
DELIMITER //
CREATE TRIGGER room_user_after_insert
AFTER INSERT ON RoomUser
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'room_uuid', NEW.room_uuid, 'user_uuid', NEW.user_uuid, 'room_user_role_name', NEW.room_user_role_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'USER_ADDED'
    );    
END //
DELIMITER ;



-- Trigger to delete all related rows when a room user is deleted
DROP TRIGGER IF EXISTS room_user_before_delete;
DELIMITER //
CREATE TRIGGER room_user_before_delete
BEFORE DELETE ON RoomUser
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'room_uuid', OLD.room_uuid, 'user_uuid', OLD.user_uuid, 'room_user_role_name', OLD.room_user_role_name, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.room_uuid, 
        'USER_REMOVED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room file is created
DROP TRIGGER IF EXISTS room_file_after_insert;
DELIMITER //
CREATE TRIGGER room_file_after_insert
AFTER INSERT ON RoomFile
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'src', NEW.src, 'size', NEW.size, 'room_uuid', NEW.room_uuid, 'room_file_type_name', NEW.room_file_type_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'FILE_CREATED'
    );
END //
DELIMITER ;



-- Trigger to delete all related rows when a room file is deleted
DROP TRIGGER IF EXISTS room_file_before_delete;
DELIMITER //
CREATE TRIGGER room_file_before_delete
BEFORE DELETE ON RoomFile
FOR EACH ROW
BEGIN
    -- if the room file is a room avatar, remove the room_file_uuid from the room avatar
    if OLD.room_file_type_name = 'RoomAvatar' THEN
        UPDATE RoomAvatar SET room_file_uuid = NULL WHERE room_file_uuid = OLD.uuid;
    end if;
    -- if the room file is a channel avatar, remove the room_file_uuid from the channel
    if OLD.room_file_type_name = 'ChannelAvatar' THEN
        UPDATE Channel SET room_file_uuid = NULL WHERE room_file_uuid = OLD.uuid;
    end if;
    -- if the room file is a channel webhook avatar, remove the room_file_uuid from the channel webhook
    if OLD.room_file_type_name = 'ChannelWebhookAvatar' THEN
        UPDATE ChannelWebhook SET room_file_uuid = NULL WHERE room_file_uuid = OLD.uuid;
    end if;
    -- if the room file is a channel message upload, delete the channel message upload
    if OLD.room_file_type_name = 'ChannelMessageUpload' THEN
        DELETE FROM ChannelMessageUpload WHERE room_file_uuid = OLD.uuid;
    end if;
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'src', OLD.src, 'size', OLD.size, 'room_uuid', OLD.room_uuid, 'room_file_type_name', OLD.room_file_type_name, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.room_uuid, 
        'FILE_DELETED'
        );
END //
DELIMITER ;



-- Trigger to create audit log when a room avatar is created
DROP TRIGGER IF EXISTS room_avatar_after_insert;
DELIMITER //
CREATE TRIGGER room_avatar_after_insert
AFTER INSERT ON RoomAvatar
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'room_uuid', NEW.room_uuid, 'room_file_uuid', NEW.room_file_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'AVATAR_CREATED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a room avatar is edited
DROP TRIGGER IF EXISTS room_avatar_after_update;
DELIMITER //
CREATE TRIGGER room_avatar_after_update
AFTER UPDATE ON RoomAvatar
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'room_uuid', NEW.room_uuid, 'room_file_uuid', NEW.room_file_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.room_uuid, 
        'AVATAR_EDITED'
    );
END //
DELIMITER ;



-- Trigger to delete all related rows when a room avatar is deleted
DROP TRIGGER IF EXISTS room_avatar_before_delete;
DELIMITER //
CREATE TRIGGER room_avatar_before_delete
BEFORE DELETE ON RoomAvatar
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO RoomAudit (uuid, body, room_uuid, room_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'room_uuid', OLD.room_uuid, 'room_file_uuid', OLD.room_file_uuid, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.room_uuid, 
        'AVATAR_DELETED'
    );
END //
DELIMITER ;


-- Trigger to create audit log when a channel is created
DROP TRIGGER IF EXISTS channel_after_insert;
DELIMITER //
CREATE TRIGGER channel_after_insert
AFTER INSERT ON Channel
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
		UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'name', NEW.name, 'description', NEW.description, 'channel_type_name', NEW.channel_type_name, 'room_uuid', NEW.room_uuid, 'room_file_uuid', NEW.room_file_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.uuid, 
        'CHANNEL_CREATED'
	);
END //
DELIMITER ;



-- Trigger to create audit log when a channel is edited
DROP TRIGGER IF EXISTS channel_after_update;
DELIMITER //
CREATE TRIGGER channel_after_update
AFTER UPDATE ON Channel
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
		UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'name', NEW.name, 'description', NEW.description, 'channel_type_name', NEW.channel_type_name, 'room_uuid', NEW.room_uuid, 'room_file_uuid', NEW.room_file_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.uuid, 
        'CHANNEL_EDITED'
	);
END //
DELIMITER ;



-- Trigger to delete all related rows when a channel is deleted
DROP TRIGGER IF EXISTS channel_before_delete;
DELIMITER //
CREATE TRIGGER channel_before_delete
BEFORE DELETE ON Channel
FOR EACH ROW
BEGIN
    -- Clear the join channel uuid from the room join setting if it is the same as the channel being deleted
    UPDATE RoomJoinSetting SET join_channel_uuid = NULL WHERE join_channel_uuid = OLD.uuid;

    -- Delete all related rows
    DELETE FROM ChannelMessage WHERE channel_uuid = OLD.uuid;
    DELETE FROM ChannelWebhook WHERE channel_uuid = OLD.uuid;
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
		UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'name', OLD.name, 'description', OLD.description, 'channel_type_name', OLD.channel_type_name, 'room_uuid', OLD.room_uuid, 'room_file_uuid', OLD.room_file_uuid, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.uuid, 
        'CHANNEL_DELETED'
	);
END //
DELIMITER ;



-- Trigger to create audit log when a channel message is created
DROP TRIGGER IF EXISTS channel_message_after_insert;
DELIMITER //
CREATE TRIGGER channel_message_after_insert
AFTER INSERT ON ChannelMessage
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'body', NEW.body, 'channel_uuid', NEW.channel_uuid, 'user_uuid', NEW.user_uuid, 'channel_message_type_name', NEW.channel_message_type_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.channel_uuid, 
        'MESSAGE_CREATED'
    );
END //
DELIMITER ;



-- Trigger to create audit log when a channel message is edited
DROP TRIGGER IF EXISTS channel_message_after_update;
DELIMITER //
CREATE TRIGGER channel_message_after_update
AFTER UPDATE ON ChannelMessage
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', NEW.uuid, 'body', NEW.body, 'channel_uuid', NEW.channel_uuid, 'user_uuid', NEW.user_uuid, 'channel_message_type_name', NEW.channel_message_type_name, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.channel_uuid, 
        'MESSAGE_EDITED'
    );
END //
DELIMITER ;



-- Trigger to delete all related rows when a channel message is deleted
DROP TRIGGER IF EXISTS channel_message_before_delete;
DELIMITER //
CREATE TRIGGER channel_message_before_delete
BEFORE DELETE ON ChannelMessage
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    DELETE FROM ChannelMessageUpload WHERE channel_message_uuid = OLD.uuid;
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'body', OLD.body, 'channel_uuid', OLD.channel_uuid, 'user_uuid', OLD.user_uuid, 'channel_message_type_name', OLD.channel_message_type_name, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.channel_uuid, 
        'MESSAGE_DELETED'
    );
    
END //
DELIMITER ;



-- Trigger to create audit log when a channel webhook is created
DROP TRIGGER IF EXISTS channel_webhook_after_insert;
DELIMITER //
CREATE TRIGGER channel_webhook_after_insert
AFTER INSERT ON ChannelWebhook
FOR EACH ROW
BEGIN
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
        UUID(),
        JSON_OBJECT('uuid', NEW.uuid, 'name', NEW.name, 'description', NEW.description, 'channel_uuid', NEW.channel_uuid, 'room_file_uuid', NEW.room_file_uuid, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at),
        NEW.channel_uuid, 
        'WEBHOOK_CREATED'
    );
END //
DELIMITER ;


-- Trigger to create audit log when a channel webhook is deleted
DROP TRIGGER IF EXISTS channel_webhook_before_delete;
DELIMITER //
CREATE TRIGGER channel_webhook_before_delete
BEFORE DELETE ON ChannelWebhook
FOR EACH ROW
BEGIN    
    -- Add information to the audit log
    INSERT INTO ChannelAudit (uuid, body, channel_uuid, channel_audit_type_name) VALUES (
        UUID(), 
        JSON_OBJECT('uuid', OLD.uuid, 'name', OLD.name, 'description', OLD.description, 'channel_uuid', OLD.channel_uuid, 'room_file_uuid', OLD.room_file_uuid, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
        OLD.channel_uuid, 
        'WEBHOOK_DELETED'
    );
    -- Delete all related rows
    DELETE FROM ChannelWebhookMessage WHERE channel_webhook_uuid = OLD.uuid;
END //
DELIMITER ;
