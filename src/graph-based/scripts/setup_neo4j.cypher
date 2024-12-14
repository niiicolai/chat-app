
CREATE CONSTRAINT unique_user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE;
CREATE CONSTRAINT unique_user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT unique_room_name IF NOT EXISTS FOR (r:Room) REQUIRE r.name IS UNIQUE;

CREATE CONSTRAINT unique_user_uuid IF NOT EXISTS FOR (u:User) REQUIRE u.uuid IS UNIQUE;
CREATE CONSTRAINT unique_room_uuid IF NOT EXISTS FOR (r:Room) REQUIRE r.uuid IS UNIQUE;
CREATE CONSTRAINT unique_user_status_uuid IF NOT EXISTS FOR (s:UserStatus) REQUIRE s.uuid IS UNIQUE;
CREATE CONSTRAINT unique_user_login_uuid IF NOT EXISTS FOR (u:UserLogin) REQUIRE u.uuid IS UNIQUE;
CREATE CONSTRAINT unique_user_email_verification_uuid IF NOT EXISTS FOR (u:UserEmailVerification) REQUIRE u.uuid IS UNIQUE;
CREATE CONSTRAINT unique_user_password_reset_uuid IF NOT EXISTS FOR (u:UserPasswordReset) REQUIRE u.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_uuid IF NOT EXISTS FOR (c:Channel) REQUIRE c.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_message_uuid IF NOT EXISTS FOR (m:ChannelMessage) REQUIRE m.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_message_upload_uuid IF NOT EXISTS FOR (u:ChannelMessageUpload) REQUIRE u.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_webhook_message_uuid IF NOT EXISTS FOR (m:ChannelWebhookMessage) REQUIRE m.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_webhook_uuid IF NOT EXISTS FOR (w:ChannelWebhook) REQUIRE w.uuid IS UNIQUE;
CREATE CONSTRAINT unique_room_file_uuid IF NOT EXISTS FOR (f:RoomFile) REQUIRE f.uuid IS UNIQUE;
CREATE CONSTRAINT unique_room_invite_link_uuid IF NOT EXISTS FOR (i:RoomInviteLink) REQUIRE i.uuid IS UNIQUE;
CREATE CONSTRAINT unique_room_audit_uuid IF NOT EXISTS FOR (a:RoomAudit) REQUIRE a.uuid IS UNIQUE;
CREATE CONSTRAINT unique_channel_audit_uuid IF NOT EXISTS FOR (a:ChannelAudit) REQUIRE a.uuid IS UNIQUE;

CREATE CONSTRAINT unique_room_category_name IF NOT EXISTS FOR (c:RoomCategory) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT unique_room_user_role_name IF NOT EXISTS FOR (r:RoomUserRole) REQUIRE r.name IS UNIQUE;
CREATE CONSTRAINT unique_user_status_state_name IF NOT EXISTS FOR (s:UserStatusState) REQUIRE s.name IS UNIQUE;
CREATE CONSTRAINT unique_user_login_type_name IF NOT EXISTS FOR (l:UserLoginType) REQUIRE l.name IS UNIQUE;
CREATE CONSTRAINT unique_channel_type_name IF NOT EXISTS FOR (t:ChannelType) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT unique_channel_message_type_name IF NOT EXISTS FOR (t:ChannelMessageType) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT unique_channel_webhook_message_type_name IF NOT EXISTS FOR (t:ChannelWebhookMessageType) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT unique_room_file_type_name IF NOT EXISTS FOR (t:RoomFileType) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT unique_room_audit_type_name IF NOT EXISTS FOR (t:RoomAuditType) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT unique_channel_audit_type_name IF NOT EXISTS FOR (t:ChannelAuditType) REQUIRE t.name IS UNIQUE;


