
DROP DATABASE IF EXISTS chat;
CREATE DATABASE chat;
USE chat;

-- ### TABLES ###

CREATE TABLE RoomCategory (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE RoomRole (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE Room (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    room_category_name VARCHAR(255) NOT NULL,
    avatar_src TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_category_name) REFERENCES RoomCategory(name),
    CONSTRAINT room_name_unique UNIQUE (name)
);
CREATE TABLE RoomInviteLink (
    uuid VARCHAR(36) PRIMARY KEY,
    room_uuid VARCHAR(36) NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid)
);
CREATE TABLE ChannelType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE Channel (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    room_uuid VARCHAR(36) NOT NULL,
    channel_type_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (channel_type_name) REFERENCES ChannelType(name),
    UNIQUE KEY unique_channel (name, channel_type_name, room_uuid)
);
CREATE TABLE RoomSetting (
    uuid VARCHAR(36) PRIMARY KEY,
    total_upload_bytes INTEGER(10) DEFAULT 26214400,
    upload_bytes INTEGER(10) DEFAULT 5242880,
    join_channel_uuid VARCHAR(36) DEFAULT NULL,
    join_message VARCHAR(255) DEFAULT "A legend entered the room!",
    rules_text TEXT NOT NULL,
    max_channels INTEGER(10) DEFAULT 5,
    max_members INTEGER(10) DEFAULT 25,
    room_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES room(uuid),
    FOREIGN KEY (join_channel_uuid) REFERENCES channel(uuid)
);
CREATE TABLE User (
    uuid VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_src TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT user_username_unique UNIQUE (username),
    CONSTRAINT user_email_unique UNIQUE (email),
    CHECK (CHAR_LENGTH(username) >= 3 AND CHAR_LENGTH(username) <= 255),
    CHECK (CHAR_LENGTH(email) >= 3 AND CHAR_LENGTH(email) <= 255),
    CHECK (CHAR_LENGTH(password) >= 8 AND CHAR_LENGTH(password) <= 255)
);
CREATE TABLE UserRoom (
    uuid VARCHAR(36) PRIMARY KEY,
    room_uuid VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    room_role_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_uuid) REFERENCES Room(uuid),
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    FOREIGN KEY (room_role_name) REFERENCES RoomRole(name),
    UNIQUE KEY unique_user_room (room_uuid, user_uuid)
);
CREATE TABLE ChannelMessage (
    uuid VARCHAR(36) PRIMARY KEY,
    body TEXT NOT NULL,
    created_by_system INTEGER DEFAULT 0,
    channel_uuid VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36), -- NULL for system messages
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_uuid) REFERENCES Channel(uuid),
    FOREIGN KEY (user_uuid) REFERENCES User(uuid),
    CHECK (created_by_system IN (0, 1))
);
CREATE TABLE ChannelWebhook (
    uuid VARCHAR(36) PRIMARY KEY,
    channel_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_uuid) REFERENCES Channel(uuid),
    UNIQUE KEY unique_channel_webhook (channel_uuid)
);
CREATE TABLE UploadType (
    name VARCHAR(255) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE MessageUpload (
    uuid VARCHAR(36) PRIMARY KEY,
    src TEXT NOT NULL,
    upload_type_name VARCHAR(255) NOT NULL,
    size INTEGER(10),
    channel_message_uuid VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_type_name) REFERENCES UploadType(name),
    FOREIGN KEY (channel_message_uuid) REFERENCES ChannelMessage(uuid)
);

-- ### TRIGGERS ###

DROP TRIGGER IF EXISTS room_settings_after_insert_room;
-- Trigger to insert a new row into roomsetting when a new room is created
DELIMITER //
CREATE TRIGGER room_settings_after_insert_room
AFTER INSERT ON room
FOR EACH ROW
BEGIN
    INSERT INTO roomsetting
    (uuid, total_upload_bytes, join_message, rules_text, max_channels, max_members, room_uuid, upload_bytes)
    VALUES
    (UUID(),                  
     5242880,                 
     'joined the room!',      
     'Default rules text',
     5,
     25,
     NEW.uuid,
     5242880
    );
END //
DELIMITER ;

DROP TRIGGER IF EXISTS room_before_delete;
-- Trigger to delete all related rows when a room is deleted
DELIMITER //
CREATE TRIGGER room_before_delete
BEFORE DELETE ON room
FOR EACH ROW
BEGIN
    DELETE FROM roomsetting WHERE room_uuid = OLD.uuid;
    DELETE FROM roominvitelink WHERE room_uuid = OLD.uuid;
    DELETE FROM userroom WHERE room_uuid = OLD.uuid;
    DELETE FROM channel WHERE room_uuid = OLD.uuid;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS channel_before_delete;
