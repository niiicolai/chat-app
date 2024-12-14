USE chat;

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

