
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

CREATE (ult:UserLoginType {name: "Password"});
CREATE (ult:UserLoginType {name: "Google"});

CREATE (cat:ChannelAuditType {name: "CHANNEL_CREATED"});
CREATE (cat:ChannelAuditType {name: "CHANNEL_EDITED"});
CREATE (cat:ChannelAuditType {name: "CHANNEL_DELETED"});
CREATE (cat:ChannelAuditType {name: "MESSAGE_CREATED"});
CREATE (cat:ChannelAuditType {name: "MESSAGE_EDITED"});
CREATE (cat:ChannelAuditType {name: "MESSAGE_DELETED"});
CREATE (cat:ChannelAuditType {name: "WEBHOOK_CREATED"});
CREATE (cat:ChannelAuditType {name: "WEBHOOK_EDITED"});
CREATE (cat:ChannelAuditType {name: "WEBHOOK_DELETED"});

CREATE (rat:RoomAuditType {name: "ROOM_CREATED"});
CREATE (rat:RoomAuditType {name: "ROOM_EDITED"});
CREATE (rat:RoomAuditType {name: "ROOM_DELETED"});
CREATE (rat:RoomAuditType {name: "JOIN_SETTING_EDITED"});
CREATE (rat:RoomAuditType {name: "INVITE_LINK_CREATED"});
CREATE (rat:RoomAuditType {name: "INVITE_LINK_EDITED"});
CREATE (rat:RoomAuditType {name: "INVITE_LINK_DELETED"});
CREATE (rat:RoomAuditType {name: "USER_ADDED"});
CREATE (rat:RoomAuditType {name: "USER_REMOVED"});
CREATE (rat:RoomAuditType {name: "FILE_CREATED"});
CREATE (rat:RoomAuditType {name: "FILE_DELETED"});
CREATE (rat:RoomAuditType {name: "AVATAR_CREATED"});
CREATE (rat:RoomAuditType {name: "AVATAR_EDITED"});
CREATE (rat:RoomAuditType {name: "AVATAR_DELETED"});

CREATE (r:RoomCategory {name: "General"});
CREATE (r:RoomCategory {name: "Tech"});
CREATE (r:RoomCategory {name: "Sports"});
CREATE (r:RoomCategory {name: "Music"});
CREATE (r:RoomCategory {name: "Movies"});
CREATE (r:RoomCategory {name: "Books"});
CREATE (r:RoomCategory {name: "Gaming"});
CREATE (r:RoomCategory {name: "Food"});
CREATE (r:RoomCategory {name: "Travel"});
CREATE (r:RoomCategory {name: "Fitness"});
CREATE (r:RoomCategory {name: "Fashion"});
CREATE (r:RoomCategory {name: "Art"});
CREATE (r:RoomCategory {name: "Science"});
CREATE (r:RoomCategory {name: "Politics"});
CREATE (r:RoomCategory {name: "Business"});
CREATE (r:RoomCategory {name: "Education"});
CREATE (r:RoomCategory {name: "Health"});
CREATE (r:RoomCategory {name: "Lifestyle"});
CREATE (r:RoomCategory {name: "Entertainment"});
CREATE (r:RoomCategory {name: "Other"});

CREATE (rur:RoomUserRole {name: "Admin"});
CREATE (rur:RoomUserRole {name: "Moderator"});
CREATE (rur:RoomUserRole {name: "Member"});

CREATE (cmupt:ChannelMessageUploadType {name: "Image"});
CREATE (cmupt:ChannelMessageUploadType {name: "Video"});
CREATE (cmupt:ChannelMessageUploadType {name: "Document"});

CREATE (clt:ChannelType {name: "Text"});
CREATE (clt:ChannelType {name: "Call"});

CREATE (cmt:ChannelMessageType {name: "User"});
CREATE (cmt:ChannelMessageType {name: "System"});
CREATE (cmt:ChannelMessageType {name: "Webhook"});

CREATE (cwmt:ChannelWebhookMessageType {name: "Custom"});
CREATE (cwmt:ChannelWebhookMessageType {name: "GitHub"});

CREATE (rft:RoomFileType {name: "RoomAvatar"});
CREATE (rft:RoomFileType {name: "ChannelAvatar"});
CREATE (rft:RoomFileType {name: "ChannelWebhookAvatar"});
CREATE (rft:RoomFileType {name: "ChannelMessageUpload"});

