
DROP DATABASE IF EXISTS chat;
CREATE DATABASE chat;
USE chat;

-- ### TABLES ###



-- A category is used for organizing rooms.
DROP TABLE IF EXISTS RoomCategory;
CREATE TABLE RoomCategory (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- A role is used for managing permissions in a room.
DROP TABLE IF EXISTS RoomUserRole;
CREATE TABLE RoomUserRole (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- The type of a room audit is used to categorize different types of audits.
DROP TABLE IF EXISTS RoomAuditType;
CREATE TABLE RoomAuditType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- The type of a room file is used to categorize different types of files.
DROP TABLE IF EXISTS RoomFileType;
CREATE TABLE RoomFileType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- The type of channel determines its functionality.
DROP TABLE IF EXISTS ChannelType;
CREATE TABLE ChannelType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- Used to determine if the message was created by the system. 
DROP TABLE IF EXISTS ChannelMessageType;
CREATE TABLE ChannelMessageType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- Used to determine what type of message was sent by a webhook.
DROP TABLE IF EXISTS ChannelWebhookMessageType;
CREATE TABLE ChannelWebhookMessageType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- An upload type is used to categorize different types of uploads.
DROP TABLE IF EXISTS ChannelMessageUploadType;
CREATE TABLE ChannelMessageUploadType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- The type of a channel audit is used to categorize different types of audits.
DROP TABLE IF EXISTS ChannelAuditType;
CREATE TABLE ChannelAuditType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS UserLoginType;
CREATE TABLE UserLoginType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users are created when they sign up for the chat application.
-- Their email and username must be unique.
-- The application is responsible for hashing the password before storing it.
-- The avatar_src is a link to the user's profile picture.
-- The username must be between 3 and 255 characters.
-- The email must be between 3 and 255 characters.
-- The password must be between 8 and 255 characters.
DROP TABLE IF EXISTS User;
CREATE TABLE User (
    uuid VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_src TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT user_username UNIQUE (username),
    CONSTRAINT user_email UNIQUE (email)
);

DROP TABLE IF EXISTS UserLogin;
CREATE TABLE UserLogin (
    uuid VARCHAR(36) PRIMARY KEY,
    user_uuid VARCHAR(36) NOT NULL,
    user_login_type_name VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    third_party_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    FOREIGN KEY (user_login_type_name) REFERENCES UserLoginType(name),
    CONSTRAINT user_login_unique UNIQUE (user_uuid, user_login_type_name),
    CONSTRAINT user_login_third_party_id_unique UNIQUE (third_party_id)
);

-- Rooms can have members and channels for communication.
DROP TABLE IF EXISTS Room;
CREATE TABLE Room (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    room_category_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_category_name) REFERENCES RoomCategory(name),
    CONSTRAINT room_name UNIQUE (name)
);



-- A room audit is created when a user performs an action in a room.
DROP TABLE IF EXISTS RoomAudit;
CREATE TABLE RoomAudit (
    uuid VARCHAR(36) PRIMARY KEY,
    body TEXT NOT NULL,
    room_audit_type_name VARCHAR(255) NOT NULL,
    room_uuid VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_audit_type_name) REFERENCES RoomAuditType(name)
);



-- Room invite links can be sent to others to join a room.
DROP TABLE IF EXISTS RoomInviteLink;
CREATE TABLE RoomInviteLink (
    uuid VARCHAR(36) PRIMARY KEY,
    room_uuid VARCHAR(36) NOT NULL,
    expires_at DATETIME DEFAULT NULL, -- NULL for never expires
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid)
);



-- A room file is a file uploaded to a room.
DROP TABLE IF EXISTS RoomFile;
CREATE TABLE RoomFile (
    uuid VARCHAR(36) PRIMARY KEY,
    src TEXT NOT NULL,
    size INTEGER NOT NULL,
    room_file_type_name VARCHAR(255) NOT NULL,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (room_file_type_name) REFERENCES RoomFileType(name),
    INDEX (size)
);



-- A room avatar is a profile picture for a room.
DROP TABLE IF EXISTS RoomAvatar;
CREATE TABLE RoomAvatar (
    uuid VARCHAR(36) PRIMARY KEY,
    room_uuid VARCHAR(36) NOT NULL,
    room_file_uuid VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (room_file_uuid) REFERENCES RoomFile(uuid),
    UNIQUE KEY unique_room_avatar (room_uuid) -- Only one avatar per room
);



-- A user room is used to define room membership and roles.
-- The room_role_name is used to determine the user's permissions in the room.
DROP TABLE IF EXISTS RoomUser;
CREATE TABLE RoomUser (
    uuid VARCHAR(36) PRIMARY KEY,
    room_uuid VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    room_user_role_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    FOREIGN KEY (room_user_role_name) REFERENCES RoomUserRole(name),
    UNIQUE KEY unique_user_room (room_uuid, user_uuid)
);



-- Channels are used for communication within a room.
-- A room can have multiple channels for different purposes.
-- And a channel can only belong to one room.
DROP TABLE IF EXISTS Channel;
CREATE TABLE Channel (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    room_uuid VARCHAR(36) NOT NULL,
    channel_type_name VARCHAR(255) NOT NULL,
    room_file_uuid VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (channel_type_name) REFERENCES ChannelType(name),
    FOREIGN KEY (room_file_uuid) REFERENCES RoomFile(uuid),
    UNIQUE KEY name_type_room_uuid (name, channel_type_name, room_uuid)
);



-- Each room have a setting for the file uploads.
DROP TABLE IF EXISTS RoomFileSetting;
CREATE TABLE RoomFileSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    total_files_bytes_allowed INTEGER DEFAULT 26214400,
    single_file_bytes_allowed INTEGER DEFAULT 5242880,
    file_days_to_live INTEGER DEFAULT 30,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    UNIQUE KEY unique_room_file_setting (room_uuid) -- Only one setting per room
);



-- Each room have a setting for the joining.
DROP TABLE IF EXISTS RoomJoinSetting;
CREATE TABLE RoomJoinSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    join_channel_uuid VARCHAR(36) DEFAULT NULL,
    join_message VARCHAR(255) DEFAULT "{name} has entered the room!",
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (join_channel_uuid) REFERENCES Channel(uuid),
    UNIQUE KEY unique_room_join_setting (room_uuid) -- Only one setting per room
);



-- Each room have a setting for the rules.
DROP TABLE IF EXISTS RoomRulesSetting;
CREATE TABLE RoomRulesSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    rules_text TEXT NOT NULL,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    UNIQUE KEY unique_room_rules_setting (room_uuid) -- Only one setting per room
);



-- Each room can have a setting for the user.
DROP TABLE IF EXISTS RoomUserSetting;
CREATE TABLE RoomUserSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    max_users INTEGER DEFAULT 25,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    UNIQUE KEY unique_room_member_setting (room_uuid) -- Only one setting per room
);



-- A channel audit is created when a user performs an action in a channel.
DROP TABLE IF EXISTS ChannelAudit;
CREATE TABLE ChannelAudit (
    uuid VARCHAR(36) PRIMARY KEY,
    body TEXT NOT NULL,
    channel_audit_type_name VARCHAR(255) NOT NULL,
    channel_uuid VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_audit_type_name) REFERENCES ChannelAuditType(name)
);



-- Each room have a setting for the channels.
DROP TABLE IF EXISTS RoomChannelSetting;
CREATE TABLE RoomChannelSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    max_channels INTEGER DEFAULT 5,
    message_days_to_live INTEGER DEFAULT 30,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    UNIQUE KEY unique_room_channel_setting (room_uuid) -- Only one setting per room
);



