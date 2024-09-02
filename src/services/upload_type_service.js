import BaseCrudService from './base_crud_service.js';
import model from '../models/upload_type.js';
import dto from '../dtos/upload_type.js';

// Create a new service
const service = new BaseCrudService({ model, dto });

// Export the service
export default service;
