import BaseCrudService from './base_crud_service.js';
import model from '../models/room.js';
import dto from '../dtos/room.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