-- A channel message is a text message sent by a user or the system.
DROP TABLE IF EXISTS ChannelMessage;
CREATE TABLE ChannelMessage (
    uuid VARCHAR(36) PRIMARY KEY,
    body TEXT NOT NULL,
    channel_message_type_name VARCHAR(255) NOT NULL,
    channel_uuid VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_uuid) REFERENCES Channel(uuid),
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    FOREIGN KEY (channel_message_type_name) REFERENCES ChannelMessageType(name)
);



-- A message upload is a file or image uploaded with a channel message.
DROP TABLE IF EXISTS ChannelMessageUpload;
CREATE TABLE ChannelMessageUpload (
    uuid VARCHAR(36) PRIMARY KEY,
    channel_message_upload_type_name VARCHAR(255) NOT NULL,
    channel_message_uuid VARCHAR(36) NOT NULL,
    room_file_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_message_upload_type_name) REFERENCES ChannelMessageUploadType(name),
    FOREIGN KEY (channel_message_uuid) REFERENCES ChannelMessage(uuid),
    FOREIGN KEY (room_file_uuid) REFERENCES RoomFile(uuid),
    UNIQUE KEY unique_message_upload (channel_message_uuid) -- Only one upload per message
);



-- A channel webhook is used by external services to send messages to a channel.
DROP TABLE IF EXISTS ChannelWebhook;
CREATE TABLE ChannelWebhook (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    channel_uuid VARCHAR(36) NOT NULL,
    room_file_uuid VARCHAR(36) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_uuid) REFERENCES Channel(uuid),
    UNIQUE KEY unique_channel_webhook (channel_uuid)
);



-- A channel webhook message is created when a webhook sends a message to a channel.
DROP TABLE IF EXISTS ChannelWebhookMessage;
CREATE TABLE ChannelWebhookMessage (
    uuid VARCHAR(36) PRIMARY KEY,
    body TEXT NOT NULL,
    channel_webhook_uuid VARCHAR(36) NOT NULL,
    channel_message_uuid VARCHAR(36) NOT NULL,
    channel_webhook_message_type_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_webhook_uuid) REFERENCES ChannelWebhook(uuid),
    FOREIGN KEY (channel_message_uuid) REFERENCES ChannelMessage(uuid),
    FOREIGN KEY (channel_webhook_message_type_name) REFERENCES ChannelWebhookMessageType(name)
);

-- A user password reset is used to reset a user's password.
DROP TABLE IF EXISTS UserPasswordReset;
CREATE TABLE UserPasswordReset (
    uuid VARCHAR(36) PRIMARY KEY,
    user_uuid VARCHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES User(uuid)
);

-- A user email verification is used to verify a user's email.
DROP TABLE IF EXISTS UserEmailVerification;
CREATE TABLE UserEmailVerification (
    uuid VARCHAR(36) PRIMARY KEY,
    user_uuid VARCHAR(36) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    CONSTRAINT user_email_verification_unique UNIQUE (user_uuid) -- Only one verification per user
);

-- A user status state is used to determine if a user is online or offline.
DROP TABLE IF EXISTS UserStatusState;
CREATE TABLE UserStatusState (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- A user status is used to determine if a user is online or offline.
DROP TABLE IF EXISTS UserStatus;
CREATE TABLE UserStatus (
    uuid VARCHAR(36) PRIMARY KEY,
    user_uuid VARCHAR(36) NOT NULL,
    user_status_state_name VARCHAR(255) NOT NULL,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    message TEXT DEFAULT NULL,
    total_online_hours INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_status_state_name) REFERENCES UserStatusState(name),
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    CONSTRAINT user_status_unique UNIQUE (user_uuid) -- Only one status per user
);

-- ### EVENTS ###

-- Event to delete expired room invite links
DROP EVENT IF EXISTS delete_expired_room_invite_links;
DELIMITER //
CREATE EVENT delete_expired_room_invite_links
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE FROM RoomInviteLink WHERE expires_at < NOW();
END //
DELIMITER ;

-- Event to delete expired user password resets
DROP EVENT IF EXISTS delete_expired_user_password_resets;
DELIMITER //
CREATE EVENT delete_expired_user_password_resets
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE FROM UserPasswordReset WHERE expires_at < NOW();
END //
DELIMITER ;


-- ### FUNCTIONS ###


-- Convert bytes to kilobytes in SQL
DROP FUNCTION IF EXISTS bytes_to_kb;
DELIMITER //
CREATE FUNCTION bytes_to_kb(bytes BIGINT)
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1024;
END;
//
DELIMITER ;



-- Convert bytes to megabytes in SQL
DROP FUNCTION IF EXISTS bytes_to_mb;
DELIMITER //
CREATE FUNCTION bytes_to_mb(bytes BIGINT) 
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1048576;
END;
//
DELIMITER ;



-- Convert bytes to gigabytes in SQL
DROP FUNCTION IF EXISTS bytes_to_gb;
DELIMITER //
CREATE FUNCTION bytes_to_gb(bytes BIGINT) 
RETURNS DECIMAL(10,2)
NO SQL
BEGIN
    RETURN bytes / 1073741824;
END;
//
DELIMITER ;


-- Check if a datetime never expires
-- Convert null to true and a datetime to false
DROP FUNCTION IF EXISTS never_expires;
DELIMITER //
CREATE FUNCTION never_expires(datetime DATETIME)
RETURNS BOOLEAN
NO SQL
BEGIN
    IF datetime IS NULL THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
//
DELIMITER ;


-- ### STORED PROCEDURES ###


-- Check if the total size + the new upload size exceeds the allowed total size for a room
DROP PROCEDURE IF EXISTS check_upload_exceeds_total_proc;
DELIMITER //
CREATE PROCEDURE check_upload_exceeds_total_proc(
    IN new_file_bytes_input BIGINT,
    IN room_uuid_input VARCHAR(36),
    OUT result BOOLEAN
)
BEGIN
    DECLARE total_files_bytes_allowed BIGINT DEFAULT 0;
    DECLARE total_files_bytes_sum BIGINT DEFAULT 0;

    -- Sum all the uploads in the room and get the total size allowed
    SELECT 
        COALESCE(SUM(rf.size), 0),
        rs.total_files_bytes_allowed
    INTO 
        total_files_bytes_sum,
        total_files_bytes_allowed
    FROM 
        RoomFileSetting rs 
    LEFT JOIN 
        RoomFile rf 
    ON 
        rs.room_uuid = rf.room_uuid
    WHERE 
        rs.room_uuid = room_uuid_input
	GROUP BY rs.total_files_bytes_allowed;

    -- Check if the total size + the new upload size exceeds 
    -- the allowed total size for a room.
    SET result = (total_files_bytes_sum + new_file_bytes_input) > total_files_bytes_allowed;
END //
DELIMITER ;



-- Check if the new upload size exceeds the allowed single file size for a room
DROP PROCEDURE IF EXISTS check_upload_exceeds_single_proc;
DELIMITER //
CREATE PROCEDURE check_upload_exceeds_single_proc(
    IN new_file_bytes_input BIGINT,
    IN room_uuid_input VARCHAR(36),
    OUT result BOOLEAN
)
BEGIN
    DECLARE single_file_bytes_allowed BIGINT;

    -- Sum all the uploads in the room and get the total size allowed
    SELECT rs.single_file_bytes_allowed INTO single_file_bytes_allowed
    FROM RoomFileSetting rs
    WHERE rs.room_uuid = room_uuid_input
    GROUP BY rs.single_file_bytes_allowed;
    
    -- Check if the new upload size exceeds the allowed single file size for a room.
    SET result = (new_file_bytes_input > single_file_bytes_allowed);
