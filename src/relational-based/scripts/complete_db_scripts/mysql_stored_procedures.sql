USE chat;

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