-- Trigger to delete all related rows when a channel is deleted
DELIMITER //
CREATE TRIGGER channel_before_delete
BEFORE DELETE ON channel
FOR EACH ROW
BEGIN
    DELETE FROM channelmessage WHERE channel_uuid = OLD.uuid;
    DELETE FROM channelwebhook WHERE channel_uuid = OLD.uuid;
    UPDATE roomsetting SET join_channel_uuid = NULL WHERE join_channel_uuid = OLD.uuid;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS channel_message_before_delete;
-- Trigger to delete all related rows when a channel message is deleted
DELIMITER //
CREATE TRIGGER channel_message_before_delete
BEFORE DELETE ON channelmessage
FOR EACH ROW
BEGIN
    DELETE FROM messageupload WHERE channel_message_uuid = OLD.uuid;
END //
DELIMITER ;

-- ### PROCEDURES ###

DROP PROCEDURE IF EXISTS check_upload_exceeds_proc;
-- Check if the total size + the new upload size exceeds the allowed total size for a room
DELIMITER //
CREATE PROCEDURE check_upload_exceeds_proc(
    IN new_upload_bytes BIGINT,
    IN room_uuid_input VARCHAR(36),
    OUT result BOOLEAN
)
BEGIN
    DECLARE total_bytes BIGINT;
    DECLARE upload_bytes BIGINT;
    
    SELECT SUM(size), total_upload_bytes INTO upload_bytes, total_bytes
    FROM roomsetting
		LEFT JOIN channel ON channel.room_uuid = roomsetting.room_uuid
        LEFT JOIN channelmessage ON channelmessage.channel_uuid = channel.uuid
        LEFT JOIN messageupload ON messageupload.channel_message_uuid = channelmessage.uuid
    WHERE roomsetting.room_uuid = room_uuid_input
    GROUP BY total_upload_bytes;
    
    SET result = ((upload_bytes + new_upload_bytes) > total_bytes);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS create_room_proc;
-- Create a new room with a user
-- It runs in a transaction to ensure that both inserts are successful
DELIMITER //
CREATE PROCEDURE create_room_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_name_input VARCHAR(255),
    IN room_description_input TEXT,
    IN room_category_name_input VARCHAR(255),
    IN room_role_name_input VARCHAR(255),
    in room_avatar_src_input TEXT,
    OUT result BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET result = FALSE;
    END;

    START TRANSACTION;

    INSERT INTO Room (uuid, name, description, room_category_name, avatar_src, created_at, updated_at) 
    VALUES (room_uuid_input, room_name_input, room_description_input, room_category_name_input, room_avatar_src_input, NOW(), NOW());

    INSERT INTO UserRoom (uuid, room_uuid, user_uuid, room_role_name, created_at, updated_at) 
    VALUES (UUID(), room_uuid_input, user_uuid_input, room_role_name_input, NOW(), NOW());
	
    COMMIT;
    SET result = TRUE;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS join_room_proc;
-- Join a user to a room
DELIMITER //
CREATE PROCEDURE join_room_proc(
    IN user_uuid_input VARCHAR(36),
    IN room_uuid_input VARCHAR(36),
    IN room_role_name_input VARCHAR(255),
    OUT result BOOLEAN
)
BEGIN
    DECLARE join_message VARCHAR(255);
    DECLARE join_channel_uuid VARCHAR(36);
    
    -- Exit handler to rollback in case of an error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET result = FALSE;
    END;

    IF EXISTS(SELECT 1 FROM roomsetting WHERE room_uuid = room_uuid_input) THEN
        SET result = FALSE;
    ELSE
        -- Select join message and join channel UUID from room setting
        SELECT join_message, join_channel_uuid INTO join_message, join_channel_uuid
        FROM roomsetting
        WHERE room_uuid = room_uuid_input;
    END IF;

    -- If no join_channel_uuid, select the first channel in the room
    IF join_channel_uuid IS NULL THEN
        SELECT uuid INTO join_channel_uuid
        FROM channel
        WHERE room_uuid = room_uuid_input
        LIMIT 1;
    END IF;

    START TRANSACTION;
    
    -- Insert the user into the room
    INSERT INTO UserRoom (uuid, room_uuid, user_uuid, room_role_name, created_at, updated_at) 
    VALUES (UUID(), room_uuid_input, user_uuid_input, room_role_name_input, NOW(), NOW());

    -- If join_channel_uuid is found, insert a welcome message into the join channel
    IF join_channel_uuid IS NOT NULL THEN
        INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
        VALUES (UUID(), IFNULL(join_message, 'User has joined the room!'), join_channel_uuid, user_uuid_input, NOW(), NOW());
    END IF;

    -- Commit the transaction
    COMMIT;
    SET result = TRUE;
END //
DELIMITER ;

-- ### VIEWS ###

DROP VIEW IF EXISTS room_view;
-- View to get all rooms with their settings
CREATE VIEW room_view AS
SELECT r.uuid, r.name, r.description, r.room_category_name, r.avatar_src, rs.total_upload_bytes, rs.upload_bytes, rs.join_channel_uuid, rs.join_message, rs.rules_text, rs.max_channels, rs.max_members
FROM room r
LEFT JOIN roomsetting rs ON r.uuid = rs.room_uuid;