END //
DELIMITER ;



-- Check if the number of channels plus a number exceeds the allowed number of channels for a room
DROP PROCEDURE IF EXISTS check_channels_exceeds_total_proc;
DELIMITER //
CREATE PROCEDURE check_channels_exceeds_total_proc(
    IN room_uuid_input VARCHAR(36),
    IN number_of_channels_input INT,
    OUT result BOOLEAN
)
BEGIN
    DECLARE total_channels_allowed INTEGER;
    DECLARE total_channels_count INTEGER;

    -- Count all the channels in the room and get the total number allowed
    SELECT COUNT(*), rs.max_channels INTO total_channels_count, total_channels_allowed
    FROM RoomChannelSetting rs
        LEFT JOIN Channel c ON rs.room_uuid = c.room_uuid
    WHERE rs.room_uuid = room_uuid_input
    GROUP BY rs.max_channels;
    
    -- Check if the number of channels plus a number exceeds the allowed number of channels for a room.
    SET result = ((total_channels_count + number_of_channels_input) > total_channels_allowed);
END //
DELIMITER ;



-- Check if the number of users plus a users exceeds the allowed number of users for a room
DROP PROCEDURE IF EXISTS check_users_exceeds_total_proc;
DELIMITER //
CREATE PROCEDURE check_users_exceeds_total_proc(
    IN room_uuid_input VARCHAR(36),
    IN number_of_users_input INT,
    OUT result BOOLEAN
)
BEGIN
    DECLARE total_users_allowed INTEGER;
    DECLARE total_users_count INTEGER;

    -- Count all the users in the room and get the total number allowed
    SELECT COUNT(*), rs.max_users INTO total_users_count, total_users_allowed
    FROM RoomUserSetting rs
        LEFT JOIN RoomUser ur ON rs.room_uuid = ur.room_uuid
    WHERE rs.room_uuid = room_uuid_input
    GROUP BY rs.max_users;
    
    -- Check if the number of members plus a number exceeds the allowed number of members for a room.
    SET result = ((total_users_count + number_of_users_input) > total_users_allowed);
END //
DELIMITER ;



-- Create a user
DROP PROCEDURE IF EXISTS create_user_proc;
DELIMITER //
CREATE PROCEDURE create_user_proc(
    IN user_uuid_input VARCHAR(36),
    IN user_name_input VARCHAR(255),
    IN user_email_input VARCHAR(255),
    IN user_avatar_src_input TEXT
)
BEGIN
    INSERT INTO User (uuid, username, email, avatar_src) VALUES (user_uuid_input, user_name_input, user_email_input, user_avatar_src_input);
END //
DELIMITER ;


-- check if a user is in a room and has a specific role
DROP PROCEDURE IF EXISTS check_user_in_room_with_role_proc;
DELIMITER //
CREATE PROCEDURE check_user_in_room_with_role_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_user_role_name_input VARCHAR(255),
    OUT result BOOLEAN
)
BEGIN
    DECLARE user_role_name VARCHAR(255);

    IF room_user_role_name_input IS NULL THEN
        SELECT ru.room_user_role_name INTO user_role_name
        FROM RoomUser ru
        WHERE ru.user_uuid = user_uuid_input AND ru.room_uuid = room_uuid_input;
        SET result = (user_role_name IS NOT NULL);
    ELSE
        -- Check if the user is in the room and has the specific role
        SELECT ru.room_user_role_name INTO user_role_name
        FROM RoomUser ru
        WHERE ru.user_uuid = user_uuid_input AND ru.room_uuid = room_uuid_input;
        SET result = (user_role_name = room_user_role_name_input);
    END IF;
END //
DELIMITER ;


-- check if a user by channel uuid is in a room and has a specific role
DROP PROCEDURE IF EXISTS check_user_by_channel_uuid_in_room_with_role_proc;
DELIMITER //
CREATE PROCEDURE check_user_by_channel_uuid_in_room_with_role_proc(
    IN user_uuid_input VARCHAR(36),
    IN channel_uuid_input VARCHAR(36),
    IN room_user_role_name_input VARCHAR(255),
    OUT result BOOLEAN
)
BEGIN
    DECLARE user_role_name VARCHAR(255);

    IF room_user_role_name_input IS NULL THEN
        SELECT ru.room_user_role_name INTO user_role_name
        FROM RoomUser ru
        WHERE ru.user_uuid = user_uuid_input AND ru.room_uuid = (SELECT c.room_uuid FROM Channel c WHERE c.uuid = channel_uuid_input);
        SET result = (user_role_name IS NOT NULL);
    ELSE
        -- Check if the user is in the room and has the specific role
        SELECT room_user_role_name INTO user_role_name
        FROM RoomUser ru
        WHERE ru.user_uuid = user_uuid_input AND ru.room_uuid = (SELECT c.room_uuid FROM Channel c WHERE c.uuid = channel_uuid_input);
        SET result = (user_role_name = room_user_role_name_input);
    END IF;
END //
DELIMITER ;


-- Edit a user
DROP PROCEDURE IF EXISTS edit_user_proc;
DELIMITER //
CREATE PROCEDURE edit_user_proc(
    IN user_uuid_input VARCHAR(36),
    IN user_name_input VARCHAR(255),
    IN user_email_input VARCHAR(255),
    IN user_avatar_src_input TEXT
)
BEGIN
    UPDATE User SET username = user_name_input, email = user_email_input, avatar_src = user_avatar_src_input WHERE uuid = user_uuid_input;
END //
DELIMITER ;


-- Delete a user
DROP PROCEDURE IF EXISTS delete_user_proc;
DELIMITER //
CREATE PROCEDURE delete_user_proc(
    IN user_uuid_input VARCHAR(36)
)
BEGIN
    DELETE FROM User WHERE uuid = user_uuid_input;
END //
DELIMITER ;



-- Delete a user avatar
DROP PROCEDURE IF EXISTS delete_user_avatar_proc;
DELIMITER //
CREATE PROCEDURE delete_user_avatar_proc(
    IN user_uuid_input VARCHAR(36)
)
BEGIN
    -- Update the user
    UPDATE User SET avatar_src = NULL WHERE uuid = user_uuid_input;
END //
DELIMITER ;


-- Delete a user login
DROP PROCEDURE IF EXISTS delete_user_login_proc;
DELIMITER //
CREATE PROCEDURE delete_user_login_proc(
    IN user_login_uuid_input VARCHAR(36)
)
BEGIN
    DELETE FROM UserLogin WHERE uuid = user_login_uuid_input;
END //
DELIMITER ;

-- Edit a user login
DROP PROCEDURE IF EXISTS edit_user_login_proc;
DELIMITER //
CREATE PROCEDURE edit_user_login_proc(
    IN user_login_uuid_input VARCHAR(36),
    IN user_login_type_name_input VARCHAR(255),
    IN user_login_password_input VARCHAR(255),
    IN user_login_third_party_id_input VARCHAR(255)
)
BEGIN
    IF user_login_type_name_input = "Password" THEN
        UPDATE UserLogin SET password = user_login_password_input WHERE uuid = user_login_uuid_input;
    END IF;
    IF user_login_type_name_input = "Google" THEN
        UPDATE UserLogin SET third_party_id = user_login_third_party_id_input WHERE uuid = user_login_uuid_input;
    END IF;
END //
DELIMITER ;


