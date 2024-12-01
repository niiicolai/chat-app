USE chat;

-- ### TEST DATA ###

-- Generate uuids for the test data
-- except for the room uuid which is hardcoded
-- to ensure that the room is created with the same uuid
SET @password = '$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa';
SET @upload_src = 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png';
SET @upload_src2 = 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/LemonadeGuyCardboardAndPencilWithShadow-8cdc3130cc5498718fce7ee9d1ff5d92ddcc2ed81c689a1bf275bd14189a607c-512.jpg'; 
SET @upload_src3 = 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/mobile-park-character-animating.png';
SET @room_uuid = 'a595b5cb-7e47-4ce7-9875-cdf99184a73c';
SET @ch_uuid = '1c9437b0-4e88-4a8e-84f0-679c7714407f';
SET @ch_uuid3D = UUID();
SET @msg_uuid = UUID();
SET @user_uuid = 'd5a0831c-88e5-4713-ae0c-c4e86c2f4209';
SET @user2_uuid = 'cdcf569f-57de-4cb3-98d6-36c7cd7141d6';
SET @user3_uuid = 'dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b';
SET @wh_uuid = UUID();

INSERT INTO UserLoginType (name) VALUES
('Password'),
('Google');

INSERT INTO ChannelAuditType (name) VALUES
('CHANNEL_CREATED'),
('CHANNEL_EDITED'),
('CHANNEL_DELETED'),
('MESSAGE_CREATED'),
('MESSAGE_EDITED'),
('MESSAGE_DELETED'),
('WEBHOOK_CREATED'),
('WEBHOOK_EDITED'),
('WEBHOOK_DELETED');

INSERT INTO RoomAuditType (name) VALUES
('ROOM_CREATED'),
('ROOM_EDITED'),
('ROOM_DELETED'),
('JOIN_SETTING_EDITED'),
('INVITE_LINK_CREATED'),
('INVITE_LINK_EDITED'),
('INVITE_LINK_DELETED'),
('USER_ADDED'),
('USER_REMOVED'),
('FILE_CREATED'),
('FILE_DELETED'),
('AVATAR_CREATED'),
('AVATAR_EDITED'),
('AVATAR_DELETED');

INSERT INTO RoomCategory (name) VALUES
('General'),
('Tech'),
('Sports'),
('Music'),
('Movies'),
('Books'),
('Gaming'),
('Food'),
('Travel'),
('Fitness'),
('Fashion'),
('Art'),
('Science'),
('Politics'),
('Business'),
('Education'),
('Health'),
('Lifestyle'),
('Entertainment'),
('Other');



INSERT INTO RoomUserRole (name) VALUES
('Admin'),
('Moderator'),
('Member');



INSERT INTO ChannelMessageUploadType (name) VALUES
('Image'),
('Video'),
('Document');



INSERT INTO ChannelType (name) VALUES
('Text'),
('Call');



INSERT INTO ChannelMessageType (name) VALUES
('User'),
('System'),
('Webhook');



INSERT INTO ChannelWebhookMessageType (name) VALUES
('Custom'),
('GitHub');

INSERT INTO RoomFileType (name) VALUES
('ChannelWebhookAvatar'),
('ChannelMessageUpload'),
('ChannelAvatar'),
('RoomAvatar');


INSERT INTO UserStatusState (name) VALUES
('Online'),
('Away'),
('Do Not Disturb'),
('Offline');


-- Create the admin, moderator, and member users
SET @loginType = 'Password';
SET @thirdPartyId = NULL;
call create_user_proc(@user_uuid, 'admin', 'admin@example.com', @password, @upload_src2, @loginType, @thirdPartyId, @result);
call create_user_proc(@user2_uuid, 'moderator', 'moderator@example.com', @password, @upload_src3, @loginType, @thirdPartyId, @result);
call create_user_proc(@user3_uuid, 'member', 'member@example.com', @password, @upload_src, @loginType, @thirdPartyId, @result);


-- Create the room with the first user as the admin
call create_room_proc(@user_uuid, @room_uuid, 'General Chat', 'A room for general discussion', 'General', 'Admin', @upload_src, 100450, @result);



-- Create channels for the room
call create_channel_proc(@ch_uuid, 'General Discussion', 'General discussion channel', 'Text', 100450, @upload_src, @room_uuid, @result);
call create_channel_proc(UUID(), 'Call Chat', 'Channel for voice and video calls', 'Call', 100450, @upload_src, @room_uuid, @result);



-- Joining the other two users to the room after the channel is created
-- to ensure that the join message is sent to a channel
call join_room_proc(@user2_uuid, @room_uuid, 'Moderator', @result);
call join_room_proc(@user3_uuid, @room_uuid, 'Member', @result);



-- Create messages for the channel
call create_channel_message_proc(UUID(), 'Hello everyone!', 'User', @ch_uuid, @user_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'Hey! How are you all doing?', 'User', @ch_uuid, @user2_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'Doing great! How about you?', 'User', @ch_uuid, @user3_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'I am good too, thanks for asking!', 'User', @ch_uuid, @user2_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'What are you all working on today?', 'User', @ch_uuid, @user_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'I am working on a new project for work.', 'User', @ch_uuid, @user3_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'That sounds interesting! Tell me more.', 'User', @ch_uuid, @user2_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'Sure, I will share the details in a bit.', 'User', @ch_uuid, @user3_uuid, NULL, NULL, NULL, NULL, @result);
call create_channel_message_proc(UUID(), 'Check out this image:', 'User', @ch_uuid, @user3_uuid, 'Image', @upload_src, 100450, @room_uuid, @result);



-- Create a room invite link that never expires
call create_room_invite_link_proc(UUID(), @room_uuid, NULL, @result);



-- Create a webhool url for the channel
call create_channel_webhook_proc(@wh_uuid, @ch_uuid, 'General Chat Webhook', 'Webhook for the general chat channel', @upload_src, 100450, @room_uuid, @result);



-- Create a webhook message for the webhook
call create_webhook_message_proc(UUID(), 'This is a webhook message!', @ch_uuid, @wh_uuid, 'Custom', @result);


-- Set users as verified
call set_user_email_verification_proc(@user_uuid, 1, @result);
call set_user_email_verification_proc(@user2_uuid, 1, @result);
call set_user_email_verification_proc(@user3_uuid, 1, @result);
