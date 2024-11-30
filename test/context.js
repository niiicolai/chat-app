import { v4 as uuidv4 } from 'uuid';

export const context = {
  admin: {
    sub: 'd5a0831c-88e5-4713-ae0c-c4e86c2f4209',
    username: 'admin',
    email: 'admin@example.com',
    password: '12345678'
  },
  mod: {
    sub: 'cdcf569f-57de-4cb3-98d6-36c7cd7141d6',
    username: 'moderator',
    email: 'moderator@example.com',
    password: '12345678'
  },
  member: {
    sub: 'dd1db381-0b0a-4b2c-b0e1-0b5d569e6f9b',
    username: 'member',
    email: 'member@example.com',
    password: '12345678'
  },
  room: {
    uuid: 'a595b5cb-7e47-4ce7-9875-cdf99184a73c',
    name: 'General Chat',
    description: 'A room for general discussion',
    room_category_name: 'General'
  },
  channel: {
    uuid: '1c9437b0-4e88-4a8e-84f0-679c7714407f',
    name: 'General Discussion',
    description: 'General discussion channel',
    channel_type_name: 'Text'
  },
  fn: {
    fakeUser() {
      return {
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
      }
    },
    fakeRoom() {
      return {
        uuid: uuidv4(),
        name: `test-${uuidv4()}`,
        description: "Test Room Description",
        room_category_name: "General"
      }
    },
    fakeRoomUser(room_uuid, user_uuid, room_user_role_name="Member") {
      return {
        uuid: uuidv4(),
        room_uuid,
        user_uuid,
        room_user_role_name,
      }
    },
    fakeRoomInviteLink(room_uuid) {
      return {
        uuid: uuidv4(), 
        room_uuid, 
      }
    },
    fakeChannel(room_uuid) {
      return {
        uuid: uuidv4(),
        name: `test-${uuidv4()}`,
        description: "test",
        channel_type_name: "Text",
        room_uuid,
      }
    },
    fakeChannelWebhook(channel_uuid) {
      return {
        uuid: uuidv4(), 
        name: `test-${uuidv4()}`, 
        description: "test",
        channel_uuid, 
      }
    },
    fakeChannelMessage(channel_uuid) {
      return {
        uuid: uuidv4(), 
        body: `test-${uuidv4()}`,
        channel_uuid, 
      }
    },
  }
};