DROP VIEW IF EXISTS channel_view;
-- View to get all channels with their messages
CREATE VIEW channel_view AS
SELECT c.uuid, c.name, c.description, c.room_uuid, c.channel_type_name, cm.uuid AS message_uuid, cm.body, cm.created_by_system, cm.user_uuid
FROM channel c
LEFT JOIN channelmessage cm ON c.uuid = cm.channel_uuid
LEFT JOIN messageupload mu ON cm.uuid = mu.channel_message_uuid
LEFT JOIN user u ON cm.user_uuid = u.uuid;

DROP VIEW IF EXISTS message_view;
-- View to get all messages with their uploads and their users
CREATE VIEW message_view AS
SELECT cm.uuid, cm.body, cm.created_by_system, cm.channel_uuid, cm.user_uuid, mu.uuid AS upload_uuid, mu.src, mu.upload_type_name, mu.size
FROM channelmessage cm
LEFT JOIN messageupload mu ON cm.uuid = mu.channel_message_uuid
LEFT JOIN user u ON cm.user_uuid = u.uuid;

-- ### TEST DATA ###

INSERT INTO RoomCategory (name, created_at, updated_at) VALUES
('General', NOW(), NOW()),
('Tech', NOW(), NOW()),
('Sports', NOW(), NOW());
INSERT INTO RoomRole (name, created_at, updated_at) VALUES
('Admin', NOW(), NOW()),
('Moderator', NOW(), NOW()),
('Member', NOW(), NOW());
INSERT INTO UploadType (name, created_at, updated_at) VALUES
('Image', NOW(), NOW()),
('Video', NOW(), NOW()),
('Document', NOW(), NOW());
INSERT INTO ChannelType (name, created_at, updated_at) VALUES
('Text', NOW(), NOW()),
('Voice', NOW(), NOW()),
('Video', NOW(), NOW());

SET @user_uuid = UUID();
SET @user2_uuid = UUID();
SET @user3_uuid = UUID();
SET @room_uuid = '4157b6a2-6856-4b54-aaa5-dc4f9a80062f';
SET @ch_uuid = UUID();
SET @msg_uuid = UUID();

INSERT INTO User (uuid, username, email, password, avatar_src, created_at, updated_at) VALUES
(@user_uuid, 'admin', 'admin@example.com', '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa', 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/LemonadeGuyCardboardAndPencilWithShadow-8cdc3130cc5498718fce7ee9d1ff5d92ddcc2ed81c689a1bf275bd14189a607c-512.jpg', NOW(), NOW());
INSERT INTO User (uuid, username, email, password, avatar_src, created_at, updated_at) VALUES
(@user2_uuid, 'moderator', 'moderator@example.com', '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa', 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png', NOW(), NOW());
INSERT INTO User (uuid, username, email, password, avatar_src, created_at, updated_at) VALUES
(@user3_uuid, 'member', 'member@example.com', '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa', 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png', NOW(), NOW());

call create_room_proc(@user_uuid, @room_uuid, 'General Chat', 'A room for general discussion', 'General', 'Admin', NULL, @result);

INSERT INTO Channel (uuid, name, description, room_uuid, channel_type_name, created_at, updated_at) VALUES
(@ch_uuid, 'General Discussion', 'Main channel for general talk', @room_uuid, 'Text', NOW(), NOW());

-- Joining the other two users to the room after the channel is created
-- to ensure that the join message is sent to a channel
call join_room_proc(@user2_uuid, @room_uuid, 'Moderator', @result);
call join_room_proc(@user3_uuid, @room_uuid, 'Member', @result);

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'Hello everyone!',@ch_uuid, @user_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'Hey! How are you all doing?', @ch_uuid, @user2_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'Doing great! How about you?', @ch_uuid, @user3_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'I am good too, thanks for asking!', @ch_uuid, @user2_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'What are you all working on today?', @ch_uuid, @user_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'I am working on a new project for work.', @ch_uuid, @user3_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'That sounds interesting! Tell me more.', @ch_uuid, @user2_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (UUID(), 'Sure, I will share the details in a bit.', @ch_uuid, @user3_uuid, NOW(), NOW());

INSERT INTO ChannelMessage (uuid, body, channel_uuid, user_uuid, created_at, updated_at) 
VALUES (@msg_uuid, 'Check out this image:', @ch_uuid, @user3_uuid, NOW(), NOW());

INSERT INTO MessageUpload (uuid, src, upload_type_name, size, channel_message_uuid, created_at, updated_at) VALUES
(UUID(), 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png', 'Image', 100450, @msg_uuid, NOW(), NOW());

INSERT INTO RoomInviteLink (uuid, room_uuid, expires_at, created_at, updated_at) VALUES
(UUID(), @room_uuid, NOW(), NOW(), NOW());

INSERT INTO ChannelWebhook (uuid, channel_uuid, created_at, updated_at) VALUES
(UUID(), @ch_uuid, NOW(), NOW());
