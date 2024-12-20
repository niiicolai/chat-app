export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    file_days_to_live: {
        type: 'integer',
        required: true
    },
    total_files_bytes_allowed: {
        type: 'integer',
        required: true
    },
    single_file_bytes_allowed: {
        type: 'integer',
        required: true
    },
    created_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
    updated_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
    /**
     * INCOMING RELATION
     */
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'FILE_SETTINGS_IS',
        direction: 'in',
    },
}
