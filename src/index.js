
import 'dotenv/config'
import express from 'express'

import ChannelController from './controllers/v1/channel_controller.js'
import ChannelMessageController from './controllers/v1/channel_message_controller.js'
import ChannelTypeController from './controllers/v1/channel_type_controller.js'
import MessageUploadController from './controllers/v1/message_upload_controller.js'
import UploadTypeController from './controllers/v1/upload_type_controller.js'
import RoomCategoryController from './controllers/v1/room_category_controller.js'
import RoomRoleController from './controllers/v1/room_role_controller.js'
import RoomController from './controllers/v1/room_controller.js'
import UserRoomController from './controllers/v1/user_room_controller.js'
import UserController from './controllers/v1/user_controller.js'

const port = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(ChannelController.router)
app.use(ChannelMessageController.router)
app.use(ChannelTypeController.router)
app.use(MessageUploadController.router)
app.use(UploadTypeController.router)
app.use(RoomCategoryController.router)
app.use(RoomRoleController.router)
app.use(RoomController.router)
app.use(UserRoomController.router)
app.use(UserController.router)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
