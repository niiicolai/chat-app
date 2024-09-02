import BaseCrudService from './base_crud_service.js';
import model from '../models/user_room.js';
import dto from '../dtos/user_room.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
