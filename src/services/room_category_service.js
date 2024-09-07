import model from '../models/room_category.js';
import dto from '../dtos/room_category.js';
import BaseTypeService from './base_type_service.js';

const service = new BaseTypeService(model, dto);

export default service;
