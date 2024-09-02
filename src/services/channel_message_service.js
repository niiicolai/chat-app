import BaseCrudService from './base_crud_service.js';
import model from '../models/channel_message.js';
import dto from '../dtos/channel_message.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
