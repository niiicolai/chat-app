import AdminPermissionRequiredError from "./admin_permission_required_error.js";
import DuplicateEntryError from "./duplicate_entry_error.js";
import EntityNotFoundError from "./entity_not_found_error.js";
import EntityExpiredError from "./entity_expired_error.js";
import DuplicateRoomUserError from "./duplicate_room_user_error.js";
import RoomMemberRequiredError from "./room_member_required_error.js";
import ExceedsRoomChannelCountError from "./exceeds_room_channel_count_error.js";
import ExceedsRoomUserCountError from "./exceeds_room_user_count_error.js";
import ExceedsSingleFileSizeError from "./exceeds_single_file_size_error.js";
import ExceedsRoomTotalFilesLimitError from "./exceeds_room_total_files_limit_error.js";
import OwnershipOrLeastModRequiredError from "./ownership_or_least_mod_required_error.js";
import RoomLeastOneAdminRequiredError from "./room_least_one_admin_required_error.js";
import UserEmailAlreadyVerifiedError from "./user_email_already_verified_error.js";
import VerifiedEmailRequiredError from "./verified_email_required_error.js";
import DuplicateThirdPartyLoginError from "./duplicate_third_party_login_error.js";
import InvalidCredentialsError from "./invalid_credentials_error.js";
import ControllerError from "./controller_error.js";

export default {
    AdminPermissionRequiredError,
    DuplicateEntryError,
    EntityNotFoundError,
    EntityExpiredError,
    DuplicateRoomUserError,
    RoomMemberRequiredError,
    ExceedsRoomChannelCountError,
    ExceedsRoomUserCountError,
    ExceedsSingleFileSizeError,
    ExceedsRoomTotalFilesLimitError,
    OwnershipOrLeastModRequiredError,
    RoomLeastOneAdminRequiredError,
    UserEmailAlreadyVerifiedError,
    VerifiedEmailRequiredError,
    DuplicateThirdPartyLoginError,
    InvalidCredentialsError,
    ControllerError
};