-- Create a user login
DROP PROCEDURE IF EXISTS create_user_login_proc;
DELIMITER //
CREATE PROCEDURE create_user_login_proc(
    IN user_login_uuid_input VARCHAR(36),
    IN user_uuid_input VARCHAR(36),
    IN user_login_type_name_input VARCHAR(255),
    IN user_login_third_party_id_input VARCHAR(255),
    IN user_login_password_input VARCHAR(255)
)
BEGIN
    if user_login_type_name_input = "Password" then
        INSERT INTO UserLogin (uuid, user_uuid, user_login_type_name, password) VALUES (user_login_uuid_input, user_uuid_input, user_login_type_name_input, user_login_password_input);
    end if;
    if user_login_type_name_input = "Google" then
        INSERT INTO UserLogin (uuid, user_uuid, user_login_type_name, third_party_id) VALUES (user_login_uuid_input, user_uuid_input, user_login_type_name_input, user_login_third_party_id_input);
    end if;
END //
DELIMITER ;


-- Create a new room with a user
DROP PROCEDURE IF EXISTS create_room_proc;
DELIMITER //
CREATE PROCEDURE create_room_proc(
    IN room_uuid_input VARCHAR(36),
    IN room_name_input VARCHAR(255),
    IN room_description_input TEXT,
    IN room_category_name_input VARCHAR(255)
)
BEGIN
    INSERT INTO Room (uuid, name, description, room_category_name) 
        VALUES (room_uuid_input, room_name_input, room_description_input, room_category_name_input);
END //
DELIMITER ;



DROP PROCEDURE IF EXISTS edit_room_proc;
DELIMITER //
CREATE PROCEDURE edit_room_proc(
    IN room_uuid_input VARCHAR(36),
    IN room_name_input VARCHAR(255),
    IN room_description_input TEXT,
    IN room_category_name_input VARCHAR(255)
)
BEGIN
    UPDATE Room SET name = room_name_input, description = room_description_input, room_category_name = room_category_name_input WHERE uuid = room_uuid_input;
END //
DELIMITER ;



DROP PROCEDURE IF EXISTS edit_room_avatar_proc;
DELIMITER //
CREATE PROCEDURE edit_room_avatar_proc(
    IN room_uuid_input VARCHAR(36),
    IN room_file_uuid_input VARCHAR(36)
)
BEGIN
    UPDATE RoomAvatar SET room_file_uuid = room_file_uuid_input WHERE room_uuid = room_uuid_input;
END //
DELIMITER ;



-- Delete a room
DROP PROCEDURE IF EXISTS delete_room_proc;
DELIMITER //
CREATE PROCEDURE delete_room_proc(
    IN room_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the room
    DELETE ChannelWebhookMessage FROM ChannelWebhookMessage
    JOIN ChannelMessage ON ChannelWebhookMessage.channel_message_uuid = ChannelMessage.uuid
    JOIN Channel ON ChannelMessage.channel_uuid = Channel.uuid
    WHERE Channel.room_uuid = room_uuid_input;
    DELETE FROM Room WHERE uuid = room_uuid_input;
END //
DELIMITER ;



-- Edit room join setting
DROP PROCEDURE IF EXISTS edit_room_setting_proc;
DELIMITER //
CREATE PROCEDURE edit_room_setting_proc(
    IN room_uuid_input VARCHAR(36),
    IN join_message_input VARCHAR(255),
    IN join_channel_uuid_input VARCHAR(36),
    IN rules_text_input TEXT
)
BEGIN
    -- Update the room setting
    UPDATE RoomJoinSetting SET 
        join_message = join_message_input, 
        join_channel_uuid = join_channel_uuid_input
    WHERE room_uuid = room_uuid_input;
    UPDATE RoomRulesSetting SET
		rules_text = rules_text_input
	WHERE room_uuid = room_uuid_input;
END //
DELIMITER ;



-- Join a user to a room with a role
DROP PROCEDURE IF EXISTS join_room_proc;
DELIMITER //
CREATE PROCEDURE join_room_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_user_role_name_input VARCHAR(255)
)
BEGIN
    DECLARE username VARCHAR(255);
    DECLARE join_message TEXT;
    DECLARE join_channel_uuid VARCHAR(36);

    -- Select join message and join channel UUID from room setting
    SELECT rs.join_message, rs.join_channel_uuid INTO join_message, join_channel_uuid
    FROM RoomJoinSetting rs 
    WHERE room_uuid = room_uuid_input LIMIT 1;

    -- If no join_channel_uuid, select the first channel in the room
    IF join_channel_uuid IS NULL THEN
        SELECT c.uuid INTO join_channel_uuid
        FROM Channel c WHERE room_uuid = room_uuid_input
        LIMIT 1;
    END IF;

    -- Get the username of the user
    SELECT u.username INTO username
    FROM User u WHERE u.uuid = user_uuid_input;

    -- Insert the user into the room
    INSERT INTO RoomUser (uuid, room_uuid, user_uuid, room_user_role_name) 
    VALUES (UUID(), room_uuid_input, user_uuid_input, room_user_role_name_input);
    
    -- If join_channel_uuid is found, insert a welcome message into the join channel
    IF join_channel_uuid IS NOT NULL THEN
        IF join_message IS NULL THEN
            SET join_message = '{name} has joined the room!';
        END IF;
        INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, channel_message_type_name)
        VALUES (UUID(), REPLACE(join_message, '{name}', username), join_channel_uuid, user_uuid_input, 'System');
    END IF;
END //
DELIMITER ;



-- Edit a user's role in a room
DROP PROCEDURE IF EXISTS edit_room_user_role_proc;
DELIMITER //
CREATE PROCEDURE edit_room_user_role_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_user_role_name_input VARCHAR(255)
)
BEGIN
    -- Update the user's role in the room
    UPDATE RoomUser SET room_user_role_name = room_user_role_name_input
    WHERE room_uuid = room_uuid_input AND user_uuid = user_uuid_input;
END //
DELIMITER ;



-- Leave a user from a room
DROP PROCEDURE IF EXISTS leave_room_proc;
DELIMITER //
CREATE PROCEDURE leave_room_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the user from the room
    DELETE FROM RoomUser WHERE room_uuid = room_uuid_input AND user_uuid = user_uuid_input;
END //
DELIMITER ;



