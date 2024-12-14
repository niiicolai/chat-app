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
