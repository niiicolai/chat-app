USE chat;


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