CREATE (uss:UserStatusState {name: "Online"});
CREATE (uss:UserStatusState {name: "Away"});
CREATE (uss:UserStatusState {name: "Do Not Disturb"});
CREATE (uss:UserStatusState {name: "Offline"});

MATCH (uss:UserStatusState {name: "Offline"})
MATCH (ult:UserLoginType {name: "Password"})
CREATE (u:User {uuid: "98f8833c-fd3e-407a-a876-1313016921a6", username: "admin", email: "admin@example.com", avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", created_at: datetime(), updated_at: datetime()})
CREATE (us:UserStatus {uuid: "c212179e-845c-465a-869b-f35a7d5d56d0", last_seen_at: datetime(), message: "I'm an admin", total_online_hours: 0})
CREATE (ul:UserLogin {uuid: "c3d6cd83-8924-42f5-9e17-9ec6770829db", password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa"})
CREATE (uev:UserEmailVerification {uuid: "c1937ab7-2aff-4208-aabf-8c44b7e9a6a0", is_verified: true})
CREATE (upr:UserPasswordReset {uuid: "ac03f7c2-d3ab-4508-976b-adacd7d34253", expires_at: datetime(), created_at: datetime(), updated_at: datetime()})
CREATE (u)-[:STATUS_IS]->(us)
CREATE (us)-[:STATE_IS]->(uss)
CREATE (u)-[:AUTHORIZE_VIA]->(ul)
CREATE (ul)-[:TYPE_IS]->(ult)
CREATE (u)-[:EMAIL_VERIFY_VIA]->(uev)
CREATE (u)-[:RESETTED_BY]->(upr);

MATCH (uss:UserStatusState {name: "Offline"})
MATCH (ult:UserLoginType {name: "Password"})
CREATE (u:User {uuid: "f75e037f-98e1-44cd-9ef2-7d2bf2487cac", username: "moderator", email: "moderator@example.com", avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", created_at: datetime(), updated_at: datetime()})
CREATE (us:UserStatus {uuid: "595ea69a-d5b8-45de-922e-15060f4d0458", last_seen_at: datetime(), message: "I'm a moderator", total_online_hours: 0})
CREATE (ul:UserLogin {uuid: "5d7e71ef-cb3e-4aed-b819-1fa13f167459", password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa"})
CREATE (uev:UserEmailVerification {uuid: "c11629fc-968e-4599-9a70-39ad8a795447", is_verified: true})
CREATE (upr:UserPasswordReset {uuid: "c5dfaf46-87dc-4f24-b721-9c83759878d8", expires_at: datetime(), created_at: datetime(), updated_at: datetime()})
CREATE (u)-[:STATUS_IS]->(us)
CREATE (us)-[:STATE_IS]->(uss)
CREATE (u)-[:AUTHORIZE_VIA]->(ul)
CREATE (ul)-[:TYPE_IS]->(ult)
CREATE (u)-[:EMAIL_VERIFY_VIA]->(uev)
CREATE (u)-[:RESETTED_BY]->(upr);

MATCH (uss:UserStatusState {name: "Offline"})
MATCH (ult:UserLoginType {name: "Password"})
CREATE (u:User {uuid: "39fc54f4-7a2b-4c83-9ca0-1a745e7b20eb", username: "member", email: "member@example.com", avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", created_at: datetime(), updated_at: datetime()})
CREATE (us:UserStatus {uuid: "7e1f5eaa-0fcb-4208-8dc3-3b14d1179d57", last_seen_at: datetime(), message: "I'm a member", total_online_hours: 0})
CREATE (ul:UserLogin {uuid: "6eabf282-4e2f-4ca2-b248-da124002792f", password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa"})
CREATE (uev:UserEmailVerification {uuid: "a5603354-3d20-4502-b478-089db518a113", is_verified: true})
CREATE (upr:UserPasswordReset {uuid: "27a77f21-7deb-4b7c-afbd-a395fc555302", expires_at: datetime(), created_at: datetime(), updated_at: datetime()})
CREATE (u)-[:STATUS_IS]->(us)
CREATE (us)-[:STATE_IS]->(uss)
CREATE (u)-[:AUTHORIZE_VIA]->(ul)
CREATE (ul)-[:TYPE_IS]->(ult)
CREATE (u)-[:EMAIL_VERIFY_VIA]->(uev)
CREATE (u)-[:RESETTED_BY]->(upr);

MATCH (ct:ChannelType {name: "Text"})
MATCH (uadmin:User {uuid: "98f8833c-fd3e-407a-a876-1313016921a6"})
MATCH (umod:User {uuid: "f75e037f-98e1-44cd-9ef2-7d2bf2487cac"})
MATCH (umember:User {uuid: "39fc54f4-7a2b-4c83-9ca0-1a745e7b20eb"})
MATCH (rc:RoomCategory {name: "General"})
CREATE (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13", name: "General", description: "General chat room", created_at: datetime(), updated_at: datetime()})
CREATE (r)-[:CATEGORY_IS]->(rc)
CREATE (uadmin)-[:MEMBER_IN {uuid: "fa0253f4-dfea-4571-bba0-40b408da2087", role: "Admin", created_at: datetime(), updated_at: datetime()}]->(r)
CREATE (umod)-[:MEMBER_IN {uuid: "13b8a2d1-d1f5-418e-92af-b8a48e7c49dc", role: "Moderator", created_at: datetime(), updated_at: datetime()}]->(r)
CREATE (umember)-[:MEMBER_IN {uuid: "3f34b0f7-e10f-4e2f-97e4-ae7e0c526896", role: "Member", created_at: datetime(), updated_at: datetime()}]->(r)
CREATE (r)-[:FILE_SETTINGS_IS]->(rfs:RoomFileSettings {uuid: "4ced5816-608a-4676-9aff-df1c5c8793cf", file_days_to_live: 30, total_files_bytes_allowed: 1073741824, single_file_bytes_allowed: 10485760})
CREATE (r)-[:USER_SETTINGS_IS]->(rus:RoomUserSettings {uuid: "3e94a173-15ee-41cf-87b1-884b8c1a65bb", max_users: 100})
CREATE (r)-[:CHANNEL_SETTINGS_IS]->(rcs:RoomChannelSettings {uuid: "5963726c-4c2d-40fa-b769-24a2c9cf7add", max_channels: 100, message_days_to_live: 30})
CREATE (r)-[:RULES_SETTINGS_IS]->(rrs:RoomRulesSettings {uuid: "86bb4303-f426-4554-9877-67b506a5a7c2", rules_text: "No rules"})
CREATE (r)-[:JOIN_SETTINGS_IS]->(rjs:RoomJoinSettings {uuid: "03af87c7-18bc-4d78-96a4-39f71acc7e61", join_message: "Welcome, {name} to the general chat room"})
CREATE (r)-[:ROOM_AVATAR_IS]->(ra:RoomAvatar {uuid: "5825088d-5398-40da-a17e-61c972fd9181"})
CREATE (r)-[:COMMUNICATES_IN]->(c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad", name: "General", description: "General chat channel", created_at: datetime(), updated_at: datetime()})
CREATE (c)-[:TYPE_IS]->(ct)
CREATE (cw:ChannelWebhook {uuid: "b13fcd56-b796-4697-af76-4923d7157759", name: "GitHub", description: "GitHub webhook", created_at: datetime(), updated_at: datetime()})
CREATE (cw)-[:WRITE_TO]->(c);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
CREATE (ril:RoomInviteLink {uuid: "27ce1e37-fbb4-4fc1-85cb-8f6914f3be35",created_at: datetime(), updated_at: datetime()})
CREATE (r)-[:INVITES_VIA]->(ril);

MATCH (c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad"})
MATCH (uadmin:User {uuid: "98f8833c-fd3e-407a-a876-1313016921a6"})
MATCH (cmt:ChannelMessageType {name: "User"})
CREATE (cm:ChannelMessage {uuid: "1faad8f6-2508-4c79-bafa-6325b31631c7", body: "Hello, I'm an admin", created_at: datetime(), updated_at: datetime()})
CREATE (cm)-[:TYPE_IS]->(cmt)
CREATE (cm)-[:WRITTEN_BY]->(uadmin)
CREATE (cm)-[:WRITTEN_IN]->(c);

MATCH (c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad"})
MATCH (cw:ChannelWebhook {uuid: "b13fcd56-b796-4697-af76-4923d7157759"})
MATCH (cwmt:ChannelWebhookMessageType {name: "GitHub"})
MATCH (cmt:ChannelMessageType {name: "Webhook"})
CREATE (cwm:ChannelWebhookMessage {uuid: "6b67cadb-bf36-47b6-a631-0194f42b37e3", body: "GitHub webhook message", created_at: datetime(), updated_at: datetime()})
CREATE (cm:ChannelMessage {uuid: "72179f91-3951-4e80-82a5-f671175cc949", body: "Commit: GitHub webhook message", created_at: datetime(), updated_at: datetime()})
CREATE (cm)-[:TYPE_IS]->(cmt)
CREATE (cwm)-[:TYPE_IS]->(cwmt)
CREATE (cm)-[:WRITTEN_IN]->(c)
CREATE (cm)-[:GENERATED_BY]->(cwm)
CREATE (cwm)-[:WRITTEN_BY]->(cw);

MATCH (c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad"})
MATCH (cat:ChannelAuditType {name: "CHANNEL_CREATED"})
CREATE (ca:ChannelAudit {uuid: "972afca8-3772-406b-93a1-2b94ef4bd4f0", body: "Channel created", created_at: datetime(), updated_at: datetime()})
CREATE (ca)-[:TYPE_IS]->(cat)
CREATE (ca)-[:AUDIT_BY]->(c);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
MATCH (rat:RoomAuditType {name: "ROOM_CREATED"})
CREATE (ra:RoomAudit {uuid: "28dc106e-7c6c-4e29-a3d8-9b307199d9e4", body: "Room created", created_at: datetime(), updated_at: datetime()})
CREATE (ra)-[:TYPE_IS]->(rat)
CREATE (ra)-[:AUDIT_BY]->(r);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
MATCH (ra:RoomAvatar {uuid: "5825088d-5398-40da-a17e-61c972fd9181"})
MATCH (rft:RoomFileType {name: "RoomAvatar"})
CREATE (rf:RoomFile {uuid: "3b1c0335-1984-4d2d-b4f6-474fcd452672", src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", size: 1048576, created_at: datetime(), updated_at: datetime()})
CREATE (rf)-[:TYPE_IS]->(rft)
CREATE (rf)-[:STORED_IN]->(r)
CREATE (ra)-[:ROOM_AVATAR_IS]->(rf);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
MATCH (c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad"})
MATCH (rft:RoomFileType {name: "ChannelAvatar"})
CREATE (rf:RoomFile {uuid: "670ea321-055e-43b3-bce9-c153995aab2d", src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", size: 1048576, created_at: datetime(), updated_at: datetime()})
CREATE (rf)-[:TYPE_IS]->(rft)
CREATE (rf)-[:STORED_IN]->(r)
CREATE (c)-[:CHANNEL_AVATAR_IS]->(rf);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
MATCH (cw:ChannelWebhook {uuid: "b13fcd56-b796-4697-af76-4923d7157759"})
MATCH (rft:RoomFileType {name: "ChannelWebhookAvatar"})
CREATE (rf:RoomFile {uuid: "14a44b61-68cc-46eb-94a4-a2c61395ef47", src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", size: 1048576, created_at: datetime(), updated_at: datetime()})
CREATE (rf)-[:TYPE_IS]->(rft)
CREATE (rf)-[:STORED_IN]->(r)
CREATE (cw)-[:WEBHOOK_AVATAR_IS]->(rf);

MATCH (r:Room {uuid: "d07c999f-2c2b-4440-89a7-44c64c1c5c13"})
MATCH (u:User {uuid: "98f8833c-fd3e-407a-a876-1313016921a6"})
MATCH (c:Channel {uuid: "0177b962-c6ad-4493-916d-b6d540dcc4ad"})
MATCH (cmt:ChannelMessageType {name: "User"})
MATCH (cmupt:ChannelMessageUploadType {name: "Image"})
MATCH (rft:RoomFileType {name: "ChannelMessageUpload"})
CREATE (cm:ChannelMessage {uuid: "0f9619fe-b5bf-445d-a3ec-32fb46df5dae", body: "Hello, I'm an admin", created_at: datetime(), updated_at: datetime()})
CREATE (cmu:ChannelMessageUpload {uuid: "0456fcef-52d5-4bd0-b24c-3a023091c046", created_at: datetime(), updated_at: datetime()})
CREATE (rf:RoomFile {uuid: "238ad2cc-8b41-4850-89c1-f616ac7da48f", src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png", size: 1048576, created_at: datetime(), updated_at: datetime()})
CREATE (rf)-[:TYPE_IS]->(rft)
CREATE (rf)-[:STORED_IN]->(r)
CREATE (cmu)-[:TYPE_IS]->(cmupt)
CREATE (cm)-[:TYPE_IS]->(cmt)
CREATE (cm)-[:UPLOAD_IS]->(cmu)
CREATE (cm)-[:WRITTEN_BY]->(u)
CREATE (cm)-[:WRITTEN_IN]->(c)
CREATE (cmu)-[:SAVED_AS]->(rf);