-- Delete a room file
DROP PROCEDURE IF EXISTS delete_room_file_proc;
DELIMITER //
CREATE PROCEDURE delete_room_file_proc(
    IN room_file_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the room file
    DELETE FROM RoomFile WHERE uuid = room_file_uuid_input;
END //
DELIMITER ;



-- Create a room invite link
DROP PROCEDURE IF EXISTS create_room_invite_link_proc;
DELIMITER //
CREATE PROCEDURE create_room_invite_link_proc(
    IN room_invite_link_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_invite_link_expires_at_input DATETIME
)
BEGIN
    -- Insert the room invite link
    INSERT INTO RoomInviteLink (uuid, room_uuid, expires_at) 
    VALUES (room_invite_link_uuid_input, room_uuid_input, room_invite_link_expires_at_input);
END //
DELIMITER ;



-- Edit a room invite link
DROP PROCEDURE IF EXISTS edit_room_invite_link_proc;
DELIMITER //
CREATE PROCEDURE edit_room_invite_link_proc(
    IN room_invite_link_uuid_input VARCHAR(36),
    IN room_invite_link_expires_at_input DATETIME
)
BEGIN
    -- Update the room invite link
    UPDATE RoomInviteLink SET expires_at = room_invite_link_expires_at_input
    WHERE uuid = room_invite_link_uuid_input;
END //
DELIMITER ;



-- Delete a room invite link
DROP PROCEDURE IF EXISTS delete_room_invite_link_proc;
DELIMITER //
CREATE PROCEDURE delete_room_invite_link_proc(
    IN room_invite_link_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the room invite link
    DELETE FROM RoomInviteLink WHERE uuid = room_invite_link_uuid_input;
END //
DELIMITER ;



-- Create a new channel for a room
DROP PROCEDURE IF EXISTS create_channel_proc;
DELIMITER //
CREATE PROCEDURE create_channel_proc(
    IN channel_uuid_input VARCHAR(36),
    IN channel_name_input VARCHAR(255),
    IN channel_description_input TEXT,
    IN channel_type_name_input VARCHAR(255),
    IN room_uuid_input VARCHAR(36),
    in room_file_uuid_input VARCHAR(36)
)
BEGIN
    INSERT INTO Channel (uuid, name, description, channel_type_name, room_uuid, room_file_uuid) 
        VALUES (channel_uuid_input, 
                channel_name_input, 
                channel_description_input, 
                channel_type_name_input, 
                room_uuid_input, 
                room_file_uuid_input);
END //
DELIMITER ;



-- Edit a channel
DROP PROCEDURE IF EXISTS edit_channel_proc;
DELIMITER //
CREATE PROCEDURE edit_channel_proc(
    IN channel_uuid_input VARCHAR(36),
    IN channel_name_input VARCHAR(255),
    IN channel_description_input TEXT,
    IN channel_type_name_input VARCHAR(255),
    IN room_uuid_input VARCHAR(36),
    in room_file_uuid_input VARCHAR(36)
)
BEGIN
    -- Update the channel
    UPDATE Channel SET name = channel_name_input, 
                       description = channel_description_input, 
                       channel_type_name = channel_type_name_input, 
                       room_file_uuid = room_file_uuid_input,
                       room_uuid = room_uuid_input
            WHERE uuid = channel_uuid_input;
END //
DELIMITER ;



-- Delete a channel
DROP PROCEDURE IF EXISTS delete_channel_proc;
DELIMITER //
CREATE PROCEDURE delete_channel_proc(
    IN channel_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the channel
    DELETE ChannelWebhookMessage FROM ChannelWebhookMessage
    JOIN ChannelMessage ON ChannelWebhookMessage.channel_message_uuid = ChannelMessage.uuid
    WHERE ChannelMessage.channel_uuid = channel_uuid_input;
    DELETE FROM Channel WHERE uuid = channel_uuid_input;
END //
DELIMITER ;


-- Create a new channel for a room
DROP PROCEDURE IF EXISTS create_room_file_proc;
DELIMITER //
CREATE PROCEDURE create_room_file_proc(
    IN room_file_uuid_input VARCHAR(36),
    IN room_file_src_input TEXT,
    IN room_file_size_input BIGINT,
    IN room_uuid_input VARCHAR(36),
    IN room_file_type_name_input VARCHAR(255)
)
BEGIN
    -- Insert the room file
    INSERT INTO RoomFile (uuid, src, size, room_uuid, room_file_type_name) 
        VALUES (room_file_uuid_input, room_file_src_input, room_file_size_input, room_uuid_input, room_file_type_name_input);
END //
DELIMITER ;


-- Create a new channel message with an optional upload
DROP PROCEDURE IF EXISTS create_channel_message_proc;
DELIMITER //
CREATE PROCEDURE create_channel_message_proc(
    IN message_uuid_input VARCHAR(36),
    IN message_body_input TEXT,
    IN channel_message_type_name_input VARCHAR(255),
    IN channel_uuid_input VARCHAR(36),
    IN user_uuid_input VARCHAR(36),
    IN channel_message_upload_type_name_input VARCHAR(255),
    in room_file_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36)
)
BEGIN
    -- Insert the channel message
    INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, channel_message_type_name)
        VALUES (message_uuid_input, message_body_input, channel_uuid_input, user_uuid_input, channel_message_type_name_input);
        
    -- Check if the channel message upload is not null and insert it into the ChannelMessageUpload table
    IF room_file_uuid_input IS NOT NULL THEN
        -- Create a channel message upload
        INSERT INTO ChannelMessageUpload (uuid, channel_message_uuid, channel_message_upload_type_name, room_file_uuid)
            VALUES (UUID(), message_uuid_input, channel_message_upload_type_name_input, room_file_uuid_input);
    END IF;
END //
DELIMITER ;



-- Edit a channel message
DROP PROCEDURE IF EXISTS edit_channel_message_proc;
DELIMITER //
CREATE PROCEDURE edit_channel_message_proc(
    IN message_uuid_input VARCHAR(36),
    IN message_body_input TEXT
)
BEGIN
    -- Edit the channel message
    UPDATE ChannelMessage SET body = message_body_input WHERE uuid = message_uuid_input;
END //
DELIMITER ;



-- Delete a channel message
DROP PROCEDURE IF EXISTS delete_channel_message_proc;
DELIMITER //
CREATE PROCEDURE delete_channel_message_proc(
    IN message_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the channel message
    DELETE FROM ChannelWebhookMessage WHERE channel_message_uuid = message_uuid_input;
    DELETE FROM ChannelMessage WHERE uuid = message_uuid_input;
END //
DELIMITER ;



-- Delete a channel message upload
DROP PROCEDURE IF EXISTS delete_channel_message_upload_proc;
DELIMITER //
CREATE PROCEDURE delete_channel_message_upload_proc(
    IN message_uuid_input VARCHAR(36),
    IN room_file_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the channel message upload
    DELETE FROM ChannelMessageUpload WHERE channel_message_uuid = message_uuid_input;
    -- Delete the room file
    DELETE FROM RoomFile WHERE uuid = room_file_uuid_input;
END //
DELIMITER ;



-- Create a new channel webhook with an optional avatar
DROP PROCEDURE IF EXISTS create_channel_webhook_proc;
DELIMITER //
CREATE PROCEDURE create_channel_webhook_proc(
    IN channel_webhook_uuid_input VARCHAR(36),
    IN channel_uuid_input VARCHAR(36),
    IN channel_webhook_name_input VARCHAR(255),
    IN channel_webhook_description_input TEXT,
    in room_file_uuid_input VARCHAR(36)
)
BEGIN
    -- Insert the channel webhook
    INSERT INTO ChannelWebhook (uuid, name, description, channel_uuid, room_file_uuid)
    VALUES (channel_webhook_uuid_input, channel_webhook_name_input, channel_webhook_description_input, channel_uuid_input, room_file_uuid_input);
END //
DELIMITER ;


-- Edit a channel webhook
DROP PROCEDURE IF EXISTS edit_channel_webhook_proc;
DELIMITER //
CREATE PROCEDURE edit_channel_webhook_proc(
    IN channel_webhook_uuid_input VARCHAR(36),
    IN channel_webhook_name_input VARCHAR(255),
    IN channel_webhook_description_input TEXT,
    in room_file_uuid_input VARCHAR(36)
)
BEGIN
    UPDATE ChannelWebhook SET name = channel_webhook_name_input, description = channel_webhook_description_input, room_file_uuid = room_file_uuid_input
    WHERE uuid = channel_webhook_uuid_input;
END //
DELIMITER ;



-- Delete a channel webhook
DROP PROCEDURE IF EXISTS delete_channel_webhook_proc;
DELIMITER //
CREATE PROCEDURE delete_channel_webhook_proc(
    IN channel_webhook_uuid_input VARCHAR(36)
)
BEGIN
    -- Delete the channel webhook
    DELETE FROM ChannelWebhook WHERE uuid = channel_webhook_uuid_input;
END //
DELIMITER ;



-- Create a new channel webhook message
DROP PROCEDURE IF EXISTS create_webhook_message_proc;
DELIMITER //
CREATE PROCEDURE create_webhook_message_proc(
    IN message_uuid_input VARCHAR(36),
    IN message_body_input TEXT,
    IN channel_uuid_input VARCHAR(36),
    IN channel_webhook_uuid_input VARCHAR(36),
    IN channel_webhook_message_type_name_input VARCHAR(255)
)
BEGIN
    -- Insert the webhook message
    INSERT INTO ChannelMessage (uuid, body, channel_uuid, channel_message_type_name)
    VALUES (message_uuid_input, message_body_input, channel_uuid_input, 'Webhook');
        
    -- Insert the webhook message into the ChannelWebhookMessage table
    INSERT INTO ChannelWebhookMessage (uuid, body, channel_webhook_uuid, channel_message_uuid, channel_webhook_message_type_name)
    VALUES (UUID(), message_body_input, channel_webhook_uuid_input, message_uuid_input, channel_webhook_message_type_name_input);
END //
DELIMITER ;

-- Set a user's email as verified
DROP PROCEDURE IF EXISTS set_user_email_verification_proc;
DELIMITER //
CREATE PROCEDURE set_user_email_verification_proc(
    IN user_uuid_input VARCHAR(36),
    IN user_is_verified_input BOOLEAN
)
BEGIN
    UPDATE UserEmailVerification SET is_verified = user_is_verified_input WHERE user_uuid = user_uuid_input;
END //
DELIMITER ;

-- Create a new UserPasswordReset
DROP PROCEDURE IF EXISTS create_user_password_reset_proc;
DELIMITER //
CREATE PROCEDURE create_user_password_reset_proc(
    IN user_password_reset_uuid_input VARCHAR(36),
    IN user_uuid_input VARCHAR(36),
    IN user_password_reset_expires_at_input DATETIME
)
BEGIN
    INSERT INTO UserPasswordReset (uuid, user_uuid, expires_at) VALUES (user_password_reset_uuid_input, user_uuid_input, user_password_reset_expires_at_input);
END //
DELIMITER ;

-- Delete a UserPasswordReset
DROP PROCEDURE IF EXISTS delete_user_password_reset_proc;
DELIMITER //
CREATE PROCEDURE delete_user_password_reset_proc(
    IN user_password_reset_uuid_input VARCHAR(36)
)
BEGIN
    DELETE FROM UserPasswordReset WHERE uuid = user_password_reset_uuid_input;
END //
DELIMITER ;

-- Update a user's status
DROP PROCEDURE IF EXISTS update_user_status_proc;
DELIMITER //
CREATE PROCEDURE update_user_status_proc(
    IN user_uuid_input VARCHAR(36),
    IN status_state_name_input VARCHAR(255),
    IN status_message_input TEXT,
    IN status_last_seen_at DATETIME,
    IN status_total_online_hours_input BIGINT
)
BEGIN
    UPDATE UserStatus SET user_status_state_name = status_state_name_input, message = status_message_input, last_seen_at = status_last_seen_at, total_online_hours = status_total_online_hours_input WHERE user_uuid = user_uuid_input;
END //
DELIMITER ;

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


-- ### VIEWS ###

-- Get all User status states
DROP VIEW IF EXISTS user_status_state_view;
CREATE VIEW user_status_state_view AS
SELECT 
    uss.name as user_status_state_name, uss.created_at as user_status_state_created_at, uss.updated_at as user_status_state_updated_at
FROM UserStatusState uss;

-- Get all users
DROP VIEW IF EXISTS user_view;
CREATE VIEW user_view AS
SELECT 
    u.uuid as user_uuid, u.username as user_username, u.email as user_email, u.avatar_src as user_avatar_src, u.created_at as user_created_at, u.updated_at as user_updated_at,
    -- UserEmailVerification
    uev.is_verified as user_email_verified,
    -- UserStatus
    us.uuid as user_status_uuid, us.user_status_state_name, us.message as user_status_message, us.last_seen_at as user_status_last_seen_at, us.total_online_hours as user_status_total_online_hours
FROM User u
LEFT JOIN UserEmailVerification uev ON u.uuid = uev.user_uuid
LEFT JOIN UserStatus us ON u.uuid = us.user_uuid;

-- Get all user logins
DROP VIEW IF EXISTS user_login_view;
CREATE VIEW user_login_view AS
SELECT 
    ul.uuid as user_login_uuid, ul.created_at as user_login_created_at, ul.updated_at as user_login_updated_at,
    ul.third_party_id as user_login_third_party_id,
    ul.password as user_login_password,
    -- UserLoginType
    ult.name as user_login_type_name,
    -- User
    u.uuid as user_uuid
FROM UserLogin ul
JOIN User u ON ul.user_uuid = u.uuid
JOIN UserLoginType ult ON ul.user_login_type_name = ult.name;

-- Get all user login types
DROP VIEW IF EXISTS user_login_type_view;
CREATE VIEW user_login_type_view AS
SELECT 
    ult.name as user_login_type_name, ult.created_at as user_login_type_created_at, ult.updated_at as user_login_type_updated_at
FROM UserLoginType ult;


-- Get all UserEmailVerifications
DROP VIEW IF EXISTS user_email_verification_view;
CREATE VIEW user_email_verification_view AS
SELECT 
    uev.uuid as user_email_verification_uuid, uev.is_verified as user_email_verified, uev.created_at as user_email_verification_created_at, uev.updated_at as user_email_verification_updated_at,
    -- User
    u.uuid as user_uuid
FROM UserEmailVerification uev
JOIN User u ON uev.user_uuid = u.uuid;

-- Get all UserPasswordResets
DROP VIEW IF EXISTS user_password_reset_view;
CREATE VIEW user_password_reset_view AS
SELECT 
    upr.uuid as user_password_reset_uuid, upr.expires_at as user_password_reset_expires_at, upr.created_at as user_password_reset_created_at, upr.updated_at as user_password_reset_updated_at,
    -- User
    u.uuid as user_uuid
FROM UserPasswordReset upr
JOIN User u ON upr.user_uuid = u.uuid;

-- Get all UserStatuses
DROP VIEW IF EXISTS user_status_view;
CREATE VIEW user_status_view AS
SELECT 
    us.uuid as user_status_uuid, 
    us.user_status_state_name, 
    us.message as user_status_message, 
    us.last_seen_at as user_status_last_seen_at, 
    us.total_online_hours as user_status_total_online_hours,
    us.created_at as user_status_created_at,
    us.updated_at as user_status_updated_at,
    us.user_uuid
FROM UserStatus us; 
    

-- Get room with all settings
DROP VIEW IF EXISTS room_view;
CREATE VIEW room_view AS
SELECT 
    -- Room
    r.uuid as room_uuid, 
    r.name as room_name, 
    r.description as room_description, 
    r.room_category_name, 
    r.created_at as room_created_at, 
    r.updated_at as room_updated_at,
    
    -- RoomJoinSetting
    rjs.join_channel_uuid, 
    rjs.join_message,
    
    -- RoomRulesSetting
    rrs.rules_text,
    
    -- RoomUserSetting
    rus.max_users,
    
    -- RoomChannelSetting
    rcs.max_channels, 
    rcs.message_days_to_live,
    
    -- RoomFileSetting
    rfs.total_files_bytes_allowed, 
    rfs.single_file_bytes_allowed, 
    rfs.file_days_to_live, 
    bytes_to_mb(rfs.total_files_bytes_allowed) as total_files_mb, 
    bytes_to_mb(rfs.single_file_bytes_allowed) as single_file_mb,

    -- RoomAvatar
    ra.uuid as room_avatar_uuid,

    -- RoomFile
    rf.uuid as room_file_uuid, 
    rf.src as room_file_src,
    rf.size as room_file_size,
    rf.room_file_type_name as room_file_type_name,
    bytes_to_mb(rf.size) as room_file_size_mb,

    -- bytes_used
    SUM(allFiles.size) as bytes_used, bytes_to_mb(SUM(allFiles.size)) as mb_used
FROM Room r
    LEFT JOIN RoomJoinSetting rjs ON r.uuid = rjs.room_uuid
    LEFT JOIN RoomRulesSetting rrs ON r.uuid = rrs.room_uuid
    LEFT JOIN RoomUserSetting rus ON r.uuid = rus.room_uuid
    LEFT JOIN RoomChannelSetting rcs ON r.uuid = rcs.room_uuid
    LEFT JOIN RoomFileSetting rfs ON r.uuid = rfs.room_uuid
    LEFT JOIN RoomAvatar ra ON r.uuid = ra.room_uuid
    LEFT JOIN RoomFile rf ON ra.room_file_uuid = rf.uuid
    LEFT JOIN RoomFile allFiles ON r.uuid = allFiles.room_uuid
GROUP BY r.uuid;



-- Get room users for a room
DROP VIEW IF EXISTS room_user_view;
CREATE VIEW room_user_view AS
SELECT 
    -- RoomUser
    ru.uuid as room_user_uuid, ru.room_user_role_name, ru.created_at as room_user_created_at, ru.updated_at as room_user_updated_at, ru.room_uuid,
    -- User
    u.uuid as user_uuid, u.username as user_username, u.email as user_email, u.avatar_src as user_avatar_src, u.created_at as user_created_at, u.updated_at as user_updated_at
FROM RoomUser ru
    JOIN User u ON ru.user_uuid = u.uuid;



-- Get room user roles
DROP VIEW IF EXISTS room_user_role_view;
CREATE VIEW room_user_role_view AS
SELECT 
    -- RoomUserRole
    rur.name as room_user_role_name, rur.created_at as room_user_role_created_at, rur.updated_at as room_user_role_updated_at
FROM RoomUserRole rur;



-- Get room categories
DROP VIEW IF EXISTS room_category_view;
CREATE VIEW room_category_view AS
SELECT 
    -- RoomCategory
    rc.name as room_category_name, rc.created_at as room_category_created_at, rc.updated_at as room_category_updated_at
FROM RoomCategory rc;



-- Get room files
DROP VIEW IF EXISTS room_file_view;
CREATE VIEW room_file_view AS
SELECT 
    -- RoomFile
    rf.uuid as room_file_uuid, rf.src as room_file_src, room_uuid, rf.size as room_file_size, rf.room_file_type_name, rf.created_at as room_file_created_at, rf.updated_at as room_file_updated_at, bytes_to_mb(rf.size) as room_file_size_mb,
    -- ChannelMessageUpload
    cmu.uuid as channel_message_upload_uuid, cmu.channel_message_upload_type_name, cmu.created_at as channel_message_upload_created_at, cmu.updated_at as channel_message_upload_updated_at,
    -- ChannelMessage
    cm.uuid as channel_message_uuid, cm.body as channel_message_body, cm.channel_message_type_name, cm.created_at as channel_message_created_at, cm.updated_at as channel_message_updated_at,
    -- User
    u.uuid as user_uuid, u.username as user_username, u.avatar_src as user_avatar_src, u.created_at as user_created_at, u.updated_at as user_updated_at
FROM RoomFile rf
    JOIN Room r ON rf.room_uuid = r.uuid
    LEFT JOIN ChannelMessageUpload cmu ON rf.uuid = cmu.room_file_uuid
    LEFT JOIN ChannelMessage cm ON cmu.channel_message_uuid = cm.uuid
    LEFT JOIN User u ON cm.user_uuid = u.uuid;



-- Get room file types
DROP VIEW IF EXISTS room_file_type_view;
CREATE VIEW room_file_type_view AS
SELECT 
    -- RoomFileType
    rft.name as room_file_type_name, rft.created_at as room_file_type_created_at, rft.updated_at as room_file_type_updated_at
FROM RoomFileType rft;



-- Get room avatars
DROP VIEW IF EXISTS room_avatar_view;
CREATE VIEW room_avatar_view AS
SELECT 
    -- RoomAvatar
    ra.uuid as room_avatar_uuid, ra.room_file_uuid, ra.created_at as room_avatar_created_at, ra.updated_at as room_avatar_updated_at,
    -- Room
    r.uuid as room_uuid, r.name as room_name, r.description as room_description, r.room_category_name as room_category_name, r.created_at as room_created_at, r.updated_at as room_updated_at,
    -- RoomFile
    rf.src as room_avatar_src, rf.size as room_avatar_size, rf.room_file_type_name as room_avatar_type_name, rf.created_at as room_avatar_file_created_at, rf.updated_at as room_avatar_file_updated_at, bytes_to_mb(rf.size) as room_avatar_size_mb
FROM RoomAvatar ra
    JOIN Room r ON ra.room_uuid = r.uuid
    JOIN RoomFile rf ON ra.room_file_uuid = rf.uuid;



-- Get room audits
DROP VIEW IF EXISTS room_audit_view;
CREATE VIEW room_audit_view AS
SELECT 
    -- RoomAudit
    ra.uuid as room_audit_uuid, ra.body as room_audit_body, ra.room_audit_type_name, ra.created_at as room_audit_created_at, ra.updated_at as room_audit_updated_at,
    -- Room
    r.uuid as room_uuid, r.name as room_name, r.description as room_description, r.room_category_name as room_category_name, r.created_at as room_created_at, r.updated_at as room_updated_at
FROM RoomAudit ra
    JOIN Room r ON ra.room_uuid = r.uuid;



-- Get room audit types
DROP VIEW IF EXISTS room_audit_type_view;
CREATE VIEW room_audit_type_view AS
SELECT 
    -- RoomAuditType
    rat.name as room_audit_type_name, rat.created_at as room_audit_type_created_at, rat.updated_at as room_audit_type_updated_at
FROM RoomAuditType rat;



-- Get room invite links
DROP VIEW IF EXISTS room_invite_link_view;
CREATE VIEW room_invite_link_view AS
SELECT 
    -- RoomInviteLink
    ril.uuid as room_invite_link_uuid, ril.expires_at as room_invite_link_expires_at, ril.created_at as room_invite_link_created_at, ril.updated_at as room_invite_link_updated_at, never_expires(ril.expires_at) as room_invite_link_never_expires,
    -- Room
    r.uuid as room_uuid, r.name as room_name, r.description as room_description, r.room_category_name as room_category_name, r.created_at as room_created_at, r.updated_at as room_updated_at
FROM RoomInviteLink ril
    JOIN Room r ON ril.room_uuid = r.uuid;



-- Get Channels for a room
DROP VIEW IF EXISTS channel_view;
CREATE VIEW channel_view AS
SELECT 
    -- Channel
    c.uuid as channel_uuid, c.name as channel_name, c.description as channel_description, c.channel_type_name, c.created_at as channel_created_at, c.updated_at as channel_updated_at,
    -- Room
    r.uuid as room_uuid, r.name as room_name, r.description as room_description, r.room_category_name as room_category_name, r.created_at as room_created_at, r.updated_at as room_updated_at,
    -- RoomFile
    rf.uuid as room_file_uuid, rf.src as room_file_src, rf.size as room_file_size, rf.room_file_type_name, bytes_to_mb(rf.size) as room_file_size_mb
FROM Channel c
    JOIN Room r ON c.room_uuid = r.uuid
    LEFT JOIN RoomFile rf ON c.room_file_uuid = rf.uuid;



-- Get channel types
DROP VIEW IF EXISTS channel_type_view;
CREATE VIEW channel_type_view AS
SELECT 
    -- ChannelType
    ct.name as channel_type_name, ct.created_at as channel_type_created_at, ct.updated_at as channel_type_updated_at
FROM ChannelType ct;



-- Get channel audits
DROP VIEW IF EXISTS channel_audit_view;
CREATE VIEW channel_audit_view AS
SELECT 
    -- ChannelAudit
    ca.uuid as channel_audit_uuid, ca.body as channel_audit_body, ca.channel_audit_type_name, ca.created_at as channel_audit_created_at, ca.updated_at as channel_audit_updated_at,
    -- Channel
    c.uuid as channel_uuid, c.name as channel_name, c.description as channel_description, c.room_uuid, c.channel_type_name, c.created_at as channel_created_at, c.updated_at as channel_updated_at
FROM ChannelAudit ca
    JOIN Channel c ON ca.channel_uuid = c.uuid;



-- Get channel audit types
DROP VIEW IF EXISTS channel_audit_type_view;
CREATE VIEW channel_audit_type_view AS
SELECT 
    -- ChannelAuditType
    cat.name as channel_audit_type_name, cat.created_at as channel_audit_type_created_at, cat.updated_at as channel_audit_type_updated_at
FROM ChannelAuditType cat;



-- Get channel messages
DROP VIEW IF EXISTS channel_message_view;
CREATE VIEW channel_message_view AS
SELECT 
    -- ChannelMessage
    cm.uuid as channel_message_uuid, cm.body as channel_message_body, cm.channel_message_type_name, cm.created_at as channel_message_created_at, cm.updated_at as channel_message_updated_at,
    -- Channel
    c.uuid as channel_uuid, c.name as channel_name, c.description as channel_description, c.room_uuid, c.channel_type_name, c.created_at as channel_created_at, c.updated_at as channel_updated_at,
    -- User
    u.uuid as user_uuid, u.username as user_username, u.email as user_email, u.avatar_src as user_avatar_src, u.created_at as user_created_at, u.updated_at as user_updated_at,
    -- ChannelMessageUpload
    mu.uuid as channel_message_upload_uuid, mu.channel_message_upload_type_name,
	-- Room File
    rf.uuid as room_file_uuid, rf.src as room_file_src, rf.size as room_file_size, rf.room_file_type_name, bytes_to_mb(rf.size) as room_file_size_mb,
    -- ChannelWebhookMessage
    cwm.uuid as channel_webhook_message_uuid, cwm.body as channel_webhook_message_body, cwm.channel_webhook_message_type_name, cwm.created_at as channel_webhook_message_created_at, cwm.updated_at as channel_webhook_message_updated_at,
    -- ChannelWebhook
    cw.uuid as channel_webhook_uuid, cw.name as channel_webhook_name,
    -- ChannelWebhook Room File
    cwrf.uuid as channel_webhook_room_file_uuid, cwrf.src as channel_webhook_room_file_src
FROM ChannelMessage cm
    JOIN Channel c ON cm.channel_uuid = c.uuid
    LEFT JOIN User u ON cm.user_uuid = u.uuid
    LEFT JOIN ChannelMessageUpload mu ON cm.uuid = mu.channel_message_uuid
    LEFT JOIN RoomFile rf on mu.room_file_uuid = rf.uuid
    LEFT JOIN ChannelWebhookMessage cwm ON cm.uuid = cwm.channel_message_uuid
    LEFT JOIN ChannelWebhook cw ON cwm.channel_webhook_uuid = cw.uuid
    LEFT JOIN RoomFile cwrf ON cw.room_file_uuid = cwrf.uuid;

-- Get channel message types
DROP VIEW IF EXISTS channel_message_type_view;
CREATE VIEW channel_message_type_view AS
SELECT 
    -- ChannelMessageType
    cmt.name as channel_message_type_name, cmt.created_at as channel_message_type_created_at, cmt.updated_at as channel_message_type_updated_at
FROM ChannelMessageType cmt;


-- Get channel webhooks
DROP VIEW IF EXISTS channel_webhook_view;
CREATE VIEW channel_webhook_view AS
SELECT 
    -- ChannelWebhook
    cw.uuid as channel_webhook_uuid, cw.name as channel_webhook_name, cw.description as channel_webhook_description, cw.created_at as channel_webhook_created_at, cw.updated_at as channel_webhook_updated_at,
    -- Channel
    c.uuid as channel_uuid, c.name as channel_name, c.description as channel_description, c.room_uuid, c.channel_type_name, c.created_at as channel_created_at, c.updated_at as channel_updated_at,
    -- Room File
    rf.uuid as room_file_uuid, rf.src as room_file_src, rf.size as room_file_size, rf.room_file_type_name, bytes_to_mb(rf.size) as room_file_size_mb
FROM ChannelWebhook cw
    JOIN Channel c ON cw.channel_uuid = c.uuid
    LEFT JOIN RoomFile rf ON cw.room_file_uuid = rf.uuid;



-- Get channel webhook messages
DROP VIEW IF EXISTS channel_webhook_message_view;
CREATE VIEW channel_webhook_message_view AS
SELECT 
    -- ChannelWebhookMessage
    cwm.uuid as channel_webhook_message_uuid, cwm.body as channel_webhook_message_body, cwm.channel_webhook_message_type_name, cwm.created_at as channel_webhook_message_created_at, cwm.updated_at as channel_webhook_message_updated_at,
    -- ChannelWebhook
    cw.uuid as channel_webhook_uuid, cw.name as channel_webhook_name, cw.description as channel_webhook_description, cw.room_file_uuid, cw.created_at as channel_webhook_created_at, cw.updated_at as channel_webhook_updated_at,
    -- ChannelMessage
    cm.uuid as channel_message_uuid, cm.body as channel_message_body, cm.channel_message_type_name, cm.channel_uuid, cm.user_uuid, cm.created_at as channel_message_created_at, cm.updated_at as channel_message_updated_at
FROM ChannelWebhookMessage cwm
    JOIN ChannelWebhook cw ON cwm.channel_webhook_uuid = cw.uuid
    JOIN ChannelMessage cm ON cwm.channel_message_uuid = cm.uuid;



-- Get channel webhook message types
DROP VIEW IF EXISTS channel_webhook_message_type_view;
CREATE VIEW channel_webhook_message_type_view AS
SELECT 
    -- ChannelWebhookMessageType
    cwmt.name as channel_webhook_message_type_name, cwmt.created_at as channel_webhook_message_type_created_at, cwmt.updated_at as channel_webhook_message_type_updated_at
FROM ChannelWebhookMessageType cwmt;





-- Get channel message uploads
DROP VIEW IF EXISTS channel_message_upload_view;
CREATE VIEW channel_message_upload_view AS
SELECT 
    -- ChannelMessageUpload
    mu.uuid as channel_message_upload_uuid, mu.channel_message_upload_type_name, mu.created_at as channel_message_upload_created_at, mu.updated_at as channel_message_upload_updated_at,
    -- Room File
    rf.uuid as room_file_uuid, rf.src as room_file_src, rf.size as room_file_size, rf.room_file_type_name, bytes_to_mb(rf.size) as room_file_size_mb
FROM ChannelMessageUpload mu
    JOIN RoomFile rf ON mu.room_file_uuid = rf.uuid;



-- Get channel message upload types
DROP VIEW IF EXISTS channel_message_upload_type_view;
CREATE VIEW channel_message_upload_type_view AS
SELECT 
    -- ChannelMessageUploadType
    cmu.name as channel_message_upload_type_name, cmu.created_at as channel_message_upload_type_created_at, cmu.updated_at as channel_message_upload_type_updated_at
FROM ChannelMessageUploadType cmu;

