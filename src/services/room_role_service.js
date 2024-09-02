import BaseCrudService from './base_crud_service.js';
import model from '../models/room_role.js';
import dto from '../dtos/room_role.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
