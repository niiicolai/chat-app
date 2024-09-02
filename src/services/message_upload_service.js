import BaseCrudService from './base_crud_service.js';
import model from '../models/message_upload.js';
import dto from '../dtos/message_upload.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
