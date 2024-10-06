import RoomInviteLink from '../models/room_invite_link.js';
import data from './data.js';

export default class RoomInviteLinkSeeder {
    async up() {
        await RoomInviteLink.insertMany(data.room_invite_links);
    }

    async down() {
        await RoomInviteLink.deleteMany({ uuid: { $in: data.room_invite_links.map((d) => d.uuid) } });
    }
}
